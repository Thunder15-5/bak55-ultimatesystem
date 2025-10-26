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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { stageName } = await req.json();

    if (!stageName) {
      return new Response(
        JSON.stringify({ error: 'Stage name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already an artist
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'artist')
      .single();

    if (existingRole) {
      return new Response(
        JSON.stringify({ error: 'User is already an artist' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple rate limiting (1 upgrade per user per 24 hours)
    const { data: recentUpgrade } = await supabase
      .from('role_upgrades')
      .select('upgraded_at')
      .eq('user_id', user.id)
      .gte('upgraded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (recentUpgrade) {
      return new Response(
        JSON.stringify({ error: 'You have already requested an upgrade recently. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current role for audit
    const { data: oldRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .neq('role', 'artist');

    // Add artist role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'artist' });

    if (roleError) {
      console.error('Role creation error:', roleError);
      throw roleError;
    }

    // Create artist profile
    const { error: profileError } = await supabase
      .from('artist_profiles')
      .insert({
        user_id: user.id,
        stage_name: stageName,
        genres: [],
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw profileError;
    }

    // Log upgrade in audit table
    if (oldRoles && oldRoles.length > 0) {
      await supabase
        .from('role_upgrades')
        .insert({
          user_id: user.id,
          from_role: oldRoles[0].role,
          to_role: 'artist',
          reason: 'User requested upgrade to artist',
        });
    }

    console.log(`User ${user.id} upgraded to artist with stage name: ${stageName}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Upgraded to artist successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upgrade error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
