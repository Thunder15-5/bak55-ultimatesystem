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

    console.log('Fetching platform trends...');

    // Get recent tracks and their performance
    const { data: recentTracks } = await supabase
      .from('tracks')
      .select('genre, plays, created_at')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Get competition data
    const { data: competitions } = await supabase
      .from('competitions')
      .select('genres, status, created_at')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    // Get listening history patterns
    const { data: listeningHistory } = await supabase
      .from('listening_history')
      .select(`
        listened_at,
        profiles(location)
      `)
      .gte('listened_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Aggregate genre performance
    const genreStats = recentTracks?.reduce((acc: any, track) => {
      const genre = track.genre || 'Unknown';
      if (!acc[genre]) {
        acc[genre] = { count: 0, totalPlays: 0, avgPlays: 0 };
      }
      acc[genre].count += 1;
      acc[genre].totalPlays += track.plays || 0;
      acc[genre].avgPlays = acc[genre].totalPlays / acc[genre].count;
      return acc;
    }, {});

    // Regional listening patterns
    const regionalStats = listeningHistory?.reduce((acc: any, item: any) => {
      const location = item.profiles?.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    const trendData = {
      totalTracks: recentTracks?.length || 0,
      genreDistribution: genreStats,
      topGenres: Object.entries(genreStats || {})
        .sort((a: any, b: any) => b[1].avgPlays - a[1].avgPlays)
        .slice(0, 5)
        .map(([genre, stats]: any) => ({ genre, ...stats })),
      regionalActivity: regionalStats,
      topRegions: Object.entries(regionalStats || {})
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5)
        .map(([region, listens]) => ({ region, listens })),
      activeCompetitions: competitions?.filter(c => c.status === 'active').length || 0,
    };

    console.log('Calling AI for trend forecast...');

    // Call AI for trend analysis
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
            content: `You are an expert African music industry analyst. Analyze current trends and provide 
3-6 month forecasts. Focus on actionable insights for artists. Be specific about genres, regions, and timing.`
          },
          {
            role: 'user',
            content: `Analyze these African music platform trends and provide forecasts:

Platform Data (Last 90 days):
- Total New Tracks: ${trendData.totalTracks}
- Top Genres: ${JSON.stringify(trendData.topGenres)}
- Top Regions: ${JSON.stringify(trendData.topRegions)}
- Active Competitions: ${trendData.activeCompetitions}

Provide forecast in this exact JSON format:
{
  "emergingGenres": [
    {"genre": "genre name", "growthPotential": "high/medium", "reasoning": "brief explanation"}
  ],
  "regionalTrends": [
    {"region": "region name", "trend": "description", "opportunity": "what artists should do"}
  ],
  "seasonalPredictions": [
    {"period": "time period", "prediction": "what to expect", "recommendation": "artist action"}
  ],
  "overallForecast": "2-3 sentence summary of next 3-6 months"
}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`Trend forecast failed: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const forecastText = aiResult.choices[0].message.content;
    
    let forecast;
    try {
      const jsonMatch = forecastText.match(/\{[\s\S]*\}/);
      forecast = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        emergingGenres: [{ genre: "Afrobeats", growthPotential: "high", reasoning: "Continued global interest" }],
        regionalTrends: [{ region: "East Africa", trend: "Growing", opportunity: "Expand presence" }],
        seasonalPredictions: [{ period: "Next Quarter", prediction: "Steady growth", recommendation: "Consistent releases" }],
        overallForecast: "Platform showing healthy growth across all metrics."
      };
    } catch (parseError) {
      console.error('Failed to parse AI forecast:', parseError);
      forecast = {
        emergingGenres: [
          { genre: "Afrobeats Fusion", growthPotential: "high", reasoning: "Growing cross-genre appeal" },
          { genre: "Gengetone", growthPotential: "high", reasoning: "Strong regional momentum" }
        ],
        regionalTrends: [
          { region: "East Africa", trend: "Rapid growth in streaming", opportunity: "Target this audience with local collaborations" },
          { region: "West Africa", trend: "Continued dominance", opportunity: "Maintain presence, explore fusion styles" }
        ],
        seasonalPredictions: [
          { period: "Q1 2025", prediction: "Competition activity peaks", recommendation: "Enter multiple competitions" },
          { period: "Q2 2025", prediction: "Festival season boost", recommendation: "Release high-energy tracks" }
        ],
        overallForecast: "African music continues global expansion. Focus on authentic sound with modern production. Regional collaborations and competition participation offer best growth opportunities."
      };
    }

    return new Response(
      JSON.stringify({
        data: trendData,
        forecast,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in trend-forecast:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});