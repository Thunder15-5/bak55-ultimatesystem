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

    // Get track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*, profiles:artist_id(username, display_name, location)')
      .eq('id', trackId)
      .single();
    if (trackError || !track) throw new Error("Track not found");

    // Get artist profile
    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('stage_name, genres, talent_score, verified')
      .eq('user_id', track.artist_id)
      .maybeSingle();

    // Get track performance metrics
    const { count: playCount } = await supabase
      .from('listening_history')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId);

    const { count: likeCount } = await supabase
      .from('track_likes')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId);

    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId);

    // Get artist's other tracks for comparison
    const { data: otherTracks } = await supabase
      .from('tracks')
      .select('title, genre, plays, created_at')
      .eq('artist_id', track.artist_id)
      .order('plays', { ascending: false })
      .limit(10);

    // Get follower count
    const { count: followerCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', track.artist_id);

    // Create analysis record
    const { data: analysisRecord, error: insertError } = await supabase
      .from('ai_track_analyses')
      .insert({
        track_id: trackId,
        user_id: userId,
        analysis_type: 'talent_scout',
        status: 'processing',
      })
      .select()
      .single();
    if (insertError) throw insertError;

    console.log(`AI Talent Scout analyzing track: ${track.title}`);

    const prompt = `You are an elite AI music talent scout for BAK55, an African music platform. Analyze this track and artist comprehensively.

TRACK DATA:
- Title: "${track.title}"
- Genre: ${track.genre || 'Unknown'}
- Description: ${track.description || 'None'}
- Total Plays: ${playCount || 0}
- Likes: ${likeCount || 0}
- Comments: ${commentCount || 0}
- Days Since Upload: ${Math.floor((Date.now() - new Date(track.created_at).getTime()) / 86400000)}
- Is Paid Download: ${track.is_paid_download || false}
- Price: ${track.price_in_bak || 0} BAK

ARTIST DATA:
- Name: ${artistProfile?.stage_name || track.profiles?.username || 'Unknown'}
- Location: ${track.profiles?.location || 'Unknown'}
- Genres: ${artistProfile?.genres?.join(', ') || 'Unknown'}
- Verified: ${artistProfile?.verified || false}
- Followers: ${followerCount || 0}
- Total Tracks: ${otherTracks?.length || 0}
- Top Tracks: ${JSON.stringify(otherTracks?.slice(0, 5).map(t => ({ title: t.title, plays: t.plays })))}

Provide a thorough analysis with these EXACT numerical scores (0-100) and insights. Use the track metrics, artist metrics, and genre context to produce UNIQUE scores for this specific track:

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
  "comparableArtists": [
    {"name": "<African artist name>", "similarity": <0-100>, "reason": "<why similar>"}
  ],
  "recommendations": [
    {"category": "<production|marketing|audience|career>", "title": "<short title>", "description": "<actionable advice>", "priority": "<high|medium|low>"}
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "overallAssessment": "<2-3 sentence comprehensive assessment>"
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
          { role: 'system', content: 'You are an expert music talent scout. Always return valid JSON. Scores must vary based on actual data provided — no two tracks should get identical scores.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errText);
      
      await supabase.from('ai_track_analyses').update({ status: 'failed' }).eq('id', analysisRecord.id);
      
      if (aiResponse.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
      if (aiResponse.status === 402) throw new Error('AI credits depleted.');
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

    // Store results
    const { error: updateError } = await supabase
      .from('ai_track_analyses')
      .update({
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
      })
      .eq('id', analysisRecord.id);

    if (updateError) throw updateError;

    console.log(`Talent Scout complete for "${track.title}". Score: ${analysis.talentScore}`);

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
