import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
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

/** Normalize a Kenyan MSISDN to 254XXXXXXXXX; null when invalid. */
function normalizeKenyanPhone(input: string): string | null {
  const digits = (input ?? "").replace(/[\s\-()]/g, "");
  const m = /^(?:\+?254|0)?([17]\d{8})$/.exec(digits);
  return m ? `254${m[1]}` : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const requestId = crypto.randomUUID();
  const log = (msg: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ fn: "process-withdrawal", requestId, msg, ...extra }));

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ success: false, code: "unauthorized", error: "Authentication required" }, 401);

    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) {
      log("auth_failed", { error: userError?.message });
      return json({ success: false, code: "unauthorized", error: "Authentication required" }, 401);
    }

    // Role gate: artists (and admins) may withdraw
    const { data: roles, error: rolesError } = await admin
      .from("user_roles").select("role").eq("user_id", user.id);
    if (rolesError) {
      log("role_lookup_failed", { error: rolesError.message });
      return json({ success: false, code: "config_error", error: "Could not verify your account" }, 500);
    }
    const roleList = (roles ?? []).map((r: { role: string }) => r.role);
    if (!roleList.includes("artist") && !roleList.includes("admin")) {
      return json({ success: false, code: "forbidden", error: "Only artists can withdraw funds" }, 403);
    }

    // Suspended accounts cannot move money
    const { data: profile } = await admin
      .from("profiles").select("banned, username, email, display_name").eq("id", user.id).maybeSingle();
    if (profile?.banned) {
      return json({ success: false, code: "forbidden", error: "Your account is suspended" }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, code: "invalid_amount", error: "Invalid request body" }, 400);
    }

    const amount = Number(body.amount);
    const rawPhone = String(body.phone_number ?? "");
    const bankDetails = (body.bank_details ?? {}) as Record<string, unknown>;

    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ success: false, code: "invalid_amount", error: "Invalid withdrawal amount" }, 400);
    }
    const phone = normalizeKenyanPhone(rawPhone);
    if (!phone) {
      return json({ success: false, code: "invalid_phone", error: "Invalid Kenyan phone number" }, 400);
    }
    const accountName = String((bankDetails as { accountName?: string }).accountName ?? "").trim();
    if (accountName.length < 2 || accountName.length > 100) {
      return json({ success: false, code: "invalid_name", error: "Invalid account name" }, 400);
    }

    log("withdrawal_requested", { userId: user.id, amount });

    // All balance checks, limits, eligibility, deduction, fee split and
    // ledger writes happen atomically inside this locked routine.
    const { data: result, error: rpcError } = await admin.rpc("request_withdrawal", {
      p_user_id: user.id,
      p_amount: amount,
      p_phone: phone,
      p_bank_details: { accountName, accountNumber: phone, bankName: "M-Pesa" },
    });

    if (rpcError) {
      log("rpc_failed", { error: rpcError.message });
      return json({ success: false, code: "config_error", error: "Could not process withdrawal" }, 500);
    }

    const payload = result as Record<string, unknown>;
    if (!payload?.success) {
      log("withdrawal_rejected", { userId: user.id, code: payload?.code });
      return json({ success: false, code: payload?.code ?? "rejected", error: payload?.error, issues: payload?.issues }, 400);
    }

    const reference = String(payload.reference);
    const netAmount = Number(payload.net_amount);
    const fee = Number(payload.fee);

    log("withdrawal_recorded", { userId: user.id, reference, netAmount, fee });

    // Non-critical side effects: never fail the payout on these.
    const displayName = profile?.display_name || profile?.username || user.email?.split("@")[0] || "User";

    const sideEffects: Promise<unknown>[] = [
      admin.from("admin_tasks").insert({
        task_type: "process_withdrawal",
        related_id: payload.transaction_id as string,
        status: "pending",
        metadata: {
          user_id: user.id,
          username: profile?.username ?? null,
          email: profile?.email ?? user.email,
          amount: payload.gross_amount,
          net_amount: netAmount,
          withdrawal_fee: fee,
          phone_number: phone,
          account_details: { accountName, accountNumber: phone, bankName: "M-Pesa" },
          reference,
        },
      }),
      admin.from("admin_activity_log").insert({
        user_id: user.id,
        event_type: "withdrawal_request",
        event_category: "payment",
        description: `Withdrawal request: ${payload.gross_amount} BAK by ${displayName}`,
        metadata: { amount: payload.gross_amount, fee, net: netAmount, reference, phone_number: phone },
      }),
      admin.from("user_roles").select("user_id").eq("role", "admin").then(({ data: admins }) => {
        if (!admins?.length) return null;
        return admin.from("notifications").insert(
          admins.map((a: { user_id: string }) => ({
            user_id: a.user_id,
            type: "withdrawal_request",
            title: "New Withdrawal Request",
            message: `${displayName} requested ${Number(payload.gross_amount).toFixed(2)} BAK (net ${netAmount.toFixed(2)} BAK)`,
            link: "/admin",
            priority: "high",
            category: "payment",
          })),
        );
      }),
      admin.functions.invoke("send-email", {
        body: {
          to: user.email,
          subject: "Withdrawal Request Received",
          template: "withdrawal_request",
          data: { username: displayName, amount: payload.gross_amount, net_amount: netAmount, fee, phone_number: phone, reference },
        },
      }),
    ];

    const settled = await Promise.allSettled(sideEffects);
    settled.forEach((s, i) => {
      if (s.status === "rejected") log("side_effect_failed", { index: i, reason: String(s.reason) });
    });

    return json({
      success: true,
      status: "pending_manual",
      message: "Withdrawal request submitted. Payouts are processed within 24–72 hours.",
      transaction_id: payload.transaction_id,
      reference,
      gross_amount: payload.gross_amount,
      fee,
      net_amount: netAmount,
      new_balance: payload.new_balance,
    });
  } catch (error) {
    console.error(JSON.stringify({ fn: "process-withdrawal", requestId, msg: "unhandled", error: String(error) }));
    return json({ success: false, code: "config_error", error: "Failed to process withdrawal" }, 500);
  }
});
