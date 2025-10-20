import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitiatePaymentRequest {
  amount: number;
  email: string;
  phone_number?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body: InitiatePaymentRequest = await req.json();
    const { amount, email, phone_number } = body;

    console.log('Initiating payment:', { amount, email, userId: user.id });

    // Validate amount (minimum 100 KSh)
    if (!amount || amount < 100) {
      throw new Error('Minimum payment amount is 100 KSh');
    }

    // Get Pesapal credentials
    const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    const ipnId = Deno.env.get('PESAPAL_NOTIFICATION_ID');
    const environment = Deno.env.get('PESAPAL_ENVIRONMENT') || 'sandbox';

    if (!consumerKey || !consumerSecret || !ipnId) {
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
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', errorText);
      throw new Error('Failed to get Pesapal authentication token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.token;
    console.log('OAuth token obtained successfully');

    // Step 2: Create payment transaction record
    const reference = `BAK-${Date.now()}-${user.id.substring(0, 8)}`;
    
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        email: email,
        amount: amount,
        currency: 'KES',
        reference: reference,
        status: 'pending',
        payment_provider: 'pesapal',
        metadata: {
          phone_number: phone_number,
          environment: environment,
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Failed to create transaction:', transactionError);
      throw new Error('Failed to create payment transaction');
    }

    console.log('Transaction created:', transaction.id);

    // Step 3: Submit order to Pesapal
    const orderPayload = {
      id: reference,
      currency: 'KES',
      amount: amount,
      description: `BAKCoins purchase - ${amount} KSh`,
      callback_url: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/functions/v1/pesapal-callback?transaction_id=${transaction.id}`,
      notification_id: ipnId,
      billing_address: {
        email_address: email,
        phone_number: phone_number || '',
        country_code: 'KE',
        first_name: user.user_metadata?.username || 'User',
        last_name: '',
      },
    };

    console.log('Submitting order to Pesapal...');
    const orderResponse = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Order submission failed:', errorText);
      
      // Update transaction as failed
      await supabaseClient
        .from('payment_transactions')
        .update({ status: 'failed', metadata: { error: errorText } })
        .eq('id', transaction.id);

      throw new Error('Failed to submit order to Pesapal');
    }

    const orderData = await orderResponse.json();
    console.log('Order submitted successfully:', orderData);

    // Step 4: Update transaction with Pesapal order details
    await supabaseClient
      .from('payment_transactions')
      .update({
        payment_reference: orderData.order_tracking_id,
        metadata: {
          ...transaction.metadata,
          merchant_reference: orderData.merchant_reference,
          redirect_url: orderData.redirect_url,
        }
      })
      .eq('id', transaction.id);

    return new Response(
      JSON.stringify({
        success: true,
        redirect_url: orderData.redirect_url,
        order_tracking_id: orderData.order_tracking_id,
        transaction_id: transaction.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in pesapal-initiate:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to initiate payment' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
