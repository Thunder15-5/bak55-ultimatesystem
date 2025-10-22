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

    // Optional: Check if user is admin
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (user) {
        const { data: hasAdmin } = await supabaseClient.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (!hasAdmin) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized - Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const { transaction_id, selar_transaction_id, reference } = await req.json();

    if (!transaction_id && !selar_transaction_id && !reference) {
      return new Response(
        JSON.stringify({ error: 'Transaction identifier required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying payment:', { transaction_id, selar_transaction_id, reference });

    // Find transaction
    let query = supabaseClient.from('payment_transactions').select('*');
    
    if (transaction_id) {
      query = query.eq('id', transaction_id);
    } else if (selar_transaction_id) {
      query = query.eq('selar_transaction_id', selar_transaction_id);
    } else {
      query = query.eq('reference', reference);
    }

    const { data: transaction, error: fetchError } = await query.single();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selarSecretKey = Deno.env.get('SELAR_SECRET_KEY');
    
    if (!selarSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Selar API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Selar API
    const verifyUrl = `https://selar.co/api/v1/payments/${transaction.selar_transaction_id || transaction.reference}`;
    
    console.log('Calling Selar verify API:', verifyUrl);

    const selarResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${selarSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!selarResponse.ok) {
      const errorData = await selarResponse.json();
      console.error('Selar API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify with Selar',
          details: errorData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selarData = await selarResponse.json();
    console.log('Selar verification response:', selarData);

    // Normalize status
    let normalizedStatus = 'pending';
    const selarStatus = selarData.status?.toLowerCase();
    
    if (selarStatus === 'successful' || selarStatus === 'success' || selarStatus === 'completed') {
      normalizedStatus = 'success';
    } else if (selarStatus === 'failed' || selarStatus === 'cancelled' || selarStatus === 'canceled') {
      normalizedStatus = 'failed';
    }

    // Update transaction
    const { error: updateError } = await supabaseClient
      .from('payment_transactions')
      .update({
        status: normalizedStatus,
        selar_transaction_id: selarData.transaction_id || selarData.id,
        metadata: {
          ...transaction.metadata,
          selar_verification: selarData,
          verified_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
    }

    // If successful and not yet credited, credit wallet
    if (normalizedStatus === 'success' && transaction.status !== 'success') {
      const bakCoins = transaction.metadata?.bak_coins || (transaction.amount / 20);

      const { data: wallet } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', transaction.user_id)
        .single();

      if (wallet) {
        await supabaseClient
          .from('wallets')
          .update({ 
            balance: wallet.balance + bakCoins,
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);

        await supabaseClient
          .from('transactions')
          .insert({
            wallet_id: wallet.id,
            type: 'income',
            amount: bakCoins,
            description: `Purchased ${bakCoins} BAKCoins via Selar (Manual Verification)`,
            reference_id: transaction.id,
            metadata: {
              payment_provider: 'selar',
              selar_transaction_id: selarData.transaction_id || selarData.id,
              verification_type: 'manual'
            }
          });

        console.log(`Manually credited ${bakCoins} BAKCoins to wallet ${wallet.id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        status: normalizedStatus,
        selar_status: selarData.status,
        amount: transaction.amount,
        reference: transaction.reference,
        verified: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in selar-verify:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
