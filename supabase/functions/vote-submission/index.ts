import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VOTE_COST = 1; // 1 BAKCoin per vote
const ARTIST_SHARE = 0.65; // 65% to artist
const PLATFORM_SHARE = 0.35; // 35% to platform
const MAX_VOTES_PER_SUBMISSION_PER_HOUR = 50; // Rate limit per user per submission per hour
const SELF_VOTE_LIMIT_PER_DAY = 10; // Max self-votes per day

// BAK55 Platform Operations Wallet
const PLATFORM_USER_ID = "b2a31558-e58a-466f-99b8-7ba636bcf6be";

interface VoteRequest {
  submission_id: string;
  stage_id?: string;
  quantity?: number; // number of votes to cast in this transaction (1-25)
}

const MAX_BUNDLE_QUANTITY = 25;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is banned/suspended
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('banned, suspended_at')
      .eq('id', user.id)
      .single();

    if (profile?.banned || profile?.suspended_at) {
      return new Response(
        JSON.stringify({ error: 'Your account has been suspended. Contact support for assistance.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { submission_id, stage_id, quantity: rawQty }: VoteRequest = await req.json();

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: 'submission_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quantity = Math.max(1, Math.min(MAX_BUNDLE_QUANTITY, Math.floor(Number(rawQty) || 1)));
    const totalCost = VOTE_COST * quantity;

    // Get submission details
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        artist_id,
        competition_id,
        voting_enabled,
        moderation_status,
        status,
        competitions (
          id,
          voting_start_date,
          voting_end_date,
          status
        )
      `)
      .eq('id', submission_id)
      .single();

    if (subError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!(submission as any).voting_enabled) {
      return new Response(
        JSON.stringify({ error: 'Voting is disabled for this submission' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((submission as any).moderation_status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'This submission has not been approved yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((submission as any).status === 'rejected') {
      return new Response(
        JSON.stringify({ error: 'This submission has been rejected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const competition = (submission as any).competitions;

    // Check voting window
    if (competition?.voting_start_date && competition?.voting_end_date) {
      const now = new Date();
      const votingStart = new Date(competition.voting_start_date);
      const votingEnd = new Date(competition.voting_end_date);

      if (now < votingStart) {
        return new Response(
          JSON.stringify({ error: 'Voting has not started yet', voting_starts: competition.voting_start_date }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (now > votingEnd) {
        return new Response(
          JSON.stringify({ error: 'Voting has ended', voting_ended: competition.voting_end_date }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const isSelfVote = user.id === submission.artist_id;

    // === RATE LIMITING ===
    
    // Check votes per submission per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: recentVotes } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('voter_id', user.id)
      .eq('submission_id', submission_id)
      .gte('created_at', oneHourAgo);

    if ((recentVotes || 0) + quantity > MAX_VOTES_PER_SUBMISSION_PER_HOUR) {
      return new Response(
        JSON.stringify({ 
          error: `You've reached the maximum of ${MAX_VOTES_PER_SUBMISSION_PER_HOUR} votes per hour for this submission. Please try again later.`,
          code: 'RATE_LIMITED'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Self-vote daily limit
    if (isSelfVote) {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      const { count: selfVotesToday } = await supabaseAdmin
        .from('votes')
        .select('id', { count: 'exact', head: true })
        .eq('voter_id', user.id)
        .eq('submission_id', submission_id)
        .gte('created_at', oneDayAgo);

      if ((selfVotesToday || 0) + quantity > SELF_VOTE_LIMIT_PER_DAY) {
        return new Response(
          JSON.stringify({ 
            error: `Self-voting is limited to ${SELF_VOTE_LIMIT_PER_DAY} votes per day. Ask your fans to vote for you!`,
            code: 'SELF_VOTE_LIMIT'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get voter's wallet
    const { data: voterWallet, error: voterWalletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single();

    if (voterWalletError || !voterWallet) {
      return new Response(
        JSON.stringify({ error: 'Wallet not found. Please set up your wallet first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (voterWallet.balance < totalCost) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient BAKCoins. You need ${totalCost} BAK to send ${quantity} vote${quantity>1?'s':''}. Current balance: ${voterWallet.balance.toFixed(2)} BAK`,
          code: 'INSUFFICIENT_BALANCE',
          required: totalCost,
          quantity,
          current_balance: voterWallet.balance
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get artist's wallet
    const { data: artistWallet, error: artistWalletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', submission.artist_id)
      .single();

    if (artistWalletError || !artistWallet) {
      return new Response(
        JSON.stringify({ error: 'Artist wallet not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get platform wallet
    const { data: platformWallet, error: platformWalletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', PLATFORM_USER_ID)
      .single();

    if (platformWalletError || !platformWallet) {
      return new Response(
        JSON.stringify({ error: 'Platform wallet configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const artistAmount = VOTE_COST * ARTIST_SHARE;
    const platformAmount = VOTE_COST * PLATFORM_SHARE;

    // === START TRANSACTION ===

    // 1. Deduct from voter's wallet with optimistic locking
    const { data: deductResult, error: voterDeductError } = await supabaseAdmin
      .from('wallets')
      .update({ 
        balance: voterWallet.balance - VOTE_COST,
        updated_at: new Date().toISOString()
      })
      .eq('id', voterWallet.id)
      .eq('balance', voterWallet.balance)
      .select('balance')
      .single();

    if (voterDeductError || !deductResult) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process payment. Your balance may have changed — please try again.',
          code: 'TRANSACTION_CONFLICT'
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Credit artist wallet (65%)
    const { error: artistCreditError } = await supabaseAdmin
      .from('wallets')
      .update({ 
        balance: artistWallet.balance + artistAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', artistWallet.id);

    if (artistCreditError) {
      await supabaseAdmin.from('wallets').update({ balance: voterWallet.balance }).eq('id', voterWallet.id);
      return new Response(
        JSON.stringify({ error: 'Failed to credit artist. Transaction rolled back.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Credit platform wallet (35%)
    await supabaseAdmin
      .from('wallets')
      .update({ 
        balance: platformWallet.balance + platformAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', platformWallet.id);

    // 4. Record the vote
    const voteData: any = {
      submission_id,
      voter_id: user.id,
      stage_id: stage_id || null,
      vote_weight: 1,
      voted_at: new Date().toISOString()
    };

    const { error: voteError } = await supabaseAdmin
      .from('votes')
      .insert(voteData);

    if (voteError) {
      console.error('Vote record error:', voteError);
      await supabaseAdmin.from('wallets').update({ balance: voterWallet.balance }).eq('id', voterWallet.id);
      await supabaseAdmin.from('wallets').update({ balance: artistWallet.balance }).eq('id', artistWallet.id);
      return new Response(
        JSON.stringify({ error: 'Failed to record vote. Transaction rolled back.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Record vote in audit log
    await supabaseAdmin.from('vote_audit_log').insert({
      competition_id: submission.competition_id,
      voter_id: user.id,
      submission_id,
      is_self_vote: isSelfVote,
      vote_number_in_session: (recentVotes || 0) + 1,
      flagged: isSelfVote && (recentVotes || 0) > 20,
      flag_reason: isSelfVote && (recentVotes || 0) > 20 ? 'High-frequency self-voting' : null
    }).then(() => {}).catch(e => console.error('Audit log error:', e));

    // 6. Transaction records
    await Promise.all([
      supabaseAdmin.from('transactions').insert({
        wallet_id: voterWallet.id,
        amount: -VOTE_COST,
        type: 'purchase',
        description: `Vote for competition submission`,
        reference_id: submission_id,
        metadata: { type: 'vote_payment', competition_id: submission.competition_id, artist_id: submission.artist_id, is_self_vote: isSelfVote }
      }),
      supabaseAdmin.from('transactions').insert({
        wallet_id: artistWallet.id,
        amount: artistAmount,
        type: 'earning',
        description: `Vote revenue (65% of ${VOTE_COST} BAK)`,
        reference_id: submission_id,
        metadata: { type: 'vote_earning', voter_id: user.id, competition_id: submission.competition_id, is_self_vote: isSelfVote }
      }),
      supabaseAdmin.from('transactions').insert({
        wallet_id: platformWallet.id,
        amount: platformAmount,
        type: 'earning',
        description: `Platform vote fee (35% of ${VOTE_COST} BAK)`,
        reference_id: submission_id,
        metadata: { type: 'platform_vote_fee', voter_id: user.id, artist_id: submission.artist_id, competition_id: submission.competition_id }
      })
    ]);

    // 7. Notify artist (throttled - only every 10th vote)
    const { count: totalVotesForSubmission } = await supabaseAdmin
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('submission_id', submission_id);

    if ((totalVotesForSubmission || 0) % 10 === 0) {
      await supabaseAdmin.from('notifications').insert({
        user_id: submission.artist_id,
        type: 'vote_received',
        title: '🗳️ Votes Update!',
        message: `Your submission has reached ${totalVotesForSubmission} votes! +${artistAmount.toFixed(2)} BAK earned.`,
        link: `/rising-stars/voting`,
        priority: 'normal',
        category: 'competition'
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Vote recorded successfully!',
        vote_cost: VOTE_COST,
        artist_earned: artistAmount,
        platform_fee: platformAmount,
        new_balance: deductResult.balance,
        is_self_vote: isSelfVote
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Vote submission error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
