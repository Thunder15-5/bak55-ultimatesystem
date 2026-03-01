import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCTION_DOMAIN = "https://bak55talent.co.ke";
const SUPPORT_EMAIL = "support@bak55talent.co.ke";
const COMPANY_NAME = "BAK55 Talent";

// ─── Inline SMTP Sender (no edge-to-edge call) ─────────────────
async function sendEmailViaSMTP(to: string, subject: string, html: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const SMTP_HOST = Deno.env.get("SMTP_HOST");
  const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465");
  const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
  const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
    console.error("SMTP credentials not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USERNAME,
          password: SMTP_PASSWORD,
        },
      },
    });

    await client.send({
      from: `${COMPANY_NAME} <${SMTP_USERNAME}>`,
      to: to,
      subject: subject,
      content: "Please view this email in an HTML-capable client.",
      html: html,
      encoding: "8bit",
    });

    await client.close();

    const msgId = crypto.randomUUID();
    console.log("Email sent successfully via SMTP:", msgId, "to:", to);
    return { success: true, id: msgId };
  } catch (error: any) {
    console.error("Error sending email via SMTP:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

// ─── Load template from DB ─────────────────────────────────────
async function loadTemplateFromDB(
  supabase: any,
  templateName: string,
  data: Record<string, any>
): Promise<{ html: string; subject?: string } | null> {
  // Template name aliases
  const aliases: Record<string, string> = {
    first_upload_guide: "first_upload_guide",
    competition_guide: "competition_guide",
    monetization_guide: "monetization_guide",
    onboarding_upload: "first_upload_guide",
    onboarding_competitions: "competition_guide",
    onboarding_monetization: "monetization_guide",
  };

  const resolvedName = aliases[templateName] || templateName;

  try {
    const { data: tmpl, error } = await supabase
      .from("email_templates")
      .select("html_content, subject, variables")
      .eq("name", resolvedName)
      .eq("is_active", true)
      .single();

    if (error || !tmpl) {
      console.warn(`Template "${resolvedName}" not found in DB`);
      return null;
    }

    let html = tmpl.html_content;
    for (const [key, value] of Object.entries(data)) {
      html = html.replaceAll(`{{${key}}}`, String(value ?? ""));
    }
    // Standard variable replacements
    html = html.replaceAll("{{dashboard_link}}", `${PRODUCTION_DOMAIN}/dashboard`);
    html = html.replaceAll("{{profile_link}}", `${PRODUCTION_DOMAIN}/profile`);
    html = html.replaceAll("{{upload_link}}", `${PRODUCTION_DOMAIN}/upload`);
    html = html.replaceAll("{{competitions_link}}", `${PRODUCTION_DOMAIN}/competitions`);
    html = html.replaceAll("{{wallet_link}}", `${PRODUCTION_DOMAIN}/wallet`);
    html = html.replaceAll("{{support_email}}", SUPPORT_EMAIL);
    html = html.replaceAll("{{company_name}}", COMPANY_NAME);
    html = html.replaceAll("{{domain}}", PRODUCTION_DOMAIN);

    console.log(`Loaded template "${resolvedName}" from database`);
    return { html, subject: tmpl.subject };
  } catch (err) {
    console.warn(`Failed to load DB template "${resolvedName}":`, err);
    return null;
  }
}

// ─── Simple fallback HTML wrapper ──────────────────────────────
function simpleFallback(subject: string, username: string): string {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px;">
    <h1>${subject}</h1>
    <p>Hi ${username},</p>
    <p>This is a notification from ${COMPANY_NAME}.</p>
    <p><a href="${PRODUCTION_DOMAIN}/dashboard">Go to Dashboard</a></p>
  </body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse optional action from request body
    let action = "process";
    try {
      const body = await req.json();
      if (body?.action) action = body.action;
    } catch {
      // No body or invalid JSON is fine — default to "process"
    }

    // ─── Retry Failed action ───────────────────────────────────
    if (action === "retry_failed") {
      const { data: updated, error } = await supabase
        .from("email_queue")
        .update({ status: "pending", error_message: null })
        .eq("status", "failed")
        .select("id");

      if (error) throw error;
      const count = updated?.length || 0;
      console.log(`Retried ${count} failed queue items`);
      return new Response(
        JSON.stringify({ success: true, message: `${count} failed emails reset to pending`, count }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Clear Stale action ────────────────────────────────────
    if (action === "clear_stale") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: deleted, error } = await supabase
        .from("email_queue")
        .delete()
        .eq("status", "pending")
        .lt("created_at", sevenDaysAgo)
        .select("id");

      if (error) throw error;
      const count = deleted?.length || 0;
      console.log(`Cleared ${count} stale queue items`);
      return new Response(
        JSON.stringify({ success: true, message: `${count} stale items cleared`, count }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Process Queue ─────────────────────────────────────────
    // Fetch pending emails: include NULL scheduled_for (immediate) and those scheduled in the past
    const now = new Date().toISOString();
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("No pending emails to process");
      return new Response(
        JSON.stringify({ success: true, message: "No emails to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingEmails.length} pending emails...`);
    let processed = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      try {
        // Check if user still exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, email")
          .eq("id", email.user_id)
          .single();

        if (!profile) {
          await supabase
            .from("email_queue")
            .update({ status: "failed", error_message: "User not found" })
            .eq("id", email.id);
          failed++;
          continue;
        }

        // Build template data
        const templateData = {
          ...email.metadata,
          username: profile.username || email.metadata?.username || "there",
          dashboard_link: `${PRODUCTION_DOMAIN}/dashboard`,
          profile_link: `${PRODUCTION_DOMAIN}/profile`,
          upload_link: `${PRODUCTION_DOMAIN}/upload`,
          competitions_link: `${PRODUCTION_DOMAIN}/competitions`,
          wallet_link: `${PRODUCTION_DOMAIN}/wallet`,
        };

        // Load template from DB directly
        const tmplResult = await loadTemplateFromDB(supabase, email.template_name, templateData);
        const emailHtml = tmplResult?.html || simpleFallback(email.subject, templateData.username);

        // Send directly via SMTP (no edge-to-edge call)
        const result = await sendEmailViaSMTP(email.recipient_email, email.subject, emailHtml);

        if (!result.success) {
          await supabase
            .from("email_queue")
            .update({ status: "failed", error_message: result.error || "SMTP send failed" })
            .eq("id", email.id);
          failed++;
          console.error(`Failed to send email ${email.id} to ${email.recipient_email}: ${result.error}`);
          continue;
        }

        // Mark as sent
        await supabase
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email.id);

        // Log to sent log
        await supabase.from("email_sent_log").insert({
          user_id: email.user_id,
          template_name: email.template_name,
          campaign_id: email.campaign_id,
          recipient_email: email.recipient_email,
          subject: email.subject,
          resend_id: result.id,
          status: "sent",
        });

        processed++;
        console.log(`✅ Sent email ${email.id} to ${email.recipient_email} (${email.template_name})`);

        // 500ms throttle between sends
        if (pendingEmails.indexOf(email) < pendingEmails.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (emailError: any) {
        console.error(`Error processing email ${email.id}:`, emailError);
        await supabase
          .from("email_queue")
          .update({ status: "failed", error_message: emailError.message })
          .eq("id", email.id);
        failed++;
      }
    }

    console.log(`Queue processing complete: ${processed} sent, ${failed} failed`);
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
