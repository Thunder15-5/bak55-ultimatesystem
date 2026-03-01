import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VOTE_COST = 1; // 1 BAKCoin per vote
const ARTIST_SHARE = 0.65; // 65% to artist
const PLATFORM_SHARE = 0.35; // 35% to platform

// BAK55 Platform Operations Wallet (admin@bak55talent.co.ke)
const PLATFORM_USER_ID = "b2a31558-e58a-466f-99b8-7ba636bcf6be";

interface VoteRequest {
  submission_id: string;
  stage_id?: string;
}

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

    const { submission_id, stage_id }: VoteRequest = await req.json();

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: 'submission_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Check voting is enabled and submission is approved
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

    // Reject if submission was rejected
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

    // NO self-voting restriction — artists can vote for themselves
    // NO duplicate vote restriction — unlimited voting allowed

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

    if (voterWallet.balance < VOTE_COST) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient BAKCoins. You need ${VOTE_COST} BAK to vote. Current balance: ${voterWallet.balance.toFixed(2)} BAK`,
          code: 'INSUFFICIENT_BALANCE',
          required: VOTE_COST,
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
      console.error('Platform wallet not found:', platformWalletError);
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
      .eq('balance', voterWallet.balance) // Optimistic lock
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
    const { error: voteError } = await supabaseAdmin
      .from('votes')
      .insert({
        submission_id,
        voter_id: user.id,
        stage_id: stage_id || null,
        vote_weight: 1,
        voted_at: new Date().toISOString()
      });

    if (voteError) {
      console.error('Vote record error:', voteError);
      // Rollback
      await supabaseAdmin.from('wallets').update({ balance: voterWallet.balance }).eq('id', voterWallet.id);
      await supabaseAdmin.from('wallets').update({ balance: artistWallet.balance }).eq('id', artistWallet.id);
      return new Response(
        JSON.stringify({ error: 'Failed to record vote. Transaction rolled back.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Transaction records
    await Promise.all([
      supabaseAdmin.from('transactions').insert({
        wallet_id: voterWallet.id,
        amount: -VOTE_COST,
        type: 'purchase',
        description: `Vote for competition submission`,
        reference_id: submission_id,
        metadata: { type: 'vote_payment', competition_id: submission.competition_id, artist_id: submission.artist_id }
      }),
      supabaseAdmin.from('transactions').insert({
        wallet_id: artistWallet.id,
        amount: artistAmount,
        type: 'earning',
        description: `Vote revenue (65% of ${VOTE_COST} BAK)`,
        reference_id: submission_id,
        metadata: { type: 'vote_earning', voter_id: user.id, competition_id: submission.competition_id }
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

    // 6. Notify artist
    await supabaseAdmin.from('notifications').insert({
      user_id: submission.artist_id,
      type: 'vote_received',
      title: '🗳️ New Vote!',
      message: `Someone voted for your competition entry! +${artistAmount.toFixed(2)} BAK earned.`,
      link: `/rising-stars/voting`,
      priority: 'normal',
      category: 'competition'
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Vote recorded successfully!',
        vote_cost: VOTE_COST,
        artist_earned: artistAmount,
        platform_fee: platformAmount,
        new_balance: deductResult.balance
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
