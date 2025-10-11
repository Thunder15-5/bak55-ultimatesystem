import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get('OrderTrackingId');
    const merchantReference = url.searchParams.get('OrderMerchantReference');

    console.log('Pesapal callback received:', { orderTrackingId, merchantReference });

    if (!orderTrackingId) {
      throw new Error('Missing OrderTrackingId');
    }

    const PESAPAL_CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const PESAPAL_CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      throw new Error('Pesapal credentials not configured');
    }

    const PESAPAL_BASE_URL = 'https://cybqa.pesapal.com/pesapalv3';

    // Step 1: Get access token
    const tokenResponse = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Pesapal access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.token;

    // Step 2: Get transaction status
    const statusResponse = await fetch(
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!statusResponse.ok) {
      throw new Error('Failed to get transaction status');
    }

    const statusData = await statusResponse.json();
    console.log('Transaction status:', statusData);

    // Find the transaction by Pesapal reference
    const { data: transaction, error: fetchError } = await supabaseClient
      .from('payment_transactions')
      .select('*')
      .eq('payment_reference', orderTrackingId)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', fetchError);
      throw new Error('Transaction not found');
    }

    // Map Pesapal status codes
    // 0 = Invalid, 1 = Completed, 2 = Failed, 3 = Reversed
    const pesapalStatus = statusData.payment_status_code;
    let transactionStatus = 'pending';

    if (pesapalStatus === 1) {
      transactionStatus = 'success';
    } else if (pesapalStatus === 2 || pesapalStatus === 0) {
      transactionStatus = 'failed';
    }

    console.log('Updating transaction status to:', transactionStatus);

    // Update transaction status
    const { error: updateError } = await supabaseClient
      .from('payment_transactions')
      .update({
        status: transactionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      throw updateError;
    }

    // If payment successful, credit the wallet
    if (transactionStatus === 'success') {
      const bakAmount = transaction.metadata.bak_amount;
      const userId = transaction.user_id;

      console.log(`Crediting ${bakAmount} BAK to user ${userId}`);

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found:', walletError);
        throw new Error('Wallet not found');
      }

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance) + parseFloat(bakAmount);
      
      const { error: balanceError } = await supabaseClient
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (balanceError) {
        console.error('Failed to update wallet balance:', balanceError);
        throw balanceError;
      }

      // Create transaction record
      const { error: transactionRecordError } = await supabaseClient
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          amount: bakAmount,
          type: 'income',
          description: `Purchased ${bakAmount} BAKCoins`,
          reference_id: transaction.id,
          metadata: {
            payment_method: 'pesapal',
            order_tracking_id: orderTrackingId,
            amount_paid_ksh: transaction.amount,
          },
        });

      if (transactionRecordError) {
        console.error('Failed to create transaction record:', transactionRecordError);
      }

      console.log('Payment processed successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: transactionStatus,
        message: transactionStatus === 'success' 
          ? 'Payment successful! BAKCoins have been added to your wallet.'
          : 'Payment processing complete.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing callback:', error);
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
