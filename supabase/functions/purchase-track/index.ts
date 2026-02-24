import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { track_id } = await req.json();

    if (!track_id) {
      return new Response(JSON.stringify({ error: 'track_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch track — read price_in_bak (new) or fall back to price_kes (legacy)
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, artist_id, is_paid_download, price_in_bak, price_kes, audio_url')
      .eq('id', track_id)
      .single();

    if (trackError || !track) {
      return new Response(JSON.stringify({ error: 'Track not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve BAK amount: prefer price_in_bak, else convert legacy price_kes using config
    let bakAmount: number = track.price_in_bak ?? null;

    if (!track.is_paid_download || (!bakAmount && !track.price_kes)) {
      return new Response(JSON.stringify({ error: 'Track is not available for paid download' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no price_in_bak, use bak_to_kes_rate config to convert legacy KES price
    if (!bakAmount && track.price_kes) {
      const { data: rateConfig } = await supabase
        .from('sales_config')
        .select('config_value')
        .eq('config_key', 'bak_to_kes_rate')
        .maybeSingle();
      const rate = Number(rateConfig?.config_value) || 1;
      bakAmount = track.price_kes / rate;
    }

    // Prevent self-purchase
    if (track.artist_id === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot purchase your own track' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check already purchased
    const { data: existingPurchase } = await supabase
      .from('song_purchases')
      .select('id')
      .eq('track_id', track_id)
      .eq('buyer_id', user.id)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPurchase) {
      return new Response(JSON.stringify({ error: 'Already purchased', purchase_id: existingPurchase.id }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Block if track is in active competition
    const { data: activeSubmission } = await supabase
      .from('submissions')
      .select('id, competition_id')
      .eq('track_id', track_id)
      .eq('status', 'approved')
      .maybeSingle();

    if (activeSubmission) {
      const { data: comp } = await supabase
        .from('competitions')
        .select('id, status')
        .eq('id', activeSubmission.competition_id)
        .eq('status', 'active')
        .maybeSingle();

      if (comp) {
        return new Response(JSON.stringify({ error: 'Track is in an active competition. Paid downloads are disabled.' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. Deduct BAK from buyer wallet (optimistic locking)
    const { data: buyerWallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!buyerWallet || buyerWallet.balance < bakAmount) {
      return new Response(JSON.stringify({
        error: 'Insufficient BAK Coin balance',
        required: bakAmount,
        current: buyerWallet?.balance || 0,
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: deductError } = await supabase
      .from('wallets')
      .update({ balance: buyerWallet.balance - bakAmount, updated_at: new Date().toISOString() })
      .eq('id', buyerWallet.id)
      .eq('balance', buyerWallet.balance);

    if (deductError) {
      return new Response(JSON.stringify({ error: 'Payment failed - please try again' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Credit 100% to artist wallet
    const { data: artistWallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', track.artist_id)
      .maybeSingle();

    if (artistWallet) {
      await supabase
        .from('wallets')
        .update({ balance: artistWallet.balance + bakAmount, updated_at: new Date().toISOString() })
        .eq('id', artistWallet.id);
    }

    // 6. Record transactions
    await supabase.from('transactions').insert({
      wallet_id: buyerWallet.id,
      type: 'spending',
      amount: -bakAmount,
      description: `Purchased "${track.title}"`,
      reference_id: track_id,
      metadata: { type: 'song_purchase', price_bak: bakAmount },
    });

    if (artistWallet) {
      await supabase.from('transactions').insert({
        wallet_id: artistWallet.id,
        type: 'earning',
        amount: bakAmount,
        description: `Song sale: "${track.title}"`,
        reference_id: track_id,
        metadata: { type: 'song_sale', price_bak: bakAmount, buyer_id: user.id },
      });
    }

    // 7. Create purchase record (amount_bak column)
    const { data: purchase, error: purchaseError } = await supabase
      .from('song_purchases')
      .insert({
        track_id,
        buyer_id: user.id,
        artist_id: track.artist_id,
        amount_kes: bakAmount,
        payment_method: 'bak_coins',
        status: 'completed',
      })
      .select()
      .maybeSingle();

    if (purchaseError) {
      console.error('Purchase record error:', purchaseError);
    }

    // 8. Notify artist
    await supabase.from('notifications').insert({
      user_id: track.artist_id,
      type: 'song_sale',
      title: '💰 Song Sold!',
      message: `Someone purchased "${track.title}" for ${bakAmount} BAK`,
      link: '/wallet',
      priority: 'high',
      category: 'payment',
    });

    return new Response(JSON.stringify({
      success: true,
      purchase_id: purchase?.id,
      amount_bak: bakAmount,
      message: `Successfully purchased "${track.title}"`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in purchase-track:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
