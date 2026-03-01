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
const emailWrapper = (content: string, preheader?: string) => {
  const ph = preheader || '';
  const year = new Date().getFullYear();
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">',
    `<title>${COMPANY_NAME}</title>`,
    '<style>',
    'body{margin:0;padding:0;width:100%;',
    'background-color:#f4f4f8;',
    'font-family:Arial,Helvetica,sans-serif;',
    '-webkit-font-smoothing:antialiased;}',
    'img{border:0;display:block;max-width:100%;}',
    'table{border-collapse:collapse;}',
    'td{padding:0;}',
    '.ec{max-width:600px;margin:0 auto;',
    'background:#ffffff;border-radius:12px;',
    'overflow:hidden;}',
    '.hdr{background:#9333EA;',
    'padding:32px 24px;text-align:center;}',
    '.hdr a{color:#ffffff;text-decoration:none;',
    'font-size:24px;font-weight:bold;}',
    '.hdr-sub{color:rgba(255,255,255,0.85);',
    'font-size:13px;margin-top:6px;}',
    '.bc{padding:36px 28px;background:#ffffff;}',
    'h1{color:#1a1a2e;font-size:24px;',
    'font-weight:bold;margin:0 0 16px;}',
    'h2{color:#1a1a2e;font-size:18px;',
    'font-weight:bold;margin:0 0 12px;}',
    'p{color:#4a4a5a;font-size:15px;',
    'line-height:1.7;margin:0 0 14px;}',
    '.gr{color:#1a1a2e;font-size:15px;',
    'margin-bottom:18px;}',
    '.gr strong{color:#9333EA;}',
    '.cw{text-align:center;margin:28px 0;}',
    '.cb{display:inline-block;background:#9333EA;',
    'color:#ffffff!important;text-decoration:none;',
    'padding:14px 36px;border-radius:8px;',
    'font-weight:bold;font-size:15px;}',
    '.hc{background:#f8f5ff;',
    'border:1px solid #e0d4f5;',
    'border-radius:12px;padding:24px;',
    'margin:20px 0;text-align:center;}',
    '.hc .lb{font-size:12px;color:#8b8ba0;',
    'text-transform:uppercase;letter-spacing:2px;',
    'margin-bottom:8px;font-weight:600;}',
    '.hc .vl{font-size:32px;font-weight:bold;',
    'color:#9333EA;letter-spacing:4px;',
    'font-family:monospace;}',
    '.hc .vt{font-size:22px;font-weight:bold;',
    'color:#9333EA;}',
    '.ic{background:#f8f8fc;border-radius:10px;',
    'padding:16px 20px;margin:16px 0;',
    'border-left:4px solid #9333EA;}',
    '.ic p{margin:0;color:#4a4a5a;font-size:14px;}',
    '.ic strong{color:#1a1a2e;}',
    '.dt td{padding:8px 0;font-size:14px;',
    'border-bottom:1px solid #f0f0f5;}',
    '.dl{color:#8b8ba0;font-weight:500;width:40%;}',
    '.dv{color:#1a1a2e;font-weight:600;',
    'text-align:right;}',
    '.si{display:flex;align-items:flex-start;',
    'margin-bottom:14px;}',
    '.sn{display:inline-block;width:28px;',
    'height:28px;min-width:28px;',
    'background:#9333EA;color:#fff;',
    'border-radius:50%;text-align:center;',
    'line-height:28px;font-weight:bold;',
    'font-size:13px;margin-right:12px;}',
    '.st{color:#4a4a5a;font-size:14px;',
    'line-height:1.6;padding-top:3px;}',
    '.dv2{height:1px;',
    'background:#e2e2ea;margin:24px 0;}',
    '.sb{display:inline-block;background:#10B981;',
    'color:#fff;padding:5px 14px;',
    'border-radius:16px;font-size:12px;',
    'font-weight:bold;text-transform:uppercase;}',
    '.wb{display:inline-block;background:#F59E0B;',
    'color:#fff;padding:5px 14px;',
    'border-radius:16px;font-size:12px;',
    'font-weight:bold;text-transform:uppercase;}',
    '.ftr{background:#1a1a2e;padding:28px 24px;',
    'text-align:center;}',
    '.ftr a{color:#9333EA;text-decoration:none;',
    'font-size:13px;font-weight:500;}',
    '.ft{color:#9b9baa;font-size:12px;',
    'line-height:1.8;margin:12px 0 0;}',
    '.nt{font-size:13px;color:#8b8ba0;',
    'line-height:1.6;}',
    '.lt{color:#9333EA;text-decoration:none;',
    'font-weight:500;}',
    '@media only screen and (max-width:620px){',
    '.ec{margin:0!important;border-radius:0!important;}',
    '.bc{padding:24px 16px!important;}',
    '.hdr{padding:24px 16px!important;}',
    'h1{font-size:20px!important;}',
    '}',
    '</style>',
    '</head>',
    '<body>',
    `<div style="display:none!important;font-size:1px;color:#f4f4f8;line-height:1px;max-height:0;overflow:hidden;">${ph}</div>`,
    '<center style="width:100%;background:#f4f4f8;padding:24px 8px;">',
    '<div class="ec">',
    '<div class="hdr">',
    `<a href="${PRODUCTION_DOMAIN}">&#127925; ${COMPANY_NAME}</a>`,
    '<div class="hdr-sub">Africa\'s Premier Music Talent Platform</div>',
    '</div>',
    '<div class="bc">',
    content,
    '</div>',
    '<div class="ftr">',
    '<div style="margin-bottom:16px;">',
    `<a href="${PRODUCTION_DOMAIN}">Website</a> &nbsp;|&nbsp; `,
    `<a href="${PRODUCTION_DOMAIN}/faq">FAQ</a> &nbsp;|&nbsp; `,
    `<a href="${PRODUCTION_DOMAIN}/contact">Contact</a> &nbsp;|&nbsp; `,
    `<a href="${PRODUCTION_DOMAIN}/terms">Terms</a>`,
    '</div>',
    `<p class="ft">&copy; ${year} ${COMPANY_NAME}. All rights reserved.<br>`,
    `Nairobi, Kenya &middot; <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>`,
    '<p class="ft">You\'re receiving this because you have an account on ' + COMPANY_NAME + '.</p>',
    '</div>',
    '</div>',
    '</center>',
    '</body>',
    '</html>',
  ].join('\n');
};

// ─── Enterprise Templates ──────────────────────────────────────
const templates: Record<string, (data: any) => string> = {

  welcome: (data: any) => {
    const role = data.role || 'fan';
    const roleTips: Record<string, string> = {
      artist: [
        '<div class="si"><span class="sn">1</span><span class="st"><strong>Upload your first track</strong> - share your music</span></div>',
        '<div class="si"><span class="sn">2</span><span class="st"><strong>Enter competitions</strong> - win BAKCoins</span></div>',
        '<div class="si"><span class="sn">3</span><span class="st"><strong>Build your fanbase</strong> - get tips and support</span></div>',
        '<div class="si"><span class="sn">4</span><span class="st"><strong>Collaborate</strong> - work with producers</span></div>',
      ].join('\n'),
      producer: [
        '<div class="si"><span class="sn">1</span><span class="st"><strong>Upload your beats</strong> - showcase your catalog</span></div>',
        '<div class="si"><span class="sn">2</span><span class="st"><strong>Set licensing tiers</strong> - earn from sales</span></div>',
        '<div class="si"><span class="sn">3</span><span class="st"><strong>Collaborate with artists</strong> - get work requests</span></div>',
        '<div class="si"><span class="sn">4</span><span class="st"><strong>Grow your brand</strong> - build your reputation</span></div>',
      ].join('\n'),
      brand: [
        '<div class="si"><span class="sn">1</span><span class="st"><strong>Discover talent</strong> - browse emerging artists</span></div>',
        '<div class="si"><span class="sn">2</span><span class="st"><strong>Sponsor competitions</strong> - reach music fans</span></div>',
        '<div class="si"><span class="sn">3</span><span class="st"><strong>Partner with artists</strong> - authentic collabs</span></div>',
      ].join('\n'),
      fan: [
        '<div class="si"><span class="sn">1</span><span class="st"><strong>Explore trending music</strong> - discover new stars</span></div>',
        '<div class="si"><span class="sn">2</span><span class="st"><strong>Vote in competitions</strong> - help decide winners</span></div>',
        '<div class="si"><span class="sn">3</span><span class="st"><strong>Tip your favorites</strong> - support artists</span></div>',
        '<div class="si"><span class="sn">4</span><span class="st"><strong>Earn rewards</strong> - get BAKCoins for activity</span></div>',
      ].join('\n'),
    };
    const uname = data.username || 'there';
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const acctName = (data.username || data.email || 'Member').toUpperCase();
    const dashPath = role === 'fan' ? 'fan' : role;
    return emailWrapper([
      `<h1>Welcome to ${COMPANY_NAME}! &#127881;</h1>`,
      `<p class="gr">Hi <strong>${uname}</strong>,</p>`,
      '<p>We\'re thrilled to have you join Africa\'s premier music talent platform.</p>',
      '<div class="hc">',
      '<div class="lb">Your Account</div>',
      `<div class="vt">${acctName}</div>`,
      `<p style="margin:8px 0 0;color:#8b8ba0;font-size:13px;">${roleLabel} Account</p>`,
      '</div>',
      '<h2>Get started:</h2>',
      roleTips[role] || roleTips.fan,
      '<div class="cw">',
      `<a href="${PRODUCTION_DOMAIN}/${dashPath}/dashboard" class="cb">Go to Your Dashboard</a>`,
      '</div>',
      '<div class="dv2"></div>',
      `<p class="nt">Need help? <a href="${PRODUCTION_DOMAIN}/faq" class="lt">FAQ</a> or <a href="mailto:${SUPPORT_EMAIL}" class="lt">${SUPPORT_EMAIL}</a></p>`,
    ].join('\n'), `Welcome to ${COMPANY_NAME}! Your ${role} account is ready.`);
  },

  activation: (data: any) => emailWrapper([
    '<h1>Activate Your Account &#128274;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    `<p>Enter the 6-digit code below to activate your account.</p>`,
    '<div class="hc">',
    '<div class="lb">Your Activation Code</div>',
    `<div class="vl">${data.activation_code || '------'}</div>`,
    '</div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/verify-account" class="cb">Activate My Account</a>`,
    '</div>',
    '<div class="ic">',
    `<p>This code expires in <strong>24 hours</strong>.</p>`,
    '</div>',
  ].join('\n'), `Your activation code: ${data.activation_code || '------'}`),

  verification: (data: any) => emailWrapper([
    '<h1>Verify Your Email &#9993;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    `<p>Please verify your email address to unlock all features.</p>`,
    '<div class="cw">',
    `<a href="${data.verification_url || PRODUCTION_DOMAIN}" class="cb">Verify Email Address</a>`,
    '</div>',
    '<div class="ic">',
    `<p style="word-break:break-all;"><a href="${data.verification_url || PRODUCTION_DOMAIN}" class="lt">${data.verification_url || PRODUCTION_DOMAIN}</a></p>`,
    '</div>',
    '<div class="dv2"></div>',
    '<p class="nt">This link expires in 24 hours.</p>',
  ].join('\n'), 'Verify your email to complete your registration.'),

  password_reset: (data: any) => emailWrapper([
    '<h1>Reset Your Password &#128273;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    '<p>We received a request to reset your password.</p>',
    '<div class="cw">',
    `<a href="${data.reset_url || PRODUCTION_DOMAIN + '/reset-password'}" class="cb">Reset Password</a>`,
    '</div>',
    '<div class="ic">',
    '<p>This link expires in <strong>1 hour</strong>.</p>',
    '</div>',
  ].join('\n'), 'Password reset request for your account.'),

  competition_submission: (data: any) => emailWrapper([
    '<h1>Submission Received! &#127919;</h1>',
    `<p class="gr">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>`,
    '<p>Your track has been submitted to the competition.</p>',
    '<div class="hc">',
    '<div class="lb">Competition</div>',
    `<div class="vt">${data.competition_title || 'Music Competition'}</div>`,
    '</div>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Track</td><td class="dv">${data.track_title || 'Your Track'}</td></tr>`,
    `<tr><td class="dl">Voting Opens</td><td class="dv">${data.voting_start_date || 'TBA'}</td></tr>`,
    '<tr><td class="dl">Scoring</td><td class="dv">70% Votes + 30% AI</td></tr>',
    '</table>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/competition/${data.competition_id || ''}" class="cb">View Competition</a>`,
    '</div>',
  ].join('\n'), `Your track "${data.track_title}" has been submitted!`),

  competition_winner: (data: any) => emailWrapper([
    '<h1>&#127942; Congratulations, You Won!</h1>',
    `<p class="gr">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>`,
    `<p>Your track "<strong>${data.track_title || 'Your Track'}</strong>" placed in the competition!</p>`,
    '<div class="hc">',
    `<div class="lb">${data.competition_title || 'Competition'}</div>`,
    `<div class="vt">${data.position || '1st'} Place &#127942;</div>`,
    '</div>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Prize</td><td class="dv" style="color:#9333EA;font-size:18px;">${data.prize_amount || 0} BAKCoins</td></tr>`,
    `<tr><td class="dl">Final Score</td><td class="dv">${data.final_score || 0}/100</td></tr>`,
    '<tr><td class="dl">Status</td><td class="dv"><span class="sb">Prize Credited</span></td></tr>',
    '</table>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/wallet" class="cb">View Your Wallet</a>`,
    '</div>',
  ].join('\n'), `You won ${data.position || ''} place! ${data.prize_amount || 0} BAKCoins credited.`),

  withdrawal_request: (data: any) => emailWrapper([
    '<h1>Withdrawal Request Received &#128176;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'User'}</strong>,</p>`,
    '<p>We\'ve received your withdrawal request.</p>',
    '<div class="hc">',
    '<div class="lb">Withdrawal Amount</div>',
    `<div class="vt">${data.amount || 0} BAKCoins</div>`,
    `<p style="margin:8px 0 0;color:#8b8ba0;font-size:14px;">KES ${data.ksh_amount || 0}</p>`,
    '</div>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">M-PESA Number</td><td class="dv">${data.phone_number || 'N/A'}</td></tr>`,
    `<tr><td class="dl">Reference</td><td class="dv">${data.reference || 'N/A'}</td></tr>`,
    '<tr><td class="dl">Status</td><td class="dv"><span class="wb">Processing</span></td></tr>',
    '</table>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/wallet" class="cb">Track in Wallet</a>`,
    '</div>',
  ].join('\n'), `Withdrawal of ${data.amount || 0} BAKCoins is being processed.`),

  withdrawal_complete: (data: any) => emailWrapper([
    '<h1>Withdrawal Successful! &#9989;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'User'}</strong>,</p>`,
    '<p>Your withdrawal has been processed.</p>',
    '<div class="hc">',
    `<div class="vt" style="color:#10B981;">KES ${data.ksh_amount || 0}</div>`,
    `<p style="margin:8px 0 0;color:#8b8ba0;font-size:14px;">Sent to ${data.phone_number || 'your M-PESA'}</p>`,
    '</div>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">BAKCoins</td><td class="dv">${data.amount || 0}</td></tr>`,
    `<tr><td class="dl">Transaction ID</td><td class="dv">${data.transaction_id || 'N/A'}</td></tr>`,
    '<tr><td class="dl">Status</td><td class="dv"><span class="sb">Complete</span></td></tr>',
    '</table>',
  ].join('\n'), `KES ${data.ksh_amount || 0} sent to your M-PESA.`),

  tip_received: (data: any) => emailWrapper([
    '<h1>You Received a Tip! &#128157;</h1>',
    `<p class="gr">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>`,
    '<p>A fan just showed their love for your music!</p>',
    '<div class="hc">',
    '<div class="lb">Tip Amount</div>',
    `<div class="vt" style="color:#9333EA;">${data.amount || 0} BAKCoins</div>`,
    `<p style="margin:10px 0 0;color:#8b8ba0;font-size:14px;">From <strong style="color:#1a1a2e;">${data.tipper_name || 'A fan'}</strong></p>`,
    '</div>',
    data.message ? `<div class="ic"><p style="font-style:italic;">"${data.message}"</p></div>` : '',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/wallet" class="cb">View Wallet</a>`,
    '</div>',
  ].join('\n'), `${data.tipper_name || 'A fan'} tipped you ${data.amount || 0} BAKCoins!`),

  new_follower: (data: any) => emailWrapper([
    '<h1>New Follower! &#128101;</h1>',
    `<p class="gr">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>`,
    `<p><strong>${data.follower_name || 'Someone'}</strong> started following you!</p>`,
    '<div class="hc">',
    '<div class="lb">Total Followers</div>',
    `<div class="vt">${data.follower_count || '-'}</div>`,
    '</div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/artist/dashboard" class="cb">View Dashboard</a>`,
    '</div>',
  ].join('\n'), `${data.follower_name || 'Someone'} started following you!`),

  track_approved: (data: any) => emailWrapper([
    '<h1>Track Approved! &#9989;</h1>',
    `<p class="gr">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>`,
    `<p>Your track is now live on ${COMPANY_NAME}!</p>`,
    '<div class="hc">',
    '<div class="lb">Now Live</div>',
    `<div class="vt">${data.track_title || 'Your Track'}</div>`,
    '</div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/track/${data.track_id || ''}" class="cb">View Your Track</a>`,
    '</div>',
    '<div class="ic">',
    '<p><strong>Pro tip:</strong> Share on social media within 24 hours for 3x more plays!</p>',
    '</div>',
  ].join('\n'), `Your track "${data.track_title}" is now live!`),

  track_rejected: (data: any) => emailWrapper([
    '<h1>Track Review Update &#9888;</h1>',
    `<p class="gr">Hi <strong>${data.artist_name || 'Artist'}</strong>,</p>`,
    '<p>Your track didn\'t pass review this time.</p>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Track</td><td class="dv">${data.track_title || 'Your Track'}</td></tr>`,
    '<tr><td class="dl">Status</td><td class="dv" style="color:#EF4444;">Not Approved</td></tr>',
    data.reason ? `<tr><td class="dl">Reason</td><td class="dv">${data.reason}</td></tr>` : '',
    '</table>',
    '<div class="ic">',
    `<p>Review our <a href="${PRODUCTION_DOMAIN}/faq" class="lt">guidelines</a>, make adjustments, and re-upload.</p>`,
    '</div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/upload" class="cb">Upload Again</a>`,
    '</div>',
  ].join('\n'), `Your track "${data.track_title}" needs revision.`),

  contact_form: (data: any) => emailWrapper([
    `<h1>New ${data.type || 'Contact'} Submission &#128231;</h1>`,
    '<table class="dt" width="100%">',
    `<tr><td class="dl">From</td><td class="dv">${data.name || 'Unknown'}</td></tr>`,
    `<tr><td class="dl">Email</td><td class="dv"><a href="mailto:${data.email}" class="lt">${data.email || ''}</a></td></tr>`,
    `<tr><td class="dl">Subject</td><td class="dv">${data.subject || 'No subject'}</td></tr>`,
    '</table>',
    '<div class="dv2"></div>',
    '<h2>Message:</h2>',
    '<div class="ic">',
    `<p>${data.message || 'No message provided.'}</p>`,
    '</div>',
  ].join('\n'), `New ${data.type || 'contact'} submission from ${data.name || 'user'}.`),

  track_upload_admin: (data: any) => emailWrapper([
    '<h1>New Track Upload &#127925;</h1>',
    '<p>A new track requires moderation.</p>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Artist</td><td class="dv">${data.artist_name || 'Unknown'}</td></tr>`,
    `<tr><td class="dl">Track</td><td class="dv">${data.track_title || 'Untitled'}</td></tr>`,
    `<tr><td class="dl">Genre</td><td class="dv">${data.genre || 'N/A'}</td></tr>`,
    '<tr><td class="dl">Status</td><td class="dv"><span class="wb">Pending</span></td></tr>',
    '</table>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/admin" class="cb">Review in Admin</a>`,
    '</div>',
  ].join('\n'), `New track "${data.track_title}" needs moderation.`),

  beat_upload_admin: (data: any) => emailWrapper([
    '<h1>New Beat Upload &#129345;</h1>',
    '<p>A new beat requires moderation.</p>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Producer</td><td class="dv">${data.producer_name || 'Unknown'}</td></tr>`,
    `<tr><td class="dl">Beat</td><td class="dv">${data.beat_title || 'Untitled'}</td></tr>`,
    `<tr><td class="dl">Genre</td><td class="dv">${data.genre || 'N/A'}</td></tr>`,
    '<tr><td class="dl">Status</td><td class="dv"><span class="wb">Pending</span></td></tr>',
    '</table>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/admin" class="cb">Review in Admin</a>`,
    '</div>',
  ].join('\n'), `New beat "${data.beat_title}" needs moderation.`),

  new_signup_admin: (data: any) => emailWrapper([
    `<h1>New ${data.user_type || 'User'} Signup &#128203;</h1>`,
    `<p>A new user has signed up for ${COMPANY_NAME}.</p>`,
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Email</td><td class="dv">${data.email || 'Unknown'}</td></tr>`,
    `<tr><td class="dl">Type</td><td class="dv">${data.user_type || 'Fan'}</td></tr>`,
    `<tr><td class="dl">Source</td><td class="dv">${data.source || 'Direct'}</td></tr>`,
    '</table>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/admin" class="cb">View in Admin</a>`,
    '</div>',
  ].join('\n'), `New ${data.user_type || 'user'} signup: ${data.email || 'unknown'}`),

  early_access_admin: (data: any) => emailWrapper([
    '<h1>New Early Access Signup &#128640;</h1>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Email</td><td class="dv">${data.email || 'Unknown'}</td></tr>`,
    `<tr><td class="dl">Source</td><td class="dv">${data.source || 'Homepage'}</td></tr>`,
    '</table>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/admin" class="cb">View Signups</a>`,
    '</div>',
  ].join('\n'), `New early access signup: ${data.email || ''}`),

  onboarding_upload: (data: any) => emailWrapper([
    '<h1>Ready to Share Your Music? &#127908;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    '<p>Time to share your first track!</p>',
    '<h2>Upload in 4 steps:</h2>',
    '<div class="si"><span class="sn">1</span><span class="st">Click <strong>"Upload Track"</strong></span></div>',
    '<div class="si"><span class="sn">2</span><span class="st">Add your audio file (MP3, WAV)</span></div>',
    '<div class="si"><span class="sn">3</span><span class="st">Add cover art and details</span></div>',
    '<div class="si"><span class="sn">4</span><span class="st">Submit for review</span></div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/upload" class="cb">Upload Your First Track</a>`,
    '</div>',
  ].join('\n'), 'Time to upload your first track!'),

  onboarding_competitions: (data: any) => emailWrapper([
    '<h1>Win Big in Competitions! &#127942;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    '<p>Enter music competitions to win BAKCoins and get discovered.</p>',
    '<div class="hc">',
    '<div class="lb">Prize Pools Up To</div>',
    '<div class="vt">1,000+ BAKCoins</div>',
    '</div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/competitions" class="cb">View Competitions</a>`,
    '</div>',
  ].join('\n'), 'Enter competitions and win BAKCoins!'),

  onboarding_monetization: (data: any) => emailWrapper([
    '<h1>Start Earning with Your Music &#128176;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    `<p>${COMPANY_NAME} isn't just exposure - it's real money.</p>`,
    '<div class="si"><span class="sn">&#128157;</span><span class="st"><strong>Tips</strong> - Fans tip you BAKCoins</span></div>',
    '<div class="si"><span class="sn">&#127942;</span><span class="st"><strong>Competitions</strong> - Win prizes</span></div>',
    '<div class="si"><span class="sn">&#127925;</span><span class="st"><strong>Streaming</strong> - Earn per play</span></div>',
    '<div class="si"><span class="sn">&#129309;</span><span class="st"><strong>Collaborations</strong> - Work with brands</span></div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/wallet" class="cb">View Your Wallet</a>`,
    '</div>',
  ].join('\n'), 'Learn how to monetize your music.'),

  profile_reminder: (data: any) => emailWrapper([
    '<h1>Complete Your Profile &#10024;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    '<p>Complete profiles get <strong>5x more engagement</strong>!</p>',
    '<div class="ic">',
    `<p>${data.missing_items || '&#128248; Profile photo &middot; Bio &middot; Social links'}</p>`,
    '</div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/profile" class="cb">Complete Your Profile</a>`,
    '</div>',
  ].join('\n'), 'Complete your profile and get discovered!'),

  custom: (data: any) => emailWrapper(
    data.html_content || '<p>No content provided.</p>'
  ),

  contact: (data: any) => emailWrapper([
    '<h1>New Support Ticket &#127915;</h1>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">From</td><td class="dv">${data.name || 'Unknown'}</td></tr>`,
    `<tr><td class="dl">Email</td><td class="dv"><a href="mailto:${data.email}" class="lt">${data.email || ''}</a></td></tr>`,
    `<tr><td class="dl">Type</td><td class="dv">${data.type || 'Support'}</td></tr>`,
    '</table>',
    '<div class="dv2"></div>',
    '<h2>Message:</h2>',
    '<div class="ic">',
    `<p>${data.message || 'No message provided.'}</p>`,
    '</div>',
  ].join('\n'), `Support ticket from ${data.name || 'user'}.`),

  purchase_success: (data: any) => emailWrapper([
    '<h1>Purchase Successful! &#9989;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    '<p>BAKCoins have been credited to your wallet.</p>',
    '<div class="hc">',
    '<div class="lb">BAKCoins Credited</div>',
    `<div class="vt" style="color:#10B981;">${data.bak_amount || 0} BAKCoins</div>`,
    `<p style="margin:8px 0 0;color:#8b8ba0;font-size:14px;">from KES ${data.amount_kes || 0}</p>`,
    '</div>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Method</td><td class="dv">${data.payment_method || 'M-Pesa / Selar'}</td></tr>`,
    `<tr><td class="dl">Reference</td><td class="dv">${data.reference || 'N/A'}</td></tr>`,
    '<tr><td class="dl">Status</td><td class="dv"><span class="sb">Complete</span></td></tr>',
    '</table>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/wallet" class="cb">View Your Wallet</a>`,
    '</div>',
  ].join('\n'), `${data.bak_amount || 0} BAKCoins credited.`),

  referral_success: (data: any) => emailWrapper([
    '<h1>Referral Reward Earned! &#127881;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    '<p>Your referral has been completed!</p>',
    '<div class="hc">',
    '<div class="lb">Referral Reward</div>',
    `<div class="vt" style="color:#9333EA;">${data.reward_amount || 0} BAKCoins</div>`,
    `<p style="margin:8px 0 0;color:#8b8ba0;font-size:14px;">Referred: <strong style="color:#1a1a2e;">${data.referred_username || 'A new user'}</strong></p>`,
    '</div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/wallet" class="cb">View Your Wallet</a>`,
    '</div>',
  ].join('\n'), `You earned ${data.reward_amount || 0} BAKCoins from a referral!`),

  deposit_approved: (data: any) => emailWrapper([
    '<h1>Deposit Approved! &#9989;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    '<p>Your M-Pesa deposit has been verified.</p>',
    '<div class="hc">',
    '<div class="lb">Deposit Credited</div>',
    `<div class="vt" style="color:#10B981;">${data.bak_amount || 0} BAKCoins</div>`,
    `<p style="margin:8px 0 0;color:#8b8ba0;font-size:14px;">from KES ${data.amount_kes || 0}</p>`,
    '</div>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Receipt</td><td class="dv">${data.receipt_code || 'N/A'}</td></tr>`,
    '<tr><td class="dl">Status</td><td class="dv"><span class="sb">Approved</span></td></tr>',
    '</table>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/wallet" class="cb">Go to Wallet</a>`,
    '</div>',
  ].join('\n'), `Deposit of KES ${data.amount_kes || 0} approved!`),

  deposit_rejected: (data: any) => emailWrapper([
    '<h1>Deposit Request Update &#9888;</h1>',
    `<p class="gr">Hi <strong>${data.username || 'there'}</strong>,</p>`,
    '<p>We were unable to verify your deposit.</p>',
    '<table class="dt" width="100%">',
    `<tr><td class="dl">Amount</td><td class="dv">KES ${data.amount_kes || 0}</td></tr>`,
    `<tr><td class="dl">Receipt</td><td class="dv">${data.receipt_code || 'N/A'}</td></tr>`,
    '<tr><td class="dl">Status</td><td class="dv" style="color:#EF4444;">Rejected</td></tr>',
    data.reason ? `<tr><td class="dl">Reason</td><td class="dv">${data.reason}</td></tr>` : '',
    '</table>',
    '<div class="ic">',
    '<p>Double-check your receipt code and resubmit.</p>',
    '</div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/wallet" class="cb">Try Again</a>`,
    '</div>',
  ].join('\n'), `Deposit of KES ${data.amount_kes || 0} was not approved.`),

  application_approved: (data: any) => emailWrapper([
    '<h1>Application Approved! &#127881;</h1>',
    `<p class="gr">Hi <strong>${data.username || data.full_name || 'Artist'}</strong>,</p>`,
    `<p>Your application to ${COMPANY_NAME} Founders Season is approved!</p>`,
    '<div class="hc">',
    '<div class="lb">Status</div>',
    '<div class="vt" style="color:#10B981;">Approved &#9989;</div>',
    `<p style="margin:8px 0 0;color:#8b8ba0;font-size:14px;">Stage: <strong style="color:#1a1a2e;">${data.stage_name || 'N/A'}</strong></p>`,
    '</div>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/artist/dashboard" class="cb">Go to Dashboard</a>`,
    '</div>',
  ].join('\n'), 'Your BAK55 application has been approved!'),

  application_rejected: (data: any) => emailWrapper([
    '<h1>Application Update &#9888;</h1>',
    `<p class="gr">Hi <strong>${data.username || data.full_name || 'there'}</strong>,</p>`,
    '<p>After review, we\'re unable to approve your application at this time.</p>',
    data.review_notes ? `<div class="ic"><p><strong>Notes:</strong> ${data.review_notes}</p></div>` : '',
    '<p>You can reapply for the next season!</p>',
    '<div class="cw">',
    `<a href="${PRODUCTION_DOMAIN}/apply" class="cb">Apply Again</a>`,
    '</div>',
  ].join('\n'), 'Update on your BAK55 application.'),

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

    // Replace variables in DB template
    let html = tmpl.html_content;
    for (const [key, value] of Object.entries(data)) {
      html = html.replaceAll(`{{${key}}}`, String(value ?? ''));
    }
    // Also replace common links
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

    // Support custom HTML emails from admin
    if (template === 'custom' && html) {
      emailHtml = emailWrapper(html);
    } else if (html && !template) {
      emailHtml = emailWrapper(html);
    } else if (template) {
      // Priority 1: Check database for latest template (no caching — always fresh)
      const dbHtml = await loadTemplateFromDB(template, data || {});
      if (dbHtml) {
        emailHtml = dbHtml;
      } else if (templates[template]) {
        // Priority 2: Fall back to hardcoded templates
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
