import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JudgeRequest {
  competition_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { competition_id }: JudgeRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all submissions for this competition
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:artist_id (username)
      `)
      .eq('competition_id', competition_id)
      .eq('status', 'approved');

    if (submissionsError) throw submissionsError;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate AI scores for each submission (30% of final score)
    const scoredSubmissions = [];

    for (const submission of submissions) {
      // Get AI analysis if not already done
      let aiScore = submission.ai_score || 0;

      if (!submission.ai_analyzed_at) {
        const prompt = `As a music industry expert judge, evaluate this competition submission:
        
Track: ${submission.title}
Artist: ${submission.profiles.username}
Description: ${submission.description || 'No description'}
Current Vote Count: ${submission.vote_count}

Evaluate based on these criteria (score 0-100):
1. Audio Quality & Production
2. Originality & Creativity
3. Market Potential
4. Technical Skill
5. Artistic Expression

Return ONLY a JSON object with:
{
  "overall_score": number (0-100),
  "audio_quality": number,
  "originality": number,
  "market_potential": number,
  "technical_skill": number,
  "artistic_expression": number,
  "feedback": "brief constructive feedback"
}`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!aiResponse.ok) {
          console.error('AI API error:', await aiResponse.text());
          aiScore = 50; // Default score if AI fails
        } else {
          const aiData = await aiResponse.json();
          const content = aiData.choices[0]?.message?.content || '{}';
          
          let analysis;
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { overall_score: 50 };
          } catch {
            analysis = { overall_score: 50 };
          }

          aiScore = analysis.overall_score || 50;

          // Update submission with AI analysis
          await supabase
            .from('submissions')
            .update({
              ai_score: aiScore,
              ai_analysis: analysis,
              ai_analyzed_at: new Date().toISOString(),
            })
            .eq('id', submission.id);
        }
      }

      // Calculate final score: 70% fan voting + 30% AI judging
      const maxVotes = Math.max(...submissions.map(s => s.vote_count || 0));
      const fanScore = maxVotes > 0 ? (submission.vote_count / maxVotes) * 70 : 0;
      const aiContribution = aiScore * 0.3;
      const finalScore = fanScore + aiContribution;

      scoredSubmissions.push({
        id: submission.id,
        final_score: finalScore,
        fan_score: fanScore,
        ai_score: aiScore,
      });

      // Update submission final score
      await supabase
        .from('submissions')
        .update({ final_score: finalScore })
        .eq('id', submission.id);
    }

    // Sort by final score
    scoredSubmissions.sort((a, b) => b.final_score - a.final_score);

    return new Response(
      JSON.stringify({ 
        success: true,
        submissions: scoredSubmissions,
        message: 'AI judging completed. Scores: 70% fan votes + 30% AI analysis',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in ai-judge-submission:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);