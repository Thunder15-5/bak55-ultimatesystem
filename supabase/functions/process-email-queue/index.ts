import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCTION_DOMAIN = "https://bak55talent.co.ke";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending emails that are due
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No emails to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      try {
        // Check if user still exists and hasn't unsubscribed
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, email")
          .eq("id", email.user_id)
          .single();

        if (!profile) {
          // User deleted, mark as failed
          await supabase
            .from("email_queue")
            .update({ status: "failed", error_message: "User not found" })
            .eq("id", email.id);
          continue;
        }

        // Build template data with production URLs
        const templateData = {
          ...email.metadata,
          username: profile.username || email.metadata?.username || "there",
          dashboard_link: `${PRODUCTION_DOMAIN}/dashboard`,
          profile_link: `${PRODUCTION_DOMAIN}/profile`,
          upload_link: `${PRODUCTION_DOMAIN}/upload`,
          competitions_link: `${PRODUCTION_DOMAIN}/competitions`,
          wallet_link: `${PRODUCTION_DOMAIN}/wallet`,
        };

        // Call the send-email function
        const { data: sendResult, error: sendError } = await supabase.functions.invoke("send-email", {
          body: {
            to: email.recipient_email,
            subject: email.subject,
            template: email.template_name,
            data: templateData,
          },
        });

        if (sendError || !sendResult?.success) {
          await supabase
            .from("email_queue")
            .update({ 
              status: "failed", 
              error_message: sendError?.message || sendResult?.error || "Unknown error" 
            })
            .eq("id", email.id);
          failed++;
          continue;
        }

        // Mark as sent
        await supabase
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email.id);

        // Log to sent log
        await supabase
          .from("email_sent_log")
          .insert({
            user_id: email.user_id,
            template_name: email.template_name,
            campaign_id: email.campaign_id,
            recipient_email: email.recipient_email,
            subject: email.subject,
            resend_id: sendResult.data?.id,
          });

        processed++;
      } catch (emailError: any) {
        console.error(`Error processing email ${email.id}:`, emailError);
        await supabase
          .from("email_queue")
          .update({ status: "failed", error_message: emailError.message })
          .eq("id", email.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processed} emails, ${failed} failed`,
        processed,
        failed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in process-email-queue:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
