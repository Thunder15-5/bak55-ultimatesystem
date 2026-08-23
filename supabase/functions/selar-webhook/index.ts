import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SelarWebhookPayload {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    customer_email: string;
    metadata?: {
      user_id?: string;
      package_id?: string;
      amount_kes?: number;
      bak_amount?: number;
    };
  };
}

export default async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: SelarWebhookPayload = await req.json();

    console.log("Selar webhook received:", {
      event: payload.event,
      reference: payload.data?.reference,
      status: payload.data?.status,
    });

    // Validate webhook payload structure
    if (!payload.event || !payload.data) {
      throw new Error("Invalid webhook payload structure");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data: webhookData, status: dataStatus } = payload.data;

    // Fetch payment transaction record
    const { data: paymentTx, error: fetchError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("reference", webhookData.reference)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`Failed to fetch payment: ${fetchError.message}`);
    }

    // Handle different payment events
    switch (payload.event) {
      case "payment.success": {
        if (!paymentTx) {
          console.warn(
            `Payment transaction not found for reference: ${webhookData.reference}`
          );
          // Create transaction record if it doesn't exist
          const { error: createError } = await supabase
            .from("payment_transactions")
            .insert({
              reference: webhookData.reference,
              email: webhookData.customer_email,
              amount: webhookData.amount,
              currency: "KES",
              status: "success",
              payment_provider: "selar",
              metadata: webhookData.metadata,
            });

          if (createError) {
            throw new Error(`Failed to create payment record: ${createError.message}`);
          }

          return new Response(
            JSON.stringify({ success: true, message: "Payment recorded" }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Skip if already processed
        if (paymentTx.status === "success") {
          console.log(
            `Payment already processed: ${webhookData.reference}`
          );
          return new Response(
            JSON.stringify({
              success: true,
              message: "Payment already processed",
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Get user and wallet
        const userId =
          paymentTx.metadata?.user_id ||
          webhookData.metadata?.user_id;
        if (!userId) {
          throw new Error("No user_id found in payment metadata");
        }

        const { data: wallet, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (walletError || !wallet) {
          throw new Error(
            `Wallet not found for user ${userId}: ${walletError?.message}`
          );
        }

        // Calculate BAK amount (20 KES = 1 BAK)
        const bakAmount =
          paymentTx.metadata?.bak_amount ||
          webhookData.metadata?.bak_amount ||
          webhookData.amount / 20;

        // Update payment transaction status
        const { error: updateTxError } = await supabase
          .from("payment_transactions")
          .update({
            status: "success",
            payment_reference: webhookData.reference,
            metadata: {
              ...paymentTx.metadata,
              payment_status: "completed",
              processed_at: new Date().toISOString(),
            },
          })
          .eq("id", paymentTx.id);

        if (updateTxError) {
          throw new Error(
            `Failed to update payment transaction: ${updateTxError.message}`
          );
        }

        // Credit wallet
        const newBalance = (wallet.balance || 0) + bakAmount;
        const { error: balanceError } = await supabase
          .from("wallets")
          .update({ balance: newBalance })
          .eq("id", wallet.id);

        if (balanceError) {
          throw new Error(`Failed to update wallet balance: ${balanceError.message}`);
        }

        // Record transaction in transaction history
        const { error: historyError } = await supabase
          .from("transactions")
          .insert({
            wallet_id: wallet.id,
            amount: bakAmount,
            type: "earning",
            description: `Purchased ${bakAmount} BAKCoins`,
            reference_id: paymentTx.id,
            metadata: {
              payment_method: "selar",
              amount_paid_kes: webhookData.amount,
              selar_reference: webhookData.reference,
            },
          });

        if (historyError) {
          throw new Error(
            `Failed to record transaction: ${historyError.message}`
          );
        }

        // Send notification to user
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "purchase_success",
          title: "💰 BAKCoins Purchased",
          message: `You've successfully purchased ${bakAmount} BAKCoins!`,
          link: "/wallet",
          priority: "high",
          category: "payment",
        });

        console.log(
          `Payment processed successfully for user ${userId}: +${bakAmount} BAK`
        );

        return new Response(
          JSON.stringify({
            success: true,
            message: `Payment processed: ${bakAmount} BAKCoins credited`,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "payment.failed": {
        if (!paymentTx) {
          return new Response(
            JSON.stringify({ success: true, message: "Payment not found" }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Update status
        const { error: updateError } = await supabase
          .from("payment_transactions")
          .update({
            status: "failed",
            metadata: {
              ...paymentTx.metadata,
              payment_status: "failed",
              failed_at: new Date().toISOString(),
            },
          })
          .eq("id", paymentTx.id);

        if (updateError) {
          throw new Error(`Failed to update payment status: ${updateError.message}`);
        }

        // Notify user
        const userId =
          paymentTx.metadata?.user_id ||
          webhookData.metadata?.user_id;
        if (userId) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "purchase_failed",
            title: "❌ Payment Failed",
            message: "Your BAKCoins purchase failed. Please try again.",
            link: "/wallet/buy-coins",
            priority: "high",
            category: "payment",
          });
        }

        console.log(`Payment failed: ${webhookData.reference}`);

        return new Response(
          JSON.stringify({ success: true, message: "Payment marked as failed" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "payment.pending": {
        if (!paymentTx) {
          return new Response(
            JSON.stringify({ success: true, message: "Payment not found" }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Update status
        const { error: updateError } = await supabase
          .from("payment_transactions")
          .update({
            status: "pending",
            metadata: {
              ...paymentTx.metadata,
              payment_status: "pending",
              pending_since: new Date().toISOString(),
            },
          })
          .eq("id", paymentTx.id);

        if (updateError) {
          throw new Error(
            `Failed to update payment status: ${updateError.message}`
          );
        }

        console.log(`Payment pending: ${webhookData.reference}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment status updated to pending",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        console.warn(`Unknown event type: ${payload.event}`);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Event acknowledged",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook processing error:", errorMessage);

    // Always return 200 to Selar to prevent retry storms
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};
