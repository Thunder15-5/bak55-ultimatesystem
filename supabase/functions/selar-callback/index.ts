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
        } else {
          console.log('Webhook signature verified successfully');
        }
      } catch (sigError) {
        console.warn('Signature verification failed:', sigError);
      }
    } else {
      console.log('No signature verification (missing API key or signature header)');
    }

    // ====== PARSE SELAR'S NATIVE WEBHOOK FORMAT ======
    // Selar sends: buyer_email, receipt_url, product_id, total_amount, etc.
    // The webhook being received IS the success confirmation (no separate status field)
    
    // Extract email from Selar's native format
    const email = payload.buyer_email || 
                  payload.email || 
                  payload.customer_email;
    
    // Extract transaction reference from receipt_url or other fields
    // receipt_url format: "https://selar.com/receipt/S0C90IZ9V2FI9?products=x6r5dgu5h5"
    let transactionId = payload.transaction_id || payload.id || payload.product_id;
    
    if (!transactionId && payload.receipt_url) {
      // Extract receipt ID from URL
      const receiptMatch = payload.receipt_url.match(/\/receipt\/([A-Z0-9]+)/i);
      if (receiptMatch) {
        transactionId = receiptMatch[1];
      }
    }
    
    const reference = payload.reference || 
                      payload.transaction_reference || 
                      payload.order_reference ||
                      transactionId;
    
    // For Zapier forwarded webhooks, check for explicit status
    const explicitStatus = payload.status || payload.payment_status;
    
    // Selar native webhooks don't have status - the webhook IS the success
    // If we have product_code, product_id, or receipt_url, it's a successful payment
    const isSelarNativeWebhook = payload.product_code || 
                                  payload.product_id || 
                                  payload.receipt_url ||
                                  payload.buyer_email;
    
    const isSuccessful = isSelarNativeWebhook || 
                         ['successful', 'success', 'completed', 'paid'].includes(
                           (explicitStatus || '').toLowerCase()
                         );

    console.log('Parsed webhook data:', { 
      email, 
      transactionId, 
      reference, 
      isSelarNativeWebhook,
      explicitStatus,
      isSuccessful 
    });

    if (!isSuccessful) {
      console.log('Payment not successful - no valid Selar webhook data');
      return new Response(
        JSON.stringify({ success: false, message: 'Payment not successful or invalid webhook' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      console.error('No email found in webhook payload');
      return new Response(
        JSON.stringify({ error: 'No email in webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email
    console.log('Looking up user by email:', email);
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('User not found by email:', email, profileError);
      return new Response(
        JSON.stringify({ error: 'User not found', email }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const targetUserId = profile.id;
    console.log('Found user:', targetUserId);

    // Check if this transaction was already processed (prevent double-crediting)
    const txRef = transactionId || reference || `selar_${Date.now()}_${email}`;
    
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

    // === CHECK FOR PENDING REFERRAL AND PROCESS REWARDS ===
    // Check if this is the user's first deposit
    const { data: depositCount } = await supabaseClient
      .from('payment_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('status', 'success');

    const isFirstDeposit = !depositCount || (depositCount as any).length <= 1;

    if (isFirstDeposit) {
      console.log('First deposit detected for user:', targetUserId);
      
      // Check for pending referral
      const { data: pendingReferral } = await supabaseClient
        .from('referrals')
        .select('id, referral_code, referrer_id')
        .eq('referred_id', targetUserId)
        .eq('status', 'pending')
        .eq('rewarded', false)
        .maybeSingle();

      if (pendingReferral) {
        console.log('Found pending referral, processing rewards:', pendingReferral.id);
        
        // Trigger referral reward processing
        try {
          const { error: referralError } = await supabaseClient.functions.invoke('process-referral', {
            body: {
              referral_code: pendingReferral.referral_code,
              referred_user_id: targetUserId,
              trigger: 'first_deposit'
            }
          });

          if (referralError) {
            console.error('Failed to process referral reward:', referralError);
          } else {
            console.log('Referral rewards processed successfully');
          }
        } catch (refError) {
          console.error('Error invoking process-referral:', refError);
        }
      }
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

    console.log('Payment processing complete for', email);

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
