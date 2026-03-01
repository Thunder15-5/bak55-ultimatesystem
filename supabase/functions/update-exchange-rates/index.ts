import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_CURRENCIES = ["KES", "NGN", "GHS", "UGX", "TZS", "RWF", "ETB", "ZAR", "XOF", "XAF", "USD"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch rates from free API (no key needed)
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await response.json();

    if (data.result !== "success" || !data.rates) {
      throw new Error("Failed to fetch exchange rates");
    }

    const now = new Date().toISOString();
    const updates = SUPPORTED_CURRENCIES.map((currency) => ({
      base_currency: "USD",
      target_currency: currency,
      rate: data.rates[currency] || 1,
      updated_at: now,
    }));

    // Upsert all rates
    const { error } = await supabase
      .from("exchange_rates")
      .upsert(updates, { onConflict: "base_currency,target_currency" });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, updated: updates.length, timestamp: now }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exchange rate update error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
