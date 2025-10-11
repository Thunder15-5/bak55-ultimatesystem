import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TipRequest {
  to_artist_id: string;
  track_id?: string;
  amount: number;
  message?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const tipRequest: TipRequest = await req.json();

    // Validate tip amount
    if (tipRequest.amount <= 0) {
      throw new Error('Tip amount must be greater than 0');
    }

    // Check sender has sufficient balance
    const { data: senderWallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletError || !senderWallet) {
      throw new Error('Wallet not found');
    }

    if (senderWallet.balance < tipRequest.amount) {
      throw new Error('Insufficient balance');
    }

    // Get recipient wallet
    const { data: recipientWallet, error: recipientError } = await supabaseClient
      .from('wallets')
      .select('id, user_id, balance')
      .eq('user_id', tipRequest.to_artist_id)
      .single();

    if (recipientError || !recipientWallet) {
      throw new Error('Recipient wallet not found');
    }

    // Deduct from sender
    const { error: deductError } = await supabaseClient
      .from('wallets')
      .update({ balance: senderWallet.balance - tipRequest.amount })
      .eq('user_id', user.id);

    if (deductError) throw deductError;

    // Add to recipient
    const { error: addError } = await supabaseClient
      .from('wallets')
      .update({ balance: recipientWallet.balance + tipRequest.amount })
      .eq('user_id', tipRequest.to_artist_id);

    if (addError) {
      // Rollback sender deduction
      await supabaseClient
        .from('wallets')
        .update({ balance: senderWallet.balance })
        .eq('user_id', user.id);
      throw addError;
    }

    // Record tip
    const { data: tip, error: tipError } = await supabaseClient
      .from('tips')
      .insert({
        from_user_id: user.id,
        to_artist_id: tipRequest.to_artist_id,
        track_id: tipRequest.track_id,
        amount: tipRequest.amount,
        message: tipRequest.message,
      })
      .select()
      .single();

    if (tipError) throw tipError;

    // Create transaction records
    const senderWalletData = await supabaseClient
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .single();

    await supabaseClient.from('transactions').insert({
      wallet_id: senderWalletData.data!.id,
      type: 'tip_sent',
      amount: -tipRequest.amount,
      description: `Tip to artist${tipRequest.message ? ': ' + tipRequest.message : ''}`,
      reference_id: tip.id,
    });

    await supabaseClient.from('transactions').insert({
      wallet_id: recipientWallet.id,
      type: 'tip_received',
      amount: tipRequest.amount,
      description: `Tip received${tipRequest.message ? ': ' + tipRequest.message : ''}`,
      reference_id: tip.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        tip,
        message: 'Tip sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-tip:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});