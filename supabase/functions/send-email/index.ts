import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Production domain
const PRODUCTION_DOMAIN = "https://bak55talent.co.ke";

interface EmailRequest {
  to: string;
  subject: string;
  template: 'welcome' | 'verification' | 'activation' | 'competition_submission' | 'competition_winner' | 'withdrawal_request' | 'withdrawal_complete' | 'tip_received' | 'contact_form' | 'password_reset' | 'onboarding_upload' | 'onboarding_competitions' | 'onboarding_monetization' | 'profile_reminder' | 'custom';
  data?: Record<string, any>;
  html?: string; // For custom admin emails
}

const getBaseEmailStyles = () => `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Poppins', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }
    
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 16px;
      overflow: hidden;
    }
    
    .email-header {
      background: linear-gradient(135deg, #D946EF 0%, #9333EA 100%);
      padding: 30px 20px;
      text-align: center;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
    }
    
    .email-body {
      padding: 40px 30px;
      background: #ffffff;
    }
    
    h1, h2, h3 {
      color: #1a1a2e;
      margin-bottom: 15px;
    }
    
    p {
      color: #555;
      margin-bottom: 15px;
      font-size: 16px;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #D946EF 0%, #9333EA 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    
    .cta-button:hover {
      opacity: 0.9;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #D946EF15 0%, #9333EA15 100%);
      border: 1px solid #D946EF30;
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
      text-align: center;
    }
    
    .code {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #D946EF;
      font-family: 'Courier New', monospace;
    }
    
    .email-footer {
      background: #1a1a2e;
      padding: 30px;
      text-align: center;
    }
    
    .footer-text {
      color: #888;
      font-size: 14px;
    }
    
    .social-links {
      margin: 20px 0;
    }
    
    .social-links a {
      color: #D946EF;
      text-decoration: none;
      margin: 0 10px;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #D946EF50, transparent);
      margin: 25px 0;
    }
    
    ul {
      color: #555;
      padding-left: 20px;
      margin: 15px 0;
    }
    
    li {
      margin-bottom: 10px;
    }
    
    .step-number {
      display: inline-block;
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #D946EF 0%, #9333EA 100%);
      color: #fff;
      border-radius: 50%;
      text-align: center;
      line-height: 28px;
      font-weight: 600;
      font-size: 14px;
      margin-right: 10px;
    }
  </style>
`;

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${getBaseEmailStyles()}
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <a href="${PRODUCTION_DOMAIN}" class="logo">🎵 BAK55 Talent</a>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <div class="social-links">
        <a href="${PRODUCTION_DOMAIN}">Website</a> |
        <a href="${PRODUCTION_DOMAIN}/contact">Contact</a> |
        <a href="${PRODUCTION_DOMAIN}/faq">FAQ</a>
      </div>
      <p class="footer-text">
        © ${new Date().getFullYear()} BAK55 Talent. All rights reserved.<br>
        Nairobi, Kenya
      </p>
      <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
        You received this email because you signed up for BAK55 Talent.<br>
        <a href="${PRODUCTION_DOMAIN}/profile" style="color: #D946EF;">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

const templates: Record<string, (data: any) => string> = {
  welcome: (data: any) => emailWrapper(`
    <h1>Welcome to BAK55 Talent! 🎉</h1>
    <p>Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>We're thrilled to have you join Africa's premier music talent platform. Whether you're an artist, producer, or fan, you're now part of a community dedicated to discovering and supporting incredible talent.</p>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #D946EF; font-weight: 600;">Your journey starts here</p>
    </div>
    
    <p><strong>Here's what you can do next:</strong></p>
    <ul>
      <li><span class="step-number">1</span> Complete your profile to stand out</li>
      <li><span class="step-number">2</span> Explore trending music and artists</li>
      <li><span class="step-number">3</span> Enter competitions to win prizes</li>
      <li><span class="step-number">4</span> Connect with other creators</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="${PRODUCTION_DOMAIN}/dashboard" class="cta-button">Go to Dashboard</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #888;">
      Need help getting started? Check out our <a href="${PRODUCTION_DOMAIN}/faq" style="color: #D946EF;">FAQ</a> or reach out to our support team.
    </p>
  `),
  
  verification: (data: any) => emailWrapper(`
    <h1>Verify Your Email Address</h1>
    <p>Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Please verify your email address to complete your registration and access all features.</p>
    
    <div style="text-align: center;">
      <a href="${data.verification_url || PRODUCTION_DOMAIN}" class="cta-button">Verify Email</a>
    </div>
    
    <p style="font-size: 14px; color: #888; margin-top: 20px;">
      Or copy and paste this link into your browser:<br>
      <a href="${data.verification_url || PRODUCTION_DOMAIN}" style="color: #D946EF; word-break: break-all;">${data.verification_url || PRODUCTION_DOMAIN}</a>
    </p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #888;">This link will expire in 24 hours. If you didn't sign up, please ignore this email.</p>
  `),
  
  activation: (data: any) => emailWrapper(`
    <h1>Activate Your Account</h1>
    <p>Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Welcome to BAK55 Talent! Use the code below to activate your account:</p>
    
    <div class="highlight-box">
      <p style="margin-bottom: 10px; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Your Activation Code</p>
      <div class="code">${data.activation_code || '------'}</div>
    </div>
    
    <p>Enter this code on the activation page to complete your registration.</p>
    
    <div style="text-align: center;">
      <a href="${PRODUCTION_DOMAIN}/verify-account" class="cta-button">Activate Account</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #888;">
      This code will expire in 24 hours. If you didn't sign up, please ignore this email.
    </p>
  `),
  
  password_reset: (data: any) => emailWrapper(`
    <h1>Reset Your Password</h1>
    <p>Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    
    <div style="text-align: center;">
      <a href="${data.reset_url || PRODUCTION_DOMAIN + '/reset-password'}" class="cta-button">Reset Password</a>
    </div>
    
    <p style="font-size: 14px; color: #888; margin-top: 20px;">
      Or copy and paste this link:<br>
      <a href="${data.reset_url || PRODUCTION_DOMAIN}" style="color: #D946EF; word-break: break-all;">${data.reset_url || PRODUCTION_DOMAIN}</a>
    </p>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #888;">
      This link will expire in 1 hour. If you didn't request this, please ignore this email or contact support if you have concerns.
    </p>
  `),
  
  onboarding_upload: (data: any) => emailWrapper(`
    <h1>Ready to Share Your Music? 🎤</h1>
    <p>Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>You've set up your profile - awesome! Now it's time to share your first track with the world.</p>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #333; font-weight: 500;">Uploading is simple:</p>
    </div>
    
    <ul>
      <li><span class="step-number">1</span> Click "Upload Track" from your dashboard</li>
      <li><span class="step-number">2</span> Add your audio file (MP3, WAV, or M4A)</li>
      <li><span class="step-number">3</span> Add cover art and details</li>
      <li><span class="step-number">4</span> Submit for review (usually approved within 24 hours)</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="${PRODUCTION_DOMAIN}/upload" class="cta-button">Upload Your First Track</a>
    </div>
    
    <div class="divider"></div>
    
    <p style="font-size: 14px; color: #888;">
      <strong>Pro tip:</strong> High-quality audio and eye-catching cover art help your tracks stand out!
    </p>
  `),
  
  onboarding_competitions: (data: any) => emailWrapper(`
    <h1>Win Big in Competitions! 🏆</h1>
    <p>Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Did you know you can win BAKCoins and prizes by entering music competitions? Here's how it works:</p>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #D946EF; font-size: 24px; font-weight: 700;">Win up to 1000+ BAKCoins</p>
    </div>
    
    <p><strong>How competitions work:</strong></p>
    <ul>
      <li>Submit your best track to active competitions</li>
      <li>Get scored by AI and fan voting (70% fans, 30% AI)</li>
      <li>Top 3 artists win prize pools</li>
      <li>Gain exposure to thousands of listeners</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="${PRODUCTION_DOMAIN}/competitions" class="cta-button">View Active Competitions</a>
    </div>
  `),
  
  onboarding_monetization: (data: any) => emailWrapper(`
    <h1>Start Earning with Your Music 💰</h1>
    <p>Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>BAK55 Talent isn't just about exposure - it's about earning from your craft. Here's how you can monetize:</p>
    
    <ul>
      <li><strong>Tips:</strong> Fans can tip you BAKCoins directly</li>
      <li><strong>Competitions:</strong> Win cash prizes and BAKCoins</li>
      <li><strong>Streaming:</strong> Earn per play (coming soon)</li>
      <li><strong>Collaborations:</strong> Connect with producers and brands</li>
    </ul>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #333;">1 BAKCoin = 20 KES</p>
      <p style="margin: 5px 0 0; color: #888; font-size: 14px;">Withdraw earnings directly to M-PESA</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">View Your Wallet</a>
    </div>
  `),
  
  profile_reminder: (data: any) => emailWrapper(`
    <h1>Complete Your Profile ✨</h1>
    <p>Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>We noticed your profile isn't complete yet. A complete profile helps you:</p>
    
    <ul>
      <li>Get discovered by fans and collaborators</li>
      <li>Build credibility in the community</li>
      <li>Increase engagement on your tracks</li>
      <li>Attract brand partnerships</li>
    </ul>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #333; font-weight: 500;">Missing: ${data.missing_items || 'Profile photo, bio, social links'}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${PRODUCTION_DOMAIN}/profile" class="cta-button">Complete Profile</a>
    </div>
  `),
  
  competition_submission: (data: any) => emailWrapper(`
    <h1>Submission Received! 🎯</h1>
    <p>Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>
    <p>Your track "<strong>${data.track_title || 'Your Track'}</strong>" has been submitted to:</p>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #D946EF; font-size: 20px; font-weight: 600;">${data.competition_title || 'Competition'}</p>
    </div>
    
    <p><strong>What happens next:</strong></p>
    <ul>
      <li>AI analysis in progress (completed within 24 hours)</li>
      <li>Voting opens: ${data.voting_start_date || 'TBA'}</li>
      <li>Voting closes: ${data.voting_end_date || 'TBA'}</li>
      <li>Winners announced shortly after voting ends</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="${PRODUCTION_DOMAIN}/competition/${data.competition_id || ''}" class="cta-button">View Competition</a>
    </div>
    
    <p style="margin-top: 20px;">Good luck! 🍀</p>
  `),
  
  competition_winner: (data: any) => emailWrapper(`
    <h1>🎉 Congratulations! You Won!</h1>
    <p>Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>
    <p>We're thrilled to announce that your submission "<strong>${data.track_title || 'Your Track'}</strong>" has won <strong>${data.position || ''} place</strong> in:</p>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #D946EF; font-size: 24px; font-weight: 700;">${data.competition_title || 'Competition'}</p>
    </div>
    
    <p><strong>Prize Details:</strong></p>
    <ul>
      <li>Position: <strong>${data.position || 'N/A'}</strong></li>
      <li>Prize: <strong>${data.prize_amount || 0} BAKCoins</strong></li>
      <li>Final Score: <strong>${data.final_score || 0}/100</strong></li>
    </ul>
    
    <p>Your prize has been automatically credited to your wallet!</p>
    
    <div style="text-align: center;">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">View Your Wallet</a>
    </div>
    
    <p style="margin-top: 20px;">Keep creating amazing music! 🏆</p>
  `),
  
  withdrawal_request: (data: any) => emailWrapper(`
    <h1>Withdrawal Request Received 💰</h1>
    <p>Hi <strong>${data.username || 'User'}</strong>,</p>
    <p>We've received your withdrawal request with the following details:</p>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #333;"><strong>${data.amount || 0} BAKCoins</strong></p>
      <p style="margin: 5px 0 0; color: #888;">≈ ${data.ksh_amount || 0} KES</p>
    </div>
    
    <ul>
      <li>Phone Number: ${data.phone_number || 'N/A'}</li>
      <li>Reference: ${data.reference || 'N/A'}</li>
    </ul>
    
    <p><strong>Processing Time:</strong> Usually within 2 hours</p>
    <p>You'll receive another email once the withdrawal is processed.</p>
    
    <div style="text-align: center;">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">View Wallet</a>
    </div>
  `),
  
  withdrawal_complete: (data: any) => emailWrapper(`
    <h1>Withdrawal Successful! ✅</h1>
    <p>Hi <strong>${data.username || 'User'}</strong>,</p>
    <p>Great news! Your withdrawal has been processed successfully.</p>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #28a745; font-size: 24px; font-weight: 700;">KES ${data.ksh_amount || 0}</p>
      <p style="margin: 5px 0 0; color: #888;">has been sent to ${data.phone_number || 'your M-PESA'}</p>
    </div>
    
    <ul>
      <li>BAKCoins: ${data.amount || 0}</li>
      <li>Transaction ID: ${data.transaction_id || 'N/A'}</li>
      <li>M-PESA Receipt: ${data.receipt_number || 'Pending'}</li>
    </ul>
    
    <p>The funds should appear in your mobile money account within a few minutes.</p>
  `),
  
  tip_received: (data: any) => emailWrapper(`
    <h1>You Received a Tip! 💝</h1>
    <p>Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>
    <p><strong>${data.tipper_name || 'A fan'}</strong> just sent you a tip!</p>
    
    <div class="highlight-box">
      <p style="margin: 0; color: #D946EF; font-size: 32px; font-weight: 700;">${data.amount || 0} BAKCoins</p>
    </div>
    
    ${data.message ? `<p style="font-style: italic; color: #666; text-align: center;">"${data.message}"</p>` : ''}
    ${data.track_title ? `<p style="text-align: center;">For: <strong>${data.track_title}</strong></p>` : ''}
    
    <p style="text-align: center; color: #888;">New wallet balance: <strong>${data.new_balance || 0} BAKCoins</strong></p>
    
    <div style="text-align: center;">
      <a href="${data.track_url || PRODUCTION_DOMAIN}" class="cta-button">View Track</a>
    </div>
  `),
  
  contact_form: (data: any) => emailWrapper(`
    <h1>New Contact Form Submission 📧</h1>
    <p><strong>From:</strong> ${data.name || 'Unknown'} (${data.email || 'No email'})</p>
    <p><strong>Subject:</strong> ${data.subject || 'No subject'}</p>
    
    <div class="divider"></div>
    
    <p><strong>Message:</strong></p>
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
      ${data.message || 'No message'}
    </div>
    
    <p style="font-size: 12px; color: #888;">This email was sent from the BAK55 Contact Form</p>
  `),
  
  custom: (data: any) => emailWrapper(data.html_content || '<p>No content provided</p>'),
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
        from: "BAK55 Talent <onboarding@resend.dev>", // Change to verified domain in production
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
    const { to, subject, template, data, html }: EmailRequest = body;

    console.log('Email request received:', { to, subject, template });

    // Validate required fields
    if (!to || !subject) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields (to, subject)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailHtml: string;

    // Support custom HTML emails from admin
    if (template === 'custom' && html) {
      emailHtml = emailWrapper(html);
    } else if (template && templates[template]) {
      emailHtml = templates[template](data || {});
    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid template: ${template}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Send email via Resend API
    const result = await sendEmailViaResend(to, subject, emailHtml);

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
