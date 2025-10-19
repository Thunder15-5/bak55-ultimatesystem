import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { transaction_id } = await req.json();

    if (!transaction_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing transaction_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Manual verification for transaction:', transaction_id);

    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found:', txError);
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Extract order_tracking_id from metadata
    const orderTrackingId = transaction.metadata?.order_tracking_id || transaction.payment_reference;

    if (!orderTrackingId) {
      return new Response(
        JSON.stringify({ success: false, error: 'No order tracking ID found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Checking Pesapal status for order:', orderTrackingId);

    // Get Pesapal access token
    const PESAPAL_CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const PESAPAL_CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';

    const tokenResp = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      }),
    });

    if (!tokenResp.ok) {
      console.error('Pesapal auth failed');
      throw new Error('Failed to authenticate with Pesapal');
    }

    const tokenData = await tokenResp.json();
    const accessToken = tokenData.token;

    // Get transaction status from Pesapal
    const statusResp = await fetch(
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!statusResp.ok) {
      console.error('Failed to fetch Pesapal status');
      throw new Error('Failed to fetch transaction status from Pesapal');
    }

    const statusData = await statusResp.json();
    console.log('Pesapal status:', statusData);

    // Map Pesapal status
    let transactionStatus = 'pending';
    const pesapalCode = statusData.payment_status_code || statusData.status_code;
    
    if (pesapalCode === 1 || statusData.payment_status_description === 'Completed') {
      transactionStatus = 'success';
    } else if (pesapalCode === 2 || pesapalCode === 0) {
      transactionStatus = 'failed';
    }

    console.log('Mapped status:', transactionStatus);

    // Update transaction
    await supabase
      .from('payment_transactions')
      .update({
        status: transactionStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          pesapal_payment_method: statusData.payment_method,
          pesapal_status_code: pesapalCode,
          pesapal_confirmation_code: statusData.confirmation_code,
          manually_verified_at: new Date().toISOString(),
        },
      })
      .eq('id', transaction_id);

    // Credit wallet if successful
    if (transactionStatus === 'success') {
      const userId = transaction.user_id;
      // Calculate BAKCoins: Use metadata.bak_amount if available, otherwise convert from KES (20 KES = 1 BAK)
      const bakAmount = transaction.metadata?.bak_amount || (parseFloat(transaction.amount) / 20) || 0;

      console.log(`Crediting ${bakAmount} BAKCoins to user ${userId} (from ${transaction.amount} KES)`);

      // Get or create wallet
      let { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!wallet) {
        console.log('Creating new wallet');
        const { data: newWallet, error: createErr } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            balance: bakAmount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (createErr) {
          console.error('Failed to create wallet:', createErr);
          throw createErr;
        }
        wallet = newWallet;
      } else {
        const newBalance = parseFloat(wallet.balance) + bakAmount;
        await supabase
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', wallet.id);
      }

      // Record earning transaction
      await supabase.from('transactions').insert({
        wallet_id: wallet.id,
        amount: bakAmount,
        type: 'earning',
        description: `Purchased ${bakAmount} BAKCoins (Manual Verification)`,
        reference_id: transaction.id,
        metadata: {
          payment_method: 'pesapal',
          order_tracking_id: orderTrackingId,
          amount_paid_ksh: transaction.amount,
          manually_verified: true,
        },
      });

      console.log('✅ Wallet credited successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: transactionStatus,
        pesapal_data: statusData,
        message: transactionStatus === 'success' 
          ? 'Payment verified and wallet credited successfully'
          : `Payment status: ${transactionStatus}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Verification error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Verification failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
