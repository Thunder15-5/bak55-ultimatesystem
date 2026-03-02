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
  return String(val ?? '').slice(0, maxLen).replace(/[{}"\\]/g, '');
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
    const { data, error: authError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = data.claims.sub;

    // Role check
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    if (!roles?.some(r => ['artist', 'producer', 'admin'].includes(r.role))) {
      return new Response(JSON.stringify({ error: 'AI Intelligence is available for artists and producers only.' }), { status: 403, headers: corsHeaders });
    }

    const { trackId } = await req.json();
    if (!trackId || !UUID_RE.test(trackId)) {
      return new Response(JSON.stringify({ error: 'Valid trackId (UUID) required' }), { status: 400, headers: corsHeaders });
    }

    // Cleanup orphaned processing records
    await supabase.from('ai_track_analyses').update({ status: 'failed' })
      .eq('user_id', userId).eq('status', 'processing')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    // Rate limit
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: todayCount } = await supabase
      .from('ai_track_analyses').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', since);
    if ((todayCount || 0) >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: `Daily limit of ${DAILY_LIMIT} analyses reached.` }), { status: 429, headers: corsHeaders });
    }

    // Cache check
    const cacheThreshold = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('ai_track_analyses').select('*')
      .eq('track_id', trackId).eq('user_id', userId)
      .eq('analysis_type', 'content_enhance').eq('status', 'completed')
      .gte('created_at', cacheThreshold)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ success: true, analysisId: cached.id, analysis: cached.raw_analysis, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: track } = await supabase
      .from('tracks').select('*, profiles:artist_id(username, display_name, bio)')
      .eq('id', trackId).single();
    if (!track) return new Response(JSON.stringify({ error: 'Track not found' }), { status: 404, headers: corsHeaders });

    const { data: artistProfile } = await supabase
      .from('artist_profiles').select('stage_name, genres')
      .eq('user_id', track.artist_id).maybeSingle();

    const { data: analysisRecord } = await supabase
      .from('ai_track_analyses')
      .insert({ track_id: trackId, user_id: userId, analysis_type: 'content_enhance', status: 'processing' })
      .select().single();

    const prompt = `You are a creative director for African music marketing. Generate promotional content for this track.

TRACK: "${sanitize(track.title)}"
Artist: ${sanitize(artistProfile?.stage_name || track.profiles?.username)}
Genre: ${sanitize(track.genre || 'Unknown')}
Description: ${sanitize(track.description || 'None', 500)}
Artist Bio: ${sanitize(track.profiles?.bio || 'None', 500)}
Artist Genres: ${sanitize(artistProfile?.genres?.join(', ') || 'Unknown')}

Generate COMPLETE promotional content package in EXACT JSON:
{
  "promoCaptions": {
    "instagram": ["<caption with emojis and hashtags>", "<caption>", "<caption>"],
    "twitter": ["<tweet under 280 chars>", "<tweet>", "<tweet>"],
    "tiktok": ["<caption>", "<caption>"],
    "whatsapp": ["<message for status/story>"]
  },
  "campaignIdeas": [{"name": "<name>", "platform": "<platform>", "duration": "<timeframe>", "description": "<plan>", "steps": ["<step>"], "expectedOutcome": "<outcome>"}],
  "coverArtConcepts": [{"style": "<style>", "description": "<visual description>", "colorPalette": ["<color>"], "mood": "<mood>"}],
  "visualizerConcepts": [{"type": "<type>", "description": "<description>", "elements": ["<element>"]}],
  "pressRelease": "<short press release>",
  "bioUpdate": "<bio update suggestion>",
  "hashtagStrategy": ["<hashtag>"]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a creative marketing expert for African music. Return valid JSON only. Make content culturally relevant and platform-optimized.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      await supabase.from('ai_track_analyses').update({ status: 'failed' }).eq('id', analysisRecord!.id);
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: 'AI rate limit exceeded.' }), { status: 429, headers: corsHeaders });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: 'AI credits depleted.' }), { status: 402, headers: corsHeaders });
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
      promo_captions: analysis.promoCaptions || [],
      campaign_ideas: analysis.campaignIdeas || [],
      cover_art_concepts: analysis.coverArtConcepts || [],
      visualizer_concepts: analysis.visualizerConcepts || [],
      raw_analysis: analysis,
      completed_at: new Date().toISOString(),
    }).eq('id', analysisRecord!.id);

    return new Response(
      JSON.stringify({ success: true, analysisId: analysisRecord!.id, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ai-content-enhance error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});