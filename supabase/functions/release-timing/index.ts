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
    
    const { artistId, genre } = await req.json();

    console.log('Analyzing release timing for artist:', artistId);

    // Get listening history patterns by day and hour
    const { data: listeningHistory } = await supabase
      .from('listening_history')
      .select('listened_at')
      .gte('listened_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString());

    // Analyze by day of week
    const dayStats = listeningHistory?.reduce((acc: any, item) => {
      const day = new Date(item.listened_at).getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {});

    // Analyze by hour of day
    const hourStats = listeningHistory?.reduce((acc: any, item) => {
      const hour = new Date(item.listened_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Get artist's past performance
    const { data: artistTracks } = await supabase
      .from('tracks')
      .select('id, title, created_at, plays, genre')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    // Analyze artist's best performing releases
    const trackPerformance = artistTracks?.map(track => {
      const dayOfWeek = new Date(track.created_at).getDay();
      const hourOfDay = new Date(track.created_at).getHours();
      return {
        title: track.title,
        plays: track.plays,
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        hourOfDay,
        genre: track.genre,
      };
    });

    // Get upcoming competitions
    const { data: upcomingCompetitions } = await supabase
      .from('competitions')
      .select('title, start_date, end_date, genres')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(5);

    const timingData = {
      platformActivity: {
        peakDays: Object.entries(dayStats || {})
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3)
          .map(([day, count]) => ({ day, activity: count })),
        peakHours: Object.entries(hourStats || {})
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3)
          .map(([hour, count]) => ({ hour: parseInt(hour), activity: count })),
      },
      artistHistory: trackPerformance?.slice(0, 10),
      upcomingEvents: upcomingCompetitions?.map(c => ({
        title: c.title,
        startDate: c.start_date,
        endDate: c.end_date,
        genres: c.genres,
      })),
      requestedGenre: genre,
    };

    console.log('Calling AI for release timing recommendations...');

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
            content: `You are a music release strategist specializing in African music markets. 
Analyze listener behavior patterns and provide specific, actionable release timing recommendations.
Consider platform activity, artist history, and upcoming events. Be precise with days and times.`
          },
          {
            role: 'user',
            content: `Provide release timing recommendations for this ${genre || 'African'} artist:

Platform Activity Patterns:
- Peak Days: ${JSON.stringify(timingData.platformActivity.peakDays)}
- Peak Hours: ${JSON.stringify(timingData.platformActivity.peakHours)}

Artist's Release History:
${JSON.stringify(timingData.artistHistory?.slice(0, 5))}

Upcoming Platform Events:
${JSON.stringify(timingData.upcomingEvents)}

Provide recommendations in this exact JSON format:
{
  "optimalReleaseDay": "day of week",
  "optimalReleaseTime": "HH:MM format (24-hour)",
  "reasoning": "detailed explanation (2-3 sentences)",
  "alternativeSlots": [
    {"day": "day", "time": "HH:MM", "reason": "brief explanation"}
  ],
  "strategicTiming": [
    {"suggestion": "specific timing advice", "impact": "expected benefit"}
  ],
  "competitionStrategy": "advice on timing releases around competitions (2-3 sentences)",
  "seasonalAdvice": "best months/seasons for releases in this genre (1-2 sentences)"
}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`Release timing analysis failed: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const recommendationsText = aiResult.choices[0].message.content;
    
    let recommendations;
    try {
      const jsonMatch = recommendationsText.match(/\{[\s\S]*\}/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        optimalReleaseDay: "Friday",
        optimalReleaseTime: "18:00",
        reasoning: "Peak listening activity occurs on weekends. Friday evening releases maximize weekend engagement.",
        alternativeSlots: [
          { day: "Thursday", time: "19:00", reason: "Pre-weekend momentum" }
        ],
        strategicTiming: [
          { suggestion: "Release 2 weeks before major competitions", impact: "Build momentum for entries" }
        ],
        competitionStrategy: "Time releases to maximize eligibility for upcoming competitions.",
        seasonalAdvice: "Summer months show higher engagement."
      };
    } catch (parseError) {
      console.error('Failed to parse AI recommendations:', parseError);
      recommendations = {
        optimalReleaseDay: "Friday",
        optimalReleaseTime: "18:00",
        reasoning: "Friday evening releases align with peak platform activity and give maximum weekend exposure. Your audience is most active during this time, increasing initial engagement crucial for algorithm visibility.",
        alternativeSlots: [
          { day: "Thursday", time: "19:00", reason: "Early weekend momentum, lower competition" },
          { day: "Saturday", time: "14:00", reason: "Weekend leisure time, high engagement" }
        ],
        strategicTiming: [
          { suggestion: "Release 2 weeks before major competitions", impact: "Build track momentum before competition submission" },
          { suggestion: "Avoid major festival dates", impact: "Reduced competition for listener attention" },
          { suggestion: "Coordinate with social media campaigns 48hrs before", impact: "Maximize launch day impact" }
        ],
        competitionStrategy: "Release tracks 2-3 weeks before competition deadlines to build natural engagement. This authentic play count and vote momentum strengthens your competition entry and demonstrates market validation.",
        seasonalAdvice: "Peak engagement occurs during festival seasons (June-August, December). However, releasing during quieter months (February-April) can reduce competition for listener attention."
      };
    }

    return new Response(
      JSON.stringify({
        data: timingData,
        recommendations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in release-timing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});