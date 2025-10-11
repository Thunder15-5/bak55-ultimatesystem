import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MPesaRequest {
  amount: number;
  phone_number: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, phone_number, user_id }: MPesaRequest = await req.json();

    if (!amount || !phone_number || !user_id) {
      throw new Error("Missing required fields");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's wallet
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user_id)
      .single();

    if (walletError) throw walletError;

    // Simulate M-Pesa STK Push (in production, integrate with actual M-Pesa API)
    // For now, we'll create a pending transaction
    const bakAmount = amount / 20; // 20 KSh = 1 BAK conversion rate

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: walletData.id,
        amount: bakAmount,
        type: 'deposit',
        description: `M-Pesa deposit via ${phone_number}`,
        mpesa_phone_number: phone_number,
        metadata: {
          status: 'pending',
          kes_amount: amount,
          bak_amount: bakAmount,
          payment_method: 'mpesa',
        },
      });

    if (txError) throw txError;

    // In production, you would:
    // 1. Call M-Pesa STK Push API
    // 2. Wait for callback confirmation
    // 3. Update transaction status
    // 4. Update wallet balance

    // For demo purposes, auto-confirm after 2 seconds
    setTimeout(async () => {
      await supabase
        .from('wallets')
        .update({ balance: walletData.balance + bakAmount })
        .eq('id', walletData.id);
    }, 2000);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "M-Pesa payment initiated. Check your phone for payment prompt.",
        bak_amount: bakAmount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in mpesa-deposit:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);