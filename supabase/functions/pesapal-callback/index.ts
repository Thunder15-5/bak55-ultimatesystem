import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map Pesapal status strings to internal status
function normalizePaymentStatus(pesapalStatus: string | undefined): 'success' | 'failed' | 'pending' {
  if (!pesapalStatus) return 'pending';
  
  const status = pesapalStatus.toLowerCase();
  
  // Success states
  if (status.includes('completed') || status.includes('paid') || status === 'success') {
    return 'success';
  }
  
  // Failed states
  if (status.includes('failed') || status.includes('cancel') || status === 'cancelled') {
    return 'failed';
  }
  
  // Pending/processing states
  if (status.includes('pending') || status.includes('processing') || status.includes('incomplete')) {
    return 'pending';
  }
  
  // Default to pending for unknown states
  return 'pending';
}

/**
 * This function is called by Pesapal once payment status changes.
 * Accepts both query parameters (IPN) and JSON body (manual verification).
 * It checks the transaction status via Pesapal API and updates Supabase.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Accept both query parameters (IPN callback) and JSON body (manual verification)
    const queryParams = Object.fromEntries(new URL(req.url).searchParams);
    let bodyParams: any = {};
    
    if (req.method === 'POST') {
      try {
        bodyParams = await req.json();
      } catch {
        // Not JSON body, use query params only
      }
    }
    
    // Merge both sources, body takes precedence
    const params: any = { ...queryParams, ...bodyParams };
    const { OrderTrackingId, OrderMerchantReference } = params;

    console.log("=== Pesapal IPN Received ===");
    console.log("OrderTrackingId:", OrderTrackingId);
    console.log("OrderMerchantReference:", OrderMerchantReference);

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

    console.log("Payment status from Pesapal:", paymentStatus);
    console.log("Amount:", amount);
    console.log("Tracking ID:", trackingId);

    // --- 3️⃣ Update Supabase transaction record ---
    // Try to find by order_tracking_id in metadata first, then by payment_reference
    let txRecord: any = null;
    let fetchError: any = null;
    
    // First attempt: search by order_tracking_id in metadata
    const { data: metadataSearch, error: metadataError } = await supabase
      .from("payment_transactions")
      .select("id, user_id, amount, status, metadata, payment_reference")
      .contains("metadata", { order_tracking_id: trackingId })
      .single();
    
    if (metadataSearch) {
      txRecord = metadataSearch;
    } else {
      // Second attempt: search by payment_reference column
      const { data: refSearch, error: refError } = await supabase
        .from("payment_transactions")
        .select("id, user_id, amount, status, metadata, payment_reference")
        .eq("payment_reference", trackingId)
        .single();
      
      if (refSearch) {
        txRecord = refSearch;
      } else {
        fetchError = refError || metadataError;
      }
    }

    if (fetchError || !txRecord) {
      console.error("Fetch transaction error:", fetchError);
      throw new Error("Transaction not found in database.");
    }

    console.log("Transaction found:", txRecord.id);

    // Map status to internal format using our normalization function
    const internalStatus = normalizePaymentStatus(paymentStatus);

    // --- 4️⃣ Update transaction status ---
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: internalStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(txRecord.metadata || {}),
          pesapal_payment_method: statusData.payment_method,
          pesapal_status_code: statusData.payment_status_code,
          pesapal_confirmation_code: statusData.confirmation_code,
          pesapal_callback_at: new Date().toISOString(),
        },
      })
      .eq("id", txRecord.id); // Use ID instead of payment_reference

    if (updateError) {
      console.error("Failed to update payment record:", updateError);
      throw updateError;
    }

    console.log("Transaction status updated to:", internalStatus);

    // --- 5️⃣ If payment successful, credit BAKCoins ---
    if (internalStatus === "success") {
      // Get metadata safely
      const metadata = txRecord.metadata as any;
      const bakAmount = metadata?.bak_amount || (parseFloat(amount) / 20);
      const coinsToAdd = bakAmount; // Don't floor, keep decimal precision

      console.log(`Calculated BAKCoins to credit: ${coinsToAdd} (from ${amount} KES)`);

      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", txRecord.user_id)
        .single();

      if (walletError || !wallet) {
        console.error("Wallet fetch error:", walletError);
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({ user_id: txRecord.user_id, balance: coinsToAdd.toString() })
          .select("id, balance")
          .single();
        
        if (createError) {
          throw new Error("Failed to create wallet.");
        }
        
        console.log(`✅ Wallet created with ${coinsToAdd} BAKCoins`);
        
        // Create transaction record
        await supabase.from("transactions").insert({
          wallet_id: newWallet.id,
          amount: coinsToAdd.toString(),
          type: "earning",
          description: `Purchased ${coinsToAdd.toFixed(2)} BAKCoins via Pesapal`,
          reference_id: txRecord.id,
          metadata: {
            payment_method: "pesapal",
            order_tracking_id: trackingId,
            amount_paid_ksh: amount,
            pesapal_status: paymentStatus,
            pesapal_confirmation_code: statusData.confirmation_code,
          },
        });
        
        console.log(`🎉 Successfully credited ${coinsToAdd} BAKCoins to user ${txRecord.user_id}`);
        
        return new Response(
          JSON.stringify({
            success: true,
            status: paymentStatus,
            order_tracking_id: trackingId,
            message: "Payment processed successfully",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newBalance = (parseFloat(wallet.balance.toString()) || 0) + coinsToAdd;

      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update({ balance: newBalance.toString(), updated_at: new Date().toISOString() })
        .eq("user_id", txRecord.user_id);

      if (walletUpdateError) {
        console.error("Wallet update error:", walletUpdateError);
        throw new Error("Failed to update wallet balance.");
      }

      console.log(`✅ Wallet updated: ${wallet.balance} → ${newBalance} BAKCoins`);

      // --- 6️⃣ Create transaction record for audit trail ---
      const { error: txError } = await supabase.from("transactions").insert({
        wallet_id: wallet.id,
        amount: coinsToAdd.toString(),
        type: "earning",
        description: `Purchased ${coinsToAdd.toFixed(2)} BAKCoins via Pesapal`,
        reference_id: txRecord.id,
        metadata: {
          payment_method: "pesapal",
          order_tracking_id: trackingId,
          amount_paid_ksh: amount,
          pesapal_status: paymentStatus,
          pesapal_confirmation_code: statusData.confirmation_code,
        },
      });

      if (txError) {
        console.error("Failed to create transaction record:", txError);
        // Don't throw - wallet is already updated, just log the error
      } else {
        console.log("✅ Transaction record created");
      }

      console.log(`🎉 Successfully credited ${coinsToAdd} BAKCoins to user ${txRecord.user_id}`);
    } else {
      console.log(`Payment not completed. Status: ${paymentStatus}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: internalStatus, // Return normalized status
        pesapal_status: paymentStatus, // Include original for reference
        order_tracking_id: trackingId,
        message: "Payment processed successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Pesapal Callback Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
