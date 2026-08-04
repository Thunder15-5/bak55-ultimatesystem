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

const BAK_PER_KES = 1 / 21; // ~21 KES per BAK
const MIN_KES = 28;
const MAX_KES = 1_000_000;
const MAX_PENDING_PER_USER = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const requestId = crypto.randomUUID();
  const log = (msg: string, extra: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ fn: "deposit-request", requestId, msg, ...extra }));

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

    const { data: profile } = await admin
      .from("profiles").select("banned, username").eq("id", user.id).maybeSingle();
    if (profile?.banned) return json({ code: "forbidden", error: "Your account is suspended" }, 403);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ code: "invalid_amount", error: "Invalid request body" }, 400);
    }

    const amountKes = Number(body.amount_kes);
    const receiptCode = String(body.receipt_code ?? "").trim().toUpperCase();
    const screenshotUrl = body.screenshot_url ? String(body.screenshot_url) : null;

    if (!Number.isFinite(amountKes) || amountKes <= 0) {
      return json({ code: "invalid_amount", error: "Enter a valid deposit amount" }, 400);
    }
    if (amountKes < MIN_KES) {
      return json({ code: "invalid_amount", error: `Minimum deposit is ${MIN_KES} KSh (~1 BAK)` }, 400);
    }
    if (amountKes > MAX_KES) {
      return json({ code: "invalid_amount", error: "Amount exceeds the maximum deposit" }, 400);
    }
    if (!/^[A-Z0-9]{8,15}$/.test(receiptCode)) {
      return json({ code: "invalid_receipt", error: "Enter the M-Pesa confirmation code (e.g. SGH4X2P9QT)" }, 400);
    }
    if (screenshotUrl && !/^https?:\/\//.test(screenshotUrl)) {
      return json({ code: "invalid_receipt", error: "Invalid screenshot URL" }, 400);
    }

    // Rate limit: cap concurrent unreviewed requests per user
    const { count: pendingCount } = await admin
      .from("deposit_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");

    if ((pendingCount ?? 0) >= MAX_PENDING_PER_USER) {
      return json(
        { code: "rate_limited", error: "You already have deposit requests awaiting review." },
        429,
      );
    }

    const expectedBak = Math.round(amountKes * BAK_PER_KES * 100) / 100;

    const { data: depositRequest, error: insertError } = await admin
      .from("deposit_requests")
      .insert({
        user_id: user.id,
        amount_kes: amountKes,
        expected_bak: expectedBak,
        receipt_code: receiptCode,
        screenshot_url: screenshotUrl,
        status: "pending",
        metadata: { submitted_via: "buy_coins_page" },
      })
      .select()
      .single();

    if (insertError) {
      // Unique index on active receipt codes prevents reuse
      if (insertError.code === "23505") {
        log("duplicate_receipt", { userId: user.id });
        return json({ code: "duplicate_receipt", error: "That M-Pesa receipt code has already been submitted." }, 409);
      }
      log("insert_failed", { error: insertError.message });
      return json({ code: "config_error", error: "Failed to submit deposit request" }, 500);
    }

    log("deposit_created", { id: depositRequest.id, userId: user.id, amountKes, expectedBak });

    // Notify admins (non-critical)
    try {
      const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
      if (admins?.length) {
        await admin.from("notifications").insert(
          admins.map((a: { user_id: string }) => ({
            user_id: a.user_id,
            type: "deposit_request",
            title: "New Deposit Awaiting Review",
            message: `${profile?.username ?? "A user"} submitted ${amountKes} KSh (${expectedBak} BAK) · ${receiptCode}`,
            link: "/admin/deposits",
            priority: "high",
            category: "payment",
          })),
        );
      }
    } catch (e) {
      log("admin_notify_failed", { error: String(e) });
    }

    return json({
      success: true,
      deposit_request: depositRequest,
      expected_bak: expectedBak,
      message: "Deposit submitted. You'll be notified once it's reviewed.",
    });
  } catch (error) {
    console.error(JSON.stringify({ fn: "deposit-request", requestId, msg: "unhandled", error: String(error) }));
    return json({ code: "config_error", error: "Failed to submit deposit request" }, 500);
  }
});
