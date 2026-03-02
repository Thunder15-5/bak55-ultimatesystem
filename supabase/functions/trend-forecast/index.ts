import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DAILY_LIMIT = 5; // Trend forecasts are expensive — tighter limit
const CACHE_HOURS = 6; // Cache for 6 hours since trends don't change fast

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

    // Rate limit — check trend_forecast analyses in last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: todayCount } = await supabase
      .from('ai_track_analyses').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('analysis_type', 'trend_forecast')
      .gte('created_at', since);
    if ((todayCount || 0) >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: `Trend forecast limit (${DAILY_LIMIT}/day) reached.` }), { status: 429, headers: corsHeaders });
    }

    // Cache check — return recent forecast if available
    const cacheThreshold = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('ai_track_analyses').select('raw_analysis, id')
      .eq('user_id', userId).eq('analysis_type', 'trend_forecast')
      .eq('status', 'completed').gte('created_at', cacheThreshold)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (cached?.raw_analysis) {
      console.log('Returning cached trend forecast');
      const cachedResult = cached.raw_analysis as any;
      return new Response(
        JSON.stringify({ data: cachedResult._platformData || {}, forecast: cachedResult._forecast || cachedResult, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching platform trends...');

    // Parallel data fetch
    const [recentTracksRes, competitionsRes, listeningHistoryRes] = await Promise.all([
      supabase.from('tracks').select('genre, plays, created_at')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false }).limit(500),
      supabase.from('competitions').select('genres, status, created_at')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('listening_history').select('listened_at, profiles(location)')
        .gte('listened_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(500),
    ]);

    const recentTracks = recentTracksRes.data;
    const competitions = competitionsRes.data;
    const listeningHistory = listeningHistoryRes.data;

    const genreStats = recentTracks?.reduce((acc: any, track) => {
      const genre = track.genre || 'Unknown';
      if (!acc[genre]) acc[genre] = { count: 0, totalPlays: 0, avgPlays: 0 };
      acc[genre].count += 1;
      acc[genre].totalPlays += track.plays || 0;
      acc[genre].avgPlays = acc[genre].totalPlays / acc[genre].count;
      return acc;
    }, {});

    const regionalStats = listeningHistory?.reduce((acc: any, item: any) => {
      const location = item.profiles?.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    // Aggregated summary — no raw data exposed to client
    const trendSummary = {
      totalTracks: recentTracks?.length || 0,
      topGenres: Object.entries(genreStats || {})
        .sort((a: any, b: any) => b[1].avgPlays - a[1].avgPlays)
        .slice(0, 5).map(([genre, stats]: any) => ({ genre, count: stats.count, avgPlays: Math.round(stats.avgPlays) })),
      topRegions: Object.entries(regionalStats || {})
        .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
        .slice(0, 5).map(([region, listens]) => ({ region, listens })),
      activeCompetitions: competitions?.filter(c => c.status === 'active').length || 0,
    };

    console.log('Calling AI for trend forecast...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert African music industry analyst. Analyze current trends and provide 3-6 month forecasts. Focus on actionable insights for artists. Be specific about genres, regions, and timing.' },
          { role: 'user', content: `Analyze these African music platform trends and provide forecasts:

Platform Data (Last 90 days):
- Total New Tracks: ${trendSummary.totalTracks}
- Top Genres: ${JSON.stringify(trendSummary.topGenres)}
- Top Regions: ${JSON.stringify(trendSummary.topRegions)}
- Active Competitions: ${trendSummary.activeCompetitions}

Provide forecast in this exact JSON format:
{
  "emergingGenres": [{"genre": "genre name", "growthPotential": "high/medium", "reasoning": "brief explanation"}],
  "regionalTrends": [{"region": "region name", "trend": "description", "opportunity": "what artists should do"}],
  "seasonalPredictions": [{"period": "time period", "prediction": "what to expect", "recommendation": "artist action"}],
  "releaseWindows": [{"window": "optimal period", "genre": "best genre for this window", "reason": "why"}],
  "overallForecast": "2-3 sentence summary of next 3-6 months"
}` }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: 'AI rate limit exceeded.' }), { status: 429, headers: corsHeaders });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: 'AI credits depleted.' }), { status: 402, headers: corsHeaders });
      throw new Error(`Trend forecast failed: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const forecastText = aiResult.choices[0].message.content;
    
    let forecast;
    try {
      const jsonMatch = forecastText.match(/\{[\s\S]*\}/);
      forecast = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(forecastText);
    } catch {
      console.error('Failed to parse AI forecast');
      forecast = {
        emergingGenres: [{ genre: "Afrobeats Fusion", growthPotential: "high", reasoning: "Growing cross-genre appeal" }],
        regionalTrends: [{ region: "East Africa", trend: "Rapid growth", opportunity: "Target with local collaborations" }],
        seasonalPredictions: [{ period: "Next Quarter", prediction: "Steady growth", recommendation: "Consistent releases" }],
        releaseWindows: [{ window: "Friday evenings", genre: "Afrobeats", reason: "Peak listening hours" }],
        overallForecast: "African music continues global expansion. Focus on authentic sound with modern production."
      };
    }

    // Store forecast for caching
    await supabase.from('ai_track_analyses').insert({
      user_id: userId,
      analysis_type: 'trend_forecast',
      status: 'completed',
      raw_analysis: { _platformData: trendSummary, _forecast: forecast },
      completed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ data: trendSummary, forecast }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in trend-forecast:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});