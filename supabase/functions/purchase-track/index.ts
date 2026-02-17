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

    // Get user from auth header
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

    const { track_id, payment_method = 'wallet' } = await req.json();

    if (!track_id) {
      return new Response(JSON.stringify({ error: 'track_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, artist_id, is_paid_download, price_kes, audio_url')
      .eq('id', track_id)
      .single();

    if (trackError || !track) {
      return new Response(JSON.stringify({ error: 'Track not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!track.is_paid_download || !track.price_kes) {
      return new Response(JSON.stringify({ error: 'Track is not available for paid download' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent self-purchase
    if (track.artist_id === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot purchase your own track' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check if already purchased
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

    // 3. Check if track is in active competition (disable paid sales)
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

    // 4. Process payment via wallet (BAK coins)
    // Convert KES to BAK: 1 BAK = 20 KES
    const bakAmount = track.price_kes / 20;

    // Get buyer wallet
    const { data: buyerWallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single();

    if (!buyerWallet || buyerWallet.balance < bakAmount) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient BAKCoin balance',
        required: bakAmount,
        current: buyerWallet?.balance || 0,
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct from buyer (optimistic locking)
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
      .single();

    if (artistWallet) {
      await supabase
        .from('wallets')
        .update({ balance: artistWallet.balance + bakAmount, updated_at: new Date().toISOString() })
        .eq('id', artistWallet.id);
    }

    // 6. Record transactions
    // Buyer spending
    await supabase.from('transactions').insert({
      wallet_id: buyerWallet.id,
      type: 'spending',
      amount: -bakAmount,
      description: `Purchased "${track.title}"`,
      reference_id: track_id,
      metadata: { type: 'song_purchase', price_kes: track.price_kes },
    });

    // Artist earning
    if (artistWallet) {
      await supabase.from('transactions').insert({
        wallet_id: artistWallet.id,
        type: 'earning',
        amount: bakAmount,
        description: `Song sale: "${track.title}"`,
        reference_id: track_id,
        metadata: { type: 'song_sale', price_kes: track.price_kes, buyer_id: user.id },
      });
    }

    // 7. Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('song_purchases')
      .insert({
        track_id,
        buyer_id: user.id,
        artist_id: track.artist_id,
        amount_kes: track.price_kes,
        payment_method,
        status: 'completed',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Purchase record error:', purchaseError);
    }

    // 8. Notify artist
    await supabase.from('notifications').insert({
      user_id: track.artist_id,
      type: 'song_sale',
      title: '💰 Song Sold!',
      message: `Someone purchased "${track.title}" for KES ${track.price_kes}`,
      link: '/wallet',
      priority: 'high',
      category: 'payment',
    });

    return new Response(JSON.stringify({
      success: true,
      purchase_id: purchase?.id,
      amount_bak: bakAmount,
      amount_kes: track.price_kes,
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
