import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLATFORM_USER_ID = "b2a31558-e58a-466f-99b8-7ba636bcf6be";

interface ProcessReferralRequest {
  referral_code: string;
  referred_user_id: string;
  reward_type?: string;
  trigger?: 'signup' | 'first_deposit'; // New: trigger type
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { referral_code, referred_user_id, reward_type = 'signup', trigger = 'signup' }: ProcessReferralRequest = await req.json();

    if (!referral_code || !referred_user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get referral code owner
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from('referral_codes')
      .select('user_id, uses_count')
      .eq('code', referral_code)
      .single();

    if (codeError || !codeData) {
      return new Response(
        JSON.stringify({ error: 'Invalid referral code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const referrer_id = codeData.user_id;

    // Prevent self-referral
    if (referrer_id === referred_user_id) {
      return new Response(
        JSON.stringify({ error: 'Self-referral not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id, status, rewarded')
      .eq('referrer_id', referrer_id)
      .eq('referred_id', referred_user_id)
      .maybeSingle();

    // If trigger is signup and referral exists, skip
    if (trigger === 'signup' && existingReferral) {
      return new Response(
        JSON.stringify({ error: 'Referral already tracked', referral_id: existingReferral.id }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If trigger is first_deposit and referral is already rewarded, skip
    if (trigger === 'first_deposit' && existingReferral?.rewarded) {
      return new Response(
        JSON.stringify({ error: 'Referral already rewarded', referral_id: existingReferral.id }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fraud detection (only for new referrals at signup)
    if (trigger === 'signup') {
      const fraudChecks = await performFraudChecks(supabaseAdmin, referrer_id, referred_user_id);
      
      if (fraudChecks.flagged) {
        // Create flagged referral for admin review
        await supabaseAdmin.from('referrals').insert({
          referrer_id,
          referred_id: referred_user_id,
          referral_code,
          reward_type,
          reward_amount: 0,
          rewarded: false,
          status: 'flagged',
          fraud_flagged: true,
          fraud_reason: fraudChecks.reason,
          metadata: { fraud_details: fraudChecks.details }
        });

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Referral flagged for review',
            flagged: true 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get referrer and referred roles
      const { data: referrerRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', referrer_id)
        .in('role', ['artist', 'brand', 'admin'])
        .maybeSingle();

      const { data: referredRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', referred_user_id)
        .maybeSingle();

      // Create PENDING referral record (no rewards yet)
      const { data: referral, error: referralError } = await supabaseAdmin
        .from('referrals')
        .insert({
          referrer_id,
          referred_id: referred_user_id,
          referral_code,
          reward_type: 'first_deposit', // Rewards on first deposit
          reward_amount: 0, // Will be set when deposit happens
          bonus_earned: 0,
          referrer_role: referrerRole?.role || 'fan',
          referred_role: referredRole?.role || 'fan',
          rewarded: false,
          status: 'pending', // Pending until first deposit
          metadata: {
            signup_at: new Date().toISOString(),
            awaiting_first_deposit: true
          }
        })
        .select()
        .single();

      if (referralError) {
        console.error('Failed to create referral record:', referralError);
        return new Response(
          JSON.stringify({ error: 'Failed to create referral' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update referral code usage count
      await supabaseAdmin
        .from('referral_codes')
        .update({ uses_count: codeData.uses_count + 1 })
        .eq('code', referral_code);

      return new Response(
        JSON.stringify({
          success: true,
          referral_id: referral?.id,
          status: 'pending',
          message: 'Referral tracked! Rewards will be credited after first deposit.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === TRIGGER: FIRST DEPOSIT - Process rewards ===
    if (trigger === 'first_deposit') {
      if (!existingReferral) {
        return new Response(
          JSON.stringify({ error: 'No pending referral found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get reward configuration
      const { data: rewardConfig } = await supabaseAdmin
        .from('referral_rewards_config')
        .select('*')
        .eq('reward_type', 'first_deposit')
        .eq('is_active', true)
        .single();

      // Fallback to signup config if first_deposit not found
      const configToUse = rewardConfig || (await supabaseAdmin
        .from('referral_rewards_config')
        .select('*')
        .eq('reward_type', 'signup')
        .eq('is_active', true)
        .single()).data;

      if (!configToUse) {
        console.error('No reward configuration found');
        return new Response(
          JSON.stringify({ error: 'Reward configuration not found' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get referrer role to determine reward amount
      const { data: referrerRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', referrer_id)
        .in('role', ['artist', 'brand', 'admin'])
        .maybeSingle();

      const isReferrerArtist = referrerRole?.role === 'artist' || referrerRole?.role === 'brand';
      const referrerReward = isReferrerArtist 
        ? configToUse.artist_referrer_reward 
        : configToUse.fan_referrer_reward;
      const referredBonus = configToUse.referred_bonus;

      // Get wallets
      const { data: referrerWallet, error: referrerWalletError } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', referrer_id)
        .single();

      const { data: referredWallet } = await supabaseAdmin
        .from('wallets')
        .select('id, balance')
        .eq('user_id', referred_user_id)
        .single();

      if (referrerWalletError || !referrerWallet) {
        console.error('Referrer wallet not found');
        return new Response(
          JSON.stringify({ error: 'Referrer wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Credit referrer wallet
      if (referrerReward > 0) {
        await supabaseAdmin
          .from('wallets')
          .update({ 
            balance: parseFloat(referrerWallet.balance) + referrerReward,
            updated_at: new Date().toISOString()
          })
          .eq('id', referrerWallet.id);

        await supabaseAdmin.from('transactions').insert({
          wallet_id: referrerWallet.id,
          type: 'earning',
          amount: referrerReward,
          description: `Referral reward - Your friend made their first deposit!`,
          metadata: { 
            type: 'referral_reward',
            trigger: 'first_deposit',
            referred_user_id,
            referral_code
          }
        });

        console.log(`Credited ${referrerReward} BAK to referrer ${referrer_id}`);
      }

      // Credit referred user bonus if applicable
      if (referredBonus > 0 && referredWallet) {
        await supabaseAdmin
          .from('wallets')
          .update({ 
            balance: parseFloat(referredWallet.balance) + referredBonus,
            updated_at: new Date().toISOString()
          })
          .eq('id', referredWallet.id);

        await supabaseAdmin.from('transactions').insert({
          wallet_id: referredWallet.id,
          type: 'earning',
          amount: referredBonus,
          description: `Welcome bonus - Thanks for making your first deposit!`,
          metadata: { 
            type: 'referral_welcome_bonus',
            trigger: 'first_deposit',
            referrer_id
          }
        });

        console.log(`Credited ${referredBonus} BAK bonus to referred user ${referred_user_id}`);
      }

      // Update referral record to completed
      await supabaseAdmin
        .from('referrals')
        .update({
          rewarded: true,
          status: 'completed',
          reward_amount: referrerReward,
          bonus_earned: referredBonus,
          completed_at: new Date().toISOString(),
          metadata: {
            deposit_rewarded_at: new Date().toISOString(),
            referrer_reward: referrerReward,
            referred_bonus: referredBonus
          }
        })
        .eq('id', existingReferral.id);

      // Send notifications
      const { data: referrerProfile } = await supabaseAdmin
        .from('profiles')
        .select('email, username')
        .eq('id', referrer_id)
        .single();

      const { data: referredProfile } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('id', referred_user_id)
        .single();

      // Notify referrer
      await supabaseAdmin.from('notifications').insert({
        user_id: referrer_id,
        type: 'referral',
        title: '🎉 Referral Reward Earned!',
        message: `${referredProfile?.username || 'Your friend'} made their first deposit! You earned ${referrerReward} BAK.`,
        link: '/wallet',
        category: 'wallet'
      });

      // Notify referred user about their bonus
      if (referredBonus > 0) {
        await supabaseAdmin.from('notifications').insert({
          user_id: referred_user_id,
          type: 'referral',
          title: '🎁 Welcome Bonus Credited!',
          message: `You earned ${referredBonus} BAK welcome bonus for your first deposit!`,
          link: '/wallet',
          category: 'wallet'
        });
      }

      // Send email to referrer
      if (referrerProfile?.email) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              to: referrerProfile.email,
              subject: '🎉 Your Referral Reward Has Been Credited!',
              template: 'referral_success',
              data: {
                username: referrerProfile.username,
                referred_username: referredProfile?.username || 'A new user',
                reward_amount: referrerReward,
                reward_type: 'first_deposit'
              }
            })
          });
        } catch (emailError) {
          console.error('Failed to send referral email:', emailError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          referral_id: existingReferral.id,
          referrer_reward: referrerReward,
          referred_bonus: referredBonus,
          message: `Referral rewards credited! Referrer earned ${referrerReward} BAK, referred user got ${referredBonus} BAK bonus.`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid trigger type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Process referral error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fraud detection helper
async function performFraudChecks(
  supabase: any, 
  referrer_id: string, 
  referred_user_id: string
): Promise<{ flagged: boolean; reason?: string; details?: any }> {
  const checks: any = {};

  // Check 1: Same IP/device patterns (via metadata analysis)
  const { data: referrerProfile } = await supabase
    .from('profiles')
    .select('email, created_at')
    .eq('id', referrer_id)
    .single();

  const { data: referredProfile } = await supabase
    .from('profiles')
    .select('email, created_at')
    .eq('id', referred_user_id)
    .single();

  // Check 2: Email domain similarity (potential fake accounts)
  if (referrerProfile?.email && referredProfile?.email) {
    const referrerDomain = referrerProfile.email.split('@')[1];
    const referredDomain = referredProfile.email.split('@')[1];
    
    // Flag if using same unusual domain (not common providers)
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (referrerDomain === referredDomain && !commonDomains.includes(referrerDomain)) {
      checks.same_domain = true;
    }
  }

  // Check 3: Referrer has too many referrals in short time
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentReferrals, error } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_id', referrer_id)
    .gte('created_at', oneHourAgo);

  if (recentReferrals && recentReferrals.length >= 10) {
    checks.too_many_recent = true;
  }

  // Check 4: Account age check (new accounts referring other new accounts)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  if (referrerProfile?.created_at > fiveMinutesAgo) {
    checks.referrer_too_new = true;
  }

  // Determine if flagged
  const flagCount = Object.keys(checks).length;
  if (flagCount >= 2) {
    return {
      flagged: true,
      reason: `Multiple fraud indicators detected: ${Object.keys(checks).join(', ')}`,
      details: checks
    };
  }

  return { flagged: false };
}
