import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCTION_DOMAIN = "https://bak55talent.co.ke";
const SUPPORT_EMAIL = "support@bak55talent.co.ke";
const COMPANY_NAME = "BAK55 Talent";

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
  html?: string;
}

// ─── Enterprise Email Wrapper ──────────────────────────────────────
const emailWrapper = (content: string, preheader?: string) => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${COMPANY_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; width: 100%; background-color: #0f0f1a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    img { border: 0; display: block; outline: none; text-decoration: none; max-width: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { padding: 0; }
    
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; color: #0f0f1a; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; }
    
    .header { background: linear-gradient(135deg, #D946EF 0%, #9333EA 50%, #6366F1 100%); padding: 40px 30px 35px; text-align: center; }
    .header-logo { font-size: 28px; font-weight: 800; color: #ffffff; text-decoration: none; letter-spacing: -0.5px; }
    .header-tagline { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 8px; letter-spacing: 1px; text-transform: uppercase; }
    
    .body-content { padding: 45px 35px 40px; background: #ffffff; }
    
    h1 { color: #0f0f1a; font-size: 26px; font-weight: 800; margin: 0 0 20px; line-height: 1.3; letter-spacing: -0.5px; }
    h2 { color: #0f0f1a; font-size: 20px; font-weight: 700; margin: 0 0 15px; line-height: 1.4; }
    p { color: #4a4a5a; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    
    .greeting { color: #0f0f1a; font-size: 15px; margin-bottom: 20px; }
    .greeting strong { color: #D946EF; }
    
    .cta-wrapper { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #D946EF 0%, #9333EA 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 15px rgba(217, 70, 239, 0.4); }
    .cta-secondary { display: inline-block; background: #f4f4f8; color: #0f0f1a !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #e2e2ea; }
    
    .highlight-card { background: linear-gradient(135deg, rgba(217,70,239,0.08) 0%, rgba(147,51,234,0.08) 100%); border: 1px solid rgba(217,70,239,0.2); border-radius: 14px; padding: 28px; margin: 25px 0; text-align: center; }
    .highlight-card .label { font-size: 12px; color: #8b8ba0; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-weight: 600; }
    .highlight-card .value { font-size: 36px; font-weight: 800; color: #D946EF; letter-spacing: 6px; font-family: 'Courier New', monospace; }
    .highlight-card .value-text { font-size: 24px; font-weight: 800; color: #D946EF; letter-spacing: 0; font-family: 'Inter', sans-serif; }
    
    .info-card { background: #f8f8fc; border-radius: 12px; padding: 20px 24px; margin: 20px 0; border-left: 4px solid #D946EF; }
    .info-card p { margin: 0; color: #4a4a5a; font-size: 14px; }
    .info-card strong { color: #0f0f1a; }
    
    .detail-table { width: 100%; margin: 20px 0; }
    .detail-table td { padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f0f0f5; }
    .detail-table .label-cell { color: #8b8ba0; font-weight: 500; width: 40%; }
    .detail-table .value-cell { color: #0f0f1a; font-weight: 600; text-align: right; }
    
    .step-list { margin: 20px 0; padding: 0; list-style: none; }
    .step-item { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .step-num { display: inline-block; width: 30px; height: 30px; min-width: 30px; background: linear-gradient(135deg, #D946EF 0%, #9333EA 100%); color: #fff; border-radius: 50%; text-align: center; line-height: 30px; font-weight: 700; font-size: 13px; margin-right: 14px; }
    .step-text { color: #4a4a5a; font-size: 14px; line-height: 1.6; padding-top: 4px; }
    
    .divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e2ea, transparent); margin: 30px 0; }
    
    .success-badge { display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .warning-badge { display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    
    .footer { background: #0f0f1a; padding: 35px 30px; text-align: center; }
    .footer-nav { margin-bottom: 20px; }
    .footer-nav a { color: #D946EF; text-decoration: none; font-size: 13px; font-weight: 500; margin: 0 12px; }
    .footer-text { color: #6b6b80; font-size: 12px; line-height: 1.8; margin: 0; }
    .footer-text a { color: #D946EF; text-decoration: none; }
    .footer-legal { color: #4a4a5a; font-size: 11px; margin-top: 20px; line-height: 1.6; }
    
    .note { font-size: 13px; color: #8b8ba0; line-height: 1.6; }
    .link-text { color: #D946EF; text-decoration: none; font-weight: 500; }
    
    @media only screen and (max-width: 620px) {
      .email-container { margin: 0 !important; border-radius: 0 !important; }
      .body-content { padding: 30px 20px !important; }
      .header { padding: 30px 20px 25px !important; }
      h1 { font-size: 22px !important; }
      .highlight-card .value { font-size: 28px !important; }
    }
  </style>
</head>
<body>
  <div class="preheader">${preheader || ''}</div>
  <center style="width: 100%; background: #0f0f1a; padding: 30px 10px;">
    <div class="email-container">
      <div class="header">
        <a href="${PRODUCTION_DOMAIN}" class="header-logo">🎵 ${COMPANY_NAME}</a>
        <div class="header-tagline">Africa's Premier Music Talent Platform</div>
      </div>
      <div class="body-content">
        ${content}
      </div>
      <div class="footer">
        <div class="footer-nav">
          <a href="${PRODUCTION_DOMAIN}">Website</a>
          <a href="${PRODUCTION_DOMAIN}/faq">FAQ</a>
          <a href="${PRODUCTION_DOMAIN}/contact">Contact</a>
          <a href="${PRODUCTION_DOMAIN}/terms">Terms</a>
        </div>
        <p class="footer-text">
          © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br>
          Nairobi, Kenya · <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
        <p class="footer-legal">
          You're receiving this because you have an account on ${COMPANY_NAME}.<br>
          <a href="${PRODUCTION_DOMAIN}/profile">Manage notification preferences</a>
        </p>
      </div>
    </div>
  </center>
</body>
</html>
`;

// ─── Enterprise Templates ──────────────────────────────────────
const templates: Record<string, (data: any) => string> = {

  // ━━━ AUTH: Welcome ━━━
  welcome: (data: any) => {
    const role = data.role || 'fan';
    const roleTips: Record<string, string> = {
      artist: `
        <div class="step-item"><span class="step-num">1</span><span class="step-text"><strong>Upload your first track</strong> — share your music with thousands of listeners</span></div>
        <div class="step-item"><span class="step-num">2</span><span class="step-text"><strong>Enter competitions</strong> — win BAKCoins and get discovered</span></div>
        <div class="step-item"><span class="step-num">3</span><span class="step-text"><strong>Build your fanbase</strong> — connect with fans who tip and support you</span></div>
        <div class="step-item"><span class="step-num">4</span><span class="step-text"><strong>Collaborate</strong> — work with producers and fellow artists</span></div>
      `,
      producer: `
        <div class="step-item"><span class="step-num">1</span><span class="step-text"><strong>Upload your beats</strong> — showcase your production catalog</span></div>
        <div class="step-item"><span class="step-num">2</span><span class="step-text"><strong>Set licensing tiers</strong> — earn from lease, premium, and exclusive sales</span></div>
        <div class="step-item"><span class="step-num">3</span><span class="step-text"><strong>Collaborate with artists</strong> — get custom work requests</span></div>
        <div class="step-item"><span class="step-num">4</span><span class="step-text"><strong>Grow your brand</strong> — build your producer profile and reputation</span></div>
      `,
      brand: `
        <div class="step-item"><span class="step-num">1</span><span class="step-text"><strong>Discover talent</strong> — browse Africa's most exciting emerging artists</span></div>
        <div class="step-item"><span class="step-num">2</span><span class="step-text"><strong>Sponsor competitions</strong> — put your brand in front of passionate music fans</span></div>
        <div class="step-item"><span class="step-num">3</span><span class="step-text"><strong>Partner with artists</strong> — authentic collaborations that resonate</span></div>
      `,
      fan: `
        <div class="step-item"><span class="step-num">1</span><span class="step-text"><strong>Explore trending music</strong> — discover Africa's next big stars</span></div>
        <div class="step-item"><span class="step-num">2</span><span class="step-text"><strong>Vote in competitions</strong> — help decide who wins</span></div>
        <div class="step-item"><span class="step-num">3</span><span class="step-text"><strong>Tip your favorites</strong> — support artists directly with BAKCoins</span></div>
        <div class="step-item"><span class="step-num">4</span><span class="step-text"><strong>Earn rewards</strong> — get BAKCoins for listening, voting, and sharing</span></div>
      `,
    };

    return emailWrapper(`
      <h1>Welcome to ${COMPANY_NAME}! 🎉</h1>
      <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
      <p>We're thrilled to have you join Africa's premier music talent platform. You're now part of a community of ${role === 'artist' ? 'talented creators' : role === 'producer' ? 'innovative producers' : role === 'brand' ? 'forward-thinking brands' : 'passionate music lovers'}.</p>
      
      <div class="highlight-card">
        <div class="label">Your Account</div>
        <div class="value-text">${(data.username || data.email || 'Member').toUpperCase()}</div>
        <p style="margin: 8px 0 0; color: #8b8ba0; font-size: 13px;">${role.charAt(0).toUpperCase() + role.slice(1)} Account · Verified ✓</p>
      </div>
      
      <h2>Get started in 4 steps:</h2>
      <div class="step-list">
        ${roleTips[role] || roleTips.fan}
      </div>
      
      <div class="cta-wrapper">
        <a href="${PRODUCTION_DOMAIN}/${role === 'fan' ? 'fan' : role}/dashboard" class="cta-button">Go to Your Dashboard →</a>
      </div>
      
      <div class="divider"></div>
      <p class="note">Need help? Visit our <a href="${PRODUCTION_DOMAIN}/faq" class="link-text">FAQ</a> or email us at <a href="mailto:${SUPPORT_EMAIL}" class="link-text">${SUPPORT_EMAIL}</a>.</p>
    `, `Welcome to ${COMPANY_NAME}! Your ${role} account is ready.`);
  },

  // ━━━ AUTH: Account Activation ━━━
  activation: (data: any) => emailWrapper(`
    <h1>Activate Your Account 🔐</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Welcome to ${COMPANY_NAME}! Enter the 6-digit code below to activate your account and get started.</p>
    
    <div class="highlight-card">
      <div class="label">Your Activation Code</div>
      <div class="value">${data.activation_code || '------'}</div>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/verify-account" class="cta-button">Activate My Account →</a>
    </div>
    
    <div class="info-card">
      <p>⏰ This code expires in <strong>24 hours</strong>. If you didn't create an account with ${COMPANY_NAME}, you can safely ignore this email.</p>
    </div>
  `, `Your activation code: ${data.activation_code || '------'}`),

  // ━━━ AUTH: Email Verification ━━━
  verification: (data: any) => emailWrapper(`
    <h1>Verify Your Email Address ✉️</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Please verify your email address to unlock all ${COMPANY_NAME} features.</p>
    
    <div class="cta-wrapper">
      <a href="${data.verification_url || PRODUCTION_DOMAIN}" class="cta-button">Verify Email Address →</a>
    </div>
    
    <p class="note" style="text-align: center;">Or copy this link into your browser:</p>
    <div class="info-card">
      <p style="word-break: break-all;"><a href="${data.verification_url || PRODUCTION_DOMAIN}" class="link-text">${data.verification_url || PRODUCTION_DOMAIN}</a></p>
    </div>
    
    <div class="divider"></div>
    <p class="note">This link expires in 24 hours. If you didn't sign up, please ignore this email.</p>
  `, 'Verify your email to complete your registration.'),

  // ━━━ AUTH: Password Reset ━━━
  password_reset: (data: any) => emailWrapper(`
    <h1>Reset Your Password 🔑</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to create a new one.</p>
    
    <div class="cta-wrapper">
      <a href="${data.reset_url || PRODUCTION_DOMAIN + '/reset-password'}" class="cta-button">Reset Password →</a>
    </div>
    
    <div class="info-card">
      <p>🔒 This link expires in <strong>1 hour</strong> for security. If you didn't request this reset, no action is needed — your password remains unchanged.</p>
    </div>
    
    <p class="note" style="text-align: center;">Can't click the button? Copy this link:<br>
    <a href="${data.reset_url || PRODUCTION_DOMAIN + '/reset-password'}" class="link-text" style="word-break: break-all;">${data.reset_url || PRODUCTION_DOMAIN + '/reset-password'}</a></p>
  `, 'Password reset request for your account.'),

  // ━━━ COMPETITION: Submission Received ━━━
  competition_submission: (data: any) => emailWrapper(`
    <h1>Submission Received! 🎯</h1>
    <p class="greeting">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>
    <p>Your track has been successfully submitted to the competition. Here are the details:</p>
    
    <div class="highlight-card">
      <div class="label">Competition</div>
      <div class="value-text">${data.competition_title || 'Music Competition'}</div>
    </div>
    
    <table class="detail-table">
      <tr><td class="label-cell">Track</td><td class="value-cell">${data.track_title || 'Your Track'}</td></tr>
      <tr><td class="label-cell">Voting Opens</td><td class="value-cell">${data.voting_start_date || 'To be announced'}</td></tr>
      <tr><td class="label-cell">Voting Closes</td><td class="value-cell">${data.voting_end_date || 'To be announced'}</td></tr>
      <tr><td class="label-cell">Scoring</td><td class="value-cell">70% Fan Votes · 30% AI</td></tr>
    </table>
    
    <div class="info-card">
      <p>📊 <strong>What happens next:</strong> Your submission will be analyzed by our AI scoring system within 24 hours. Once voting opens, share your track to rally fan support!</p>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/competition/${data.competition_id || ''}" class="cta-button">View Competition →</a>
    </div>
    
    <p style="text-align: center; color: #8b8ba0; font-size: 14px;">Good luck! 🍀 Share your submission to increase your chances.</p>
  `, `Your track "${data.track_title}" has been submitted!`),

  // ━━━ COMPETITION: Winner ━━━
  competition_winner: (data: any) => emailWrapper(`
    <h1>🏆 Congratulations, You Won!</h1>
    <p class="greeting">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>
    <p>Incredible news! Your track "<strong>${data.track_title || 'Your Track'}</strong>" has placed in the competition!</p>
    
    <div class="highlight-card">
      <div class="label">${data.competition_title || 'Competition'}</div>
      <div class="value-text">${data.position || '1st'} Place 🏆</div>
    </div>
    
    <table class="detail-table">
      <tr><td class="label-cell">Prize</td><td class="value-cell" style="color: #D946EF; font-size: 18px;">${data.prize_amount || 0} BAKCoins</td></tr>
      <tr><td class="label-cell">Final Score</td><td class="value-cell">${data.final_score || 0}/100</td></tr>
      <tr><td class="label-cell">Status</td><td class="value-cell"><span class="success-badge">Prize Credited</span></td></tr>
    </table>
    
    <p>Your prize has been automatically credited to your wallet. Keep creating — the world is listening! 🎶</p>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">View Your Wallet →</a>
    </div>
  `, `You won ${data.position || ''} place! ${data.prize_amount || 0} BAKCoins credited.`),

  // ━━━ WALLET: Withdrawal Request ━━━
  withdrawal_request: (data: any) => emailWrapper(`
    <h1>Withdrawal Request Received 💰</h1>
    <p class="greeting">Hi <strong>${data.username || 'User'}</strong>,</p>
    <p>We've received your withdrawal request. Here are the details:</p>
    
    <div class="highlight-card">
      <div class="label">Withdrawal Amount</div>
      <div class="value-text">${data.amount || 0} BAKCoins</div>
      <p style="margin: 8px 0 0; color: #8b8ba0; font-size: 14px;">≈ KES ${data.ksh_amount || 0}</p>
    </div>
    
    <table class="detail-table">
      <tr><td class="label-cell">M-PESA Number</td><td class="value-cell">${data.phone_number || 'N/A'}</td></tr>
      <tr><td class="label-cell">Reference</td><td class="value-cell">${data.reference || 'N/A'}</td></tr>
      <tr><td class="label-cell">Status</td><td class="value-cell"><span class="warning-badge">Processing</span></td></tr>
      <tr><td class="label-cell">Est. Time</td><td class="value-cell">Within 2 hours</td></tr>
    </table>
    
    <p>You'll receive another email once the withdrawal is processed and sent to your M-PESA.</p>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">Track in Wallet →</a>
    </div>
    
    <div class="info-card">
      <p>🔒 If you didn't request this withdrawal, please contact support immediately at <a href="mailto:${SUPPORT_EMAIL}" class="link-text">${SUPPORT_EMAIL}</a>.</p>
    </div>
  `, `Withdrawal of ${data.amount || 0} BAKCoins is being processed.`),

  // ━━━ WALLET: Withdrawal Complete ━━━
  withdrawal_complete: (data: any) => emailWrapper(`
    <h1>Withdrawal Successful! ✅</h1>
    <p class="greeting">Hi <strong>${data.username || 'User'}</strong>,</p>
    <p>Great news! Your withdrawal has been processed and sent to your M-PESA.</p>
    
    <div class="highlight-card">
      <div class="value-text" style="color: #10B981;">KES ${data.ksh_amount || 0}</div>
      <p style="margin: 8px 0 0; color: #8b8ba0; font-size: 14px;">Sent to ${data.phone_number || 'your M-PESA'}</p>
    </div>
    
    <table class="detail-table">
      <tr><td class="label-cell">BAKCoins</td><td class="value-cell">${data.amount || 0}</td></tr>
      <tr><td class="label-cell">Transaction ID</td><td class="value-cell">${data.transaction_id || 'N/A'}</td></tr>
      <tr><td class="label-cell">M-PESA Receipt</td><td class="value-cell">${data.receipt_number || 'Check your phone'}</td></tr>
      <tr><td class="label-cell">Status</td><td class="value-cell"><span class="success-badge">Complete</span></td></tr>
    </table>
    
    <p>The funds should appear in your mobile money account within a few minutes.</p>
  `, `KES ${data.ksh_amount || 0} has been sent to your M-PESA.`),

  // ━━━ SOCIAL: Tip Received ━━━
  tip_received: (data: any) => emailWrapper(`
    <h1>You Received a Tip! 💝</h1>
    <p class="greeting">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>
    <p>A fan just showed their love for your music!</p>
    
    <div class="highlight-card">
      <div class="label">Tip Amount</div>
      <div class="value-text" style="color: #D946EF;">${data.amount || 0} BAKCoins</div>
      <p style="margin: 10px 0 0; color: #8b8ba0; font-size: 14px;">From <strong style="color: #0f0f1a;">${data.tipper_name || 'A fan'}</strong></p>
    </div>
    
    ${data.message ? `<div class="info-card"><p style="font-style: italic;">"${data.message}"</p></div>` : ''}
    ${data.track_title ? `<p style="text-align: center; color: #8b8ba0;">For: <strong style="color: #0f0f1a;">${data.track_title}</strong></p>` : ''}
    
    <table class="detail-table">
      <tr><td class="label-cell">New Balance</td><td class="value-cell" style="color: #D946EF; font-weight: 700;">${data.new_balance || 0} BAKCoins</td></tr>
    </table>
    
    <div class="cta-wrapper">
      <a href="${data.track_url || PRODUCTION_DOMAIN + '/wallet'}" class="cta-button">View Wallet →</a>
    </div>
  `, `${data.tipper_name || 'A fan'} tipped you ${data.amount || 0} BAKCoins!`),

  // ━━━ SOCIAL: New Follower ━━━
  new_follower: (data: any) => emailWrapper(`
    <h1>New Follower! 👥</h1>
    <p class="greeting">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>
    <p>Your fanbase just grew! <strong>${data.follower_name || 'Someone'}</strong> started following you on ${COMPANY_NAME}.</p>
    
    <div class="highlight-card">
      <div class="label">Total Followers</div>
      <div class="value-text">${data.follower_count || '—'}</div>
    </div>
    
    <p>Keep creating great music to grow your audience even more!</p>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/artist/dashboard" class="cta-button">View Dashboard →</a>
    </div>
  `, `${data.follower_name || 'Someone'} started following you!`),

  // ━━━ CONTENT: Track Approved ━━━
  track_approved: (data: any) => emailWrapper(`
    <h1>Track Approved! ✅</h1>
    <p class="greeting">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>
    <p>Great news — your track has been reviewed and approved! It's now live on ${COMPANY_NAME}.</p>
    
    <div class="highlight-card">
      <div class="label">Now Live</div>
      <div class="value-text">${data.track_title || 'Your Track'}</div>
    </div>
    
    <p>Share it with your audience to get those first plays rolling!</p>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/track/${data.track_id || ''}" class="cta-button">View Your Track →</a>
    </div>
    
    <div class="info-card">
      <p>💡 <strong>Pro tip:</strong> Tracks that get shared on social media within the first 24 hours get 3x more plays!</p>
    </div>
  `, `Your track "${data.track_title}" is now live!`),

  // ━━━ CONTENT: Track Rejected ━━━
  track_rejected: (data: any) => emailWrapper(`
    <h1>Track Review Update ⚠️</h1>
    <p class="greeting">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>
    <p>Unfortunately, your track didn't pass our review process this time.</p>
    
    <table class="detail-table">
      <tr><td class="label-cell">Track</td><td class="value-cell">${data.track_title || 'Your Track'}</td></tr>
      <tr><td class="label-cell">Status</td><td class="value-cell" style="color: #EF4444;">Not Approved</td></tr>
      ${data.reason ? `<tr><td class="label-cell">Reason</td><td class="value-cell">${data.reason}</td></tr>` : ''}
    </table>
    
    <div class="info-card">
      <p>📝 <strong>What you can do:</strong> Review our <a href="${PRODUCTION_DOMAIN}/faq" class="link-text">content guidelines</a>, make adjustments, and re-upload. Most rejections are easily fixable!</p>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/upload" class="cta-button">Upload Again →</a>
    </div>
  `, `Your track "${data.track_title}" needs revision.`),

  // ━━━ ADMIN: Contact Form ━━━
  contact_form: (data: any) => emailWrapper(`
    <h1>New ${data.type || 'Contact'} Submission 📧</h1>
    
    <table class="detail-table">
      <tr><td class="label-cell">From</td><td class="value-cell">${data.name || 'Unknown'}</td></tr>
      <tr><td class="label-cell">Email</td><td class="value-cell"><a href="mailto:${data.email}" class="link-text">${data.email || 'No email'}</a></td></tr>
      <tr><td class="label-cell">Subject</td><td class="value-cell">${data.subject || 'No subject'}</td></tr>
      <tr><td class="label-cell">Received</td><td class="value-cell">${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</td></tr>
    </table>
    
    <div class="divider"></div>
    <h2>Message:</h2>
    <div class="info-card">
      <p>${data.message || 'No message provided.'}</p>
    </div>
    
    <p class="note">This message was sent via the ${COMPANY_NAME} ${data.type || 'contact'} form.</p>
  `, `New ${data.type || 'contact'} form submission from ${data.name || 'user'}.`),

  // ━━━ ADMIN: Track Upload Notification ━━━
  track_upload_admin: (data: any) => emailWrapper(`
    <h1>New Track Upload 🎵</h1>
    <p>A new track has been uploaded and requires moderation.</p>
    
    <table class="detail-table">
      <tr><td class="label-cell">Artist</td><td class="value-cell">${data.artist_name || data.artist_email || 'Unknown'}</td></tr>
      <tr><td class="label-cell">Track Title</td><td class="value-cell">${data.track_title || 'Untitled'}</td></tr>
      <tr><td class="label-cell">Genre</td><td class="value-cell">${data.genre || 'Not specified'}</td></tr>
      <tr><td class="label-cell">Status</td><td class="value-cell"><span class="warning-badge">Pending Review</span></td></tr>
      <tr><td class="label-cell">Uploaded</td><td class="value-cell">${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</td></tr>
    </table>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/admin" class="cta-button">Review in Admin Panel →</a>
    </div>
  `, `New track "${data.track_title}" needs moderation.`),

  // ━━━ ADMIN: Beat Upload Notification ━━━
  beat_upload_admin: (data: any) => emailWrapper(`
    <h1>New Beat Upload 🥁</h1>
    <p>A new beat has been uploaded and requires moderation.</p>
    
    <table class="detail-table">
      <tr><td class="label-cell">Producer</td><td class="value-cell">${data.producer_name || data.producer_email || 'Unknown'}</td></tr>
      <tr><td class="label-cell">Beat Title</td><td class="value-cell">${data.beat_title || 'Untitled'}</td></tr>
      <tr><td class="label-cell">Genre</td><td class="value-cell">${data.genre || 'Not specified'}</td></tr>
      <tr><td class="label-cell">BPM</td><td class="value-cell">${data.bpm || 'Not specified'}</td></tr>
      <tr><td class="label-cell">Status</td><td class="value-cell"><span class="warning-badge">Pending Review</span></td></tr>
    </table>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/admin" class="cta-button">Review in Admin Panel →</a>
    </div>
  `, `New beat "${data.beat_title}" needs moderation.`),

  // ━━━ ADMIN: New Signup Notification ━━━
  new_signup_admin: (data: any) => emailWrapper(`
    <h1>New ${data.user_type || 'User'} Signup 📋</h1>
    <p>A new user has signed up for ${COMPANY_NAME}.</p>
    
    <table class="detail-table">
      <tr><td class="label-cell">Email</td><td class="value-cell">${data.email || 'Unknown'}</td></tr>
      <tr><td class="label-cell">Type</td><td class="value-cell">${data.user_type || 'Fan'}</td></tr>
      <tr><td class="label-cell">Source</td><td class="value-cell">${data.source || 'Direct'}</td></tr>
      <tr><td class="label-cell">Date</td><td class="value-cell">${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</td></tr>
    </table>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/admin" class="cta-button">View in Admin →</a>
    </div>
  `, `New ${data.user_type || 'user'} signup: ${data.email || 'unknown'}`),

  // ━━━ ADMIN: Early Access Signup ━━━
  early_access_admin: (data: any) => emailWrapper(`
    <h1>New Early Access Signup 🚀</h1>
    <p>Someone just signed up for early access.</p>
    
    <table class="detail-table">
      <tr><td class="label-cell">Email</td><td class="value-cell">${data.email || 'Unknown'}</td></tr>
      <tr><td class="label-cell">Source</td><td class="value-cell">${data.source || 'Homepage CTA'}</td></tr>
      <tr><td class="label-cell">Date</td><td class="value-cell">${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</td></tr>
    </table>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/admin" class="cta-button">View Signups →</a>
    </div>
  `, `New early access signup: ${data.email || ''}`),

  // ━━━ ONBOARDING: Upload Guide (48h after signup) ━━━
  onboarding_upload: (data: any) => emailWrapper(`
    <h1>Ready to Share Your Music? 🎤</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>You've set up your profile — awesome! Now it's time to share your first track and start building your audience.</p>
    
    <h2>Upload in 4 simple steps:</h2>
    <div class="step-list">
      <div class="step-item"><span class="step-num">1</span><span class="step-text">Click <strong>"Upload Track"</strong> from your dashboard</span></div>
      <div class="step-item"><span class="step-num">2</span><span class="step-text">Add your audio file <strong>(MP3, WAV, or M4A)</strong></span></div>
      <div class="step-item"><span class="step-num">3</span><span class="step-text">Add cover art and details (title, genre)</span></div>
      <div class="step-item"><span class="step-num">4</span><span class="step-text">Submit for review — usually approved within <strong>24 hours</strong></span></div>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/upload" class="cta-button">Upload Your First Track →</a>
    </div>
    
    <div class="info-card">
      <p>💡 <strong>Pro tip:</strong> High-quality audio (320kbps+) and eye-catching cover art help your tracks stand out and get more plays!</p>
    </div>
  `, 'Time to upload your first track!'),

  // ━━━ ONBOARDING: Competitions Guide (72h after signup) ━━━
  onboarding_competitions: (data: any) => emailWrapper(`
    <h1>Win Big in Competitions! 🏆</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Did you know you can win BAKCoins and prizes by entering music competitions? It's one of the fastest ways to get discovered.</p>
    
    <div class="highlight-card">
      <div class="label">Prize Pools Up To</div>
      <div class="value-text">1,000+ BAKCoins</div>
    </div>
    
    <h2>How competitions work:</h2>
    <div class="step-list">
      <div class="step-item"><span class="step-num">1</span><span class="step-text">Submit your best track to an active competition</span></div>
      <div class="step-item"><span class="step-num">2</span><span class="step-text">Get scored: <strong>70% fan voting + 30% AI analysis</strong></span></div>
      <div class="step-item"><span class="step-num">3</span><span class="step-text">Top 3 artists win from the prize pool</span></div>
      <div class="step-item"><span class="step-num">4</span><span class="step-text">Gain exposure to thousands of listeners</span></div>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/competitions" class="cta-button">View Active Competitions →</a>
    </div>
  `, 'Enter competitions and win BAKCoins!'),

  // ━━━ ONBOARDING: Monetization Guide (96h after signup) ━━━
  onboarding_monetization: (data: any) => emailWrapper(`
    <h1>Start Earning with Your Music 💰</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>${COMPANY_NAME} isn't just about exposure — it's about earning real money from your craft. Here's how:</p>
    
    <div class="step-list">
      <div class="step-item"><span class="step-num">💝</span><span class="step-text"><strong>Tips</strong> — Fans tip you BAKCoins directly on your tracks</span></div>
      <div class="step-item"><span class="step-num">🏆</span><span class="step-text"><strong>Competitions</strong> — Win cash prizes and BAKCoins</span></div>
      <div class="step-item"><span class="step-num">🎵</span><span class="step-text"><strong>Streaming</strong> — Earn per play (coming soon)</span></div>
      <div class="step-item"><span class="step-num">🤝</span><span class="step-text"><strong>Collaborations</strong> — Connect with producers and brands</span></div>
    </div>
    
    <div class="highlight-card">
      <div class="label">Conversion Rate</div>
      <div class="value-text">1 BAKCoin = 20 KES</div>
      <p style="margin: 8px 0 0; color: #8b8ba0; font-size: 13px;">Withdraw earnings directly to M-PESA</p>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">View Your Wallet →</a>
    </div>
  `, 'Learn how to monetize your music on BAK55.'),

  // ━━━ ONBOARDING: Profile Reminder (24h after signup) ━━━
  profile_reminder: (data: any) => emailWrapper(`
    <h1>Complete Your Profile ✨</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>We noticed your profile isn't complete yet. Artists with complete profiles get <strong>5x more engagement</strong>!</p>
    
    <h2>What's missing:</h2>
    <div class="info-card">
      <p>${data.missing_items || '📸 Profile photo · ✍️ Bio · 🔗 Social links'}</p>
    </div>
    
    <p><strong>A complete profile helps you:</strong></p>
    <div class="step-list">
      <div class="step-item"><span class="step-num">🔍</span><span class="step-text">Get discovered by fans and collaborators</span></div>
      <div class="step-item"><span class="step-num">⭐</span><span class="step-text">Build credibility in the community</span></div>
      <div class="step-item"><span class="step-num">📈</span><span class="step-text">Increase engagement on your tracks</span></div>
      <div class="step-item"><span class="step-num">🤝</span><span class="step-text">Attract brand partnerships</span></div>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/profile" class="cta-button">Complete Your Profile →</a>
    </div>
  `, 'Complete your profile and get discovered!'),

  // ━━━ CUSTOM: Admin Custom Email ━━━
  custom: (data: any) => emailWrapper(data.html_content || '<p>No content provided.</p>'),

  // ━━━ Alias for 'contact' template name used in Support.tsx ━━━
  contact: (data: any) => emailWrapper(`
    <h1>New Support Ticket 🎫</h1>
    
    <table class="detail-table">
      <tr><td class="label-cell">From</td><td class="value-cell">${data.name || 'Unknown'}</td></tr>
      <tr><td class="label-cell">Email</td><td class="value-cell"><a href="mailto:${data.email}" class="link-text">${data.email || 'No email'}</a></td></tr>
      <tr><td class="label-cell">Type</td><td class="value-cell">${data.type || 'Support'}</td></tr>
      <tr><td class="label-cell">Received</td><td class="value-cell">${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</td></tr>
    </table>
    
    <div class="divider"></div>
    <h2>Message:</h2>
    <div class="info-card">
      <p>${data.message || 'No message provided.'}</p>
    </div>
  `, `Support ticket from ${data.name || 'user'}.`),

  // ━━━ WALLET: Purchase Success ━━━
  purchase_success: (data: any) => emailWrapper(`
    <h1>Purchase Successful! ✅</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Your payment has been processed and BAKCoins have been credited to your wallet.</p>
    
    <div class="highlight-card">
      <div class="label">BAKCoins Credited</div>
      <div class="value-text" style="color: #10B981;">${data.bak_amount || 0} BAKCoins</div>
      <p style="margin: 8px 0 0; color: #8b8ba0; font-size: 14px;">from KES ${data.amount_kes || 0} payment</p>
    </div>
    
    <table class="detail-table">
      <tr><td class="label-cell">Payment Method</td><td class="value-cell">${data.payment_method || 'M-Pesa / Selar'}</td></tr>
      <tr><td class="label-cell">Exchange Rate</td><td class="value-cell">20 KES = 1 BAK</td></tr>
      <tr><td class="label-cell">Reference</td><td class="value-cell">${data.reference || 'N/A'}</td></tr>
      <tr><td class="label-cell">Status</td><td class="value-cell"><span class="success-badge">Complete</span></td></tr>
    </table>
    
    <p>Your new balance is ready to use for voting, tipping artists, or entering competitions!</p>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">View Your Wallet →</a>
    </div>
  `, `${data.bak_amount || 0} BAKCoins credited to your wallet.`),

  // ━━━ SOCIAL: Referral Success ━━━
  referral_success: (data: any) => emailWrapper(`
    <h1>Referral Reward Earned! 🎉</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Great news! Your referral has completed their first deposit, and your reward has been credited.</p>
    
    <div class="highlight-card">
      <div class="label">Referral Reward</div>
      <div class="value-text" style="color: #D946EF;">${data.reward_amount || 0} BAKCoins</div>
      <p style="margin: 8px 0 0; color: #8b8ba0; font-size: 14px;">Referred: <strong style="color: #0f0f1a;">${data.referred_username || 'A new user'}</strong></p>
    </div>
    
    <div class="info-card">
      <p>💡 <strong>Keep sharing!</strong> Every friend you refer earns you BAKCoins when they make their first deposit. Share your referral code from your dashboard.</p>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">View Your Wallet →</a>
    </div>
  `, `You earned ${data.reward_amount || 0} BAKCoins from a referral!`),

  // ━━━ WALLET: Deposit Approved ━━━
  deposit_approved: (data: any) => emailWrapper(`
    <h1>Deposit Approved! ✅</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Your M-Pesa deposit has been verified and BAKCoins have been credited to your wallet.</p>
    
    <div class="highlight-card">
      <div class="label">Deposit Credited</div>
      <div class="value-text" style="color: #10B981;">${data.bak_amount || 0} BAKCoins</div>
      <p style="margin: 8px 0 0; color: #8b8ba0; font-size: 14px;">from KES ${data.amount_kes || 0} deposit</p>
    </div>
    
    <table class="detail-table">
      <tr><td class="label-cell">Receipt Code</td><td class="value-cell">${data.receipt_code || 'N/A'}</td></tr>
      <tr><td class="label-cell">Exchange Rate</td><td class="value-cell">20 KES = 1 BAK</td></tr>
      <tr><td class="label-cell">Status</td><td class="value-cell"><span class="success-badge">Approved</span></td></tr>
    </table>
    
    <p>Your BAKCoins are ready to use! Start voting in competitions, tipping your favorite artists, or save for withdrawals.</p>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">Go to Wallet →</a>
    </div>
  `, `Your deposit of KES ${data.amount_kes || 0} has been approved!`),

  // ━━━ WALLET: Deposit Rejected ━━━
  deposit_rejected: (data: any) => emailWrapper(`
    <h1>Deposit Request Update ⚠️</h1>
    <p class="greeting">Hi <strong>${data.username || 'there'}</strong>,</p>
    <p>Unfortunately, we were unable to verify your deposit request.</p>
    
    <table class="detail-table">
      <tr><td class="label-cell">Amount</td><td class="value-cell">KES ${data.amount_kes || 0}</td></tr>
      <tr><td class="label-cell">Receipt Code</td><td class="value-cell">${data.receipt_code || 'N/A'}</td></tr>
      <tr><td class="label-cell">Status</td><td class="value-cell" style="color: #EF4444;">Rejected</td></tr>
      ${data.reason ? `<tr><td class="label-cell">Reason</td><td class="value-cell">${data.reason}</td></tr>` : ''}
    </table>
    
    <div class="info-card">
      <p>📝 <strong>What you can do:</strong> Double-check your M-Pesa receipt code and resubmit. Make sure the transaction matches the amount submitted. If you believe this is an error, contact support.</p>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/wallet" class="cta-button">Try Again →</a>
      <br><br>
      <a href="mailto:${SUPPORT_EMAIL}" class="cta-secondary">Contact Support</a>
    </div>
  `, `Your deposit of KES ${data.amount_kes || 0} was not approved.`),

  // ━━━ ADMIN: Application Approved ━━━
  application_approved: (data: any) => emailWrapper(`
    <h1>Application Approved! 🎉</h1>
    <p class="greeting">Hi <strong>${data.username || data.full_name || 'Artist'}</strong>,</p>
    <p>Congratulations! Your application to join ${COMPANY_NAME} Founders Season has been approved.</p>
    
    <div class="highlight-card">
      <div class="label">Status</div>
      <div class="value-text" style="color: #10B981;">✅ Approved</div>
      <p style="margin: 8px 0 0; color: #8b8ba0; font-size: 14px;">Stage Name: <strong style="color: #0f0f1a;">${data.stage_name || 'N/A'}</strong></p>
    </div>
    
    <h2>Next Steps:</h2>
    <div class="step-list">
      <div class="step-item"><span class="step-num">1</span><span class="step-text"><strong>Upload your first track</strong> from your Artist Dashboard</span></div>
      <div class="step-item"><span class="step-num">2</span><span class="step-text"><strong>Enter the active competition</strong> to start competing</span></div>
      <div class="step-item"><span class="step-num">3</span><span class="step-text"><strong>Share your profile</strong> to build your fanbase</span></div>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/artist/dashboard" class="cta-button">Go to Artist Dashboard →</a>
    </div>
  `, 'Your BAK55 application has been approved!'),

  // ━━━ ADMIN: Application Rejected ━━━
  application_rejected: (data: any) => emailWrapper(`
    <h1>Application Update ⚠️</h1>
    <p class="greeting">Hi <strong>${data.username || data.full_name || 'there'}</strong>,</p>
    <p>Thank you for your interest in ${COMPANY_NAME} Founders Season. After careful review, we're unable to approve your application at this time.</p>
    
    ${data.review_notes ? `<div class="info-card"><p>📝 <strong>Reviewer notes:</strong> ${data.review_notes}</p></div>` : ''}
    
    <p>This doesn't mean the end of your journey! You can:</p>
    <div class="step-list">
      <div class="step-item"><span class="step-num">1</span><span class="step-text">Continue building your skills and portfolio</span></div>
      <div class="step-item"><span class="step-num">2</span><span class="step-text">Reapply for the next season</span></div>
      <div class="step-item"><span class="step-num">3</span><span class="step-text">Stay as a fan and earn BAKCoins through engagement</span></div>
    </div>
    
    <div class="cta-wrapper">
      <a href="${PRODUCTION_DOMAIN}/apply" class="cta-button">Apply Again →</a>
    </div>
  `, 'Update on your BAK55 application.'),

  // ━━━ Queue template aliases used by process-email-queue ━━━
  first_upload_guide: (data: any) => templates.onboarding_upload(data),
  competition_guide: (data: any) => templates.onboarding_competitions(data),
  monetization_guide: (data: any) => templates.onboarding_monetization(data),
};

// ─── SMTP Sender ──────────────────────────────────────
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

// ─── Handler ──────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, subject, template, data, html }: EmailRequest = body;

    console.log('Email request received:', { to, subject, template });

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
    } else if (html && !template) {
      // Legacy: raw HTML passed without template (e.g. old callers)
      emailHtml = emailWrapper(html);
    } else if (template && templates[template]) {
      emailHtml = templates[template](data || {});
    } else {
      console.warn(`Unknown template: ${template}, falling back to custom wrapper`);
      // Graceful fallback instead of hard error
      emailHtml = emailWrapper(html || `<p>${JSON.stringify(data || {})}</p>`);
    }
    
    const result = await sendEmailViaSMTP(to, subject, emailHtml);

    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, data: { id: result.id } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
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
