import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Settles Amplify campaigns whose end date has passed.
 * Enforces the auto-refund threshold (under 50% predicted reach = proportional BAK refund).
 *
 * Can be invoked:
 *  - By cron with no body (settles all due campaigns)
 *  - By an artist for a specific campaign they own (body: { campaign_id })
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let targets: string[] = [];
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.campaign_id) {
        // Verify ownership when called by user
        const auth = req.headers.get("Authorization");
        if (auth) {
          const userClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: auth } } }
          );
          const { data: { user } } = await userClient.auth.getUser();
          if (!user) return json({ error: "Unauthorized" }, 401);
          const { data: c } = await admin
            .from("amplify_campaigns")
            .select("id")
            .eq("id", body.campaign_id)
            .eq("artist_id", user.id)
            .maybeSingle();
          if (!c) return json({ error: "Not found" }, 404);
        }
        targets = [body.campaign_id];
      }
    }

    if (targets.length === 0) {
      const { data: due } = await admin
        .from("amplify_campaigns")
        .select("id")
        .in("status", ["active", "completed"])
        .lte("ends_at", new Date().toISOString())
        .limit(100);
      targets = (due ?? []).map((r) => r.id);
    }

    const results: Array<{ id: string; result: unknown }> = [];
    for (const id of targets) {
      const { data, error } = await admin.rpc("settle_amplify_campaign", { p_campaign_id: id });
      results.push({ id, result: error ? { error: error.message } : data });
    }

    return json({ success: true, settled: results.length, results });
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
