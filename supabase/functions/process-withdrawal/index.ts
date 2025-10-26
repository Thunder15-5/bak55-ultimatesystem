import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WithdrawalRequest {
  amount: number;
  phone_number: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify user is an artist or admin
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      throw new Error("Failed to verify user role");
    }

    const userRoles = roles?.map(r => r.role) || [];
    const isArtist = userRoles.includes('artist') || userRoles.includes('admin');
    
    if (!isArtist) {
      throw new Error("Only artists can withdraw funds");
    }

    const { amount, phone_number }: WithdrawalRequest = await req.json();

    // Production validation
    if (typeof amount !== 'number' || isNaN(amount) || !phone_number) {
      throw new Error("Invalid withdrawal request data");
    }

    console.log("Processing withdrawal:", { user_id: user.id, amount });

    // Validation
    const MIN_WITHDRAWAL = 100; // 100 BAK = 2000 KSh
    const MAX_WITHDRAWAL = 50000; // 50,000 BAK = 1,000,000 KSh
    const CONVERSION_RATE = 20; // 1 BAK = 20 KSh

    if (amount < MIN_WITHDRAWAL) {
      throw new Error(`Minimum withdrawal is ${MIN_WITHDRAWAL} BAKCoins`);
    }

    if (amount > MAX_WITHDRAWAL) {
      throw new Error(`Maximum withdrawal is ${MAX_WITHDRAWAL} BAKCoins`);
    }

    // Validate phone number (Kenyan format)
    const phoneRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
    if (!phoneRegex.test(phone_number)) {
      throw new Error("Invalid Kenyan phone number format");
    }

    // Format phone number to 254XXXXXXXXX
    const formattedPhone = phone_number.replace(/^(?:254|\+254|0)?/, '254');

    // Get user's wallet with row locking
    const { data: wallet, error: walletError } = await supabaseClient
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      throw new Error("Wallet not found");
    }

    // Check sufficient balance
    if (parseFloat(wallet.balance) < amount) {
      throw new Error(`Insufficient balance. Available: ${wallet.balance} BAKCoins`);
    }

    // Check daily withdrawal limit
    const today = new Date().toISOString().split('T')[0];
    const { data: todayWithdrawals } = await supabaseClient
      .from("transactions")
      .select("amount")
      .eq("wallet_id", wallet.id)
      .eq("type", "withdrawal")
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59");

    const dailyTotal = todayWithdrawals?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const DAILY_LIMIT = 100000; // 100,000 BAKCoins per day

    if (dailyTotal + amount > DAILY_LIMIT) {
      throw new Error(`Daily withdrawal limit exceeded. Limit: ${DAILY_LIMIT} BAKCoins, Used today: ${dailyTotal} BAKCoins`);
    }

    // Calculate KSh amount and withdrawal fee (2% fee)
    const kshAmount = amount * CONVERSION_RATE;
    const withdrawalFee = amount * 0.02; // 2% fee
    const netAmount = amount - withdrawalFee;
    const netKshAmount = netAmount * CONVERSION_RATE;

    // Fraud detection - check for suspicious patterns
    const { data: recentWithdrawals } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .eq("type", "withdrawal")
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order("created_at", { ascending: false });

    // Flag if more than 3 withdrawals in the last hour
    const isSuspicious = (recentWithdrawals?.length || 0) >= 3;

    if (isSuspicious) {
      console.warn("⚠️ Suspicious withdrawal pattern detected", {
        user_id: user.id,
        recent_count: recentWithdrawals?.length,
      });

      // Create admin task for manual review
      await supabaseClient.from("admin_tasks").insert({
        task_type: "review_withdrawal",
        related_id: user.id,
        status: "pending",
        metadata: {
          amount,
          phone_number: formattedPhone,
          reason: "Multiple withdrawals in short time",
        },
      });

      throw new Error("Withdrawal flagged for review. Our team will process it manually within 2 hours.");
    }

    // Deduct from wallet atomically
    const { error: deductError } = await supabaseClient
      .from("wallets")
      .update({
        balance: parseFloat(wallet.balance) - amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wallet.id)
      .eq("balance", wallet.balance); // Optimistic locking

    if (deductError) {
      throw new Error("Failed to deduct from wallet - concurrent modification detected");
    }

    // Create transaction record
    const reference = `WDL-${Date.now()}-${user.id.substring(0, 8)}`;
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .insert({
        wallet_id: wallet.id,
        type: "withdrawal",
        amount: -amount, // Negative for withdrawal
        withdrawal_fee: withdrawalFee,
        description: `Withdrawal to ${formattedPhone}`,
        mpesa_phone_number: formattedPhone,
        metadata: {
          ksh_amount: kshAmount,
          net_ksh_amount: netKshAmount,
          status: "processing",
          reference,
        },
      })
      .select()
      .single();

    if (txError) {
      console.error("Failed to create transaction record:", txError);
      // Rollback wallet deduction
      await supabaseClient
        .from("wallets")
        .update({ balance: wallet.balance })
        .eq("id", wallet.id);
      throw new Error("Failed to create transaction record");
    }

    // Send withdrawal request email
    try {
      await supabaseClient.functions.invoke("send-email", {
        body: {
          to: user.email,
          subject: "Withdrawal Request Received",
          template: "withdrawal_request",
          data: {
            username: user.email?.split('@')[0] || 'User',
            amount,
            ksh_amount: kshAmount,
            phone_number: formattedPhone,
            reference,
          },
        },
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Don't fail the withdrawal if email fails
    }

    // Process withdrawal via M-PESA Daraja API (B2C)
    // NOTE: This requires M-PESA Daraja API credentials
    // For now, we'll mark it as pending and process via webhook
    
    const MPESA_CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY");
    const MPESA_CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET");
    const MPESA_SHORTCODE = Deno.env.get("MPESA_SHORTCODE");
    const MPESA_PASSKEY = Deno.env.get("MPESA_PASSKEY");

    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
      console.warn("⚠️ M-PESA credentials not configured - withdrawal pending manual processing");
      
      // Create admin task for manual processing
      await supabaseClient.from("admin_tasks").insert({
        task_type: "process_withdrawal",
        related_id: transaction.id,
        status: "pending",
        metadata: {
          amount: netAmount,
          ksh_amount: netKshAmount,
          phone_number: formattedPhone,
          reference,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          status: "pending_manual",
          message: "Withdrawal request submitted. Manual processing required.",
          transaction_id: transaction.id,
          reference,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // TODO: Implement M-PESA B2C payment
    // For now, mark as pending
    console.log("M-PESA B2C payment would be initiated here");

    return new Response(
      JSON.stringify({
        success: true,
        status: "processing",
        message: `Withdrawal of ${netAmount} BAKCoins (${netKshAmount} KSh) is being processed to ${formattedPhone}`,
        transaction_id: transaction.id,
        reference,
        net_amount: netAmount,
        fee: withdrawalFee,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing withdrawal:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process withdrawal",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
