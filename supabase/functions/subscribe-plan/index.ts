import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SubscribeRequest {
  plan_id: string;
  payment_method: 'bakcoins' | 'mpesa';
  phone_number?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // User client for auth verification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Admin client for wallet operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { plan_id, payment_method, phone_number }: SubscribeRequest = await req.json();

    // Fetch plan details including duration_days
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('Plan fetch error:', planError);
      return new Response(
        JSON.stringify({ error: 'Plan not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing active subscription
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingSub) {
      return new Response(
        JSON.stringify({ error: 'You already have an active subscription. Please manage your existing subscription first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payment_method === 'bakcoins') {
      const amount = plan.price_bak;

      // Handle free plans
      if (amount === 0) {
        // Create subscription for free plan (no expiry for free plans)
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan_id: plan.id,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: new Date('2099-12-31').toISOString(), // Free plans don't expire
            auto_renew: false,
            payment_method: 'free',
          })
          .select()
          .single();

        if (subError) {
          console.error('Free subscription creation error:', subError);
          return new Response(
            JSON.stringify({ error: 'Failed to create subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Free subscription created for user ${user.id}: ${plan.name}`);

        return new Response(
          JSON.stringify({
            success: true,
            subscription_id: subscription.id,
            expires_at: subscription.expires_at,
            plan_name: plan.name,
            message: `Free plan activated! Enjoy your ${plan.name} subscription.`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check wallet balance using admin client
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet fetch error:', walletError);
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (wallet.balance < amount) {
        return new Response(
          JSON.stringify({ error: `Insufficient balance. You need ${amount} BAK but have ${wallet.balance} BAK.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Deduct BAK from wallet using admin client (bypasses RLS)
      const { data: updatedWallet, error: updateError } = await supabaseAdmin
        .from('wallets')
        .update({ balance: wallet.balance - amount, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('balance', wallet.balance) // Optimistic lock to prevent race conditions
        .select('id, balance')
        .single();

      if (updateError || !updatedWallet) {
        console.error('Wallet update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to process payment. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Wallet deducted: ${amount} BAK from user ${user.id}. New balance: ${updatedWallet.balance}`);

      // Calculate expiry based on plan's duration_days
      const expiresAt = new Date();
      const durationDays = plan.duration_days || 30; // Default to 30 if not set
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          auto_renew: false,
          payment_method: 'bakcoins',
        })
        .select()
        .single();

      if (subError) {
        console.error('Subscription creation error:', subError);
        // Refund the wallet if subscription creation fails using admin client
        await supabaseAdmin
          .from('wallets')
          .update({ balance: wallet.balance, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ error: 'Failed to create subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create subscription transaction record using admin client
      const { error: txError } = await supabaseAdmin
        .from('subscription_transactions')
        .insert({
          subscription_id: subscription.id,
          user_id: user.id,
          amount: amount,
          currency: 'BAK',
          status: 'completed',
          payment_reference: `SUB-${subscription.id}`,
        });

      if (txError) {
        console.error('Subscription transaction record error:', txError);
      }

      // Create wallet transaction using admin client
      const { error: walletTxError } = await supabaseAdmin
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'spending',
          amount: -amount,
          description: `Subscription: ${plan.name}`,
          reference_id: subscription.id,
        });

      if (walletTxError) {
        console.error('Wallet transaction record error:', walletTxError);
      }

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'subscription',
          title: '🎉 Subscription Activated!',
          message: `Your ${plan.name} subscription is now active until ${new Date(subscription.expires_at).toLocaleDateString()}.`,
          link: '/subscription/manage',
        });

      console.log(`Subscription created for user ${user.id}: ${plan.name} (${durationDays} days)`);

      // Build appropriate message based on duration
      let durationText = '';
      if (durationDays === 1) {
        durationText = 'for 24 hours';
      } else if (durationDays === 30) {
        durationText = 'for 1 month';
      } else if (durationDays === 90) {
        durationText = 'for 3 months';
      } else if (durationDays === 365) {
        durationText = 'for 1 year';
      } else {
        durationText = `for ${durationDays} days`;
      }

      return new Response(
        JSON.stringify({
          success: true,
          subscription_id: subscription.id,
          expires_at: subscription.expires_at,
          plan_name: plan.name,
          message: `Subscription activated ${durationText}! Valid until ${new Date(subscription.expires_at).toLocaleDateString()}.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (payment_method === 'mpesa') {
      // M-Pesa integration placeholder
      return new Response(
        JSON.stringify({ 
          error: 'M-Pesa payment is coming soon! Please use BAKCoins for now.',
          alternative: 'You can buy BAKCoins with M-Pesa and then subscribe.'
        }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid payment method' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Subscribe error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});