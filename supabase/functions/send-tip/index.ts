import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

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
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tipRequest: TipRequest = await req.json();

    // Validate input
    if (!tipRequest.to_artist_id || !tipRequest.amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (tipRequest.amount <= 0 || tipRequest.amount > 10000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tip amount must be between 0.1 and 10,000 BAK' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize amount to 2 decimal places
    const normalizedAmount = Math.round(tipRequest.amount * 100) / 100;

    // Cannot tip yourself
    if (user.id === tipRequest.to_artist_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot send tip to yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Transferring ${normalizedAmount} BAK from ${user.id} to ${tipRequest.to_artist_id}`);

    // Use atomic transfer function to prevent race conditions
    const { data: transferResult, error: transferError } = await supabaseClient.rpc('transfer_funds', {
      sender_id: user.id,
      recipient_id: tipRequest.to_artist_id,
      transfer_amount: normalizedAmount,
    });

    if (transferError) {
      console.error('Transfer failed:', transferError);
      
      // Map common errors to user-friendly messages
      let errorMessage = 'Failed to send tip';
      if (transferError.message?.includes('Insufficient balance')) {
        errorMessage = 'Insufficient balance';
      } else if (transferError.message?.includes('Sender wallet not found')) {
        errorMessage = 'Your wallet is not set up';
      } else if (transferError.message?.includes('Recipient wallet not found')) {
        errorMessage = 'Recipient wallet not found';
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get wallet IDs for transaction records
    const { data: senderWallet } = await supabaseClient
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { data: recipientWallet } = await supabaseClient
      .from('wallets')
      .select('id')
      .eq('user_id', tipRequest.to_artist_id)
      .single();

    if (!senderWallet || !recipientWallet) {
      console.error('Wallet lookup failed after transfer');
      return new Response(
        JSON.stringify({ 
          success: true, // Transfer succeeded even though record creation may fail
          warning: 'Tip sent but transaction record may be incomplete' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create tip record
    const { error: tipError } = await supabaseClient.from('tips').insert({
      from_user_id: user.id,
      to_artist_id: tipRequest.to_artist_id,
      track_id: tipRequest.track_id || null,
      amount: normalizedAmount,
      message: tipRequest.message || null,
    });

    if (tipError) {
      console.error('Failed to create tip record:', tipError);
      // Don't fail the request since the transfer already succeeded
    }

    // Create transaction records for both sender and recipient
    const transactionRecords = [
      {
        wallet_id: senderWallet.id,
        type: 'expense',
        amount: normalizedAmount,
        description: `Tip sent${tipRequest.message ? `: ${tipRequest.message.substring(0, 50)}` : ''}`,
        reference_id: tipRequest.track_id || null,
        metadata: {
          tip: true,
          recipient: tipRequest.to_artist_id,
          track_id: tipRequest.track_id,
        },
      },
      {
        wallet_id: recipientWallet.id,
        type: 'income',
        amount: normalizedAmount,
        description: `Tip received${tipRequest.message ? `: ${tipRequest.message.substring(0, 50)}` : ''}`,
        reference_id: tipRequest.track_id || null,
        metadata: {
          tip: true,
          sender: user.id,
          track_id: tipRequest.track_id,
        },
      },
    ];

    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert(transactionRecords);

    if (transactionError) {
      console.error('Failed to create transaction records:', transactionError);
      // Don't fail since the transfer succeeded
    }

    console.log('Tip sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tip sent successfully',
        amount: normalizedAmount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-tip:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
