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

    const body = await req.json();
    const { case_id, action_type, subject_type, subject_id, reason_code, notes, requires_second_admin, approve_action_id } = body;

    // Approval flow: second admin confirms a pending action
    if (approve_action_id) {
      const { data: pending } = await supabase.from("enforcement_actions").select("*").eq("id", approve_action_id).single();
      if (!pending) return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: corsHeaders });
      if (pending.proposed_by === user.id) return new Response(JSON.stringify({ error: "Cannot approve own action" }), { status: 400, headers: corsHeaders });

      await executeAction(supabase, pending, user.id);
      await supabase.from("enforcement_actions").update({
        approved_by: user.id, status: "executed", executed_at: new Date().toISOString(),
        reversible_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      }).eq("id", approve_action_id);
      return new Response(JSON.stringify({ ok: true, executed: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!action_type || !subject_id || !reason_code) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }

    // Capture before-state
    let before_state: any = {};
    if (subject_type === "artist") {
      const { data } = await supabase.from("profiles").select("banned, suspended_at").eq("id", subject_id).maybeSingle();
      before_state = data || {};
    }

    // Insert proposed action
    const { data: actionRow, error: insErr } = await supabase.from("enforcement_actions").insert({
      case_id: case_id || null,
      action_type,
      subject_type,
      subject_id,
      reason_code,
      notes,
      before_state,
      proposed_by: user.id,
      requires_second_admin: !!requires_second_admin,
      status: requires_second_admin ? "pending" : "approved",
    }).select().single();
    if (insErr) throw insErr;

    if (!requires_second_admin) {
      await executeAction(supabase, actionRow, user.id);
      await supabase.from("enforcement_actions").update({
        status: "executed", executed_at: new Date().toISOString(),
        reversible_until: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      }).eq("id", actionRow.id);
    }

    await supabase.from("admin_activity_log").insert({
      user_id: user.id,
      event_type: `enforcement_${action_type}`,
      event_category: "moderation",
      description: `${requires_second_admin ? "Proposed" : "Executed"} ${action_type} (${reason_code})`,
      metadata: { action_id: actionRow.id, subject_type, subject_id, reason_code },
    });

    if (case_id) {
      await supabase.from("fraud_cases").update({
        status: requires_second_admin ? "awaiting_approval" : "resolved",
        resolved_at: requires_second_admin ? null : new Date().toISOString(),
        resolution: action_type,
        resolution_notes: notes,
      }).eq("id", case_id);
    }

    return new Response(JSON.stringify({ ok: true, action: actionRow }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});

async function executeAction(supabase: any, action: any, adminId: string) {
  const { action_type, subject_type, subject_id, reason_code } = action;

  if (action_type === "warn") {
    await supabase.from("notifications").insert({
      user_id: subject_id, type: "warning", title: "⚠️ Platform Warning",
      message: `Your account has been issued a warning. Reason: ${reason_code}. You may appeal this decision.`,
      link: "/support", priority: "high", category: "moderation",
    });
  } else if (action_type === "suspend" || action_type === "ban") {
    await supabase.from("profiles").update({
      banned: true, suspended_at: new Date().toISOString(),
      suspension_reason: reason_code, suspended_by: adminId,
    }).eq("id", subject_id);
    await supabase.from("notifications").insert({
      user_id: subject_id, type: action_type, title: action_type === "ban" ? "🚫 Account Banned" : "⛔ Account Suspended",
      message: `Reason: ${reason_code}. You may appeal this decision within 7 days.`,
      link: "/support", priority: "high", category: "moderation",
    });
  } else if (action_type === "invalidate_votes") {
    if (subject_type === "voter") {
      await supabase.rpc("admin_invalidate_votes", { p_voter_id: subject_id, p_reason: reason_code });
    } else if (subject_type === "submission") {
      await supabase.from("votes").delete().eq("submission_id", subject_id);
      await supabase.from("submissions").update({ vote_count: 0 }).eq("id", subject_id);
    }
  } else if (action_type === "disqualify") {
    if (subject_type === "submission") {
      await supabase.from("submissions").update({ status: "disqualified", voting_enabled: false }).eq("id", subject_id);
    }
  } else if (action_type === "restrict") {
    await supabase.from("notifications").insert({
      user_id: subject_id, type: "restriction", title: "🔒 Account Restricted",
      message: `Some features have been temporarily limited. Reason: ${reason_code}.`,
      link: "/support", priority: "high", category: "moderation",
    });
  }
}
