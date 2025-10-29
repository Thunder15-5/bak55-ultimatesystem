import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StageProgressRequest {
  stageId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { stageId } = await req.json() as StageProgressRequest;

    console.log('Processing stage progression for stage:', stageId);

    // Get stage details
    const { data: stage, error: stageError } = await supabase
      .from('competition_stages')
      .select('*, competitions(*)')
      .eq('id', stageId)
      .single();

    if (stageError || !stage) {
      throw new Error('Stage not found');
    }

    // Get all submissions for this stage with vote counts
    const { data: stageSubmissions, error: submissionsError } = await supabase
      .from('stage_submissions')
      .select(`
        id,
        artist_id,
        submission_id,
        submissions (
          id,
          vote_count,
          ai_score,
          final_score
        )
      `)
      .eq('stage_id', stageId)
      .eq('status', 'active');

    if (submissionsError) {
      throw submissionsError;
    }

    // Calculate rankings based on final scores
    const rankedSubmissions = stageSubmissions
      .map(sub => {
        const submission = Array.isArray(sub.submissions) ? sub.submissions[0] : sub.submissions;
        return {
          ...sub,
          finalScore: (submission as any)?.final_score || 0,
          voteCount: (submission as any)?.vote_count || 0,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    // Determine who advances and who gets eliminated
    const advancingCount = (stage.max_participants || 0) - (stage.elimination_count || 0);
    const advancing = rankedSubmissions.slice(0, advancingCount);
    const eliminated = rankedSubmissions.slice(advancingCount);

    console.log(`Stage ${stageId}: ${advancing.length} advancing, ${eliminated.length} eliminated`);

    // Update stage submissions status
    for (let i = 0; i < advancing.length; i++) {
      await supabase
        .from('stage_submissions')
        .update({
          status: 'advanced',
          stage_rank: i + 1,
        })
        .eq('id', advancing[i].id);
    }

    for (let i = 0; i < eliminated.length; i++) {
      await supabase
        .from('stage_submissions')
        .update({
          status: 'eliminated',
          stage_rank: advancingCount + i + 1,
          eliminated_at: new Date().toISOString(),
        })
        .eq('id', eliminated[i].id);

      // Update artist journey
      await supabase
        .from('artist_competition_journey')
        .update({
          is_eliminated: true,
          elimination_stage_id: stageId,
        })
        .eq('competition_id', stage.competition_id)
        .eq('artist_id', eliminated[i].artist_id);
    }

    // Update stage status to completed
    await supabase
      .from('competition_stages')
      .update({ status: 'completed' })
      .eq('id', stageId);

    // Send notifications to eliminated artists
    for (const elim of eliminated) {
      await supabase.from('notifications').insert({
        user_id: elim.artist_id,
        type: 'competition_elimination',
        title: '🎵 Competition Stage Complete',
        message: `You've been eliminated from ${stage.stage_name}. Thank you for participating!`,
        link: `/competition/${stage.competition_id}`,
        priority: 'high',
        category: 'competition',
      });
    }

    // Send notifications to advancing artists
    for (const adv of advancing) {
      await supabase.from('notifications').insert({
        user_id: adv.artist_id,
        type: 'competition_advancement',
        title: '🎉 You Advanced!',
        message: `Congratulations! You're moving forward in ${stage.stage_name}!`,
        link: `/competition/${stage.competition_id}`,
        priority: 'high',
        category: 'competition',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        advancing: advancing.length,
        eliminated: eliminated.length,
        rankings: rankedSubmissions.map(s => ({
          artistId: s.artist_id,
          rank: rankedSubmissions.indexOf(s) + 1,
          score: s.finalScore,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing stage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});