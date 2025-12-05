import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

const templates: Record<string, (data: any) => string> = {
  welcome: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #D946EF; margin: 0;">🎵 BAK55 Talent</h1>
      </div>
      <h2 style="color: #333;">Welcome to BAK55 Talent Platform!</h2>
      <p style="font-size: 16px; color: #555;">Hi ${data.username || 'there'},</p>
      <p style="font-size: 16px; color: #555;">We're excited to have you join our community of talented African artists and music lovers.</p>
      <p style="font-size: 16px; color: #555;">Get started by:</p>
      <ul style="color: #555;">
        <li>Completing your profile</li>
        <li>Uploading your first track (artists)</li>
        <li>Exploring active competitions</li>
        <li>Connecting with other artists</li>
      </ul>
      <p style="font-size: 14px; color: #999; margin-top: 30px;">Best regards,<br><strong style="color: #D946EF;">The BAK55 Team</strong></p>
    </div>
  `,
  
  verification: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #D946EF;">Verify Your Email Address</h1>
      <p>Hi ${data.username || 'there'},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${data.verification_url}" style="background: #D946EF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${data.verification_url}</p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>The BAK55 Team</p>
    </div>
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
      
      <p style="font-size: 14px; color: #999; margin-top: 30px;">If you didn't sign up for BAK55 Talent, please ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #999; text-align: center;">
        Best regards,<br>
        <strong style="color: #D946EF;">The BAK55 Talent Team</strong>
      </p>
    </div>
  `,
  
  competition_submission: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #D946EF;">Competition Submission Received! 🎯</h1>
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
    </div>
  `,
  
  competition_winner: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #D946EF;">🎉 Congratulations! You Won!</h1>
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
      <p><a href="${data.wallet_url || '#'}" style="background: #D946EF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Wallet</a></p>
      <p>Congratulations again! 🏆</p>
      <p>Best regards,<br>The BAK55 Team</p>
    </div>
  `,
  
  withdrawal_request: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #D946EF;">Withdrawal Request Received 💰</h1>
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
    </div>
  `,
  
  withdrawal_complete: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #D946EF;">Withdrawal Processed Successfully ✅</h1>
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
    </div>
  `,
  
  tip_received: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #D946EF;">You Received a Tip! 💝</h1>
      <p>Hi ${data.artist_name || 'Artist'},</p>
      <p>${data.tipper_name || 'A fan'} sent you a tip of <strong>${data.amount || 0} BAKCoins</strong>!</p>
      ${data.message ? `<p><em>"${data.message}"</em></p>` : ''}
      ${data.track_title ? `<p>For your track: <strong>${data.track_title}</strong></p>` : ''}
      <p>Your new wallet balance: ${data.new_balance || 0} BAKCoins</p>
      <p><a href="${data.track_url || '#'}" style="background: #D946EF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Track</a></p>
      <p>Best regards,<br>The BAK55 Team</p>
    </div>
  `,
  
  contact_form: (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #D946EF;">New Contact Form Submission 📧</h1>
      <p><strong>From:</strong> ${data.name || 'Unknown'} (${data.email || 'No email'})</p>
      <p><strong>Subject:</strong> ${data.subject || 'No subject'}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message || 'No message'}</p>
      <hr />
      <p><small>This email was sent from the BAK55 Contact Form</small></p>
    </div>
  `,
};

async function sendEmailViaResend(to: string, subject: string, html: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BAK55 Talent <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    console.log("Email sent successfully via Resend:", data.id);
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("Error sending email via Resend:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, subject, template, data }: EmailRequest = body;

    console.log('Email request received:', { to, subject, template });

    // Validate required fields
    if (!to || !subject || !template) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields (to, subject, template)" }),
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
    
    // Send email via Resend API
    const result = await sendEmailViaResend(to, subject, html);

    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, data: { id: result.id } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Return 200 even on failure to not break signup flow
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