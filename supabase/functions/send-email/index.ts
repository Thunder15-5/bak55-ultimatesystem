import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCTION_DOMAIN = "https://bak55talent.co.ke";
const SUPPORT_EMAIL = "support@bak55talent.co.ke";
const COMPANY_NAME = "BAK55 Talent";
const LOGO_URL = `${PRODUCTION_DOMAIN}/icons/icon-512x512.png`;
const BRAND_PRIMARY = "#7C3AED";
const BRAND_DARK = "#5B21B6";
const BRAND_LIGHT = "#EDE9FE";
const BRAND_ACCENT = "#A78BFA";
const TEXT_DARK = "#1F2937";
const TEXT_SECONDARY = "#6B7280";
const TEXT_MUTED = "#9CA3AF";
const SUCCESS_COLOR = "#059669";
const WARNING_COLOR = "#D97706";
const ERROR_COLOR = "#DC2626";
const BG_BODY = "#F3F4F6";
const BG_CARD = "#ffffff";
const BORDER_COLOR = "#E5E7EB";
const YEAR = new Date().getFullYear();

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
  html?: string;
}

// ─── Reusable Inline-Style Building Blocks ─────────────────────

const btn = (href: string, label: string, color = BRAND_PRIMARY) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto;">
    <tr><td align="center" style="border-radius:8px;background:${color};">
      <!--[if mso]><a href="${href}" target="_blank" style="background:${color};color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;padding:14px 40px;text-decoration:none;display:inline-block;border-radius:8px;mso-padding-alt:0;"><![endif]-->
      <!--[if !mso]><!--><a href="${href}" target="_blank" style="display:inline-block;background:${color};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;padding:14px 40px;text-decoration:none;border-radius:8px;line-height:1.4;"><!--<![endif]-->${label}<!--[if !mso]><!--></a><!--<![endif]-->
      <!--[if mso]></a><![endif]-->
    </td></tr>
  </table>`;

const heading = (text: string) =>
  `<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:${TEXT_DARK};line-height:1.3;">${text}</h1>`;

const subheading = (text: string) =>
  `<h2 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:${TEXT_DARK};line-height:1.3;">${text}</h2>`;

const para = (text: string) =>
  `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${TEXT_SECONDARY};">${text}</p>`;

const greeting = (name: string) =>
  `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${TEXT_DARK};">Hi <strong style="color:${BRAND_PRIMARY};">${name}</strong>,</p>`;

const highlightCard = (label: string, value: string, subtext?: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
    <tr><td style="background:${BRAND_LIGHT};border:1px solid #DDD6FE;border-radius:12px;padding:28px;text-align:center;">
      <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:2px;">${label}</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:28px;font-weight:800;color:${BRAND_PRIMARY};letter-spacing:1px;">${value}</p>
      ${subtext ? `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};">${subtext}</p>` : ''}
    </td></tr>
  </table>`;

const codeCard = (label: string, code: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
    <tr><td style="background:${BRAND_LIGHT};border:2px dashed ${BRAND_ACCENT};border-radius:12px;padding:28px;text-align:center;">
      <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:2px;">${label}</p>
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;color:${BRAND_PRIMARY};letter-spacing:6px;">${code}</p>
    </td></tr>
  </table>`;

const infoBox = (text: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
    <tr><td style="background:#F9FAFB;border-left:4px solid ${BRAND_PRIMARY};border-radius:0 8px 8px 0;padding:16px 20px;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:${TEXT_SECONDARY};">${text}</p>
    </td></tr>
  </table>`;

const divider = () =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;"><tr><td style="height:1px;background:${BORDER_COLOR};"></td></tr></table>`;

const detailRow = (label: string, value: string, valueColor?: string) =>
  `<tr>
    <td style="padding:10px 0;font-family:Arial,sans-serif;font-size:14px;color:${TEXT_MUTED};font-weight:500;border-bottom:1px solid #F3F4F6;width:40%;">${label}</td>
    <td style="padding:10px 0;font-family:Arial,sans-serif;font-size:14px;color:${valueColor || TEXT_DARK};font-weight:600;text-align:right;border-bottom:1px solid #F3F4F6;">${value}</td>
  </tr>`;

const detailTable = (rows: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">${rows}</table>`;

const statusBadge = (text: string, color: string) =>
  `<span style="display:inline-block;background:${color};color:#ffffff;padding:4px 14px;border-radius:20px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${text}</span>`;

const step = (num: string, text: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
    <tr>
      <td style="width:36px;vertical-align:top;">
        <div style="width:30px;height:30px;background:${BRAND_PRIMARY};color:#ffffff;border-radius:50%;text-align:center;line-height:30px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;">${num}</div>
      </td>
      <td style="padding-left:12px;vertical-align:top;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:${TEXT_SECONDARY};padding-top:4px;">${text}</p>
      </td>
    </tr>
  </table>`;

const helpFooter = () =>
  `${divider()}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="text-align:center;padding:8px 0;">
      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};">Need help? <a href="${PRODUCTION_DOMAIN}/faq" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:600;">Visit FAQ</a> or email <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:600;">${SUPPORT_EMAIL}</a></p>
    </td></tr>
  </table>`;


// ─── Enterprise Email Wrapper (Table-Based, Inline Styles) ─────

const emailWrapper = (content: string, preheader?: string) => {
  const ph = preheader || '';
  return [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    '<html xmlns="http://www.w3.org/1999/xhtml" lang="en">',
    '<head>',
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
    '<meta name="color-scheme" content="light" />',
    '<meta name="supported-color-schemes" content="light" />',
    `<title>${COMPANY_NAME}</title>`,
    '<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->',
    '<style type="text/css">',
    '#outlook a{padding:0;}',
    'body{margin:0;padding:0;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}',
    'table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}',
    'img{-ms-interpolation-mode:bicubic;border:0;display:block;outline:none;text-decoration:none;}',
    'a{color:' + BRAND_PRIMARY + ';text-decoration:none;}',
    '@media only screen and (max-width:620px){',
    '.email-container{width:100%!important;max-width:100%!important;}',
    '.email-body{padding:24px 16px!important;}',
    '.email-header{padding:24px 16px!important;}',
    'h1{font-size:20px!important;}',
    '}',
    '@media (prefers-color-scheme:dark){',
    '.email-bg{background-color:#1F2937!important;}',
    '.email-card{background-color:#111827!important;}',
    '.email-header{background:linear-gradient(135deg,#5B21B6,#7C3AED)!important;}',
    'h1,h2{color:#F9FAFB!important;}',
    'p{color:#D1D5DB!important;}',
    '}',
    '</style>',
    '</head>',
    `<body style="margin:0;padding:0;width:100%;background-color:${BG_BODY};font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">`,
    // Preheader
    `<div style="display:none;font-size:1px;color:${BG_BODY};line-height:1px;max-height:0;overflow:hidden;mso-hide:all;">${ph}${'&zwnj;&nbsp;'.repeat(30)}</div>`,
    // Outer table
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BG_BODY};" class="email-bg">`,
    '<tr><td align="center" style="padding:32px 12px;">',
    // Container
    '<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"><tr><td><![endif]-->',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${BG_CARD};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);" class="email-container email-card">`,
    // Header
    '<tr><td>',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">`,
    `<tr><td style="background:linear-gradient(135deg,${BRAND_DARK},${BRAND_PRIMARY});padding:32px 28px;text-align:center;" class="email-header">`,
    `<img src="${LOGO_URL}" alt="${COMPANY_NAME}" width="48" height="48" style="display:inline-block;width:48px;height:48px;border-radius:12px;margin-bottom:12px;" />`,
    `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">&#127925; ${COMPANY_NAME}</p>`,
    `<p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:2px;">Africa&rsquo;s Premier Music Talent Platform</p>`,
    '</td></tr>',
    '</table>',
    '</td></tr>',
    // Body
    `<tr><td style="padding:36px 32px;background:${BG_CARD};" class="email-body">`,
    content,
    '</td></tr>',
    // Footer
    '<tr><td>',
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#111827;padding:0;">`,
    '<tr><td style="padding:28px 24px;text-align:center;">',
    // Social links row
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">',
    '<tr>',
    `<td style="padding:0 8px;"><a href="https://instagram.com/bak55talent" style="color:${BRAND_ACCENT};font-family:Arial,sans-serif;font-size:13px;font-weight:600;text-decoration:none;">Instagram</a></td>`,
    `<td style="padding:0 8px;color:#4B5563;">&middot;</td>`,
    `<td style="padding:0 8px;"><a href="https://twitter.com/bak55talent" style="color:${BRAND_ACCENT};font-family:Arial,sans-serif;font-size:13px;font-weight:600;text-decoration:none;">Twitter</a></td>`,
    `<td style="padding:0 8px;color:#4B5563;">&middot;</td>`,
    `<td style="padding:0 8px;"><a href="https://tiktok.com/@bak55talent" style="color:${BRAND_ACCENT};font-family:Arial,sans-serif;font-size:13px;font-weight:600;text-decoration:none;">TikTok</a></td>`,
    '</tr>',
    '</table>',
    // Nav links
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">',
    '<tr>',
    `<td style="padding:0 10px;"><a href="${PRODUCTION_DOMAIN}" style="color:#9CA3AF;font-family:Arial,sans-serif;font-size:12px;text-decoration:none;">Website</a></td>`,
    `<td style="padding:0 10px;"><a href="${PRODUCTION_DOMAIN}/faq" style="color:#9CA3AF;font-family:Arial,sans-serif;font-size:12px;text-decoration:none;">FAQ</a></td>`,
    `<td style="padding:0 10px;"><a href="${PRODUCTION_DOMAIN}/contact" style="color:#9CA3AF;font-family:Arial,sans-serif;font-size:12px;text-decoration:none;">Contact</a></td>`,
    `<td style="padding:0 10px;"><a href="${PRODUCTION_DOMAIN}/terms" style="color:#9CA3AF;font-family:Arial,sans-serif;font-size:12px;text-decoration:none;">Terms</a></td>`,
    `<td style="padding:0 10px;"><a href="${PRODUCTION_DOMAIN}/privacy" style="color:#9CA3AF;font-family:Arial,sans-serif;font-size:12px;text-decoration:none;">Privacy</a></td>`,
    '</tr>',
    '</table>',
    // Copyright
    `<p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6B7280;">&copy; ${YEAR} ${COMPANY_NAME}. All rights reserved.</p>`,
    `<p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;color:#4B5563;">Zanzi Court, Riara Rd &middot; Nairobi, Kenya</p>`,
    `<p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#4B5563;">You received this because you have a ${COMPANY_NAME} account.</p>`,
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '<!--[if mso]></td></tr></table><![endif]-->',
    '</td></tr>',
    '</table>',
    '</body>',
    '</html>',
  ].join('\n');
};

// ─── Enterprise Templates ──────────────────────────────────────
const templates: Record<string, (data: any) => string> = {

  welcome: (data: any) => {
    const role = data.role || 'fan';
    const uname = data.username || 'there';
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const acctName = (data.username || data.email || 'Member').toUpperCase();
    const dashPath = role === 'fan' ? 'fan' : role;

    const roleTips: Record<string, string> = {
      artist: [
        step('1', '<strong>Upload your first track</strong> — share your music with the world'),
        step('2', '<strong>Enter competitions</strong> — win BAKCoins and get discovered'),
        step('3', '<strong>Build your fanbase</strong> — earn tips and streaming revenue'),
        step('4', '<strong>Collaborate</strong> — connect with producers and brands'),
      ].join(''),
      producer: [
        step('1', '<strong>Upload your beats</strong> — showcase your production catalog'),
        step('2', '<strong>Set licensing tiers</strong> — lease, premium, and exclusive'),
        step('3', '<strong>Collaborate with artists</strong> — receive work requests'),
        step('4', '<strong>Grow your brand</strong> — build your reputation on the platform'),
      ].join(''),
      brand: [
        step('1', '<strong>Discover talent</strong> — browse Africa\'s emerging artists'),
        step('2', '<strong>Sponsor competitions</strong> — reach engaged music fans'),
        step('3', '<strong>Partner with artists</strong> — authentic brand collaborations'),
      ].join(''),
      fan: [
        step('1', '<strong>Explore trending music</strong> — discover Africa\'s next big stars'),
        step('2', '<strong>Vote in competitions</strong> — help decide the winners'),
        step('3', '<strong>Tip your favorites</strong> — support artists you love'),
        step('4', '<strong>Earn rewards</strong> — get BAKCoins for your activity'),
      ].join(''),
    };

    return emailWrapper([
      heading(`Welcome to ${COMPANY_NAME}! &#127881;`),
      greeting(uname),
      para(`We're thrilled to have you join Africa's premier music talent platform. Your <strong>${roleLabel}</strong> account is ready.`),
      highlightCard('Your Account', acctName, `${roleLabel} Account &middot; Active`),
      subheading('Get started in 4 easy steps:'),
      roleTips[role] || roleTips.fan,
      btn(`${PRODUCTION_DOMAIN}/${dashPath}/dashboard`, 'Go to Your Dashboard'),
      helpFooter(),
    ].join(''), `Welcome to ${COMPANY_NAME}! Your ${role} account is ready.`);
  },

  activation: (data: any) => emailWrapper([
    heading('Activate Your Account &#128274;'),
    greeting(data.username || 'there'),
    para('Enter the 6-digit code below to activate your account and unlock all features.'),
    codeCard('Your Activation Code', data.activation_code || '------'),
    btn(`${PRODUCTION_DOMAIN}/verify-account`, 'Activate My Account'),
    infoBox(`This code expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.`),
    helpFooter(),
  ].join(''), `Your activation code: ${data.activation_code || '------'}`),

  verification: (data: any) => emailWrapper([
    heading('Verify Your Email &#9993;'),
    greeting(data.username || 'there'),
    para('Please verify your email address to unlock all platform features.'),
    btn(data.verification_url || PRODUCTION_DOMAIN, 'Verify Email Address'),
    infoBox(`Or copy this link: <a href="${data.verification_url || PRODUCTION_DOMAIN}" style="color:${BRAND_PRIMARY};word-break:break-all;">${data.verification_url || PRODUCTION_DOMAIN}</a>`),
    para(`<span style="color:${TEXT_MUTED};font-size:13px;">This link expires in 24 hours.</span>`),
    helpFooter(),
  ].join(''), 'Verify your email to complete your registration.'),

  password_reset: (data: any) => emailWrapper([
    heading('Reset Your Password &#128273;'),
    greeting(data.username || 'there'),
    para('We received a request to reset your password. Click the button below to choose a new one.'),
    btn(data.reset_url || `${PRODUCTION_DOMAIN}/reset-password`, 'Reset Password'),
    infoBox(`This link expires in <strong>1 hour</strong>. If you didn't request this, your account is safe — no action needed.`),
    helpFooter(),
  ].join(''), 'Password reset request for your account.'),

  competition_submission: (data: any) => emailWrapper([
    heading('Submission Received! &#127919;'),
    greeting(data.artist_name || 'Artist'),
    para('Your track has been successfully submitted to the competition. Here are the details:'),
    highlightCard('Competition', data.competition_title || 'Music Competition'),
    detailTable([
      detailRow('Track', data.track_title || 'Your Track'),
      detailRow('Voting Opens', data.voting_start_date || 'To Be Announced'),
      detailRow('Scoring Method', '70% Fan Votes + 30% AI Analysis'),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/competition/${data.competition_id || ''}`, 'View Competition'),
    infoBox('Share your submission with friends and fans to maximize your votes!'),
    helpFooter(),
  ].join(''), `Your track "${data.track_title}" has been submitted!`),

  competition_winner: (data: any) => emailWrapper([
    heading('&#127942; Congratulations, You Won!'),
    greeting(data.artist_name || 'Artist'),
    para(`Your track "<strong>${data.track_title || 'Your Track'}</strong>" placed in the competition! Your prize has been credited.`),
    highlightCard(data.competition_title || 'Competition', `${data.position || '1st'} Place &#127942;`),
    detailTable([
      detailRow('Prize', `${data.prize_amount || 0} BAKCoins`, BRAND_PRIMARY),
      detailRow('Final Score', `${data.final_score || 0}/100`),
      detailRow('Status', statusBadge('Prize Credited', SUCCESS_COLOR)),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/wallet`, 'View Your Wallet'),
    helpFooter(),
  ].join(''), `You won ${data.position || ''} place! ${data.prize_amount || 0} BAKCoins credited.`),

  withdrawal_request: (data: any) => emailWrapper([
    heading('Withdrawal Request Received &#128176;'),
    greeting(data.username || 'User'),
    para('We\'ve received your withdrawal request and it\'s being processed.'),
    highlightCard('Withdrawal Amount', `${data.amount || 0} BAKCoins`, `≈ $${((data.amount || 0) * 0.16).toFixed(2)} USD`),
    detailTable([
      detailRow('M-PESA Number', data.phone_number || 'N/A'),
      detailRow('Reference', data.reference || 'N/A'),
      detailRow('Status', statusBadge('Processing', WARNING_COLOR)),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/wallet`, 'Track in Wallet'),
    infoBox('Withdrawals are typically processed within 24-48 hours during business days.'),
    helpFooter(),
  ].join(''), `Withdrawal of ${data.amount || 0} BAKCoins is being processed.`),

  withdrawal_complete: (data: any) => emailWrapper([
    heading('Withdrawal Successful! &#9989;'),
    greeting(data.username || 'User'),
    para('Your withdrawal has been processed and sent to your M-PESA.'),
    highlightCard('Amount Sent', `${data.amount || 0} BAKCoins`, `Sent to ${data.phone_number || 'your account'}`),
    detailTable([
      detailRow('BAKCoins Withdrawn', `${data.amount || 0}`),
      detailRow('Transaction ID', data.transaction_id || 'N/A'),
      detailRow('Status', statusBadge('Complete', SUCCESS_COLOR)),
    ].join('')),
    helpFooter(),
  ].join(''), `${data.amount || 0} BAKCoins sent to your account.`),

  tip_received: (data: any) => emailWrapper([
    heading('You Received a Tip! &#128157;'),
    greeting(data.artist_name || 'Artist'),
    para('A fan just showed their love for your music!'),
    highlightCard('Tip Amount', `${data.amount || 0} BAKCoins`, `From <strong>${data.tipper_name || 'A fan'}</strong>`),
    data.message ? infoBox(`<em>"${data.message}"</em>`) : '',
    btn(`${PRODUCTION_DOMAIN}/wallet`, 'View Wallet'),
    helpFooter(),
  ].join(''), `${data.tipper_name || 'A fan'} tipped you ${data.amount || 0} BAKCoins!`),

  new_follower: (data: any) => emailWrapper([
    heading('New Follower! &#128101;'),
    greeting(data.artist_name || 'Artist'),
    para(`<strong>${data.follower_name || 'Someone'}</strong> started following you! Keep creating great music to grow your fanbase.`),
    highlightCard('Total Followers', data.follower_count || '-'),
    btn(`${PRODUCTION_DOMAIN}/artist/dashboard`, 'View Dashboard'),
    helpFooter(),
  ].join(''), `${data.follower_name || 'Someone'} started following you!`),

  track_approved: (data: any) => emailWrapper([
    heading('Track Approved! &#9989;'),
    greeting(data.artist_name || 'Artist'),
    para(`Your track is now live on ${COMPANY_NAME} and available to fans everywhere!`),
    highlightCard('Now Live', data.track_title || 'Your Track'),
    btn(`${PRODUCTION_DOMAIN}/track/${data.track_id || ''}`, 'View Your Track'),
    infoBox('<strong>Pro tip:</strong> Share on social media within 24 hours for 3x more plays!'),
    helpFooter(),
  ].join(''), `Your track "${data.track_title}" is now live!`),

  track_rejected: (data: any) => emailWrapper([
    heading('Track Review Update &#9888;'),
    greeting(data.artist_name || 'Artist'),
    para('After careful review, your track didn\'t pass moderation this time.'),
    detailTable([
      detailRow('Track', data.track_title || 'Your Track'),
      detailRow('Status', statusBadge('Not Approved', ERROR_COLOR)),
      ...(data.reason ? [detailRow('Reason', data.reason)] : []),
    ].join('')),
    infoBox(`Review our <a href="${PRODUCTION_DOMAIN}/faq" style="color:${BRAND_PRIMARY};font-weight:600;">content guidelines</a>, make adjustments, and re-upload. You can try again anytime!`),
    btn(`${PRODUCTION_DOMAIN}/upload`, 'Upload Again'),
    helpFooter(),
  ].join(''), `Your track "${data.track_title}" needs revision.`),

  contact_form: (data: any) => emailWrapper([
    heading(`New ${data.type || 'Contact'} Submission &#128231;`),
    detailTable([
      detailRow('From', data.name || 'Unknown'),
      detailRow('Email', `<a href="mailto:${data.email}" style="color:${BRAND_PRIMARY};">${data.email || ''}</a>`),
      detailRow('Subject', data.subject || 'No subject'),
    ].join('')),
    divider(),
    subheading('Message:'),
    infoBox(data.message || 'No message provided.'),
  ].join(''), `New ${data.type || 'contact'} submission from ${data.name || 'user'}.`),

  track_upload_admin: (data: any) => emailWrapper([
    heading('New Track Upload &#127925;'),
    para('A new track requires moderation review.'),
    detailTable([
      detailRow('Artist', data.artist_name || 'Unknown'),
      detailRow('Track', data.track_title || 'Untitled'),
      detailRow('Genre', data.genre || 'N/A'),
      detailRow('Status', statusBadge('Pending', WARNING_COLOR)),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/admin`, 'Review in Admin'),
  ].join(''), `New track "${data.track_title}" needs moderation.`),

  beat_upload_admin: (data: any) => emailWrapper([
    heading('New Beat Upload &#129345;'),
    para('A new beat requires moderation review.'),
    detailTable([
      detailRow('Producer', data.producer_name || 'Unknown'),
      detailRow('Beat', data.beat_title || 'Untitled'),
      detailRow('Genre', data.genre || 'N/A'),
      detailRow('Status', statusBadge('Pending', WARNING_COLOR)),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/admin`, 'Review in Admin'),
  ].join(''), `New beat "${data.beat_title}" needs moderation.`),

  new_signup_admin: (data: any) => emailWrapper([
    heading(`New ${data.user_type || 'User'} Signup &#128203;`),
    para(`A new user has signed up for ${COMPANY_NAME}.`),
    detailTable([
      detailRow('Email', data.email || 'Unknown'),
      detailRow('Type', data.user_type || 'Fan'),
      detailRow('Source', data.source || 'Direct'),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/admin`, 'View in Admin'),
  ].join(''), `New ${data.user_type || 'user'} signup: ${data.email || 'unknown'}`),

  early_access_admin: (data: any) => emailWrapper([
    heading('New Early Access Signup &#128640;'),
    detailTable([
      detailRow('Email', data.email || 'Unknown'),
      detailRow('Source', data.source || 'Homepage'),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/admin`, 'View Signups'),
  ].join(''), `New early access signup: ${data.email || ''}`),

  onboarding_upload: (data: any) => emailWrapper([
    heading('Ready to Share Your Music? &#127908;'),
    greeting(data.username || 'there'),
    para('It\'s time to upload your first track and share your talent with Africa!'),
    subheading('Upload in 4 simple steps:'),
    step('1', 'Click <strong>"Upload Track"</strong> from your dashboard'),
    step('2', 'Add your audio file (MP3 or WAV, up to 50MB)'),
    step('3', 'Upload cover art and fill in track details'),
    step('4', 'Submit for review — we\'ll notify you when it\'s live'),
    btn(`${PRODUCTION_DOMAIN}/upload`, 'Upload Your First Track'),
    helpFooter(),
  ].join(''), 'Time to upload your first track!'),

  onboarding_competitions: (data: any) => emailWrapper([
    heading('Win Big in Competitions! &#127942;'),
    greeting(data.username || 'there'),
    para('Enter music competitions to win BAKCoins, get exposure, and climb the leaderboard.'),
    highlightCard('Prize Pools Up To', '1,000+ BAKCoins'),
    para('Competitions are scored 70% by fan votes and 30% by AI analysis — so share with your fans for the best chance!'),
    btn(`${PRODUCTION_DOMAIN}/competitions`, 'View Active Competitions'),
    helpFooter(),
  ].join(''), 'Enter competitions and win BAKCoins!'),

  onboarding_monetization: (data: any) => emailWrapper([
    heading('Start Earning with Your Music &#128176;'),
    greeting(data.username || 'there'),
    para(`${COMPANY_NAME} isn't just about exposure — it's real money in your pocket.`),
    step('&#128157;', '<strong>Tips</strong> — Fans tip you BAKCoins directly'),
    step('&#127942;', '<strong>Competitions</strong> — Win cash prizes'),
    step('&#127925;', '<strong>Streaming</strong> — Earn per play'),
    step('&#129309;', '<strong>Collaborations</strong> — Partner with brands'),
    btn(`${PRODUCTION_DOMAIN}/wallet`, 'View Your Wallet'),
    helpFooter(),
  ].join(''), 'Learn how to monetize your music.'),

  profile_reminder: (data: any) => emailWrapper([
    heading('Complete Your Profile &#10024;'),
    greeting(data.username || 'there'),
    para('Complete profiles get <strong>5x more engagement</strong>! Add the finishing touches to yours.'),
    infoBox(data.missing_items || '&#128248; Profile photo &middot; Bio &middot; Social links'),
    btn(`${PRODUCTION_DOMAIN}/profile`, 'Complete Your Profile'),
    helpFooter(),
  ].join(''), 'Complete your profile and get discovered!'),

  purchase_success: (data: any) => emailWrapper([
    heading('Purchase Successful! &#9989;'),
    greeting(data.username || 'there'),
    para('BAKCoins have been credited to your wallet. Here\'s your receipt:'),
    highlightCard('BAKCoins Credited', `${data.bak_amount || 0}`, `≈ $${((data.bak_amount || 0) * 0.16).toFixed(2)} USD`),
    detailTable([
      detailRow('Payment Method', data.payment_method || 'M-Pesa / Selar'),
      detailRow('Reference', data.reference || 'N/A'),
      detailRow('Status', statusBadge('Complete', SUCCESS_COLOR)),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/wallet`, 'View Your Wallet'),
    helpFooter(),
  ].join(''), `${data.bak_amount || 0} BAKCoins credited.`),

  referral_success: (data: any) => emailWrapper([
    heading('Referral Reward Earned! &#127881;'),
    greeting(data.username || 'there'),
    para('Your referral has been completed and your reward is ready!'),
    highlightCard('Referral Reward', `${data.reward_amount || 0} BAKCoins`, `Referred: <strong>${data.referred_username || 'A new user'}</strong>`),
    btn(`${PRODUCTION_DOMAIN}/wallet`, 'View Your Wallet'),
    helpFooter(),
  ].join(''), `You earned ${data.reward_amount || 0} BAKCoins from a referral!`),

  deposit_approved: (data: any) => emailWrapper([
    heading('Deposit Approved! &#9989;'),
    greeting(data.username || 'there'),
    para('Your M-Pesa deposit has been verified and BAKCoins credited.'),
    highlightCard('Deposit Credited', `${data.bak_amount || 0} BAKCoins`, `≈ $${((data.bak_amount || 0) * 0.16).toFixed(2)} USD`),
    detailTable([
      detailRow('Receipt Code', data.receipt_code || 'N/A'),
      detailRow('Status', statusBadge('Approved', SUCCESS_COLOR)),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/wallet`, 'Go to Wallet'),
    helpFooter(),
  ].join(''), `Deposit of ${data.bak_amount || 0} BAKCoins approved!`),

  deposit_rejected: (data: any) => emailWrapper([
    heading('Deposit Request Update &#9888;'),
    greeting(data.username || 'there'),
    para('We were unable to verify your deposit. Please review the details below.'),
    detailTable([
      detailRow('Amount', `${data.bak_amount || data.amount_kes || 0} BAK`),
      detailRow('Receipt Code', data.receipt_code || 'N/A'),
      detailRow('Status', statusBadge('Rejected', ERROR_COLOR)),
      ...(data.reason ? [detailRow('Reason', data.reason)] : []),
    ].join('')),
    infoBox('Double-check your M-Pesa receipt code and resubmit. If the issue persists, contact support.'),
    btn(`${PRODUCTION_DOMAIN}/wallet`, 'Try Again'),
    helpFooter(),
  ].join(''), `Deposit of ${data.bak_amount || 0} BAKCoins was not approved.`),

  application_approved: (data: any) => emailWrapper([
    heading('Application Approved! &#127881;'),
    greeting(data.username || data.full_name || 'Artist'),
    para(`Your application to ${COMPANY_NAME} Founders Season has been approved! Welcome aboard.`),
    highlightCard('Status', 'Approved &#9989;', `Stage: <strong>${data.stage_name || 'N/A'}</strong>`),
    btn(`${PRODUCTION_DOMAIN}/artist/dashboard`, 'Go to Dashboard'),
    helpFooter(),
  ].join(''), 'Your BAK55 application has been approved!'),

  application_rejected: (data: any) => emailWrapper([
    heading('Application Update &#9888;'),
    greeting(data.username || data.full_name || 'there'),
    para('After careful review, we\'re unable to approve your application at this time.'),
    data.review_notes ? infoBox(`<strong>Reviewer notes:</strong> ${data.review_notes}`) : '',
    para('Don\'t be discouraged — you can reapply for the next season with updated material!'),
    btn(`${PRODUCTION_DOMAIN}/apply`, 'Apply Again'),
    helpFooter(),
  ].join(''), 'Update on your BAK55 application.'),

  // ─── New Enterprise Templates ─────────────────────

  subscription_activated: (data: any) => emailWrapper([
    heading('Subscription Activated! &#127775;'),
    greeting(data.username || 'there'),
    para(`Your <strong>${data.plan_name || 'Premium'}</strong> subscription is now active. Enjoy all the benefits!`),
    highlightCard('Active Plan', data.plan_name || 'Premium', `Expires: ${data.expires_at || 'N/A'}`),
    detailTable([
      detailRow('Upload Limit', data.upload_limit || 'Unlimited'),
      detailRow('Competition Entry', statusBadge('Included', SUCCESS_COLOR)),
      detailRow('Priority Support', statusBadge('Active', SUCCESS_COLOR)),
    ].join('')),
    btn(`${PRODUCTION_DOMAIN}/artist/dashboard`, 'Start Creating'),
    helpFooter(),
  ].join(''), `Your ${data.plan_name || 'Premium'} subscription is now active!`),

  subscription_expiring: (data: any) => emailWrapper([
    heading('Subscription Expiring Soon &#9888;'),
    greeting(data.username || 'there'),
    para(`Your <strong>${data.plan_name || 'Premium'}</strong> subscription expires in <strong>${data.days_left || 3} days</strong>. Renew now to keep your benefits.`),
    highlightCard('Expires On', data.expires_at || 'Soon'),
    infoBox('After expiration, you\'ll lose access to unlimited uploads, competition entries, and priority support.'),
    btn(`${PRODUCTION_DOMAIN}/subscribe`, 'Renew Subscription'),
    helpFooter(),
  ].join(''), `Your subscription expires in ${data.days_left || 3} days — renew now.`),

  weekly_digest: (data: any) => emailWrapper([
    heading('Your Weekly Digest &#128202;'),
    greeting(data.username || 'there'),
    para('Here\'s a summary of your activity this week:'),
    detailTable([
      detailRow('Total Plays', data.total_plays || '0'),
      detailRow('New Followers', data.new_followers || '0'),
      detailRow('Tips Received', `${data.tips_received || 0} BAKCoins`),
      detailRow('Competition Votes', data.competition_votes || '0'),
    ].join('')),
    data.top_track ? infoBox(`&#127942; <strong>Top Track:</strong> "${data.top_track}" with ${data.top_track_plays || 0} plays`) : '',
    btn(`${PRODUCTION_DOMAIN}/artist/dashboard`, 'View Full Analytics'),
    helpFooter(),
  ].join(''), `Your weekly summary: ${data.total_plays || 0} plays, ${data.new_followers || 0} new followers.`),

  vote_received: (data: any) => emailWrapper([
    heading('You Received a Vote! &#128499;'),
    greeting(data.artist_name || 'Artist'),
    para(`Your track "<strong>${data.track_title || 'Your Track'}</strong>" just received a vote in the Rising Stars competition!`),
    highlightCard('Current Vote Count', `${data.vote_count || 1}`, data.competition_title || 'Rising Stars'),
    para('Share your track with more fans to climb the leaderboard!'),
    btn(`${PRODUCTION_DOMAIN}/rising-stars/voting`, 'View Leaderboard'),
    helpFooter(),
  ].join(''), `Your track received a vote! Total: ${data.vote_count || 1}`),

  // ─── Aliases ─────────────────────

  contact: (data: any) => emailWrapper([
    heading('New Support Ticket &#127915;'),
    detailTable([
      detailRow('From', data.name || 'Unknown'),
      detailRow('Email', `<a href="mailto:${data.email}" style="color:${BRAND_PRIMARY};">${data.email || ''}</a>`),
      detailRow('Type', data.type || 'Support'),
    ].join('')),
    divider(),
    subheading('Message:'),
    infoBox(data.message || 'No message provided.'),
  ].join(''), `Support ticket from ${data.name || 'user'}.`),

  custom: (data: any) => emailWrapper(
    data.html_content || para('No content provided.')
  ),

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

// ─── Dynamic DB Template Loader ──────────────────────────────────
async function loadTemplateFromDB(templateName: string, data: Record<string, any>): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return null;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: tmpl, error } = await supabase
      .from("email_templates")
      .select("html_content, variables")
      .eq("name", templateName)
      .eq("is_active", true)
      .single();

    if (error || !tmpl) return null;

    let html = tmpl.html_content;
    for (const [key, value] of Object.entries(data)) {
      html = html.replaceAll(`{{${key}}}`, String(value ?? ''));
    }
    html = html.replaceAll("{{dashboard_link}}", `${PRODUCTION_DOMAIN}/dashboard`);
    html = html.replaceAll("{{profile_link}}", `${PRODUCTION_DOMAIN}/profile`);
    html = html.replaceAll("{{upload_link}}", `${PRODUCTION_DOMAIN}/upload`);
    html = html.replaceAll("{{competitions_link}}", `${PRODUCTION_DOMAIN}/competitions`);
    html = html.replaceAll("{{wallet_link}}", `${PRODUCTION_DOMAIN}/wallet`);
    html = html.replaceAll("{{support_email}}", SUPPORT_EMAIL);
    html = html.replaceAll("{{company_name}}", COMPANY_NAME);
    html = html.replaceAll("{{domain}}", PRODUCTION_DOMAIN);

    console.log(`Loaded template "${templateName}" from database`);
    // If DB template is already a complete HTML document, don't double-wrap
    if (html.trim().toLowerCase().startsWith('<!doctype') || html.trim().toLowerCase().startsWith('<html')) {
      return html;
    }
    return emailWrapper(html);
  } catch (err) {
    console.warn(`Failed to load DB template "${templateName}":`, err);
    return null;
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

    if (template === 'custom' && html) {
      emailHtml = emailWrapper(html);
    } else if (html && !template) {
      emailHtml = emailWrapper(html);
    } else if (template) {
      const dbHtml = await loadTemplateFromDB(template, data || {});
      if (dbHtml) {
        emailHtml = dbHtml;
      } else if (templates[template]) {
        emailHtml = templates[template](data || {});
      } else {
        console.warn(`Unknown template: ${template}, falling back to custom wrapper`);
        emailHtml = emailWrapper(html || `<p>${JSON.stringify(data || {})}</p>`);
      }
    } else {
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
