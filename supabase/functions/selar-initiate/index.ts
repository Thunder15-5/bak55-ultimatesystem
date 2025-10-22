import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitiatePaymentRequest {
  amount: number;
  email: string;
  product_type?: string;
  description?: string;
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
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, email, product_type = 'bakcoins', description }: InitiatePaymentRequest = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selarPublicKey = Deno.env.get('SELAR_PUBLIC_KEY');
    const selarSecretKey = Deno.env.get('SELAR_SECRET_KEY');
    
    if (!selarPublicKey || !selarSecretKey) {
      console.error('Selar API keys not configured');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate BAKCoins (20 KSh = 1 BAK)
    const bakCoins = amount / 20;
    const reference = `BAK${Date.now()}${user.id.substring(0, 8)}`;

    console.log('Creating payment transaction:', { user_id: user.id, amount, reference });

    // Step 1: Create payment transaction record
    const { data: transaction, error: txError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        email: email,
        amount: amount,
        currency: 'KES',
        status: 'pending',
        payment_provider: 'selar',
        reference: reference,
        metadata: {
          product_type,
          bak_coins: bakCoins,
          description: description || `Purchase ${bakCoins} BAKCoins`
        }
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction creation error:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction created:', transaction.id);

    // Step 2: Create Selar payment link
    // Selar API endpoint: https://selar.co/api/v1/payments/create
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/selar-callback`;
    const successUrl = `${Deno.env.get('VITE_SUPABASE_URL') || 'https://qtdxzgeeomgukkxfkwmh.supabase.co'}/payment/success`;
    const cancelUrl = `${Deno.env.get('VITE_SUPABASE_URL') || 'https://qtdxzgeeomgukkxfkwmh.supabase.co'}/wallet/buy-coins`;

    const selarPayload = {
      email: email,
      amount: amount,
      currency: 'KES',
      reference: reference,
      callback_url: callbackUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        transaction_id: transaction.id,
        product_type,
        bak_coins: bakCoins
      }
    };

    console.log('Calling Selar API...');

    const selarResponse = await fetch('https://selar.co/api/v1/payments/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${selarSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(selarPayload),
    });

    const selarData = await selarResponse.json();

    if (!selarResponse.ok) {
      console.error('Selar API error:', selarData);
      
      // Update transaction status to failed
      await supabaseClient
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          metadata: { 
            ...transaction.metadata,
            selar_error: selarData 
          }
        })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment link',
          details: selarData.message || 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Selar payment link created:', selarData);

    // Step 3: Update transaction with Selar details
    const { error: updateError } = await supabaseClient
      .from('payment_transactions')
      .update({
        selar_transaction_id: selarData.transaction_id || selarData.id,
        selar_payment_link: selarData.payment_link || selarData.url,
        payment_reference: selarData.reference || reference,
        metadata: {
          ...transaction.metadata,
          selar_response: selarData
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: selarData.payment_link || selarData.url,
        reference: reference,
        transaction_id: transaction.id,
        selar_transaction_id: selarData.transaction_id || selarData.id,
        amount: amount,
        bak_coins: bakCoins
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in selar-initiate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
