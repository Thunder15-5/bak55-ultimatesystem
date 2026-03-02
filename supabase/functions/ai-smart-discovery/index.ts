import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DAILY_LIMIT = 10;
const CACHE_HOURS = 24;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // JWT auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Unauthorized");
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !caller) throw new Error("Unauthorized");

    const { trackId } = await req.json();
    if (!trackId) throw new Error("trackId required");
    const userId = caller.id;

    // Rate limit
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: todayCount } = await supabase
      .from('ai_track_analyses').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', since);
    if ((todayCount || 0) >= DAILY_LIMIT) throw new Error(`Daily limit of ${DAILY_LIMIT} analyses reached.`);

    // Cache check
    const cacheThreshold = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('ai_track_analyses').select('*')
      .eq('track_id', trackId).eq('user_id', userId)
      .eq('analysis_type', 'discovery').eq('status', 'completed')
      .gte('created_at', cacheThreshold)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ success: true, analysisId: cached.id, analysis: cached.raw_analysis, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get track + artist data
    const { data: track } = await supabase
      .from('tracks').select('*, profiles:artist_id(username, display_name, location, bio)')
      .eq('id', trackId).single();
    if (!track) throw new Error("Track not found");

    const [artistProfileRes, listenersRes, genreTracksRes] = await Promise.all([
      supabase.from('artist_profiles').select('stage_name, genres, verified').eq('user_id', track.artist_id).maybeSingle(),
      supabase.from('listening_history').select('user_id, profiles:user_id(location)').eq('track_id', trackId).limit(200),
      supabase.from('tracks').select('title, genre, plays, artist_id').eq('genre', track.genre || '').order('plays', { ascending: false }).limit(20),
    ]);

    const artistProfile = artistProfileRes.data;
    const listeners = listenersRes.data;
    const genreTracks = genreTracksRes.data;

    const { data: analysisRecord } = await supabase
      .from('ai_track_analyses')
      .insert({ track_id: trackId, user_id: userId, analysis_type: 'discovery', status: 'processing' })
      .select().single();

    const listenerLocations = listeners?.reduce((acc: any, l: any) => {
      const loc = l.profiles?.location || 'Unknown';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {});

    const prompt = `You are a music discovery strategist for African music. Analyze this track's audience potential.

TRACK: "${track.title}" by ${artistProfile?.stage_name || track.profiles?.username}
Genre: ${track.genre || 'Unknown'}
Description: ${track.description || 'None'}
Artist Location: ${track.profiles?.location || 'Unknown'}
Artist Genres: ${artistProfile?.genres?.join(', ') || track.genre || 'Unknown'}
Current Plays: ${track.plays || 0}
Listener Locations: ${JSON.stringify(listenerLocations)}
Similar Genre Top Tracks: ${JSON.stringify(genreTracks?.slice(0, 5).map(t => ({ title: t.title, plays: t.plays })))}

Provide audience discovery analysis in EXACT JSON:
{
  "targetCountries": [{"country": "<country>", "adoptionLikelihood": <0-100>, "reason": "<why>"}],
  "listenerPersona": {"ageRange": "<e.g. 18-25>", "gender": "<primary gender split>", "lifestyle": "<lifestyle description>", "listeningHabits": "<when/how they listen>", "otherGenres": ["<genre>"]},
  "platformStrategy": [{"platform": "<name>", "strategy": "<what to do>", "expectedImpact": "<high/medium/low>"}],
  "fanGrowthPrediction": {"thirtyDays": <number>, "ninetyDays": <number>, "sixMonths": <number>, "growthStrategy": "<key strategy>"},
  "genreCrossovers": [{"genre": "<genre>", "fitScore": <0-100>, "approach": "<how>"}],
  "discoveryScore": <0-100>,
  "viralPotential": <0-100>,
  "summary": "<2-3 sentence discovery strategy>"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert music discovery strategist focused on African music markets. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      await supabase.from('ai_track_analyses').update({ status: 'failed' }).eq('id', analysisRecord!.id);
      if (aiResponse.status === 429) throw new Error('Rate limit exceeded.');
      if (aiResponse.status === 402) throw new Error('AI credits depleted.');
      throw new Error(`AI failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      await supabase.from('ai_track_analyses').update({ status: 'failed' }).eq('id', analysisRecord!.id);
      throw new Error("Invalid AI response");
    }

    await supabase.from('ai_track_analyses').update({
      status: 'completed',
      target_countries: analysis.targetCountries || [],
      listener_persona: analysis.listenerPersona || {},
      platform_strategy: analysis.platformStrategy || [],
      fan_growth_prediction: analysis.fanGrowthPrediction || {},
      genre_crossovers: analysis.genreCrossovers || [],
      raw_analysis: analysis,
      completed_at: new Date().toISOString(),
    }).eq('id', analysisRecord!.id);

    return new Response(
      JSON.stringify({ success: true, analysisId: analysisRecord!.id, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ai-smart-discovery error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
