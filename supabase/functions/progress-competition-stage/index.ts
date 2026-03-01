import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // Check admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders });
    }

    // Validate input
    const body = await req.json();
    const stageId = body?.stageId;

    if (!stageId || typeof stageId !== 'string') {
      return new Response(JSON.stringify({ error: 'stageId is required' }), { status: 400, headers: corsHeaders });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(stageId)) {
      return new Response(JSON.stringify({ error: 'Invalid stageId format' }), { status: 400, headers: corsHeaders });
    }

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

    const advancingCount = (stage.max_participants || 0) - (stage.elimination_count || 0);
    const advancing = rankedSubmissions.slice(0, advancingCount);
    const eliminated = rankedSubmissions.slice(advancingCount);

    console.log(`Stage ${stageId}: ${advancing.length} advancing, ${eliminated.length} eliminated`);

    for (let i = 0; i < advancing.length; i++) {
      await supabase
        .from('stage_submissions')
        .update({ status: 'advanced', stage_rank: i + 1 })
        .eq('id', advancing[i].id);
    }

    for (let i = 0; i < eliminated.length; i++) {
      await supabase
        .from('stage_submissions')
        .update({ status: 'eliminated', stage_rank: advancingCount + i + 1, eliminated_at: new Date().toISOString() })
        .eq('id', eliminated[i].id);

      await supabase
        .from('artist_competition_journey')
        .update({ is_eliminated: true, elimination_stage_id: stageId })
        .eq('competition_id', stage.competition_id)
        .eq('artist_id', eliminated[i].artist_id);
    }

    await supabase.from('competition_stages').update({ status: 'completed' }).eq('id', stageId);

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
        rankings: rankedSubmissions.map((s, idx) => ({
          artistId: s.artist_id,
          rank: idx + 1,
          score: s.finalScore,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing stage:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
