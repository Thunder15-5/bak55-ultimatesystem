import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

interface CheckoutBody {
  tier_id: string;
  tier_name: string;
  bak_price: number;
  duration_days: number;
  audience_level: number;
  placements: string[];
  predicted_impressions_low: number;
  predicted_impressions_high: number;
  predicted_new_fans_low: number;
  predicted_new_fans_high: number;
  predicted_cost_per_fan: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as CheckoutBody;
    const required = [
      "tier_id","tier_name","bak_price","duration_days","audience_level",
      "predicted_impressions_low","predicted_impressions_high",
      "predicted_new_fans_low","predicted_new_fans_high","predicted_cost_per_fan",
    ] as const;
    for (const k of required) {
      if (body[k] === undefined || body[k] === null) {
        return json({ error: `Missing field: ${k}` }, 400);
      }
    }
    if (body.bak_price <= 0 || body.bak_price > 100000) {
      return json({ error: "Invalid price" }, 400);
    }
    if (body.audience_level < 0 || body.audience_level > 100) {
      return json({ error: "Invalid audience level" }, 400);
    }

    // Deduct wallet
    const { data: deduct, error: dErr } = await supabase.rpc("deduct_wallet", {
      p_user_id: user.id,
      p_amount: body.bak_price,
      p_description: `Amplify Boost: ${body.tier_name}`,
    });
    if (dErr) return json({ error: dErr.message }, 400);
    if (!deduct?.success) return json({ error: deduct?.error || "Payment failed" }, 400);

    const endsAt = new Date(Date.now() + body.duration_days * 86400_000).toISOString();

    const { data: camp, error: cErr } = await supabase
      .from("amplify_campaigns")
      .insert({
        artist_id: user.id,
        tier_id: body.tier_id,
        tier_name: body.tier_name,
        bak_price: body.bak_price,
        duration_days: body.duration_days,
        audience_level: body.audience_level,
        placements: body.placements ?? [],
        predicted_impressions_low: body.predicted_impressions_low,
        predicted_impressions_high: body.predicted_impressions_high,
        predicted_new_fans_low: body.predicted_new_fans_low,
        predicted_new_fans_high: body.predicted_new_fans_high,
        predicted_cost_per_fan: body.predicted_cost_per_fan,
        ends_at: endsAt,
        transaction_id: deduct.transaction_id,
      })
      .select()
      .single();

    if (cErr) {
      // Best-effort refund on failure
      await supabase.rpc("credit_wallet", { p_user_id: user.id, p_amount: body.bak_price }).catch(() => {});
      return json({ error: cErr.message }, 500);
    }

    return json({ success: true, campaign: camp, new_balance: deduct.new_balance });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
