import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate that PESAPAL_NOTIFICATION_ID is a UUID, not a URL
function validatePesapalNotificationId(notificationId: string | undefined): string {
  if (!notificationId) {
    throw new Error('PESAPAL_NOTIFICATION_ID is missing. Please register your IPN with Pesapal and set the secret to the IPN UUID.');
  }
  
  // UUID v4 regex validation
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidV4Regex.test(notificationId)) {
    throw new Error(
      `PESAPAL_NOTIFICATION_ID does not look like a UUID. It may be set to a URL. Please register your IPN with Pesapal and set the secret to the IPN UUID (not the URL). Current value starts with: ${notificationId.substring(0, 50)}...`
    );
  }
  
  return notificationId;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  callback_url?: string;
  email: string;
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: PaymentRequest = await req.json();
    console.log('Payment initiation:', body);

    if (!body.amount || !body.email || !body.user_id) {
      throw new Error('Missing required fields: amount, email, and user_id');
    }

    // --- Pesapal Auth ---
    const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';
    const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    if (!consumerKey || !consumerSecret) {
      throw new Error('Missing Pesapal credentials');
    }

    // Validate PESAPAL_NOTIFICATION_ID is a UUID, not a URL
    const notificationId = validatePesapalNotificationId(Deno.env.get('PESAPAL_NOTIFICATION_ID'));

    const tokenRes = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Pesapal token error: ${await tokenRes.text()}`);
    }

    const { token } = await tokenRes.json();

    // --- Order details ---
    const transactionId = crypto.randomUUID();
    const callbackUrl =
      body.callback_url ||
      `https://bak55talent.co.ke/pesapal/callback`;

    const orderPayload = {
      id: transactionId,
      currency: body.currency || 'KES',
      amount: body.amount,
      description: body.description || 'BAK55 Token Purchase',
      callback_url: callbackUrl,
      notification_id: notificationId,
      billing_address: {
        email_address: body.email,
        first_name: body.email.split('@')[0] || 'User',
        last_name: '',
        country_code: 'KE',
      },
    };

    console.log('Submitting order:', orderPayload);

    const orderRes = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderRes.json();
    console.log('Pesapal response:', orderData);
    
    if (!orderRes.ok) {
      console.error('Pesapal order failed:', orderData);
      throw new Error(orderData.message || 'Failed to create Pesapal order');
    }

    if (!orderData.redirect_url) {
      console.error('No redirect_url in Pesapal response:', orderData);
      throw new Error('Pesapal did not return a payment URL. Please check IPN configuration.');
    }

    // --- Save to Supabase ---
    const { error: insertError } = await supabase.from('payment_transactions').insert({
      id: transactionId,
      user_id: body.user_id,
      email: body.email,
      amount: body.amount,
      currency: body.currency || 'KES',
      reference: transactionId,
      payment_reference: orderData.order_tracking_id,
      status: 'pending',
      payment_provider: 'pesapal',
      metadata: {
        order_tracking_id: orderData.order_tracking_id,
        bak_amount: body.amount / 20,
        type: 'coin_purchase',
      },
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw new Error('Database insert failed');
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirect_url: orderData.redirect_url,
        tracking_id: orderData.order_tracking_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Something went wrong',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
