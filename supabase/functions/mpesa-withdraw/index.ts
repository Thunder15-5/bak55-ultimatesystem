import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Admin-only payout finaliser.
 * Marks a queued withdrawal as paid (after the admin has actually sent the
 * M-Pesa transfer) or reverses it and refunds the artist. All balance and
 * ledger effects happen inside locked SECURITY DEFINER routines.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const requestId = crypto.randomUUID();
  const log = (msg: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ fn: "mpesa-withdraw", requestId, msg, ...extra }));

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return json({ code: "unauthorized", error: "Authentication required" }, 401);

    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json({ code: "unauthorized", error: "Authentication required" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ code: "forbidden", error: "Admin access required" }, 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ code: "invalid_request", error: "Invalid request body" }, 400);
    }

    const taskId = String(body.task_id ?? "");
    const action = String(body.action ?? "complete");
    const receipt = body.mpesa_receipt ? String(body.mpesa_receipt).trim().toUpperCase() : null;
    const reason = body.reason ? String(body.reason).slice(0, 300) : undefined;

    if (!/^[0-9a-f-]{36}$/i.test(taskId)) {
      return json({ code: "invalid_request", error: "Invalid task id" }, 400);
    }
    if (!["complete", "fail"].includes(action)) {
      return json({ code: "invalid_request", error: "Invalid action" }, 400);
    }
    if (action === "complete" && receipt && !/^[A-Z0-9]{8,15}$/.test(receipt)) {
      return json({ code: "invalid_receipt", error: "Invalid M-Pesa confirmation code" }, 400);
    }

    const { data: result, error: rpcError } =
      action === "complete"
        ? await admin.rpc("admin_complete_withdrawal", {
            p_task_id: taskId,
            p_admin_id: user.id,
            p_mpesa_receipt: receipt,
          })
        : await admin.rpc("admin_fail_withdrawal", {
            p_task_id: taskId,
            p_admin_id: user.id,
            p_reason: reason ?? "Payout could not be completed.",
          });

    if (rpcError) {
      log("rpc_failed", { action, error: rpcError.message });
      return json({ code: "config_error", error: "Could not process this payout" }, 500);
    }

    const payload = result as Record<string, unknown>;
    if (!payload?.success) {
      log("rejected", { action, code: payload?.code });
      return json({ code: payload?.code ?? "rejected", error: payload?.error }, 400);
    }

    log("payout_finalised", { action, taskId, adminId: user.id });

    return json({
      success: true,
      action,
      refunded: payload.refunded ?? null,
      message: action === "complete" ? "Payout marked as sent." : "Payout reversed and refunded.",
    });
  } catch (error) {
    console.error(JSON.stringify({ fn: "mpesa-withdraw", requestId, msg: "unhandled", error: String(error) }));
    return json({ code: "config_error", error: "Failed to process payout" }, 500);
  }
});
