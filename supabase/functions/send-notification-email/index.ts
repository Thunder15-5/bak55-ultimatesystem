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
        from: 'notifications@bak55talent.co.ke',
        cc: [] as string[],
        bcc: [] as string[]
      };
    case 'withdrawal':
      return {
        from: 'notifications@bak55talent.co.ke',
        cc: [] as string[],
        bcc: ['finance@bak55talent.co.ke']
      };
    default:
      return {
        from: 'notifications@bak55talent.co.ke',
        cc: [] as string[],
        bcc: [] as string[]
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
  const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
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
  let isConnected = false;

  try {
    // Set a connection timeout
    const connectPromise = client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });

    // Add 30-second timeout for connection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SMTP connection timeout after 30s')), 30000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    isConnected = true;
    console.log('SMTP connection established successfully');

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

    if (isConnected) {
      await client.close();
    }
    
    console.log("Notification email sent successfully via SMTP");
    return { success: true };
  } catch (error: any) {
    console.error("SMTP error details:", {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      host: SMTP_HOST,
      port: SMTP_PORT
    });
    
    if (isConnected) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing SMTP connection:", closeError);
      }
    }
    
    throw new Error(`Failed to send email via SMTP: ${error?.message || 'Unknown error'}. Please verify SMTP server is accessible and credentials are correct.`);
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
