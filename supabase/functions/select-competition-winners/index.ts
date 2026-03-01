import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
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
    const competition_id = body?.competition_id;

    if (!competition_id || typeof competition_id !== 'string') {
      return new Response(JSON.stringify({ error: 'competition_id is required' }), { status: 400, headers: corsHeaders });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(competition_id)) {
      return new Response(JSON.stringify({ error: 'Invalid competition_id format' }), { status: 400, headers: corsHeaders });
    }

    console.log('Selecting winners for competition:', competition_id);

    // Fetch competition details
    const { data: competition, error: compError } = await supabase
      .from('competitions')
      .select('prize_amount, title')
      .eq('id', competition_id)
      .single();

    if (compError) throw compError;

    // Fetch all submissions with vote counts
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('id, artist_id, vote_count, ai_score')
      .eq('competition_id', competition_id)
      .eq('status', 'pending');

    if (subError) throw subError;

    if (!submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No submissions found for this competition' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate final scores (70% fan votes, 30% AI score)
    const maxVotes = Math.max(...submissions.map(s => s.vote_count));
    const scoredSubmissions = submissions.map(sub => {
      const normalizedVotes = maxVotes > 0 ? (sub.vote_count / maxVotes) * 70 : 0;
      const aiScore = (sub.ai_score || 75) * 0.3;
      const finalScore = normalizedVotes + aiScore;
      return { ...sub, final_score: finalScore };
    });

    const rankedSubmissions = scoredSubmissions.sort((a, b) => b.final_score - a.final_score);
    const winners = rankedSubmissions.slice(0, 3);

    const prizes = [
      { place: 1, amount: competition.prize_amount * 0.5 },
      { place: 2, amount: competition.prize_amount * 0.3 },
      { place: 3, amount: competition.prize_amount * 0.2 },
    ];

    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const prize = prizes[i];

      await supabase.from('submissions').update({ status: 'winner' }).eq('id', winner.id);

      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', winner.artist_id)
        .single();

      if (walletError) {
        console.error('Error fetching wallet:', walletError);
        continue;
      }

      await supabase.from('wallets').update({ balance: wallet.balance + prize.amount }).eq('id', wallet.id);

      await supabase.from('transactions').insert({
        wallet_id: wallet.id,
        type: 'earning',
        amount: prize.amount,
        description: `${prize.place === 1 ? '1st' : prize.place === 2 ? '2nd' : '3rd'} place prize - ${competition.title}`,
        reference_id: competition_id,
        metadata: { type: 'competition_prize', competition_id, placement: prize.place },
      });

      await supabase.from('notifications').insert({
        user_id: winner.artist_id,
        type: 'competition_win',
        title: `🏆 Congratulations! You placed ${prize.place === 1 ? '1st' : prize.place === 2 ? '2nd' : '3rd'} in ${competition.title}!`,
        message: `You've won ${prize.amount.toFixed(2)} BAKCoins! The prize has been credited to your wallet.`,
        link: `/competition/${competition_id}`,
        priority: 'high',
        category: 'competition',
      });
    }

    await supabase.from('competitions').update({ status: 'completed' }).eq('id', competition_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Winners selected and prizes distributed',
        winners: winners.map((w, i) => ({
          submission_id: w.id,
          artist_id: w.artist_id,
          place: i + 1,
          prize: prizes[i].amount,
          final_score: w.final_score,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error selecting winners:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
