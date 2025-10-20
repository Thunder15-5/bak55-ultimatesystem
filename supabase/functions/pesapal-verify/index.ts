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

    // Verify admin access if authorization header is present
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        
        if (user) {
          const { data: hasRole } = await supabaseClient
            .rpc('has_role', { _user_id: user.id, _role: 'admin' });

          if (!hasRole) {
            return new Response(
              JSON.stringify({ success: false, error: 'Admin access required' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (authError) {
        console.error('Auth verification error:', authError);
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { transaction_id, order_tracking_id } = await req.json();

    console.log('Manual verification requested:', { transaction_id, order_tracking_id });

    if (!transaction_id && !order_tracking_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Either transaction_id or order_tracking_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Pesapal credentials
    const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    const environment = Deno.env.get('PESAPAL_ENVIRONMENT') || 'sandbox';

    if (!consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Pesapal credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = environment === 'live' 
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3';

    // Step 1: Get transaction from database
    let transaction = null;
    
    if (transaction_id) {
      const { data, error } = await supabaseClient
        .from('payment_transactions')
        .select('*')
        .eq('id', transaction_id)
        .maybeSingle();
      
      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to fetch transaction');
      }
      transaction = data;
    } else {
      const { data, error } = await supabaseClient
        .from('payment_transactions')
        .select('*')
        .eq('payment_reference', order_tracking_id)
        .maybeSingle();
      
      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to fetch transaction');
      }
      transaction = data;
    }

    if (!transaction) {
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction not found in database' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trackingId = transaction.payment_reference || order_tracking_id;
    if (!trackingId) {
      return new Response(
        JSON.stringify({ success: false, error: 'No OrderTrackingId available for this transaction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', errorText);
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
      console.error('Status request failed:', errorText);
      throw new Error(`Failed to get transaction status from Pesapal`);
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
      console.error('Update error:', updateError);
      throw new Error('Failed to update transaction');
    }

    // Step 5: If successful and not yet credited, credit the wallet
    if (normalizedStatus === 'success' && transaction.status !== 'success') {
      console.log('Payment successful, crediting wallet...');
      
      const bakAmount = transaction.amount / 20;

      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', transaction.user_id)
        .maybeSingle();

      if (walletError) {
        console.error('Wallet fetch error:', walletError);
      } else if (wallet) {
        const { error: balanceError } = await supabaseClient
          .from('wallets')
          .update({ 
            balance: wallet.balance + bakAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id);

        if (balanceError) {
          console.error('Balance update error:', balanceError);
        }

        const { error: txError } = await supabaseClient
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

        if (txError) {
          console.error('Transaction insert error:', txError);
        } else {
          console.log('Wallet credited:', bakAmount, 'BAK');
        }
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
