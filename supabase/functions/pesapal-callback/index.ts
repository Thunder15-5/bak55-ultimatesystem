import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * This function is called by Pesapal once payment status changes.
 * It checks the transaction status via Pesapal API and updates Supabase.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { OrderTrackingId, OrderMerchantReference } = Object.fromEntries(
      new URL(req.url).searchParams
    );

    if (!OrderTrackingId) {
      throw new Error("Missing OrderTrackingId in query.");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- 1️⃣ Get Pesapal access token ---
    const tokenRes = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumer_key: Deno.env.get("PESAPAL_CONSUMER_KEY"),
        consumer_secret: Deno.env.get("PESAPAL_CONSUMER_SECRET"),
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error("Failed to get Pesapal token: " + errText);
    }

    const { token } = await tokenRes.json();

    // --- 2️⃣ Check transaction status from Pesapal ---
    const statusRes = await fetch(
      `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const statusData = await statusRes.json();
    console.log("Pesapal status data:", statusData);

    if (!statusRes.ok) {
      throw new Error(statusData.message || "Failed to get payment status.");
    }

    const paymentStatus = statusData.payment_status_description;
    const amount = statusData.amount;
    const trackingId = statusData.order_tracking_id;

    // --- 3️⃣ Update Supabase transaction record ---
    const { data: txRecord, error: fetchError } = await supabase
      .from("payment_transactions")
      .select("id, user_id, amount, status")
      .eq("pesapal_tracking_id", trackingId)
      .single();

    if (fetchError) {
      console.error("Fetch transaction error:", fetchError);
      throw new Error("Transaction not found in database.");
    }

    // --- 4️⃣ Update transaction status ---
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: paymentStatus?.toLowerCase() || "unknown",
        updated_at: new Date().toISOString(),
        metadata: statusData,
      })
      .eq("pesapal_tracking_id", trackingId);

    if (updateError) {
      console.error("Failed to update payment record:", updateError);
      throw updateError;
    }

    // --- 5️⃣ If payment successful, credit BAKCoins or wallet ---
    if (paymentStatus?.toLowerCase() === "completed") {
      const coinsToAdd = Math.floor(parseFloat(amount)); // 1 KES = 1 BAKCoin, adjust if needed

      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", txRecord.user_id)
        .single();

      if (walletError) {
        console.error("Wallet fetch error:", walletError);
        throw new Error("User wallet not found.");
      }

      const newBalance = (wallet?.balance || 0) + coinsToAdd;

      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", txRecord.user_id);

      if (walletUpdateError) {
        console.error("Wallet update error:", walletUpdateError);
        throw new Error("Failed to update wallet balance.");
      }

      console.log(`Credited ${coinsToAdd} BAKCoins to user ${txRecord.user_id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: paymentStatus,
        order_tracking_id: trackingId,
        message: "Payment processed successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Pesapal Callback Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
