import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  template: 'welcome' | 'verification' | 'competition_submission' | 'competition_winner' | 'withdrawal_request' | 'withdrawal_complete' | 'tip_received' | 'contact_form';
  data?: Record<string, any>;
}

const templates = {
  welcome: (data: any) => `
    <h1>Welcome to BAK55 Talent Platform! 🎵</h1>
    <p>Hi ${data.username},</p>
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
    <p>Hi ${data.username},</p>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="${data.verification_url}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
    <p>Or copy and paste this link into your browser:</p>
    <p>${data.verification_url}</p>
    <p>This link will expire in 24 hours.</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  competition_submission: (data: any) => `
    <h1>Competition Submission Received! 🎯</h1>
    <p>Hi ${data.artist_name},</p>
    <p>Your submission "<strong>${data.track_title}</strong>" has been successfully submitted to the competition:</p>
    <h2>${data.competition_title}</h2>
    <p><strong>What happens next:</strong></p>
    <ul>
      <li>AI analysis in progress (will be completed within 24 hours)</li>
      <li>Voting opens: ${data.voting_start_date}</li>
      <li>Voting closes: ${data.voting_end_date}</li>
      <li>Winners announced: Shortly after voting ends</li>
    </ul>
    <p>Good luck! 🍀</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  competition_winner: (data: any) => `
    <h1>🎉 Congratulations! You Won!</h1>
    <p>Hi ${data.artist_name},</p>
    <p>We're thrilled to announce that your submission "<strong>${data.track_title}</strong>" has won ${data.position} place in:</p>
    <h2>${data.competition_title}</h2>
    <p><strong>Prize Details:</strong></p>
    <ul>
      <li>Position: ${data.position}</li>
      <li>Prize: ${data.prize_amount} BAKCoins</li>
      <li>Final Score: ${data.final_score}/100</li>
    </ul>
    <p>Your prize has been automatically credited to your wallet!</p>
    <p><a href="${data.wallet_url}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Wallet</a></p>
    <p>Congratulations again! 🏆</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  withdrawal_request: (data: any) => `
    <h1>Withdrawal Request Received 💰</h1>
    <p>Hi ${data.username},</p>
    <p>We've received your withdrawal request:</p>
    <ul>
      <li>Amount: ${data.amount} BAKCoins (${data.ksh_amount} KSh)</li>
      <li>Phone Number: ${data.phone_number}</li>
      <li>Reference: ${data.reference}</li>
    </ul>
    <p><strong>Processing Time:</strong> Usually within 2 hours</p>
    <p>You'll receive another email once the withdrawal is processed.</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  withdrawal_complete: (data: any) => `
    <h1>Withdrawal Processed Successfully ✅</h1>
    <p>Hi ${data.username},</p>
    <p>Your withdrawal has been successfully processed!</p>
    <ul>
      <li>Amount: ${data.amount} BAKCoins (${data.ksh_amount} KSh)</li>
      <li>Phone Number: ${data.phone_number}</li>
      <li>Transaction ID: ${data.transaction_id}</li>
      <li>M-PESA Receipt: ${data.receipt_number || 'Pending'}</li>
    </ul>
    <p>The funds should appear in your mobile money account within a few minutes.</p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  tip_received: (data: any) => `
    <h1>You Received a Tip! 💝</h1>
    <p>Hi ${data.artist_name},</p>
    <p>${data.tipper_name} sent you a tip of <strong>${data.amount} BAKCoins</strong>!</p>
    ${data.message ? `<p><em>"${data.message}"</em></p>` : ''}
    ${data.track_title ? `<p>For your track: <strong>${data.track_title}</strong></p>` : ''}
    <p>Your new wallet balance: ${data.new_balance} BAKCoins</p>
    <p><a href="${data.track_url}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Track</a></p>
    <p>Best regards,<br>The BAK55 Team</p>
  `,
  
  contact_form: (data: any) => `
    <h1>New Contact Form Submission 📧</h1>
    <p><strong>From:</strong> ${data.name} (${data.email})</p>
    <p><strong>Subject:</strong> ${data.subject}</p>
    <p><strong>Message:</strong></p>
    <p>${data.message}</p>
    <hr />
    <p><small>This email was sent from the BAK55 Contact Form</small></p>
  `,
};

async function sendEmailViaResend(to: string, subject: string, html: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "BAK55 Talent <notifications@bak55talent.co.ke>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, template, data }: EmailRequest = await req.json();

    if (!to || !subject || !template) {
      throw new Error("Missing required fields: to, subject, template");
    }

    if (!templates[template]) {
      throw new Error(`Invalid template: ${template}`);
    }

    const html = templates[template](data || {});
    const emailResponse = await sendEmailViaResend(to, subject, html);

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
