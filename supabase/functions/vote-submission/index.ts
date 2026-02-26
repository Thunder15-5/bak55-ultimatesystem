import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VOTE_COST = 1; // 1 BAKCoin per vote
const ARTIST_SHARE = 0.65; // 65% to artist
const PLATFORM_SHARE = 0.35; // 35% to platform

// BAK55 Platform Operations Wallet (admin@bak55talent.co.ke)
// Used for: voting fees (35%), withdrawal fees, hosting & maintenance
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

    // Create client with user's auth token
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Create admin client for wallet operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
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

    // Get submission details including artist_id and competition info
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        artist_id,
        competition_id,
        voting_enabled,
        moderation_status,
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

    // Check if voting is enabled for this submission
    if (!(submission as any).voting_enabled) {
      return new Response(
        JSON.stringify({ error: 'Voting is disabled for this submission' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if submission is approved
    if ((submission as any).moderation_status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'This submission has not been approved yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const competition = (submission as any).competitions;

    // Check if voting is currently open
    if (!competition?.voting_start_date || !competition?.voting_end_date) {
      return new Response(
        JSON.stringify({ error: 'Voting dates not set for this competition' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const votingStart = new Date(competition.voting_start_date);
    const votingEnd = new Date(competition.voting_end_date);

    if (now < votingStart) {
      return new Response(
        JSON.stringify({ 
          error: 'Voting has not started yet',
          voting_starts: competition.voting_start_date 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (now > votingEnd) {
      return new Response(
        JSON.stringify({ 
          error: 'Voting has ended',
          voting_ended: competition.voting_end_date 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-voting
    if (submission.artist_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'You cannot vote for your own submission' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already voted for this submission
    const { data: existingVote } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('submission_id', submission_id)
      .eq('voter_id', user.id)
      .maybeSingle();

    if (existingVote) {
      return new Response(
        JSON.stringify({ error: 'You have already voted for this submission' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    if (voterWallet.balance < VOTE_COST) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient balance. You need ${VOTE_COST} BAK to vote. Current balance: ${voterWallet.balance.toFixed(2)} BAK`,
          required: VOTE_COST,
          current_balance: voterWallet.balance
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Calculate distribution
    const artistAmount = VOTE_COST * ARTIST_SHARE;
    const platformAmount = VOTE_COST * PLATFORM_SHARE;

    // === START TRANSACTION ===
    
    // 1. Deduct from voter's wallet with optimistic locking
    const { error: voterDeductError } = await supabaseAdmin
      .from('wallets')
      .update({ 
        balance: voterWallet.balance - VOTE_COST,
        updated_at: new Date().toISOString()
      })
      .eq('id', voterWallet.id)
      .eq('balance', voterWallet.balance); // Optimistic lock

    if (voterDeductError) {
      return new Response(
        JSON.stringify({ error: 'Failed to process payment. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      // Rollback voter deduction
      await supabaseAdmin
        .from('wallets')
        .update({ balance: voterWallet.balance })
        .eq('id', voterWallet.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to credit artist. Transaction rolled back.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Credit platform wallet (35%)
    const { error: platformCreditError } = await supabaseAdmin
      .from('wallets')
      .update({ 
        balance: platformWallet.balance + platformAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', platformWallet.id);

    if (platformCreditError) {
      console.error('Platform credit failed:', platformCreditError);
      // Non-critical, continue but log
    }

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
      // Critical - rollback all wallet changes
      await supabaseAdmin
        .from('wallets')
        .update({ balance: voterWallet.balance })
        .eq('id', voterWallet.id);
      await supabaseAdmin
        .from('wallets')
        .update({ balance: artistWallet.balance })
        .eq('id', artistWallet.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to record vote. Transaction rolled back.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Create transaction records
    await Promise.all([
      // Voter's debit transaction
      supabaseAdmin.from('transactions').insert({
        wallet_id: voterWallet.id,
        amount: -VOTE_COST,
        type: 'purchase',
        description: `Vote for competition submission`,
        reference_id: submission_id,
        metadata: { 
          type: 'vote_payment',
          competition_id: submission.competition_id 
        }
      }),
      // Artist's credit transaction
      supabaseAdmin.from('transactions').insert({
        wallet_id: artistWallet.id,
        amount: artistAmount,
        type: 'earning',
        description: `Vote revenue (65% of ${VOTE_COST} BAK)`,
        reference_id: submission_id,
        metadata: { 
          type: 'vote_earning',
          voter_id: user.id,
          competition_id: submission.competition_id
        }
      }),
      // Platform's credit transaction
      supabaseAdmin.from('transactions').insert({
        wallet_id: platformWallet.id,
        amount: platformAmount,
        type: 'earning',
        description: `Platform vote fee (35% of ${VOTE_COST} BAK)`,
        reference_id: submission_id,
        metadata: { 
          type: 'platform_vote_fee',
          voter_id: user.id,
          artist_id: submission.artist_id,
          competition_id: submission.competition_id
        }
      })
    ]);

    // 6. Create notification for artist
    await supabaseAdmin.from('notifications').insert({
      user_id: submission.artist_id,
      type: 'vote_received',
      title: '🗳️ New Vote!',
      message: `Someone voted for your competition entry! +${artistAmount.toFixed(2)} BAK earned.`,
      link: `/competition/${submission.competition_id}`,
      priority: 'normal',
      category: 'competition'
    });

    // === END TRANSACTION ===

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Vote recorded successfully!',
        vote_cost: VOTE_COST,
        artist_earned: artistAmount,
        platform_fee: platformAmount,
        new_balance: voterWallet.balance - VOTE_COST
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
