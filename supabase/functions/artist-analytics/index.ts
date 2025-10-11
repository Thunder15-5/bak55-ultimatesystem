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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { artistId } = await req.json();
    
    if (!artistId) {
      throw new Error('Artist ID is required');
    }

    console.log('Fetching analytics for artist:', artistId);

    // Fetch artist data
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id, title, genre, plays, created_at')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    // Fetch listening history for demographics
    const trackIds = tracks?.map(t => t.id) || [];
    const { data: listeningHistory } = await supabase
      .from('listening_history')
      .select(`
        listened_at,
        user_id,
        profiles(location)
      `)
      .in('track_id', trackIds);

    // Fetch earnings/transactions
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', artistId)
      .single();

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at, type, description')
      .eq('wallet_id', wallet?.id)
      .order('created_at', { ascending: false });

    // Fetch follower data
    const { count: followerCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    // Get submissions and votes
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, vote_count, ai_score, created_at')
      .eq('artist_id', artistId);

    // Prepare data for AI analysis
    const analyticsData = {
      tracks: tracks?.length || 0,
      totalPlays: tracks?.reduce((sum, t) => sum + (t.plays || 0), 0) || 0,
      genres: [...new Set(tracks?.map(t => t.genre).filter(Boolean))],
      followers: followerCount || 0,
      totalEarnings: transactions?.reduce((sum, t) => 
        t.type === 'earning' ? sum + Number(t.amount) : sum, 0
      ) || 0,
      avgPlaysPerTrack: tracks?.length 
        ? (tracks.reduce((sum, t) => sum + (t.plays || 0), 0) / tracks.length).toFixed(1)
        : 0,
      topLocations: listeningHistory?.reduce((acc: any, curr: any) => {
        const loc = curr.profiles?.location;
        if (loc) acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {}),
      recentPerformance: tracks?.slice(0, 5).map(t => ({
        title: t.title,
        plays: t.plays,
        daysOld: Math.floor((Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24))
      })),
      competitionStats: {
        totalSubmissions: submissions?.length || 0,
        avgVotes: submissions?.length 
          ? (submissions.reduce((sum, s) => sum + s.vote_count, 0) / submissions.length).toFixed(1)
          : 0,
        avgAiScore: submissions?.length
          ? (submissions.reduce((sum, s) => sum + (s.ai_score || 0), 0) / submissions.length).toFixed(1)
          : 0,
      }
    };

    console.log('Calling AI for insights...');

    // Call Lovable AI for personalized insights
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert music industry analyst specializing in African music markets. 
Analyze artist performance data and provide actionable insights in a friendly, encouraging tone.
Focus on: growth opportunities, strengths to leverage, and specific recommendations.
Keep insights concise (2-3 sentences each) and data-driven.`
          },
          {
            role: 'user',
            content: `Analyze this African artist's performance and provide insights:

Data:
- Total Tracks: ${analyticsData.tracks}
- Total Plays: ${analyticsData.totalPlays}
- Avg Plays/Track: ${analyticsData.avgPlaysPerTrack}
- Genres: ${analyticsData.genres.join(', ') || 'Not specified'}
- Followers: ${analyticsData.followers}
- Total Earnings: ${analyticsData.totalEarnings} BAKCoins
- Top Listener Locations: ${JSON.stringify(analyticsData.topLocations)}
- Recent Track Performance: ${JSON.stringify(analyticsData.recentPerformance)}
- Competition Stats: ${JSON.stringify(analyticsData.competitionStats)}

Provide insights in this exact JSON format:
{
  "overallPerformance": "Brief assessment (1-2 sentences)",
  "strengths": ["strength 1", "strength 2"],
  "growthOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "demographicInsights": "Key insight about listener demographics (1-2 sentences)",
  "genreRecommendations": "Advice on genre strategy (1-2 sentences)",
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"]
}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const insightsText = aiResult.choices[0].message.content;
    
    // Parse AI response
    let insights;
    try {
      const jsonMatch = insightsText.match(/\{[\s\S]*\}/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        overallPerformance: "Analysis in progress",
        strengths: ["Growing audience"],
        growthOpportunities: ["Continue uploading quality content"],
        demographicInsights: "Building diverse listener base",
        genreRecommendations: "Explore different genres",
        nextSteps: ["Keep creating", "Engage with fans"]
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      insights = {
        overallPerformance: "Keep up the great work! Your music is resonating with listeners.",
        strengths: ["Consistent quality", "Growing engagement"],
        growthOpportunities: ["Expand to new regions", "Collaborate with other artists", "Enter more competitions"],
        demographicInsights: "You're attracting listeners from diverse locations.",
        genreRecommendations: "Your current genre mix is working well. Consider exploring related styles.",
        nextSteps: ["Upload regularly", "Engage with your top listeners", "Promote on social media"]
      };
    }

    return new Response(
      JSON.stringify({
        data: analyticsData,
        insights,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in artist-analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});