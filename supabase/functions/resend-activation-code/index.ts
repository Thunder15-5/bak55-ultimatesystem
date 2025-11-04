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
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token
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

    // Use admin client to fetch profile
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's profile with activation code
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('username, email, activation_code, is_activated')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already activated
    if (profile.is_activated) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account is already activated' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new activation code if needed
    let activationCode = profile.activation_code;
    if (!activationCode) {
      activationCode = String(Math.floor(100000 + Math.random() * 900000));
      
      // Update profile with new code
      await supabaseAdmin
        .from('profiles')
        .update({ 
          activation_code: activationCode,
          activation_code_sent_at: new Date().toISOString()
        })
        .eq('id', user.id);
    } else {
      // Update sent timestamp
      await supabaseAdmin
        .from('profiles')
        .update({ activation_code_sent_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    // Send activation email
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
      body: {
        to: profile.email,
        subject: 'Your BAK55 Activation Code',
        template: 'activation',
        data: {
          username: profile.username,
          activation_code: activationCode,
        },
      },
    });

    if (emailError) {
      console.error('Email sending error:', emailError);
      throw new Error('Failed to send activation email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Activation code sent successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Resend activation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
