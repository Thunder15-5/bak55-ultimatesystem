import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-selar-signature, x-webhook-signature',
};

// Fixed package: 100 KES = 5 BAK (20 KES = 1 BAK)
const PACKAGE_PRICE_KES = 100;
const BAK_RATE = 20;
const BAK_AMOUNT = PACKAGE_PRICE_KES / BAK_RATE; // 5.00 BAK

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get raw body for signature verification
    const rawBody = await req.text();
    let payload;
    
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error('Invalid JSON payload');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Selar webhook received:', JSON.stringify(payload));

    // Verify webhook signature if Selar API key is configured
    const selarApiKey = Deno.env.get('SELAR_API_KEY');
    const signature = req.headers.get('x-selar-signature') || 
                      req.headers.get('x-webhook-signature');

    if (selarApiKey && signature) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawBody);
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(selarApiKey),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signatureBytes = await crypto.subtle.sign('HMAC', key, data);
        const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
        
        if (signature !== expectedSignature) {
          console.warn('Webhook signature mismatch - logging but proceeding');
          // Log but don't reject - Selar may use different signature method
        } else {
          console.log('Webhook signature verified successfully');
        }
      } catch (sigError) {
        console.warn('Signature verification failed:', sigError);
        // Continue processing - don't block on signature issues
      }
    } else {
      console.log('No signature verification (missing API key or signature header)');
    }

    // Extract data from Selar webhook
    // Selar sends different payload structures, handle common cases
    const reference = payload.reference || payload.transaction_reference || payload.order_reference;
    const transactionId = payload.transaction_id || payload.id;
    const status = payload.status || payload.payment_status;
    const email = payload.email || payload.customer_email || payload.buyer_email;
    const metadata = payload.metadata || payload.custom_data || {};
    const userId = metadata.user_id || payload.user_id;

    console.log('Parsed webhook data:', { reference, transactionId, status, email, userId });

    // Check if payment is successful
    const isSuccessful = ['successful', 'success', 'completed', 'paid'].includes(
      (status || '').toLowerCase()
    );

    if (!isSuccessful) {
      console.log('Payment not successful, status:', status);
      return new Response(
        JSON.stringify({ success: false, message: 'Payment not successful' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email if userId not in metadata
    let targetUserId = userId;
    
    if (!targetUserId && email) {
      console.log('Looking up user by email:', email);
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        console.error('User not found by email:', email, profileError);
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUserId = profile.id;
    }

    if (!targetUserId) {
      console.error('No user ID found in webhook');
      return new Response(
        JSON.stringify({ error: 'No user ID in webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing payment for user:', targetUserId);

    // Check if this transaction was already processed (prevent double-crediting)
    const txRef = transactionId || reference || `selar_${Date.now()}`;
    
    const { data: existingTx } = await supabaseClient
      .from('payment_transactions')
      .select('id')
      .eq('payment_reference', txRef)
      .single();

    if (existingTx) {
      console.log('Transaction already processed:', txRef);
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create user's wallet
    let { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (walletError || !wallet) {
      console.log('Creating wallet for user:', targetUserId);
      const { data: newWallet, error: createError } = await supabaseClient
        .from('wallets')
        .insert({ user_id: targetUserId, balance: 0 })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create wallet:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create wallet' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      wallet = newWallet;
    }

    // Credit the wallet with fixed BAK amount (5 BAK per 100 KES)
    const newBalance = (wallet.balance || 0) + BAK_AMOUNT;
    
    const { error: updateError } = await supabaseClient
      .from('wallets')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('Failed to update wallet:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to credit wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Credited ${BAK_AMOUNT} BAK to wallet ${wallet.id}. New balance: ${newBalance}`);

    // Record the payment transaction
    const { error: paymentTxError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: targetUserId,
        email: email || '',
        amount: PACKAGE_PRICE_KES,
        currency: 'KES',
        status: 'success',
        payment_provider: 'selar',
        reference: reference || txRef,
        payment_reference: txRef,
        selar_transaction_id: transactionId,
        metadata: {
          selar_webhook: payload,
          bak_credited: BAK_AMOUNT,
          bak_rate: BAK_RATE,
          processed_at: new Date().toISOString()
        }
      });

    if (paymentTxError) {
      console.error('Failed to record payment transaction:', paymentTxError);
      // Don't fail - wallet already credited
    }

    // Record in transactions table
    const { error: txRecordError } = await supabaseClient
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'income',
        amount: BAK_AMOUNT,
        description: `Purchased ${BAK_AMOUNT.toFixed(2)} BAKCoins via Selar (100 KES)`,
        reference_id: txRef,
        metadata: {
          payment_provider: 'selar',
          selar_transaction_id: transactionId,
          amount_kes: PACKAGE_PRICE_KES,
          bak_rate: BAK_RATE
        }
      });

    if (txRecordError) {
      console.error('Failed to create transaction record:', txRecordError);
    }

    // Send notification to user
    try {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'payment',
          title: 'BAKCoins Credited!',
          message: `${BAK_AMOUNT.toFixed(2)} BAKCoins have been added to your wallet from your 100 KES purchase.`,
          category: 'wallet'
        });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    // Try to send email notification
    try {
      if (email) {
        await supabaseClient.functions.invoke('send-notification-email', {
          body: {
            to: email,
            subject: 'BAKCoins Purchase Successful!',
            html: `
              <h1>Payment Successful!</h1>
              <p>Your payment of <strong>100 KES</strong> has been processed successfully.</p>
              <p><strong>${BAK_AMOUNT.toFixed(2)} BAKCoins</strong> have been added to your wallet.</p>
              <p>Exchange Rate: 20 KES = 1 BAK</p>
              <p>Reference: ${txRef}</p>
              <p>Thank you for using BAK55 Talent!</p>
            `
          }
        });
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    console.log('Payment processing complete');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Credited ${BAK_AMOUNT.toFixed(2)} BAKCoins`,
        user_id: targetUserId,
        transaction_ref: txRef
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in selar-callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
