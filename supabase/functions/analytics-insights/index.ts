import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders });
    }

    const { artistId, analyticsData } = await req.json();

    if (!artistId || typeof artistId !== 'string' || !analyticsData || typeof analyticsData !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: corsHeaders });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating AI insights for artist:", artistId);

    const systemPrompt = `You are an expert music industry analyst specializing in African music markets. 
Analyze artist performance data and provide actionable insights to help them grow their career.
Be specific, data-driven, and culturally aware of East African music trends.`;

    const safeData = {
      tracks: Number(analyticsData.tracks) || 0,
      totalPlays: Number(analyticsData.totalPlays) || 0,
      totalEarnings: Number(analyticsData.totalEarnings) || 0,
      followers: Number(analyticsData.followers) || 0,
      avgPlaysPerTrack: Number(analyticsData.avgPlaysPerTrack) || 0,
      genres: Array.isArray(analyticsData.genres) ? analyticsData.genres.slice(0, 10).map(String) : [],
      topLocations: typeof analyticsData.topLocations === 'object' ? analyticsData.topLocations : {},
    };

    const userPrompt = `Analyze this artist's performance data:
- Total Tracks: ${safeData.tracks}
- Total Plays: ${safeData.totalPlays}
- Total Earnings: ${safeData.totalEarnings} BAKCoins
- Followers: ${safeData.followers}
- Average Plays per Track: ${safeData.avgPlaysPerTrack}
- Genres: ${safeData.genres.join(', ')}
- Top Locations: ${JSON.stringify(safeData.topLocations)}

Provide insights in this exact JSON structure:
{
  "overallPerformance": "Brief 2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "growthOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "demographicInsights": "2-3 sentences about audience and location data",
  "genreRecommendations": "2-3 sentences about genre strategy",
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_insights",
            description: "Provide structured artist insights",
            parameters: {
              type: "object",
              properties: {
                overallPerformance: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                growthOpportunities: { type: "array", items: { type: "string" } },
                demographicInsights: { type: "string" },
                genreRecommendations: { type: "string" },
                nextSteps: { type: "array", items: { type: "string" } },
              },
              required: ["overallPerformance", "strengths", "growthOpportunities", "demographicInsights", "genreRecommendations", "nextSteps"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "provide_insights" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(insights),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in analytics-insights:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate insights" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
