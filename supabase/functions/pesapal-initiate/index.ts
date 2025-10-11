import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  callback_url: string;
  notification_id: string;
  reference: string;
  email: string;
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

    const paymentRequest: PaymentRequest = await req.json();
    console.log('Payment request:', paymentRequest);

    const PESAPAL_CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const PESAPAL_CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      throw new Error('Pesapal credentials not configured');
    }

    // Pesapal API base URL (use sandbox for testing)
    const PESAPAL_BASE_URL = 'https://cybqa.pesapal.com/pesapalv3';
    // Production: https://pay.pesapal.com/v3

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

    console.log('Got Pesapal access token');

    // Step 2: Register IPN (if not already registered)
    const ipnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pesapal-callback`;
    
    const ipnResponse = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'GET',
      }),
    });

    const ipnData = await ipnResponse.json();
    console.log('IPN registration response:', ipnData);

    // Step 3: Submit order request
    const orderPayload = {
      id: paymentRequest.notification_id,
      currency: paymentRequest.currency,
      amount: paymentRequest.amount,
      description: paymentRequest.description,
      callback_url: paymentRequest.callback_url,
      notification_id: ipnData.ipn_id || ipnData.ipn_registration_id,
      billing_address: {
        email_address: paymentRequest.email,
        phone_number: '',
        country_code: 'KE',
        first_name: user.email?.split('@')[0] || 'User',
        middle_name: '',
        last_name: '',
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: '',
      },
    };

    console.log('Submitting order:', orderPayload);

    const orderResponse = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
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
      throw new Error('Failed to submit order to Pesapal');
    }

    const orderData = await orderResponse.json();
    console.log('Order response:', orderData);

    // Update transaction with Pesapal reference
    const { error: updateError } = await supabaseClient
      .from('paystack_transactions')
      .update({
        paystack_reference: orderData.order_tracking_id,
        metadata: {
          ...paymentRequest,
          pesapal_merchant_reference: orderData.merchant_reference,
          pesapal_order_tracking_id: orderData.order_tracking_id,
        },
      })
      .eq('id', paymentRequest.notification_id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirect_url: orderData.redirect_url,
        order_tracking_id: orderData.order_tracking_id,
        merchant_reference: orderData.merchant_reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error initiating payment:', error);
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
