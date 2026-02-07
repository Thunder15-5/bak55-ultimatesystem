import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-selar-signature, x-webhook-signature',
};

// BAK conversion rate: 20 KES = 1 BAK
const BAK_RATE = 20;

// Package mappings based on Selar product URLs
const PACKAGES: Record<string, { priceKES: number; bakAmount: number }> = {
  '5b14447v0n': { priceKES: 250, bakAmount: 12.5 },
  '79r4616705': { priceKES: 500, bakAmount: 25 },
  '22en2upr67': { priceKES: 1000, bakAmount: 50 },
  'f176d5q724': { priceKES: 2500, bakAmount: 125 },
  '7167167f11': { priceKES: 5000, bakAmount: 250 },
  'x6r5dgu5h5': { priceKES: 100, bakAmount: 5 }, // Legacy package
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

    // Verify webhook signature if configured
    const selarApiKey = Deno.env.get('SELAR_API_KEY');
    const signature = req.headers.get('x-selar-signature') || req.headers.get('x-webhook-signature');

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
        }
      } catch (sigError) {
        console.warn('Signature verification failed:', sigError);
      }
    }

    // Parse Selar webhook payload
    const email = payload.buyer_email || payload.email || payload.customer_email;
    
    // Extract product code to determine package
    let productCode = payload.product_code || payload.product_id;
    
    // Try to extract from receipt_url
    if (!productCode && payload.receipt_url) {
      const productMatch = payload.receipt_url.match(/products=([a-zA-Z0-9]+)/i);
      if (productMatch) {
        productCode = productMatch[1];
      }
    }
    
    // Try from metadata
    if (!productCode && payload.metadata?.package_id) {
      // Extract from package_id like 'pkg_250'
      const amountMatch = payload.metadata.package_id.match(/pkg_(\d+)/);
      if (amountMatch) {
        const amountKES = parseInt(amountMatch[1]);
        for (const [code, pkg] of Object.entries(PACKAGES)) {
          if (pkg.priceKES === amountKES) {
            productCode = code;
            break;
          }
        }
      }
    }

    // Determine package and amounts
    let priceKES: number;
    let bakAmount: number;

    if (productCode && PACKAGES[productCode]) {
      priceKES = PACKAGES[productCode].priceKES;
      bakAmount = PACKAGES[productCode].bakAmount;
    } else if (payload.total_amount || payload.amount) {
      // Fallback: Calculate from amount
      priceKES = parseFloat(payload.total_amount || payload.amount);
      bakAmount = priceKES / BAK_RATE;
    } else if (payload.metadata?.amount_kes) {
      priceKES = parseFloat(payload.metadata.amount_kes);
      bakAmount = parseFloat(payload.metadata.bak_amount) || priceKES / BAK_RATE;
    } else {
      // Default to legacy package
      priceKES = 100;
      bakAmount = 5;
    }

    // Extract transaction reference
    let transactionId = payload.transaction_id || payload.id;
    if (!transactionId && payload.receipt_url) {
      const receiptMatch = payload.receipt_url.match(/\/receipt\/([A-Z0-9]+)/i);
      if (receiptMatch) {
        transactionId = receiptMatch[1];
      }
    }
    
    const reference = payload.reference || payload.transaction_reference || transactionId;
    
    // Check if webhook indicates success
    const explicitStatus = payload.status || payload.payment_status;
    const isSelarNativeWebhook = payload.product_code || payload.product_id || payload.receipt_url || payload.buyer_email;
    const isSuccessful = isSelarNativeWebhook || ['successful', 'success', 'completed', 'paid'].includes((explicitStatus || '').toLowerCase());

    console.log('Parsed webhook:', { email, productCode, priceKES, bakAmount, transactionId, isSuccessful });

    if (!isSuccessful) {
      return new Response(
        JSON.stringify({ success: false, message: 'Payment not successful' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      console.error('No email found in webhook');
      return new Response(
        JSON.stringify({ error: 'No email in payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('User not found:', email);
      return new Response(
        JSON.stringify({ error: 'User not found', email }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = profile.id;
    const txRef = transactionId || reference || `selar_${Date.now()}_${email}`;

    // Check for duplicate transaction
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

    // Get or create wallet
    let { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      const { data: newWallet, error: createError } = await supabaseClient
        .from('wallets')
        .insert({ user_id: userId, balance: 0 })
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

    // Credit wallet
    const newBalance = (wallet.balance || 0) + bakAmount;
    
    const { error: updateError } = await supabaseClient
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('Failed to credit wallet:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to credit wallet' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Credited ${bakAmount} BAK to user ${userId}. New balance: ${newBalance}`);

    // Record payment transaction
    await supabaseClient.from('payment_transactions').insert({
      user_id: userId,
      email,
      amount: priceKES,
      currency: 'KES',
      status: 'success',
      payment_provider: 'selar',
      reference: reference || txRef,
      payment_reference: txRef,
      selar_transaction_id: transactionId,
      metadata: {
        selar_webhook: payload,
        bak_credited: bakAmount,
        bak_rate: BAK_RATE,
        product_code: productCode,
        processed_at: new Date().toISOString()
      }
    });

    // Record transaction in transactions table
    await supabaseClient.from('transactions').insert({
      wallet_id: wallet.id,
      type: 'income',
      amount: bakAmount,
      description: `Purchased ${bakAmount.toFixed(2)} BAKCoins via Selar (${priceKES.toLocaleString()} KES)`,
      reference_id: txRef,
      metadata: {
        payment_provider: 'selar',
        selar_transaction_id: transactionId,
        amount_kes: priceKES,
        bak_rate: BAK_RATE
      }
    });

    // Process referral if first deposit
    const { data: depositCount } = await supabaseClient
      .from('payment_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'success');

    const isFirstDeposit = !depositCount || (depositCount as any).length <= 1;

    if (isFirstDeposit) {
      const { data: pendingReferral } = await supabaseClient
        .from('referrals')
        .select('id, referral_code, referrer_id')
        .eq('referred_id', userId)
        .eq('status', 'pending')
        .eq('rewarded', false)
        .maybeSingle();

      if (pendingReferral) {
        try {
          await supabaseClient.functions.invoke('process-referral', {
            body: {
              referral_code: pendingReferral.referral_code,
              referred_user_id: userId,
              trigger: 'first_deposit'
            }
          });
        } catch (refError) {
          console.error('Error processing referral:', refError);
        }
      }
    }

    // Send notification
    await supabaseClient.from('notifications').insert({
      user_id: userId,
      type: 'payment',
      title: '💰 BAKCoins Credited!',
      message: `${bakAmount.toFixed(2)} BAKCoins have been added to your wallet from your ${priceKES.toLocaleString()} KES purchase.`,
      category: 'payment'
    });

    // Send email notification
    try {
      await supabaseClient.functions.invoke('send-notification-email', {
        body: {
          to: email,
          subject: 'BAKCoins Purchase Successful!',
          html: `
            <h1>Payment Successful!</h1>
            <p>Your payment of <strong>${priceKES.toLocaleString()} KES</strong> has been processed.</p>
            <p><strong>${bakAmount.toFixed(2)} BAKCoins</strong> have been credited to your wallet.</p>
            <p>Exchange Rate: 20 KES = 1 BAK</p>
            <p>Reference: ${txRef}</p>
            <p>Thank you for using BAK55 Talent!</p>
          `
        }
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Credited ${bakAmount.toFixed(2)} BAKCoins`,
        user_id: userId,
        amount_kes: priceKES,
        bak_amount: bakAmount,
        transaction_ref: txRef
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in selar-callback:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
