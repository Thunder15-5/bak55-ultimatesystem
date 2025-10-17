import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ Verify Pesapal webhook signature
async function verifyPesapalSignature(payload: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return computedSignature === signature;
  } catch (err) {
    console.error('Error verifying signature:', err);
    return false;
  }
}

// Helper function to process transaction and credit wallet
async function processTransaction(
  transaction: any,
  statusData: any,
  supabase: any,
  orderTrackingId: string,
  merchantReference: string | null
) {
  // ✅ Improved status mapping (Pesapal API codes)
  let transactionStatus = 'pending';
  const pesapalCode = Number(statusData.payment_status_code);

  if (pesapalCode === 1) transactionStatus = 'success';
  else if (pesapalCode === 2 || pesapalCode === 3) transactionStatus = 'failed';
  else if (pesapalCode === 4) transactionStatus = 'pending';
  else transactionStatus = 'unknown';

  // Idempotent update
  if (transaction.status !== transactionStatus) {
    await supabase
      .from('payment_transactions')
      .update({
        status: transactionStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          pesapal_payment_method: statusData.payment_method,
          pesapal_status_code: pesapalCode,
          pesapal_confirmation_code: statusData.confirmation_code,
          verified_at: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id);
  }

  // ✅ Skip if already successful (prevent double credit)
  if (transaction.status === 'success') {
    console.log('⏩ Transaction already marked success — skipping double credit');
    return { success: true, status: 'success', message: 'Already processed' };
  }

  // ✅ Credit user if success
  if (transactionStatus === 'success') {
    const userId = transaction.user_id;
    const bakAmount =
      transaction.metadata?.bak_amount ||
      parseFloat(transaction.amount) ||
      0;

    console.log(`💰 Crediting ${bakAmount} BAKCoins to user ${userId}`);

    // Ensure wallet exists
    let { data: wallet, error: walletErr } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletErr) console.error('⚠️ Wallet fetch error:', walletErr);

    if (!wallet) {
      console.warn('No wallet found — creating new one');
      const { data: newWallet, error: createErr } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: bakAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (createErr) console.error('❌ Failed to create wallet:', createErr);
      wallet = newWallet;
    } else {
      console.log('🔍 Wallet before credit:', wallet);

      // ✅ Safe number addition
      const currentBalance = Number(wallet.balance ?? 0);
      const newBalance = parseFloat((currentBalance + bakAmount).toFixed(2));

      const { error: updateErr } = await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

      if (updateErr) console.error('❌ Wallet update failed:', updateErr);
      else console.log(`✅ Wallet credited. Old: ${wallet.balance}, New: ${newBalance}`);
    }

    // Record earning transaction
    await supabase.from('transactions').insert({
      wallet_id: wallet.id,
      amount: bakAmount,
      type: 'earning',
      description: `Purchased ${bakAmount} BAKCoins`,
      reference_id: transaction.id,
      metadata: {
        payment_method: 'pesapal',
        order_tracking_id: orderTrackingId,
        amount_paid_ksh: transaction.amount,
        merchant_reference: merchantReference,
      },
    });

    console.log('✅ Wallet credited successfully');
  }

  return {
    success: true,
    status: transactionStatus,
    message:
      transactionStatus === 'success'
        ? 'Payment successful — wallet credited.'
        : 'Payment processed.',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.text();
    const signature = req.headers.get('x-pesapal-signature');
    const ipnSecret = Deno.env.get('PESAPAL_IPN_SECRET');

    // Optional signature check
    if (ipnSecret && signature) {
      const ok = await verifyPesapalSignature(rawBody, signature, ipnSecret);
      if (!ok) console.warn('⚠️ Signature invalid — continuing safely');
      else console.log('✅ Signature verified');
    }

    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get('OrderTrackingId');
    const merchantReference = url.searchParams.get('OrderMerchantReference');

    if (!orderTrackingId) {
      console.error('❌ Missing OrderTrackingId');
      return new Response(
        JSON.stringify({ success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Pesapal callback received:', { orderTrackingId, merchantReference });

    // Get token
    const PESAPAL_CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const PESAPAL_CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';

    const tokenResp = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      }),
    });

    if (!tokenResp.ok) throw new Error('Auth failed');
    const tokenData = await tokenResp.json();
    const accessToken = tokenData.token;

    // Get transaction status
    const statusResp = await fetch(
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!statusResp.ok) throw new Error('Failed to fetch status');
    const statusData = await statusResp.json();
    console.log('Transaction status:', statusData);

    // ✅ Locate transaction in database (search by reference or metadata)
    let transaction = null;
    const { data: txByRef } = await supabase
      .from('payment_transactions')
      .select('*')
      .or(`payment_reference.eq.${orderTrackingId},reference.eq.${merchantReference || ''}`)
      .maybeSingle();

    if (txByRef) {
      transaction = txByRef;
    } else {
      const { data: txByMetadata } = await supabase
        .from('payment_transactions')
        .select('*')
        .contains('metadata', { order_tracking_id: orderTrackingId })
        .maybeSingle();
      transaction = txByMetadata;
    }

    if (!transaction) {
      console.error('❌ Transaction not found for', orderTrackingId);
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the transaction
    const result = await processTransaction(
      transaction,
      statusData,
      supabase,
      orderTrackingId,
      merchantReference
    );

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Unhandled error in callback:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
