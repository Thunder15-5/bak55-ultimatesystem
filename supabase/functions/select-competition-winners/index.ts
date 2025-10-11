import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { competition_id } = await req.json();

    if (!competition_id) {
      throw new Error('competition_id is required');
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
      const aiScore = (sub.ai_score || 75) * 0.3; // Default AI score of 75 if not set
      const finalScore = normalizedVotes + aiScore;
      
      return {
        ...sub,
        final_score: finalScore
      };
    });

    // Sort by final score and get top 3
    const rankedSubmissions = scoredSubmissions.sort((a, b) => b.final_score - a.final_score);
    const winners = rankedSubmissions.slice(0, 3);

    console.log('Winners:', winners);

    // Prize distribution
    const prizes = [
      { place: 1, amount: competition.prize_amount * 0.5 },  // 50% for 1st
      { place: 2, amount: competition.prize_amount * 0.3 },  // 30% for 2nd
      { place: 3, amount: competition.prize_amount * 0.2 },  // 20% for 3rd
    ];

    // Update submissions and distribute prizes
    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const prize = prizes[i];

      // Update submission status
      await supabase
        .from('submissions')
        .update({ status: 'winner' })
        .eq('id', winner.id);

      // Get artist wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', winner.artist_id)
        .single();

      if (walletError) {
        console.error('Error fetching wallet:', walletError);
        continue;
      }

      // Update wallet balance
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance + prize.amount })
        .eq('id', wallet.id);

      // Record transaction
      await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'credit',
          amount: prize.amount,
          description: `${prize.place === 1 ? '1st' : prize.place === 2 ? '2nd' : '3rd'} place prize - ${competition.title}`,
          reference_id: competition_id
        });

      console.log(`Awarded ${prize.amount} BAK to artist ${winner.artist_id} for ${prize.place} place`);
    }

    // Update competition status to completed
    await supabase
      .from('competitions')
      .update({ status: 'completed' })
      .eq('id', competition_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Winners selected and prizes distributed',
        winners: winners.map((w, i) => ({
          submission_id: w.id,
          artist_id: w.artist_id,
          place: i + 1,
          prize: prizes[i].amount,
          final_score: w.final_score
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error selecting winners:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
