import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationEmailRequest {
  to: string;
  subject: string;
  html: string;
  type?: 'support' | 'withdrawal' | 'general';
}

const sendEmailViaSMTP = async (
  to: string,
  subject: string,
  html: string,
) => {
  const SMTP_HOST = Deno.env.get("SMTP_HOST");
  const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465");
  const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
  const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
    throw new Error("SMTP credentials not configured");
  }

  console.log('Sending notification email via SMTP:', { host: SMTP_HOST, port: SMTP_PORT, to, subject });

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
      from: `BAK55 Talent <${SMTP_USERNAME}>`,
      to: to,
      subject: subject,
      content: "Please view this email in an HTML-capable client.",
      html: html,
    });

    await client.close();

    console.log("Notification email sent successfully via SMTP");
    return { success: true };
  } catch (error: any) {
    console.error("SMTP error:", error?.message);
    throw new Error(`Failed to send email via SMTP: ${error?.message || 'Unknown error'}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html }: NotificationEmailRequest = await req.json();

    console.log('Processing notification email:', { to, subject });

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, or html");
    }

    const result = await sendEmailViaSMTP(to, subject, html);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
