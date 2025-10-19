import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  subject: string;
  html: string;
  type?: 'support' | 'withdrawal' | 'general';
}

// Determine sender and routing based on notification type
const getNotificationRouting = (type?: string) => {
  switch (type) {
    case 'support':
      return {
        from: 'support@bak55talent.co.ke',
        cc: ['admin@bak55talent.co.ke']
      };
    case 'withdrawal':
      return {
        from: 'finance@bak55talent.co.ke',
        cc: ['finance@bak55talent.co.ke']
      };
    default:
      return {
        from: 'noreply@bak55talent.co.ke',
        bcc: ['admin@bak55talent.co.ke']
      };
  }
};

const sendEmailViaSMTP = async (
  to: string,
  subject: string,
  html: string,
  type?: string
) => {
  const SMTP_HOST = Deno.env.get("SMTP_HOST");
  const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465");
  const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
  const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
    throw new Error("SMTP credentials not configured");
  }

  const routing = getNotificationRouting(type);
  
  console.log('Sending notification email via SMTP:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    from: routing.from,
    to,
    cc: routing.cc,
    bcc: routing.bcc,
    subject
  });

  const client = new SmtpClient();

  try {
    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });

    // Send to primary recipient
    await client.send({
      from: routing.from,
      to: to,
      subject: subject,
      content: html,
      html: html,
    });

    // Send copies to CC recipients
    if (routing.cc && routing.cc.length > 0) {
      for (const ccEmail of routing.cc) {
        await client.send({
          from: routing.from,
          to: ccEmail,
          subject: `[CC] ${subject}`,
          content: html,
          html: html,
        });
      }
    }

    // Send copies to BCC recipients
    if (routing.bcc && routing.bcc.length > 0) {
      for (const bccEmail of routing.bcc) {
        await client.send({
          from: routing.from,
          to: bccEmail,
          subject: `[BCC] ${subject}`,
          content: html,
          html: html,
        });
      }
    }

    await client.close();
    
    console.log("Notification email sent successfully via SMTP");
    return { success: true };
  } catch (error) {
    console.error("SMTP error:", error);
    await client.close();
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type }: NotificationEmailRequest = await req.json();

    console.log('Processing notification email:', { to, subject, type });

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, or html");
    }

    const result = await sendEmailViaSMTP(to, subject, html, type);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
