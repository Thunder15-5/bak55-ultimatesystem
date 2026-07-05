# BAK55 Build Brief — Mobile-First Premium Rollout

Scope: convert the mobile-first + design-system work we just aligned on into
a single execution brief a developer can pick up, ship in stages, and QA.

---

## 1. Objective
Ship a **premium, mobile-first, trust-forward** interaction layer across the
five highest-conversion surfaces (Competitions, Voting, Payments/Wallet,
Tipping, Following) using our new primitives:
`BottomSheet`, `PressableButton`, `actionToast`, `haptic`, `RetryableError`,
`Skeleton*`, `EmptyState`.

The outcome the user should *feel*: one product, one voice, thumb-native,
no janky modals, no dead loading screens, every money action reviewed and
receipted before it commits.

## 2. User Story
> As a fan on a mid-range Android phone with flaky data, I want every
> money-moving action (vote, tip, buy coins, follow, subscribe) to feel
> fast, safe, and reversible — even when the network drops — so I trust
> BAK55 with my BAKCoins.

## 3. Required UI Sections (per surface)

| Surface | Above-fold | Sheet body | Post-action |
|---|---|---|---|
| Competitions list | Featured hero + skeleton grid | — | Empty state w/ CTA |
| Competition detail | Cover + stage nav + prize | Submit sheet, Vote sheet | Vote receipt |
| Voting flow | Track card + cheer bar | Select → Review → Confirm | VoteSuccessState + share |
| Payment / Wallet | Balance card + skeletons | Top-up sheet, Withdraw sheet | PaymentStatusScreen |
| Tip | Artist header | Preset chips + custom + fee review | Toast + optimistic count |
| Follow | Artist card | — (inline) | Optimistic toggle + toast |

## 4. Core Components (reuse, don't duplicate)
- `mobile/BottomSheet` — replaces every `Dialog` used on <768px flows
- `PressableButton` — every primary CTA (vote/tip/follow/submit/pay)
- `actionToast.success|error|info|loading` — the only toast surface
- `haptic("light"|"medium"|"success"|"error")` — attach to CTA + result
- `RetryableError` — every fetch failure state
- `ui/skeleton-components` — `TrackCardSkeleton`, `TransactionSkeleton`,
  `DashboardStatSkeleton`, `PlaylistCardSkeleton`
- `EmptyState` — every zero-data list
- `trust/VoteReceipt` — pre-confirm review inside voting + payment sheets

## 5. Backend Logic Needed (already in place; wire, don't rebuild)
- `send-tip` edge function — used by TipDialog
- `vote-submission` edge function — used by VoteSheet
- `deduct_wallet()` RPC — enforce row-level lock on every money action
- `selar-callback` — HMAC-verified top-up webhook (PaymentCallback polls
  `wallets.balance` for delta)
- `renew-fan-memberships` — follow-to-subscribe promotion path
- No new tables. If a new action lands, follow public-schema GRANT rule.

## 6. States & Edge Cases (checklist per action)
- **Idle** — CTA enabled, cost/fee shown up front
- **Loading skeleton** — never a bare spinner on a list
- **Empty** — `EmptyState` with a next-step CTA (never a dead card)
- **Optimistic** — count/toggle updates before server ack
- **Rollback** — on error, revert + `actionToast.error` + haptic("error")
- **Rate-limited** — friendly copy ("Slow down — 5 per minute")
- **Insufficient balance** — deep-link to `/buy-coins?intent=<action>`
- **Offline** — `RetryableError` with `onRetry`
- **Session expired** — bounce to `/login?redirect=<current>`
- **Duplicate submit** — disable CTA + guard by request id

## 7. Validation Rules
- Amounts: `min 0.1`, `max 10 000` BAK, 2-dp rounding via
  `Math.round(x*100)/100`
- Messages: sanitize with `sanitizeText`, cap 140 chars
- Vote: one row per `(user_id, submission_id, day)` for free tier; paid
  self-votes capped at 10/day (see voting-integrity memory)
- Tip: reuse `tipSchema` from `lib/validation`
- Payment polling: 20 attempts × 3s, then `failed` state

## 8. Mobile Requirements
- All sheets: `pb-safe`, grabber handle (built into `BottomSheet`),
  `maxVh={92}`
- Touch targets ≥ 44×44
- Inputs: `inputMode="decimal"` for amounts, `autoComplete` set, `h-12`
  min height to block iOS zoom
- Persistent player offset: wrappers keep `pb-16`
- Type ramp only: `text-display` / `text-title` / `text-body`
- Card language only: `card-base` / `card-elevated` (rounded-2xl, blur)
- Press-scale on every CTA (`.press-scale` or `PressableButton`)

## 9. Trust & Fraud Considerations
- **Review before commit** — every money sheet shows fee split via
  `FeeSplitBadge` + `VoteReceipt` before the confirm tap
- **Receipt after commit** — `VoteReceipt` / `PaymentStatusScreen` render
  the transaction id + timestamp for user-verifiable audit
- **Rate limiting** — `rateLimiter.check` on tip, vote, follow bursts
- **Server auth** — edge functions verify `auth.getClaims` (system-security
  memory); never trust client user id
- **Webhook integrity** — Selar callbacks HMAC-SHA256 + replay guard
- **PII** — read `profiles_public`, never raw `profiles`, in every list
- **Transparency links** — Competition + Voting surfaces link to
  `/transparency` and show `TrustSignals`

## 10. Suggested Implementation Priority

### Phase A — Ship this week (high traffic, high $)
1. `CompetitionsActive` + `CompetitionDetails`: skeletons + `EmptyState` +
   `RetryableError`; migrate `SubmitExistingTrackDialog` to `BottomSheet`
2. `TipDialog` → `BottomSheet` + `PressableButton` + `actionToast` +
   haptics; keep the fee-review block as the confirm gate
3. `Wallet` transactions list: `TransactionSkeleton` grid +
   `RetryableError` + `EmptyState`

### Phase B — Follow-up
4. Follow buttons across `ArtistProfile`, `TrendingArtists`,
   `FeaturedArtistsCarousel`: `PressableButton` + optimistic toggle +
   `actionToast`
5. `WithdrawDialog`, `BeatLicenseDialog`, `AddTracksDialog`,
   `StreamViewer` → `BottomSheet` on mobile (auto-fallback to Dialog on
   `md+` via `useIsMobile`)
6. `PaymentCallback` copy pass + share-back on success

### Phase C — Polish
7. Admin quick actions: FAB on `/admin` with the 4 most-used ops
8. Global toast audit: kill remaining raw `toast.*` calls in favor of
   `actionToast`
9. Remove any residual `Dialog` on money surfaces

---

### Technical notes
- `useIsMobile()` from `hooks/use-mobile` is the switch for
  `BottomSheet` vs `Dialog` where desktop parity matters.
- Skeleton grids must match final card count/shape to prevent layout
  shift (CLS).
- Every optimistic update needs a matching rollback in the `catch` — no
  silent divergence between UI and DB.
- `actionToast.loading(id)` + `actionToast.dismiss(id)` is the pattern
  for long ops; never leave a loading toast orphaned.
