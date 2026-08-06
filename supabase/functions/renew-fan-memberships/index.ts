import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // 1. Find memberships expiring in the next 3 days for notification
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: expiringSoon } = await supabase
      .from('fan_club_memberships')
      .select('id, fan_id, artist_id, tier_id, expires_at, auto_renew, fan_club_tiers(tier_name, price_bak)')
      .eq('status', 'active')
      .lte('expires_at', threeDaysFromNow)
      .gt('expires_at', now);

    // Send expiry warnings
    for (const membership of expiringSoon || []) {
      const tier = (membership as any).fan_club_tiers;
      const daysLeft = Math.ceil((new Date(membership.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      await supabase.from('notifications').insert({
        user_id: membership.fan_id,
        type: 'membership_expiring',
        title: '⏰ Fan Club Membership Expiring',
        message: `Your fan club membership expires in ${daysLeft} day(s). ${membership.auto_renew ? 'Auto-renewal is enabled.' : 'Enable auto-renewal to keep access.'}`,
        link: `/artist/${membership.artist_id}`,
        category: 'subscription',
        priority: 'high',
      }).catch(() => {});
    }

    // 2. Process expired memberships with auto_renew enabled
    const { data: expiredAutoRenew } = await supabase
      .from('fan_club_memberships')
      .select('id, fan_id, artist_id, tier_id, fan_club_tiers(tier_name, price_bak, tier_level)')
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('expires_at', now);

    let renewed = 0;
    let failed = 0;

    for (const membership of expiredAutoRenew || []) {
      const tier = (membership as any).fan_club_tiers;
      const price = tier?.price_bak || 0;

      const { data: renewalResult, error: renewalError } = await supabase.rpc(
        'renew_fan_club_membership',
        { p_membership_id: membership.id },
      );
      const renewal = renewalResult as { success?: boolean; error?: string; expires_at?: string } | null;

      if (renewalError || !renewal?.success) {
        await supabase.from('notifications').insert({
          user_id: membership.fan_id,
          type: 'membership_expired',
          title: '❌ Fan Club Membership Expired',
          message: renewal?.error === 'Insufficient balance'
            ? `Your fan club membership could not be renewed due to insufficient BAKCoins (needed ${price} BAK).`
            : 'Your fan club membership could not be renewed. You can rejoin from the artist profile.',
          link: '/wallet/buy-coins',
          category: 'subscription',
          priority: 'high',
        }).catch(() => {});
        
        failed++;
        continue;
      }
      const newExpiry = renewal.expires_at || membership.expires_at;

      // Notify fan
      await supabase.from('notifications').insert({
        user_id: membership.fan_id,
        type: 'membership_renewed',
        title: '✅ Fan Club Renewed',
        message: `Your fan club membership was renewed for ${price} BAK. Next renewal: ${new Date(newExpiry).toLocaleDateString()}.`,
        link: `/artist/${membership.artist_id}`,
        category: 'subscription',
      }).catch(() => {});

      renewed++;
    }

    // 3. Expire non-auto-renew memberships
    const { data: expiredNoRenew } = await supabase
      .from('fan_club_memberships')
      .select('id, fan_id, artist_id')
      .eq('status', 'active')
      .eq('auto_renew', false)
      .lte('expires_at', now);

    for (const membership of expiredNoRenew || []) {
      await supabase
        .from('fan_club_memberships')
        .update({ status: 'expired' })
        .eq('id', membership.id);

      await supabase.from('notifications').insert({
        user_id: membership.fan_id,
        type: 'membership_expired',
        title: '⏰ Fan Club Membership Expired',
        message: 'Your fan club membership has expired. Rejoin to access exclusive content!',
        link: `/artist/${membership.artist_id}`,
        category: 'subscription',
      }).catch(() => {});
    }

    const expired = expiredNoRenew?.length || 0;

    return new Response(
      JSON.stringify({ 
        success: true, 
        renewed, 
        failed, 
        expired,
        warnings_sent: expiringSoon?.length || 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Renewal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
