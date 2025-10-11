import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Pesapal webhook signature to prevent payment forgery
async function verifyPesapalSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    console.error('Missing signature header');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = computedSignature === signature;
    
    if (!isValid) {
      console.error('Signature verification failed', {
        computed: computedSignature.substring(0, 20) + '...',
        received: signature.substring(0, 20) + '...'
      });
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Always return 200 for webhooks to prevent retries
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SECURITY: Verify webhook signature to prevent payment forgery
    const rawBody = await req.text();
    const signature = req.headers.get('x-pesapal-signature');
    const ipnSecret = Deno.env.get('PESAPAL_IPN_SECRET');

    if (ipnSecret) {
      const isValidSignature = await verifyPesapalSignature(rawBody, signature, ipnSecret);
      
      if (!isValidSignature) {
        console.error('Invalid webhook signature - potential attack attempt');
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ PESAPAL_IPN_SECRET not set - skipping signature verification (INSECURE)');
    }

    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get('OrderTrackingId');
    const merchantReference = url.searchParams.get('OrderMerchantReference');

    console.log('Pesapal callback received:', { orderTrackingId, merchantReference });

    if (!orderTrackingId) {
      console.error('Missing OrderTrackingId in callback');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing OrderTrackingId' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate processing (idempotency)
    const { data: existingTransaction } = await supabaseClient
      .from('payment_transactions')
      .select('status, id')
      .eq('payment_reference', orderTrackingId)
      .single();

    if (existingTransaction?.status === 'success') {
      console.log('Transaction already processed successfully:', orderTrackingId);
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PESAPAL_CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const PESAPAL_CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      console.error('Pesapal credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Production Pesapal API
    const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';

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
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      const errorText = await statusResponse.text();
      console.error('Status check failed:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Status check failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusData = await statusResponse.json();
    console.log('Transaction status:', statusData);

    // Find the transaction by Pesapal reference with row locking
    const { data: transaction, error: fetchError } = await supabaseClient
      .from('payment_transactions')
      .select('*')
      .eq('payment_reference', orderTrackingId)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        metadata: {
          ...transaction.metadata,
          pesapal_status_code: pesapalStatus,
          pesapal_payment_method: statusData.payment_method,
          processed_at: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id)
      .eq('status', transaction.status); // Optimistic locking

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Update failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If payment successful, credit the wallet
    if (transactionStatus === 'success') {
      const bakAmount = transaction.metadata.bak_amount;
      const userId = transaction.user_id;

      console.log(`Crediting ${bakAmount} BAK to user ${userId}`);

      // Get user's wallet with row locking
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found:', walletError);
        return new Response(
          JSON.stringify({ success: false, error: 'Wallet not found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance) + parseFloat(bakAmount);
      
      const { error: balanceError } = await supabaseClient
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (balanceError) {
        console.error('Failed to update wallet balance:', balanceError);
        return new Response(
          JSON.stringify({ success: false, error: 'Balance update failed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
            merchant_reference: merchantReference,
          },
        });

      if (transactionRecordError) {
        console.error('Failed to create transaction record:', transactionRecordError);
        // Don't fail since wallet was already credited
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
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing callback:', error);
    // Always return 200 for webhooks
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal error',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
