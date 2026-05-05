import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: { user } } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const created: any[] = [];

    // Rule 1: Vote velocity > 50 votes/hr on a single submission
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const { data: recentVotes } = await supabase
      .from("votes")
      .select("submission_id")
      .gte("created_at", oneHourAgo);

    const counts: Record<string, number> = {};
    (recentVotes || []).forEach((v: any) => { counts[v.submission_id] = (counts[v.submission_id] || 0) + 1; });

    for (const [subId, count] of Object.entries(counts)) {
      if (count >= 50) {
        const { data: existing } = await supabase.from("fraud_alerts")
          .select("id").eq("rule_id", "vote_velocity_hourly").eq("subject_id", subId).eq("status", "open").maybeSingle();
        if (existing) continue;
        const { data: ins } = await supabase.from("fraud_alerts").insert({
          rule_id: "vote_velocity_hourly",
          rule_name: "Vote velocity spike",
          severity: count > 200 ? "critical" : count > 100 ? "high" : "medium",
          subject_type: "submission",
          subject_id: subId,
          evidence: { summary: `${count} votes in the last hour`, count, window: "1h" },
        }).select().single();
        if (ins) created.push(ins);
      }
    }

    // Rule 2: High self-vote ratio per artist (>=20% with >=20 votes)
    const { data: artists } = await supabase.from("artist_profiles").select("user_id").limit(500);
    for (const a of artists || []) {
      const { data: risk } = await supabase.rpc("compute_artist_risk_score", { p_artist_id: a.user_id });
      const r: any = risk;
      if (!r) continue;
      if (r.total_votes >= 20 && r.self_vote_ratio >= 20) {
        const { data: existing } = await supabase.from("fraud_alerts")
          .select("id").eq("rule_id", "self_vote_ratio").eq("subject_id", a.user_id).eq("status", "open").maybeSingle();
        if (existing) continue;
        const sev = r.score >= 70 ? "critical" : r.score >= 50 ? "high" : "medium";
        const { data: ins } = await supabase.from("fraud_alerts").insert({
          rule_id: "self_vote_ratio",
          rule_name: "High self-vote ratio",
          severity: sev,
          subject_type: "artist",
          subject_id: a.user_id,
          evidence: { summary: `${r.self_vote_ratio}% self-votes (risk ${r.score})`, ...r },
        }).select().single();
        if (ins) {
          // Auto-create case for high+ severity
          if (sev === "critical" || sev === "high") {
            const { data: caseRow } = await supabase.from("fraud_cases").insert({
              title: `High self-vote ratio (${r.self_vote_ratio}%)`,
              subject_type: "artist",
              subject_id: a.user_id,
              severity: sev,
              sla_due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              created_by: user.id,
            }).select().single();
            if (caseRow) {
              await supabase.from("fraud_alerts").update({ case_id: caseRow.id }).eq("id", ins.id);
            }
          }
          created.push(ins);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, created: created.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
