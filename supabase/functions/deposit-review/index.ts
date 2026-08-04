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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const requestId = crypto.randomUUID();
  const log = (msg: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ fn: "deposit-review", requestId, msg, ...extra }));

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

    const requestIdParam = String(body.request_id ?? "");
    const action = String(body.action ?? "");
    const notes = body.notes ? String(body.notes).slice(0, 500) : null;

    if (!/^[0-9a-f-]{36}$/i.test(requestIdParam) || !["approve", "reject"].includes(action)) {
      return json({ code: "invalid_request", error: "Invalid parameters" }, 400);
    }

    // Wallet credit, ledger entry, status flip, notification and audit log
    // all happen atomically inside the locked routine — no double-credits.
    const rpcName = action === "approve" ? "approve_deposit_request" : "reject_deposit_request";
    const { data: result, error: rpcError } = await admin.rpc(rpcName, {
      p_request_id: requestIdParam,
      p_admin_id: user.id,
      p_notes: notes,
    });

    if (rpcError) {
      log("rpc_failed", { rpcName, error: rpcError.message });
      return json({ code: "config_error", error: "Could not process this deposit" }, 500);
    }

    const payload = result as Record<string, unknown>;
    if (!payload?.success) {
      log("review_rejected", { code: payload?.code });
      return json({ code: payload?.code ?? "rejected", error: payload?.error }, 400);
    }

    log("review_complete", { action, requestId: requestIdParam, adminId: user.id });

    // Email notification is best-effort
    try {
      const { data: depositRequest } = await admin
        .from("deposit_requests")
        .select("user_id, amount_kes, expected_bak, receipt_code")
        .eq("id", requestIdParam)
        .single();

      if (depositRequest) {
        const { data: profile } = await admin
          .from("profiles").select("email, username, display_name")
          .eq("id", depositRequest.user_id).maybeSingle();

        if (profile?.email) {
          await admin.functions.invoke("send-email", {
            body: {
              to: profile.email,
              subject: action === "approve" ? "Deposit Approved — BAKCoins Credited" : "Deposit Request Update",
              template: action === "approve" ? "deposit_approved" : "deposit_rejected",
              data: {
                username: profile.display_name || profile.username || "there",
                bak_amount: depositRequest.expected_bak,
                amount_kes: depositRequest.amount_kes,
                receipt_code: depositRequest.receipt_code,
                reason: notes || undefined,
              },
            },
          });
        }
      }
    } catch (e) {
      log("email_failed", { error: String(e) });
    }

    return json({
      success: true,
      action,
      credited_bak: payload.credited_bak ?? null,
      new_balance: payload.new_balance ?? null,
      message: `Deposit request ${action}d successfully`,
    });
  } catch (error) {
    console.error(JSON.stringify({ fn: "deposit-review", requestId, msg: "unhandled", error: String(error) }));
    return json({ code: "config_error", error: "Failed to review deposit" }, 500);
  }
});
