/**
 * BAK55 real journey data.
 *
 * SOURCE OF TRUTH RULES
 * - Every entry here must describe something that actually happened on this platform.
 * - Counts that change over time are NOT hardcoded here — they are read live from the
 *   database via `get_public_platform_stats` and rendered by <LiveStatsRow />.
 * - Never add speculative, illustrative, or "example" entries to these arrays.
 */

export interface Milestone {
  date: string; // ISO date of the real event
  title: string;
  description: string;
}

/** Real milestones, oldest last. */
export const MILESTONES: Milestone[] = [
  {
    date: "2025-10-07",
    title: "Public beta opened",
    description:
      "BAK55 went live as an open beta. The first accounts were created and the first tracks were uploaded on the same day.",
  },
  {
    date: "2025-10-07",
    title: "Artist registration opened",
    description:
      "Artist sign-up and profile creation went live, alongside track upload and the BAKCoins wallet.",
  },
  {
    date: "2026-02-09",
    title: "First competition created",
    description:
      "The first BAK55 competition was published, opening submissions and fan voting on the platform.",
  },
  {
    date: "2026-04-15",
    title: "Two-admin approval for winner overrides",
    description:
      "Any manual change to a competition result now requires sign-off from two separate admins and is written to the audit log.",
  },
  {
    date: "2026-06-01",
    title: "Mobile-first rebuild",
    description:
      "Bottom-sheet flows, larger tap targets and a persistent player position were rolled out after mobile users reported cramped dialogs.",
  },
  {
    date: "2026-07-20",
    title: "Transparency portal",
    description:
      "Public vote receipts, the live audit feed and the fairness breakdown were published so anyone can inspect how results are produced.",
  },
];

export type ChangeCategory = "feature" | "fix" | "security" | "performance" | "policy";

export interface ChangelogEntry {
  version: string;
  date: string; // ISO
  changes: { category: ChangeCategory; text: string }[];
}

/** Real, shipped releases. Append-only — never edit or delete a published entry. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.7",
    date: "2026-07-20",
    changes: [
      { category: "feature", text: "Public transparency portal: vote receipts, live audit feed and fairness breakdown" },
      { category: "feature", text: "Artist revenue dashboard with gross/fee/net itemisation and CSV export" },
      { category: "policy", text: "Fee splits disclosed before every spend (votes, tips, beats, subscriptions)" },
    ],
  },
  {
    version: "0.6",
    date: "2026-06-01",
    changes: [
      { category: "feature", text: "Mobile-first rebuild: bottom-sheet dialogs, safe-area padding, larger tap targets" },
      { category: "fix", text: "Modals were cut off on small screens and could not be dismissed on some Android browsers" },
      { category: "performance", text: "Route-level code splitting with retry for in-app browsers, reducing first load time" },
    ],
  },
  {
    version: "0.5",
    date: "2026-04-15",
    changes: [
      { category: "security", text: "Two-admin approval required for manual competition result changes" },
      { category: "security", text: "Trust & Safety console: fraud alerts, case queue, enforcement log and appeals" },
      { category: "policy", text: "Self-voting capped at 10 votes per user per day" },
    ],
  },
  {
    version: "0.4",
    date: "2026-03-02",
    changes: [
      { category: "fix", text: "Wallet balance no longer goes stale after a deposit — all spends run through a locked ledger transaction" },
      { category: "security", text: "Payment callbacks hardened with signature verification and replay protection" },
      { category: "performance", text: "Database indexes and pagination added to catalog and leaderboard queries" },
    ],
  },
  {
    version: "0.3",
    date: "2026-02-09",
    changes: [
      { category: "feature", text: "Competitions: submissions, fan voting and leaderboards went live" },
      { category: "fix", text: "Duplicate votes could be recorded on slow connections — votes are now idempotent per request" },
      { category: "fix", text: "Play counts double-counted on replay; now only counted after 30 seconds of playback" },
    ],
  },
  {
    version: "0.2",
    date: "2025-12-08",
    changes: [
      { category: "feature", text: "Artist profiles: stage name, bio, cover art and public catalog page" },
      { category: "fix", text: "Sign-up could fail silently when the verification email did not send; fallback activation codes added" },
      { category: "feature", text: "Dashboard redesign with real play, follower and earnings figures" },
    ],
  },
  {
    version: "0.1",
    date: "2025-10-07",
    changes: [
      { category: "feature", text: "Public beta: accounts, track upload, streaming and the BAKCoins wallet" },
    ],
  },
];

export interface ResolvedIssue {
  problem: string;
  cause: string;
  solution: string;
  status: string;
}

/** Real defects that were reported during beta and have been fixed. */
export const RESOLVED_ISSUES: ResolvedIssue[] = [
  {
    problem: "BAKCoins balance did not update after a deposit or a vote.",
    cause: "The wallet was read from a cached client query and written by two separate code paths that could race.",
    solution: "All balance changes now go through a single database function that locks the wallet row, and the client refetches after every transaction.",
    status: "Fixed",
  },
  {
    problem: "Dashboard statistics did not match the catalog (plays, followers, earnings).",
    cause: "Stats were counted from partial query results — Postgres returns a maximum of 1,000 rows per request by default.",
    solution: "Counts are now computed in the database and paginated queries batch through the full set.",
    status: "Fixed",
  },
  {
    problem: "Songs showed inflated play counts.",
    cause: "A play was recorded on every player mount, including scrubbing and replays.",
    solution: "A play is only counted once per session after 30 seconds of continuous playback.",
    status: "Fixed",
  },
  {
    problem: "Earnings shown on the artist dashboard lagged behind the wallet.",
    cause: "Earnings were aggregated on write and could drift when a transaction failed part-way.",
    solution: "Earnings are derived from the transaction ledger, so the ledger is always the single source of truth.",
    status: "Fixed",
  },
  {
    problem: "Some profiles failed to load with a relationship error.",
    cause: "Nested joins across profiles, artist profiles and tracks broke when a related row was missing.",
    solution: "Related records are fetched in explicit batches and missing data falls back to a safe default.",
    status: "Fixed",
  },
  {
    problem: "Users could not sign in after registering.",
    cause: "Verification emails were delayed or blocked by some providers, and the error message was generic.",
    solution: "Added activation codes, a resend flow with cooldown, Google sign-in, magic links, and error messages that name the actual cause.",
    status: "Fixed",
  },
  {
    problem: "Votes were occasionally recorded twice.",
    cause: "Retrying a slow request submitted the same vote again.",
    solution: "Vote submission is handled by a single server function with per-request idempotency and rate limits.",
    status: "Fixed",
  },
  {
    problem: "Payments completed but coins were not credited.",
    cause: "The payment callback was not verified and could be missed if the browser closed during redirect.",
    solution: "Callbacks are signature-verified, replay-protected, and the payment screen polls the wallet until the credit lands.",
    status: "Fixed",
  },
  {
    problem: "Dialogs and forms were unusable on small phones.",
    cause: "Desktop modals were reused on mobile, overflowing the viewport under the browser chrome.",
    solution: "Mobile flows now use bottom sheets with safe-area padding, 44px tap targets and correct keyboard types.",
    status: "Fixed",
  },
];

export interface OpenIssue {
  title: string;
  description: string;
  progress: number; // 0-100, honest self-assessment
  expected: string;
}

/** Work genuinely still in progress. Keep this honest — do not empty it to look finished. */
export const OPEN_ISSUES: OpenIssue[] = [
  {
    title: "Profile completion drop-off",
    description:
      "A large share of registered artists never finish their profile or upload a track, so their page stays empty.",
    progress: 40,
    expected: "Guided onboarding with a saved checklist and reminders, so a new artist can go from sign-up to first upload in one sitting.",
  },
  {
    title: "Withdrawals at scale",
    description:
      "Payouts work but each request still involves a manual review step before the transfer is released.",
    progress: 55,
    expected: "Automated payout batching with clearer status updates, while keeping the fraud review window in place.",
  },
  {
    title: "Blog and press publishing from the admin panel",
    description:
      "Articles are still stored in the codebase, so publishing an update requires a deploy.",
    progress: 20,
    expected: "A database-backed editor so real updates can be published the day they happen.",
  },
  {
    title: "Search and discovery depth",
    description:
      "Search covers titles and artist names but not lyrics, moods or richer filters, so smaller catalogs are hard to browse.",
    progress: 30,
    expected: "Better ranking, genre and mood filters, and recommendations that work with a small catalog.",
  },
];
