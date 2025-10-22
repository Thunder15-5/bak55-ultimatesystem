import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

    const selarWebhookSecret = Deno.env.get('SELAR_WEBHOOK_SECRET');
    
    // Verify webhook signature if Selar provides one
    const signature = req.headers.get('x-selar-signature');
    
    const payload = await req.json();
    console.log('Selar webhook received:', payload);

    // Extract transaction details from Selar webhook
    const {
      reference,
      transaction_id,
      status,
      amount,
      email,
      metadata
    } = payload;

    if (!reference) {
      console.error('No reference in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing payment for reference:', reference);

    // Find the transaction by reference or selar_transaction_id
    const { data: transaction, error: fetchError } = await supabaseClient
      .from('payment_transactions')
      .select('*')
      .or(`reference.eq.${reference},selar_transaction_id.eq.${transaction_id}`)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize Selar status to our internal status
    let normalizedStatus = 'pending';
    if (status === 'successful' || status === 'success' || status === 'completed') {
      normalizedStatus = 'success';
    } else if (status === 'failed' || status === 'cancelled' || status === 'canceled') {
      normalizedStatus = 'failed';
    }

    console.log(`Transaction ${transaction.id}: ${transaction.status} -> ${normalizedStatus}`);

    // Update transaction status
    const { error: updateError } = await supabaseClient
      .from('payment_transactions')
      .update({
        status: normalizedStatus,
        selar_transaction_id: transaction_id,
        metadata: {
          ...transaction.metadata,
          selar_webhook: payload,
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If payment is successful and not already credited, credit the wallet
    if (normalizedStatus === 'success' && transaction.status !== 'success') {
      console.log('Payment successful, crediting wallet...');

      const bakCoins = transaction.metadata?.bak_coins || (transaction.amount / 20);

      // Get user wallet
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', transaction.user_id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found:', walletError);
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update wallet balance
      const { error: balanceError } = await supabaseClient
        .from('wallets')
        .update({ 
          balance: wallet.balance + bakCoins,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (balanceError) {
        console.error('Failed to update wallet balance:', balanceError);
        return new Response(
          JSON.stringify({ error: 'Failed to credit wallet' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create transaction record
      const { error: txRecordError } = await supabaseClient
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'income',
          amount: bakCoins,
          description: `Purchased ${bakCoins} BAKCoins via Selar`,
          reference_id: transaction.id,
          metadata: {
            payment_provider: 'selar',
            selar_transaction_id: transaction_id,
            amount_ksh: amount
          }
        });

      if (txRecordError) {
        console.error('Failed to create transaction record:', txRecordError);
      }

      // Send success notification email
      try {
        await supabaseClient.functions.invoke('send-notification-email', {
          body: {
            to: transaction.email,
            subject: 'BAKCoins Purchase Successful',
            html: `
              <h1>Payment Successful!</h1>
              <p>Your payment of KSh ${amount} has been processed successfully.</p>
              <p><strong>${bakCoins} BAKCoins</strong> have been added to your wallet.</p>
              <p>Reference: ${reference}</p>
              <p>Thank you for using BAK55 Talent!</p>
            `
          }
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }

      console.log(`Successfully credited ${bakCoins} BAKCoins to wallet ${wallet.id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        status: normalizedStatus,
        transaction_id: transaction.id
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
