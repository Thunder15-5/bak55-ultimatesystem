import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Try to identify user (optional)
    let userEmail = '';
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!error && user) userEmail = user.email ?? '';
    }

    const body: PaymentRequest = await req.json();
    console.log('Payment initiation:', body);

    if (!body.amount || !body.email) {
      throw new Error('Missing amount or email');
    }

    // --- Pesapal Auth ---
    const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';
    const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    if (!consumerKey || !consumerSecret) {
      throw new Error('Missing Pesapal credentials');
    }

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
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/pesapal-callback`;

    const orderPayload = {
      id: transactionId,
      currency: body.currency || 'KES',
      amount: body.amount,
      description: body.description || 'BAK55 Token Purchase',
      callback_url: callbackUrl,
      notification_id: Deno.env.get('PESAPAL_NOTIFICATION_ID'),
      billing_address: {
        email_address: body.email,
        first_name: userEmail?.split('@')[0] || 'User',
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
    if (!orderRes.ok) {
      console.error('Pesapal order failed:', orderData);
      throw new Error(orderData.message || 'Failed to create Pesapal order');
    }

    // --- Save to Supabase ---
    const { error: insertError } = await supabase.from('payment_transactions').insert({
      id: transactionId,
      user_id: body.user_id || null,
      email: body.email,
      amount: body.amount,
      status: 'pending',
      pesapal_tracking_id: orderData.order_tracking_id,
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

  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Something went wrong',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
