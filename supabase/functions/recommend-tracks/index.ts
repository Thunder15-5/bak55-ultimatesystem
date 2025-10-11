import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      throw new Error('user_id is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's listening history
    const { data: history, error: historyError } = await supabase
      .from('listening_history')
      .select(`
        track_id,
        tracks (
          id,
          title,
          genre,
          artist_id,
          profiles:artist_id (username)
        )
      `)
      .eq('user_id', user_id)
      .order('listened_at', { ascending: false })
      .limit(20);

    if (historyError) throw historyError;

    // Get all tracks for recommendation pool
    const { data: allTracks, error: tracksError } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        genre,
        plays,
        artist_id,
        profiles:artist_id (username)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (tracksError) throw tracksError;

    // Prepare data for AI analysis
    const listeningProfile = history?.map((h: any) => ({
      title: h.tracks?.title,
      genre: h.tracks?.genre,
      artist: h.tracks?.profiles?.username,
    })) || [];

    const availableTracks = allTracks?.map((t: any) => ({
      id: t.id,
      title: t.title,
      genre: t.genre,
      artist: t.profiles?.username,
      plays: t.plays,
    })) || [];

    // Call Lovable AI for recommendations
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a music recommendation AI. Analyze user listening patterns and recommend tracks. You must return ONLY a valid JSON array of track IDs with no markdown formatting, no code blocks, no extra text. Just the raw JSON array like ["id1", "id2", "id3"].'
          },
          {
            role: 'user',
            content: `Based on this listening history:\n${JSON.stringify(listeningProfile, null, 2)}\n\nRecommend tracks from this catalog:\n${JSON.stringify(availableTracks, null, 2)}\n\nReturn ONLY a JSON array of up to 10 track IDs with no markdown formatting.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits depleted. Please add credits to continue.');
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    let responseContent = aiResult.choices[0].message.content;
    
    // Clean up markdown code blocks if present
    responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const recommendedIds = JSON.parse(responseContent);

    // Get full track details for recommendations
    const { data: recommendedTracks, error: recError } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        genre,
        cover_image,
        plays,
        artist_id,
        profiles:artist_id (username, avatar_url)
      `)
      .in('id', recommendedIds);

    if (recError) throw recError;

    // Sort by recommendation order
    const sortedTracks = recommendedIds
      .map((id: string) => recommendedTracks?.find((t: any) => t.id === id))
      .filter(Boolean);

    console.log(`Generated ${sortedTracks.length} recommendations for user ${user_id}`);

    return new Response(
      JSON.stringify({ recommendations: sortedTracks }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in recommend-tracks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
