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
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Please log in to resend activation code' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.log('User authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Please log in to resend activation code' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resending activation code for user:', user.id);

    // Use admin client to fetch profile
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile with activation code
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('username, email, activation_code, is_activated')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Could not find your profile. Please try signing up again.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already activated
    if (profile.is_activated) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Your account is already activated! You can proceed to the dashboard.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new activation code if needed or use existing
    let activationCode = profile.activation_code;
    if (!activationCode) {
      activationCode = String(Math.floor(100000 + Math.random() * 900000));
      
      console.log('Generated new activation code for user:', user.id);
      
      // Update profile with new code
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          activation_code: activationCode,
          activation_code_sent_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update activation code:', updateError);
      }
    } else {
      // Update sent timestamp
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ activation_code_sent_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update timestamp:', updateError);
      }
    }

    console.log('Sending activation email to:', profile.email);

    // Send activation email - using fetch directly to avoid edge function invocation issues
    try {
      const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-email`;
      
      const emailResponse = await fetch(emailFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: profile.email,
          subject: 'Your BAK55 Activation Code',
          template: 'activation',
          data: {
            username: profile.username || profile.email.split('@')[0],
            activation_code: activationCode,
          },
        }),
      });

      const emailResult = await emailResponse.json();
      console.log('Email function response:', emailResult);

      if (emailResult.success) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Activation code sent! Please check your email.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Email failed but we have the code - return success with code displayed
        console.error('Email send failed:', emailResult.error);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'We had trouble sending the email. Your activation code is: ' + activationCode,
            code: activationCode // Include code as fallback
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (emailError: any) {
      console.error('Email function error:', emailError);
      // Return success with code as fallback
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email service temporarily unavailable. Your activation code is: ' + activationCode,
          code: activationCode
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Resend activation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Something went wrong. Please try again.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});