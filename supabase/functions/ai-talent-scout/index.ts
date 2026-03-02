import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DAILY_LIMIT = 10;
const CACHE_HOURS = 24;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitize(val: unknown, maxLen = 200): string {
  const s = String(val ?? '').slice(0, maxLen);
  return s.replace(/[{}"\\]/g, '');
}

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
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = data.claims.sub;

    // Role check — only artists and producers
    const { data: roles } = await supabase
      .from('user_roles').select('role')
      .eq('user_id', userId);
    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.some(r => ['artist', 'producer', 'admin'].includes(r))) {
      return new Response(JSON.stringify({ error: 'AI Intelligence is available for artists and producers only.' }), { status: 403, headers: corsHeaders });
    }

    const { trackId } = await req.json();
    if (!trackId || !UUID_RE.test(trackId)) {
      return new Response(JSON.stringify({ error: 'Valid trackId (UUID) required' }), { status: 400, headers: corsHeaders });
    }

    // Cleanup orphaned processing records older than 10 min
    await supabase
      .from('ai_track_analyses')
      .update({ status: 'failed' })
      .eq('user_id', userId)
      .eq('status', 'processing')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    // Rate limit check
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: todayCount } = await supabase
      .from('ai_track_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since);
    if ((todayCount || 0) >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: `Daily limit of ${DAILY_LIMIT} analyses reached. Try again tomorrow.` }), { status: 429, headers: corsHeaders });
    }

    // Cache check
    const cacheThreshold = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('ai_track_analyses').select('*')
      .eq('track_id', trackId).eq('user_id', userId)
      .eq('analysis_type', 'talent_scout').eq('status', 'completed')
      .gte('created_at', cacheThreshold)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ success: true, analysisId: cached.id, analysis: cached.raw_analysis, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*, profiles:artist_id(username, display_name, location)')
      .eq('id', trackId).single();
    if (trackError || !track) {
      return new Response(JSON.stringify({ error: 'Track not found' }), { status: 404, headers: corsHeaders });
    }

    // Parallel data fetch
    const [artistProfileRes, playCountRes, likeCountRes, commentCountRes, otherTracksRes, followerCountRes] = await Promise.all([
      supabase.from('artist_profiles').select('stage_name, genres, talent_score, verified').eq('user_id', track.artist_id).maybeSingle(),
      supabase.from('listening_history').select('*', { count: 'exact', head: true }).eq('track_id', trackId),
      supabase.from('track_likes').select('*', { count: 'exact', head: true }).eq('track_id', trackId),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('track_id', trackId),
      supabase.from('tracks').select('title, genre, plays, created_at').eq('artist_id', track.artist_id).order('plays', { ascending: false }).limit(10),
      supabase.from('followers').select('*', { count: 'exact', head: true }).eq('artist_id', track.artist_id),
    ]);

    const artistProfile = artistProfileRes.data;

    // Create analysis record
    const { data: analysisRecord, error: insertError } = await supabase
      .from('ai_track_analyses')
      .insert({ track_id: trackId, user_id: userId, analysis_type: 'talent_scout', status: 'processing' })
      .select().single();
    if (insertError) throw insertError;

    // Sanitized prompt — prevents prompt injection from user-controlled fields
    const prompt = `You are an elite AI music talent scout for BAK55, an African music platform. Analyze this track and artist comprehensively.

TRACK DATA:
- Title: "${sanitize(track.title)}"
- Genre: ${sanitize(track.genre || 'Unknown')}
- Description: ${sanitize(track.description || 'None', 500)}
- Total Plays: ${playCountRes.count || 0}
- Likes: ${likeCountRes.count || 0}
- Comments: ${commentCountRes.count || 0}
- Days Since Upload: ${Math.floor((Date.now() - new Date(track.created_at).getTime()) / 86400000)}
- Is Paid Download: ${track.is_paid_download || false}
- Price: ${track.price_in_bak || 0} BAK

ARTIST DATA:
- Name: ${sanitize(artistProfile?.stage_name || track.profiles?.username || 'Unknown')}
- Location: ${sanitize(track.profiles?.location || 'Unknown')}
- Genres: ${sanitize(artistProfile?.genres?.join(', ') || 'Unknown')}
- Verified: ${artistProfile?.verified || false}
- Followers: ${followerCountRes.count || 0}
- Total Tracks: ${otherTracksRes.data?.length || 0}
- Top Tracks: ${JSON.stringify(otherTracksRes.data?.slice(0, 5).map(t => ({ title: sanitize(t.title, 60), plays: t.plays })))}

Provide a thorough analysis with EXACT numerical scores (0-100) and insights.

Return ONLY valid JSON:
{
  "talentScore": <0-100>,
  "commercialReadiness": <0-100>,
  "breakoutProbability": <0-100>,
  "vocalStrength": <0-100>,
  "productionQuality": <0-100>,
  "emotionalTone": "<dominant emotion>",
  "successProbability": <0-100>,
  "marketReadiness": <0-100>,
  "comparableArtists": [{"name": "<artist>", "similarity": <0-100>, "reason": "<why>"}],
  "recommendations": [{"category": "<production|marketing|audience|career>", "title": "<title>", "description": "<advice>", "priority": "<high|medium|low>"}],
  "strengths": ["<strength>"],
  "weaknesses": ["<weakness>"],
  "overallAssessment": "<assessment>"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert music talent scout. Always return valid JSON. Scores must vary based on actual data provided.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      await supabase.from('ai_track_analyses').update({ status: 'failed' }).eq('id', analysisRecord.id);
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Try again later.' }), { status: 429, headers: corsHeaders });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: 'AI credits depleted.' }), { status: 402, headers: corsHeaders });
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error('Failed to parse:', content);
      await supabase.from('ai_track_analyses').update({ status: 'failed' }).eq('id', analysisRecord.id);
      throw new Error("Invalid AI response format");
    }

    await supabase.from('ai_track_analyses').update({
      status: 'completed',
      talent_score: analysis.talentScore,
      commercial_readiness: analysis.commercialReadiness,
      breakout_probability: analysis.breakoutProbability,
      vocal_strength: analysis.vocalStrength,
      production_quality: analysis.productionQuality,
      emotional_tone: analysis.emotionalTone,
      comparable_artists: analysis.comparableArtists || [],
      recommendations: analysis.recommendations || [],
      raw_analysis: analysis,
      completed_at: new Date().toISOString(),
    }).eq('id', analysisRecord.id);

    console.log(`Talent Scout complete for track ${trackId}. Score: ${analysis.talentScore}`);

    return new Response(
      JSON.stringify({ success: true, analysisId: analysisRecord.id, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ai-talent-scout error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});