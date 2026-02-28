import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackId, userId } = await req.json();
    if (!trackId || !userId) throw new Error("trackId and userId required");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: track } = await supabase
      .from('tracks')
      .select('*, profiles:artist_id(username, display_name, bio)')
      .eq('id', trackId).single();
    if (!track) throw new Error("Track not found");

    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('stage_name, genres')
      .eq('user_id', track.artist_id).maybeSingle();

    const { data: analysisRecord } = await supabase
      .from('ai_track_analyses')
      .insert({
        track_id: trackId, user_id: userId,
        analysis_type: 'content_enhance', status: 'processing',
      }).select().single();

    const prompt = `You are a creative director for African music marketing. Generate promotional content for this track.

TRACK: "${track.title}"
Artist: ${artistProfile?.stage_name || track.profiles?.username}
Genre: ${track.genre || 'Unknown'}
Description: ${track.description || 'None'}
Artist Bio: ${track.profiles?.bio || 'None'}
Artist Genres: ${artistProfile?.genres?.join(', ') || 'Unknown'}

Generate COMPLETE promotional content package in EXACT JSON:
{
  "promoCaptions": {
    "instagram": ["<caption 1 with emojis and hashtags>", "<caption 2>", "<caption 3>"],
    "twitter": ["<tweet 1 (under 280 chars)>", "<tweet 2>", "<tweet 3>"],
    "tiktok": ["<caption 1>", "<caption 2>"],
    "whatsapp": ["<message for WhatsApp status/story>"]
  },
  "campaignIdeas": [
    {
      "name": "<campaign name>",
      "platform": "<primary platform>",
      "duration": "<timeframe>",
      "description": "<detailed plan>",
      "steps": ["<step 1>", "<step 2>", "<step 3>"],
      "expectedOutcome": "<what to expect>"
    }
  ],
  "coverArtConcepts": [
    {
      "style": "<art style>",
      "description": "<detailed visual description for an AI image generator>",
      "colorPalette": ["<color 1>", "<color 2>", "<color 3>"],
      "mood": "<visual mood>"
    }
  ],
  "visualizerConcepts": [
    {
      "type": "<visualizer type>",
      "description": "<how the visualizer should look and behave>",
      "elements": ["<element 1>", "<element 2>"]
    }
  ],
  "pressRelease": "<short press release paragraph>",
  "bioUpdate": "<suggested artist bio update incorporating this track>",
  "hashtagStrategy": ["<hashtag 1>", "<hashtag 2>", "<hashtag 3>", "<hashtag 4>", "<hashtag 5>"]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a creative marketing expert for African music. Return valid JSON only. Make content culturally relevant, engaging, and platform-optimized.' },
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
