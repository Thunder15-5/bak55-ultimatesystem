import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid voucher code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Lookup voucher with service role to bypass RLS
    const { data: voucher, error: voucherError } = await supabaseClient
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (voucherError || !voucher) {
      return new Response(JSON.stringify({ error: 'Invalid voucher code' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate voucher
    if (voucher.status !== 'unused') {
      return new Response(JSON.stringify({ error: `Voucher already ${voucher.status}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Voucher has expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark voucher as used
    const { error: updateError } = await supabaseClient
      .from('vouchers')
      .update({
        status: 'used',
        used_by: user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', voucher.id);

    if (updateError) {
      console.error('Error updating voucher:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to redeem voucher' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      console.error('Wallet not found for user:', user.id);
      return new Response(JSON.stringify({ error: 'Wallet not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Credit wallet
    const { error: creditError } = await supabaseClient
      .from('wallets')
      .update({ balance: wallet.balance + voucher.bak_coins })
      .eq('id', wallet.id);

    if (creditError) {
      console.error('Error crediting wallet:', creditError);
      return new Response(JSON.stringify({ error: 'Failed to credit wallet' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record transaction
    const { error: txError } = await supabaseClient
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'income',
        amount: voucher.bak_coins,
        description: `Voucher redeemed: ${voucher.bak_coins} BAK`,
        metadata: { 
          provider: 'voucher', 
          voucher_code: code,
          voucher_id: voucher.id 
        }
      });

    if (txError) {
      console.error('Error recording transaction:', txError);
    }

    console.log(`User ${user.id} redeemed voucher ${code} for ${voucher.bak_coins} BAK`);

    return new Response(JSON.stringify({ 
      success: true,
      amount: voucher.bak_coins,
      new_balance: wallet.balance + voucher.bak_coins,
      message: `Successfully redeemed ${voucher.bak_coins} BAKCoins!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in voucher-redeem:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});