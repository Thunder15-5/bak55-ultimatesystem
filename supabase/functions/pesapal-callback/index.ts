import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get OrderTrackingId from either query params (IPN) or body (manual call)
    const url = new URL(req.url);
    let orderTrackingId = url.searchParams.get('OrderTrackingId');
    let transactionId = url.searchParams.get('transaction_id');

    if (!orderTrackingId && req.method === 'POST') {
      const body = await req.json();
      orderTrackingId = body.OrderTrackingId || body.order_tracking_id;
      transactionId = body.transaction_id;
    }

    console.log('Pesapal callback received:', { orderTrackingId, transactionId });

    if (!orderTrackingId) {
      throw new Error('OrderTrackingId is required');
    }

    // Get Pesapal credentials
    const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    const environment = Deno.env.get('PESAPAL_ENVIRONMENT') || 'sandbox';

    if (!consumerKey || !consumerSecret) {
      throw new Error('Pesapal credentials not configured');
    }

    const baseUrl = environment === 'live' 
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3';

    // Step 1: Get OAuth token
    console.log('Getting OAuth token...');
    const tokenResponse = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Pesapal authentication token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.token;

    // Step 2: Get transaction status from Pesapal
    console.log('Fetching transaction status from Pesapal...');
    const statusResponse = await fetch(
      `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!statusResponse.ok) {
      throw new Error('Failed to get transaction status from Pesapal');
    }

    const statusData = await statusResponse.json();
    console.log('Pesapal status:', statusData);

    // Normalize status
    const paymentStatus = statusData.payment_status_description?.toLowerCase() || '';
    let normalizedStatus = 'pending';
    
    if (paymentStatus.includes('completed') || paymentStatus.includes('success')) {
      normalizedStatus = 'success';
    } else if (paymentStatus.includes('failed') || paymentStatus.includes('invalid')) {
      normalizedStatus = 'failed';
    }

    console.log('Normalized status:', normalizedStatus);

    // Step 3: Find the payment transaction
    let transaction;
    if (transactionId) {
      const { data } = await supabaseClient
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
      transaction = data;
    } else {
      const { data } = await supabaseClient
        .from('payment_transactions')
        .select('*')
        .eq('payment_reference', orderTrackingId)
        .single();
      transaction = data;
    }

    if (!transaction) {
      console.error('Transaction not found:', { orderTrackingId, transactionId });
      throw new Error('Transaction not found');
    }

    console.log('Found transaction:', transaction.id);

    // Step 4: Update payment transaction
    const { error: updateError } = await supabaseClient
      .from('payment_transactions')
      .update({
        status: normalizedStatus,
        payment_reference: orderTrackingId,
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          pesapal_status: statusData.payment_status_description,
          pesapal_method: statusData.payment_method,
          confirmation_code: statusData.confirmation_code,
          verified_at: new Date().toISOString(),
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      throw updateError;
    }

    // Step 5: If successful, credit the wallet
    if (normalizedStatus === 'success') {
      console.log('Payment successful, crediting wallet...');
      
      // Calculate BAKCoins (20 KSh = 1 BAK)
      const bakAmount = transaction.amount / 20;

      // Get user's wallet
      const { data: wallet } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', transaction.user_id)
        .single();

      if (wallet) {
        // Update wallet balance
        const { error: walletError } = await supabaseClient
          .from('wallets')
          .update({ 
            balance: wallet.balance + bakAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id);

        if (walletError) {
          console.error('Failed to update wallet:', walletError);
        } else {
          console.log('Wallet credited:', bakAmount, 'BAK');

          // Create transaction record
          await supabaseClient
            .from('transactions')
            .insert({
              wallet_id: wallet.id,
              type: 'income',
              amount: bakAmount,
              description: `BAKCoins purchase via Pesapal - ${transaction.amount} KSh`,
              reference_id: transaction.id,
              metadata: {
                payment_provider: 'pesapal',
                order_tracking_id: orderTrackingId,
                ksh_amount: transaction.amount,
              }
            });

          console.log('Transaction record created');
        }
      }
    }

    // Return success response to Pesapal IPN
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: normalizedStatus,
        message: 'Payment processed successfully' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in pesapal-callback:', error);
    
    // Always return 200 to Pesapal to acknowledge receipt
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
