import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { artistId } = await req.json();

    if (!artistId || typeof artistId !== 'string') {
      return new Response(JSON.stringify({ error: 'artistId is required' }), { status: 400, headers: corsHeaders });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(artistId)) {
      return new Response(JSON.stringify({ error: 'Invalid artistId format' }), { status: 400, headers: corsHeaders });
    }

    // Authorization: only the artist themselves or an admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (userId !== artistId) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Unauthorized to view this artist\'s data' }), { status: 403, headers: corsHeaders });
      }
    }

    console.log('Fetching analytics for artist:', artistId);

    // Fetch artist data
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id, title, genre, plays, created_at')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    const trackIds = tracks?.map(t => t.id) || [];
    const { data: listeningHistory } = await supabase
      .from('listening_history')
      .select(`listened_at, user_id, profiles(location)`)
      .in('track_id', trackIds.length > 0 ? trackIds : ['00000000-0000-0000-0000-000000000000']);

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', artistId)
      .single();

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at, type, description')
      .eq('wallet_id', wallet?.id || '00000000-0000-0000-0000-000000000000')
      .order('created_at', { ascending: false });

    const { count: followerCount } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, vote_count, ai_score, created_at')
      .eq('artist_id', artistId);

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
      throw new Error(`AI analysis failed`);
    }

    const aiResult = await aiResponse.json();
    const insightsText = aiResult.choices[0].message.content;

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
      JSON.stringify({ data: analyticsData, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in artist-analytics:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch analytics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
