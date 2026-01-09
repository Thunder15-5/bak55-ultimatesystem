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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    const { amount_kes, receipt_code, screenshot_url } = await req.json();

    // Validate input
    if (!amount_kes || !receipt_code) {
      return new Response(JSON.stringify({ error: 'Amount and receipt code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount_kes < 28) {
      return new Response(JSON.stringify({ error: 'Minimum deposit is 28 KSh (~1 BAK)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create deposit request
    const { data: depositRequest, error: insertError } = await supabaseClient
      .from('deposit_requests')
      .insert({
        user_id: user.id,
        amount_kes: amount_kes,
        receipt_code: receipt_code.trim(),
        screenshot_url: screenshot_url || null,
        metadata: { submitted_via: 'buy_coins_page' }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating deposit request:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to submit deposit request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Deposit request created: ${depositRequest.id} by user ${user.id}`);

    return new Response(JSON.stringify({ 
      success: true,
      deposit_request: depositRequest,
      message: 'Your deposit request has been submitted. You will be notified once it is reviewed.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in deposit-request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});