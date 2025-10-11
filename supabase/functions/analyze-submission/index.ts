import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
    
    if (!submissionId) {
      throw new Error("Submission ID is required");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*, competitions(title, description, genres)')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      throw new Error("Submission not found");
    }

    console.log(`Analyzing submission: ${submission.title}`);

    // Prepare AI analysis prompt
    const prompt = `You are an expert music talent scout analyzing a competition submission. 
    
Competition: ${submission.competitions.title}
Competition Description: ${submission.competitions.description}
Expected Genres: ${submission.competitions.genres?.join(', ') || 'Any'}

Submission: ${submission.title}
Description: ${submission.description || 'No description provided'}

Analyze this music submission and provide scores (0-100) for:
1. Technical Quality - Audio quality, production, mixing, mastering
2. Creativity & Originality - Uniqueness, innovation, artistic vision
3. Genre Fit - How well it matches competition requirements
4. Commercial Potential - Market appeal, hit potential
5. Emotional Impact - Connection with audience, storytelling

Return your analysis as JSON with this exact structure:
{
  "technical_quality": <score>,
  "creativity": <score>,
  "genre_fit": <score>,
  "commercial_potential": <score>,
  "emotional_impact": <score>,
  "overall_score": <average of all scores>,
  "feedback": "<brief constructive feedback>"
}`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert music talent scout. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error("No AI response received");
    }

    console.log('AI Response:', aiContent);

    // Parse AI response (extract JSON from markdown if needed)
    let analysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error("Invalid AI response format");
    }

    // Update submission with AI analysis
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        ai_score: analysis.overall_score,
        ai_analysis: analysis,
        ai_analyzed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      throw updateError;
    }

    console.log(`AI analysis complete for submission ${submissionId}. Score: ${analysis.overall_score}`);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-submission:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});