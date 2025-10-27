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

    // Check if user is admin
    const { data: roleCheck } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { request_id, action, notes } = await req.json();

    if (!request_id || !action || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get deposit request
    const { data: depositRequest, error: fetchError } = await supabaseClient
      .from('deposit_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchError || !depositRequest) {
      return new Response(JSON.stringify({ error: 'Deposit request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (depositRequest.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Request already processed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'approve') {
      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', depositRequest.user_id)
        .single();

      if (walletError || !wallet) {
        return new Response(JSON.stringify({ error: 'Wallet not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Credit wallet
      const { error: creditError } = await supabaseClient
        .from('wallets')
        .update({ balance: wallet.balance + depositRequest.expected_bak })
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
          amount: depositRequest.expected_bak,
          description: `Manual M-Pesa deposit: ${depositRequest.amount_kes} KSh`,
          metadata: { 
            provider: 'manual_mpesa',
            receipt_code: depositRequest.receipt_code,
            deposit_request_id: request_id
          }
        });

      if (txError) {
        console.error('Error recording transaction:', txError);
      }

      console.log(`Approved deposit request ${request_id}: ${depositRequest.expected_bak} BAK to user ${depositRequest.user_id}`);
    }

    // Update deposit request status
    const { error: updateError } = await supabaseClient
      .from('deposit_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('Error updating deposit request:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create notification for user
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: depositRequest.user_id,
        type: action === 'approve' ? 'deposit_approved' : 'deposit_rejected',
        title: action === 'approve' ? '✅ Deposit Approved' : '❌ Deposit Rejected',
        message: action === 'approve' 
          ? `Your deposit of ${depositRequest.expected_bak} BAKCoins has been approved!`
          : `Your deposit request was rejected. ${notes || 'Please contact support for details.'}`,
        link: '/wallet'
      });

    return new Response(JSON.stringify({ 
      success: true,
      action: action,
      message: `Deposit request ${action}d successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in deposit-review:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});