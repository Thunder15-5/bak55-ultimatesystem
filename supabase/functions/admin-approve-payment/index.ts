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

/** Admin-only approval/rejection of manual coin purchases. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const requestId = crypto.randomUUID();
  const log = (msg: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ fn: "admin-approve-payment", requestId, msg, ...extra }));

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

    const transactionId = String(body.transaction_id ?? "");
    const action = String(body.action ?? "approve");

    if (!/^[0-9a-f-]{36}$/i.test(transactionId) || !["approve", "reject"].includes(action)) {
      return json({ code: "invalid_request", error: "Invalid parameters" }, 400);
    }

    if (action === "reject") {
      const { error } = await admin
        .from("payment_transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", transactionId)
        .eq("status", "pending");
      if (error) {
        log("reject_failed", { error: error.message });
        return json({ code: "config_error", error: "Could not reject payment" }, 500);
      }
      log("payment_rejected", { transactionId, adminId: user.id });
      return json({ success: true, action, message: "Payment rejected" });
    }

    const { data: result, error: rpcError } = await admin.rpc("admin_approve_payment", {
      p_transaction_id: transactionId,
      p_admin_id: user.id,
    });

    if (rpcError) {
      log("rpc_failed", { error: rpcError.message });
      return json({ code: "config_error", error: "Could not approve payment" }, 500);
    }

    const payload = result as Record<string, unknown>;
    if (!payload?.success) {
      return json({ code: payload?.code ?? "rejected", error: payload?.error }, 400);
    }

    log("payment_approved", { transactionId, adminId: user.id, credited: payload.credited_bak });

    return json({
      success: true,
      action,
      credited_bak: payload.credited_bak,
      new_balance: payload.new_balance,
      message: `Credited ${payload.credited_bak} BAK`,
    });
  } catch (error) {
    console.error(JSON.stringify({ fn: "admin-approve-payment", requestId, msg: "unhandled", error: String(error) }));
    return json({ code: "config_error", error: "Failed to process payment" }, 500);
  }
});
