import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BadgeCheckRequest {
  userId: string;
  competitionId: string;
  eventType?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, competitionId, eventType } = await req.json() as BadgeCheckRequest;

    console.log('Checking badges for user:', userId, 'competition:', competitionId);

    const newBadges: string[] = [];

    // Get all badges and their criteria
    const { data: allBadges } = await supabase
      .from('fan_badges')
      .select('*');

    if (!allBadges) return new Response(JSON.stringify({ badges: [] }), { headers: corsHeaders });

    // Get user's vote count in this competition
    const { data: votes } = await supabase
      .from('votes')
      .select('id, submission_id, created_at')
      .eq('voter_id', userId)
      .order('created_at', { ascending: true });

    const voteCount = votes?.length || 0;

    // Check each badge type
    for (const badge of allBadges) {
      // Check if user already has this badge for this competition
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)
        .eq('competition_id', competitionId)
        .single();

      if (existingBadge) continue;

      let shouldAward = false;

      switch (badge.badge_type) {
        case 'early_supporter':
          // Check if user is among first 100 voters
          const { count: voterCount } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .lte('created_at', votes?.[0]?.created_at || new Date().toISOString());
          shouldAward = (voterCount || 0) <= 100;
          break;

        case 'mega_fan':
          shouldAward = voteCount >= 50;
          break;

        case 'loyal_voter':
          // Check if voted in all stages
          const { data: stages } = await supabase
            .from('competition_stages')
            .select('id')
            .eq('competition_id', competitionId);

          const { data: userStageVotes } = await supabase
            .from('votes')
            .select('stage_id')
            .eq('voter_id', userId)
            .in('stage_id', stages?.map(s => s.id) || []);

          const uniqueStages = new Set(userStageVotes?.map(v => v.stage_id).filter(Boolean));
          shouldAward = Boolean(stages && uniqueStages.size === stages.length);
          break;

        case 'first_blood':
          if (eventType === 'first_vote_in_stage') {
            shouldAward = true;
          }
          break;

        case 'talent_scout':
          // Check if any voted artist made it to top 5
          const { data: votedSubmissions } = await supabase
            .from('votes')
            .select('submission_id, submissions!inner(artist_id)')
            .eq('voter_id', userId);

          const { data: topArtists } = await supabase
            .from('artist_competition_journey')
            .select('artist_id')
            .eq('competition_id', competitionId)
            .lte('final_placement', 5);

          const votedArtistIds = votedSubmissions?.map(v => (v.submissions as any)?.artist_id).filter(Boolean) || [];
          const topArtistIds = topArtists?.map(a => a.artist_id) || [];
          shouldAward = votedArtistIds.some(id => topArtistIds.includes(id));
          break;
      }

      if (shouldAward) {
        const { error: insertError } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            competition_id: competitionId,
          });

        if (!insertError) {
          newBadges.push(badge.badge_name);

          // Send notification
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'badge_earned',
            title: `🏆 Badge Earned: ${badge.badge_name}!`,
            message: badge.badge_description,
            link: `/profile`,
            priority: 'normal',
            category: 'achievement',
          });
        }
      }
    }

    console.log('Awarded badges:', newBadges);

    return new Response(
      JSON.stringify({ success: true, badges: newBadges }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking badges:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});