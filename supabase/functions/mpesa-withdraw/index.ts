import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MPesaWithdrawRequest {
  task_id: string;
  admin_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_id, admin_id }: MPesaWithdrawRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get admin task details
    const { data: task, error: taskError } = await supabase
      .from('admin_tasks')
      .select('*')
      .eq('id', task_id)
      .single();

    if (taskError) throw taskError;

    const metadata = task.metadata;
    const phone = metadata.account_details?.accountNumber || '';
    const amount = metadata.net_amount;

    // In production, integrate with M-Pesa B2C API here
    // For now, simulate the withdrawal
    console.log(`Processing M-Pesa withdrawal: ${amount} BAK to ${phone}`);

    // Update task status
    await supabase
      .from('admin_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: admin_id,
      })
      .eq('id', task_id);

    // Send notification to user
    await supabase.from('notifications').insert({
      user_id: metadata.user_id,
      type: 'withdrawal_completed',
      title: 'Withdrawal Processed',
      message: `Your withdrawal of ${amount.toFixed(2)} BAK has been processed via M-Pesa.`,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Withdrawal processed successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in mpesa-withdraw:', error);
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