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

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      
      if (!user) {
        throw new Error('Unauthorized');
      }

      const { data: hasRole } = await supabaseClient
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (!hasRole) {
        throw new Error('Admin access required');
      }
    }

    const { transaction_id, order_tracking_id } = await req.json();

    console.log('Manual verification requested:', { transaction_id, order_tracking_id });

    if (!transaction_id && !order_tracking_id) {
      throw new Error('Either transaction_id or order_tracking_id is required');
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

    // Step 1: Get transaction from database
    let transaction;
    if (transaction_id) {
      const { data } = await supabaseClient
        .from('payment_transactions')
        .select('*')
        .eq('id', transaction_id)
        .single();
      transaction = data;
    } else {
      const { data } = await supabaseClient
        .from('payment_transactions')
        .select('*')
        .eq('payment_reference', order_tracking_id)
        .single();
      transaction = data;
    }

    if (!transaction) {
      throw new Error('Transaction not found in database');
    }

    const trackingId = transaction.payment_reference || order_tracking_id;
    if (!trackingId) {
      throw new Error('No OrderTrackingId available for this transaction');
    }

    // Step 2: Get OAuth token
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

    // Step 3: Get transaction status from Pesapal
    console.log('Fetching transaction status from Pesapal...');
    const statusResponse = await fetch(
      `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`Failed to get transaction status: ${errorText}`);
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

    // Step 4: Update local transaction
    const { error: updateError } = await supabaseClient
      .from('payment_transactions')
      .update({
        status: normalizedStatus,
        payment_reference: trackingId,
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          pesapal_status: statusData.payment_status_description,
          pesapal_method: statusData.payment_method,
          confirmation_code: statusData.confirmation_code,
          manually_verified_at: new Date().toISOString(),
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      throw updateError;
    }

    // Step 5: If successful and not yet credited, credit the wallet
    if (normalizedStatus === 'success' && transaction.status !== 'success') {
      console.log('Payment successful, crediting wallet...');
      
      const bakAmount = transaction.amount / 20;

      const { data: wallet } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', transaction.user_id)
        .single();

      if (wallet) {
        await supabaseClient
          .from('wallets')
          .update({ 
            balance: wallet.balance + bakAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id);

        await supabaseClient
          .from('transactions')
          .insert({
            wallet_id: wallet.id,
            type: 'income',
            amount: bakAmount,
            description: `BAKCoins purchase via Pesapal - ${transaction.amount} KSh (Manual Verification)`,
            reference_id: transaction.id,
            metadata: {
              payment_provider: 'pesapal',
              order_tracking_id: trackingId,
              ksh_amount: transaction.amount,
              manually_verified: true,
            }
          });

        console.log('Wallet credited:', bakAmount, 'BAK');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        status: normalizedStatus,
        pesapal_status: statusData.payment_status_description,
        amount: transaction.amount,
        bak_amount: transaction.amount / 20,
        confirmation_code: statusData.confirmation_code,
        payment_method: statusData.payment_method,
        message: normalizedStatus === 'success' 
          ? 'Payment verified and wallet credited' 
          : `Payment status: ${normalizedStatus}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in pesapal-verify:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to verify payment' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
