import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activation_code } = await req.json();

    if (!activation_code || activation_code.length !== 6) {
      return new Response(
        JSON.stringify({ error: 'Invalid activation code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user client to verify token
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find profile with matching activation code
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, is_activated')
      .eq('id', user.id)
      .eq('activation_code', activation_code)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Invalid activation code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.is_activated) {
      return new Response(
        JSON.stringify({ success: true, message: 'Account already activated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Activate the account
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_activated: true,
        activation_code: null, // Clear the code
        activation_code_sent_at: null,
        signup_bonus_awarded: true
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Fetch the user's role to determine bonus amount
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = roleData?.role || 'fan';
    // Artists get 20 BAK, Fans get 10 BAK welcome bonus
    const welcomeBonus = userRole === 'artist' ? 20 : 10;

    // Get or create wallet and add welcome bonus
    const { data: existingWallet } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingWallet) {
      // Update existing wallet with bonus
      await supabaseAdmin
        .from('wallets')
        .update({ balance: existingWallet.balance + welcomeBonus })
        .eq('id', existingWallet.id);

      // Record the transaction
      await supabaseAdmin
        .from('transactions')
        .insert({
          wallet_id: existingWallet.id,
          amount: welcomeBonus,
          type: 'credit',
          description: 'Welcome bonus for email verification 🎉',
          reference: `WELCOME_BONUS_${user.id.substring(0, 8)}`
        });
    } else {
      // Create wallet with welcome bonus
      const { data: newWallet } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: user.id,
          balance: welcomeBonus
        })
        .select()
        .single();

      if (newWallet) {
        await supabaseAdmin
          .from('transactions')
          .insert({
            wallet_id: newWallet.id,
            amount: welcomeBonus,
            type: 'credit',
            description: 'Welcome bonus for email verification 🎉',
            reference: `WELCOME_BONUS_${user.id.substring(0, 8)}`
          });
      }
    }

    // Send welcome email
    await supabaseAdmin.functions.invoke('send-email', {
      body: {
        to: profile.email,
        subject: 'Welcome to BAK55 Talent! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #D946EF;">Welcome to BAK55 Talent!</h1>
            <p>Your account has been successfully activated.</p>
            <p>You can now:</p>
            <ul>
              <li>Stream music from emerging African artists</li>
              <li>Participate in competitions</li>
              <li>Earn and spend BAKCoins</li>
              <li>Connect with the music community</li>
            </ul>
            <p>Get started: <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', '')}/dashboard">Go to Dashboard</a></p>
            <p>Best regards,<br>The BAK55 Team</p>
          </div>
        `,
        type: 'welcome',
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account activated successfully!',
        welcomeBonus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Activation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
