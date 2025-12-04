import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  template: 'welcome' | 'verification' | 'activation' | 'competition_submission' | 'competition_winner' | 'withdrawal_request' | 'withdrawal_complete' | 'tip_received' | 'contact_form';
  data?: Record<string, any>;
}

const templates = {
  welcome: (data: any) => `
    <h1>Welcome to BAK55 Talent Platform! 🎵</h1>
    <p>Hi ${data.username || 'there'},</p>
    <p>We're excited to have you join our community of talented African artists and music lovers.</p>
    <p>Get started by:</p>
    <ul>
      <li>Completing your profile</li>
      <li>Uploading your first track (artists)</li>
      <li>Exploring active competitions</li>
      <li>Connecting with other artists</li>
    </ul>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  verification: (data: any) => `
    <h1>Verify Your Email Address</h1>
    <p>Hi ${data.username || 'there'},</p>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="${data.verification_url}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
    <p>Or copy and paste this link into your browser:</p>
    <p>${data.verification_url}</p>
    <p>This link will expire in 24 hours.</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  activation: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D946EF; margin: 0;">🎵 BAK55 Talent</h1>
      </div>
      <h2 style="color: #333; font-size: 24px;">Activate Your Account</h2>
      <p style="font-size: 16px; color: #555;">Hi ${data.username || 'there'},</p>
      <p style="font-size: 16px; color: #555;">Welcome to BAK55 Talent! Please use the following activation code to complete your registration:</p>
      
      <div style="background: linear-gradient(135deg, #D946EF 0%, #9333EA 100%); padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0;">
        <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
          <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Your Activation Code</p>
          <p style="margin: 0; font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #D946EF; font-family: 'Courier New', monospace;">${data.activation_code || '------'}</p>
        </div>
      </div>
      
      <p style="font-size: 16px; color: #555; margin-top: 20px;">This code will expire in 24 hours.</p>
      
      <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Once activated, you can:</p>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          <li>Stream exclusive African music</li>
          <li>Join exciting competitions</li>
          <li>Earn and spend BAKCoins</li>
          <li>Connect with artists and fans</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #999; margin-top: 30px;">If you didn't sign up for BAK55 Talent, please ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #999; text-align: center;">
        Best regards,<br>
        <strong style="color: #D946EF;">The BAK55 Talent Team</strong>
      </p>
    </div>
  `,
  
  competition_submission: (data: any) => `
    <h1>Competition Submission Received! 🎯</h1>
    <p>Hi ${data.artist_name || 'Artist'},</p>
    <p>Your submission "<strong>${data.track_title || 'Your Track'}</strong>" has been successfully submitted to the competition:</p>
    <h2>${data.competition_title || 'Competition'}</h2>
    <p><strong>What happens next:</strong></p>
    <ul>
      <li>AI analysis in progress (will be completed within 24 hours)</li>
      <li>Voting opens: ${data.voting_start_date || 'TBA'}</li>
      <li>Voting closes: ${data.voting_end_date || 'TBA'}</li>
      <li>Winners announced: Shortly after voting ends</li>
    </ul>
    <p>Good luck! 🍀</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  competition_winner: (data: any) => `
    <h1>🎉 Congratulations! You Won!</h1>
    <p>Hi ${data.artist_name || 'Artist'},</p>
    <p>We're thrilled to announce that your submission "<strong>${data.track_title || 'Your Track'}</strong>" has won ${data.position || ''} place in:</p>
    <h2>${data.competition_title || 'Competition'}</h2>
    <p><strong>Prize Details:</strong></p>
    <ul>
      <li>Position: ${data.position || 'N/A'}</li>
      <li>Prize: ${data.prize_amount || 0} BAKCoins</li>
      <li>Final Score: ${data.final_score || 0}/100</li>
    </ul>
    <p>Your prize has been automatically credited to your wallet!</p>
    <p><a href="${data.wallet_url || '#'}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Wallet</a></p>
    <p>Congratulations again! 🏆</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  withdrawal_request: (data: any) => `
    <h1>Withdrawal Request Received 💰</h1>
    <p>Hi ${data.username || 'User'},</p>
    <p>We've received your withdrawal request:</p>
    <ul>
      <li>Amount: ${data.amount || 0} BAKCoins (${data.ksh_amount || 0} KSh)</li>
      <li>Phone Number: ${data.phone_number || 'N/A'}</li>
      <li>Reference: ${data.reference || 'N/A'}</li>
    </ul>
    <p><strong>Processing Time:</strong> Usually within 2 hours</p>
    <p>You'll receive another email once the withdrawal is processed.</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  withdrawal_complete: (data: any) => `
    <h1>Withdrawal Processed Successfully ✅</h1>
    <p>Hi ${data.username || 'User'},</p>
    <p>Your withdrawal has been successfully processed!</p>
    <ul>
      <li>Amount: ${data.amount || 0} BAKCoins (${data.ksh_amount || 0} KSh)</li>
      <li>Phone Number: ${data.phone_number || 'N/A'}</li>
      <li>Transaction ID: ${data.transaction_id || 'N/A'}</li>
      <li>M-PESA Receipt: ${data.receipt_number || 'Pending'}</li>
    </ul>
    <p>The funds should appear in your mobile money account within a few minutes.</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  tip_received: (data: any) => `
    <h1>You Received a Tip! 💝</h1>
    <p>Hi ${data.artist_name || 'Artist'},</p>
    <p>${data.tipper_name || 'A fan'} sent you a tip of <strong>${data.amount || 0} BAKCoins</strong>!</p>
    ${data.message ? `<p><em>"${data.message}"</em></p>` : ''}
    ${data.track_title ? `<p>For your track: <strong>${data.track_title}</strong></p>` : ''}
    <p>Your new wallet balance: ${data.new_balance || 0} BAKCoins</p>
    <p><a href="${data.track_url || '#'}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Track</a></p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  contact_form: (data: any) => `
    <h1>New Contact Form Submission 📧</h1>
    <p><strong>From:</strong> ${data.name || 'Unknown'} (${data.email || 'No email'})</p>
    <p><strong>Subject:</strong> ${data.subject || 'No subject'}</p>
    <p><strong>Message:</strong></p>
    <p>${data.message || 'No message'}</p>
    <hr />
    <p><small>This email was sent from the BAK55 Contact Form</small></p>
  `,
};

const getEmailRouting = (template: string) => {
  switch (template) {
    case 'withdrawal_request':
    case 'withdrawal_complete':
      return {
        from: 'finance@bak55talent.co.ke',
        cc: [] as string[],
        bcc: ['finance@bak55talent.co.ke']
      };
    default:
      return {
        from: 'noreply@bak55talent.co.ke',
        cc: [] as string[],
        bcc: [] as string[]
      };
  }
};

async function sendEmailViaSMTP(to: string, subject: string, html: string, template: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const SMTP_HOST = Deno.env.get("SMTP_HOST");
  const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
  const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

  console.log('SMTP Configuration check:', {
    hasHost: !!SMTP_HOST,
    port: SMTP_PORT,
    hasUsername: !!SMTP_USERNAME,
    hasPassword: !!SMTP_PASSWORD
  });

  if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
    const missing = [];
    if (!SMTP_HOST) missing.push('SMTP_HOST');
    if (!SMTP_USERNAME) missing.push('SMTP_USERNAME');
    if (!SMTP_PASSWORD) missing.push('SMTP_PASSWORD');
    return { 
      success: false, 
      error: `Missing SMTP credentials: ${missing.join(', ')}` 
    };
  }

  const routing = getEmailRouting(template);
  
  console.log('Attempting to send email:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    from: routing.from,
    to,
    subject,
    template
  });

  const client = new SmtpClient();
  let isConnected = false;

  try {
    // Connect with timeout
    const connectPromise = client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SMTP connection timeout after 30s')), 30000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    isConnected = true;
    console.log('SMTP connection established');

    // Send email
    await client.send({
      from: routing.from,
      to: to,
      subject: subject,
      content: html,
      html: html,
    });

    console.log('Email sent successfully to:', to);

    // Close connection
    if (isConnected) {
      try {
        await client.close();
      } catch (closeErr) {
        console.warn('Error closing SMTP connection:', closeErr);
      }
    }
    
    return { success: true, id: `smtp-${Date.now()}` };
  } catch (error: any) {
    console.error("SMTP error:", {
      message: error?.message,
      name: error?.name,
      code: error?.code
    });
    
    if (isConnected) {
      try {
        await client.close();
      } catch (closeError) {
        console.warn("Error closing SMTP connection:", closeError);
      }
    }
    
    return { 
      success: false, 
      error: error?.message || 'Unknown SMTP error' 
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, subject, template, data }: EmailRequest = body;

    console.log('Email request received:', { to, subject, template, hasData: !!data });

    // Validate required fields
    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing 'to' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subject) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing 'subject' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!template) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing 'template' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!templates[template]) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid template: ${template}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate HTML from template
    const html = templates[template](data || {});
    
    // Try to send email
    const result = await sendEmailViaSMTP(to, subject, html, template);

    if (result.success) {
      console.log("Email sent successfully:", result.id);
      return new Response(
        JSON.stringify({ success: true, data: { id: result.id } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Email failed but we return 200 with success: false to not break the signup flow
      console.error("Email send failed:", result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error, recoverable: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error", recoverable: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});