# BAK55 — Complete Partially Finished Features Plan
**Created:** March 8, 2026  
**Objective:** Bring every partially-built feature to production-ready status  
**Estimated Timeline:** 6 weeks (3 sprints × 2 weeks)

---

## Summary of Partially Built Features

| # | Feature | Current State | What's Missing |
|---|---------|--------------|----------------|
| 1 | Fan Club Content Gating | Tiers & memberships exist, subscription works | No actual content access control; no exclusive upload flow; no auto-billing |
| 2 | Live Streaming | UI + DB tables exist (create/list streams) | No WebRTC/video infrastructure; no actual streaming; no live tipping |
| 3 | Artist Course / Education | UI + `course_lessons` table exist | Table is empty — zero lessons populated; no completion certificates |
| 4 | KYC Verification | `kyc_verifications` table exists; manual review only | No automated ID verification provider; no selfie matching; no document upload UI |
| 5 | Withdrawal Pipeline | Wallet + withdrawal request UI exists | M-Pesa integration is simulated; no status tracking UI for users; no automated payouts |
| 6 | Brand Dashboard | Basic stats + competition creation works | No campaign management; no sponsorship tracking; no artist discovery filters; no ROI metrics |
| 7 | OG Image Generation | Edge function generates SVG | SVG not supported by social crawlers — needs PNG conversion |
| 8 | Push Notifications | In-app notification bell works | No native push (FCM/APNs); no background notifications; no preference controls |
| 9 | Direct Messaging | `conversations` + `messages` tables exist | Chat UI exists but is basic; no read receipts; no typing indicators; no fan club group chat |
| 10 | Listening History Analytics | History page fetches data | No insights/stats (top genres, time spent, streak); no recommendations based on history |
| 11 | Payment Webhook Validation | Selar + PesaPal callbacks exist | Signature verification is incomplete/untested |
| 12 | Artist Analytics | Basic play counts shown | No revenue breakdown by source; no follower growth chart; no export capability |

---

## Sprint 1: Revenue-Critical Features (Weeks 1–2)

### 1.1 Fan Club Content Gating ✦ HIGH PRIORITY
**Goal:** Artists can upload exclusive content; only paying members see it.

- [ ] Add `is_exclusive` and `required_tier_level` columns to `tracks` table
- [ ] Create RLS policies: block track access if user lacks active membership at required tier
- [ ] Build "Upload Exclusive Content" flow on artist dashboard (select tier level)
- [ ] Add "Members Only" lock overlay on gated tracks in UI
- [ ] Implement auto-renewal: edge function that runs daily, deducts BAKCoins for active memberships, expires lapsed ones
- [ ] Add membership expiry notifications (3 days before, on expiry)

**Database changes:**
```sql
ALTER TABLE tracks ADD COLUMN is_exclusive boolean DEFAULT false;
ALTER TABLE tracks ADD COLUMN required_tier_level integer DEFAULT 0;
```

### 1.2 Complete Withdrawal Pipeline ✦ HIGH PRIORITY
**Goal:** Artists can request withdrawals and track status; admins approve with real M-Pesa payouts.

- [ ] Build user-facing withdrawal status tracker (pending → approved → processing → completed/failed)
- [ ] Add withdrawal history page showing all past requests with statuses
- [ ] Integrate real M-Pesa B2C API in `mpesa-withdraw` edge function (replace simulation)
- [ ] Add PesaPal production credentials and test end-to-end
- [ ] Add admin withdrawal details view: user KYC status, transaction history, fraud flags
- [ ] Email notifications on withdrawal status changes

### 1.3 OG Image PNG Conversion ✦ HIGH PRIORITY
**Goal:** Social sharing images render correctly on WhatsApp, Facebook, Instagram, X.

- [ ] Install `@vercel/og` or use Satori + resvg-js in edge function for SVG→PNG rendering
- [ ] Update `generate-og-image` to return `image/png` content type
- [ ] Test with Facebook Sharing Debugger, X Card Validator, WhatsApp link preview
- [ ] Add fallback default image for tracks/artists without cover art

### 1.4 Payment Webhook Hardening
**Goal:** Verify all payment callbacks are authentic.

- [ ] Implement HMAC signature validation in `selar-callback` edge function using `SELAR_WEBHOOK_SECRET`
- [ ] Implement PesaPal IPN signature validation using `PESAPAL_IPN_SECRET`
- [ ] Add replay attack prevention (check transaction ID uniqueness)
- [ ] Log all webhook events to `admin_activity_log` for audit

---

## Sprint 2: Engagement & Growth Features (Weeks 3–4)

### 2.1 Artist Course Content Population ✦ MEDIUM PRIORITY
**Goal:** 10 onboarding lessons live and trackable.

- [ ] Write and insert 10 lessons into `course_lessons` table via migration:
  1. Welcome to BAK55 — Platform overview
  2. Setting Up Your Artist Profile — Bio, photos, social links
  3. Uploading Your First Track — Audio specs, cover art, metadata
  4. Understanding BAKCoins — Earning, spending, withdrawing
  5. Entering Competitions — How to submit and win
  6. Growing Your Fanbase — Followers, engagement, sharing
  7. Fan Clubs & Exclusive Content — Monetize your superfans
  8. Understanding Analytics — Reads your stats, make decisions
  9. KYC & Withdrawals — Getting verified and cashing out
  10. Collaboration & Networking — Working with other artists
- [ ] Add completion badge: "BAK55 Graduate" to `artist_badges` table
- [ ] Auto-award badge when all 10 lessons completed
- [ ] Add course completion certificate UI (shareable card)

### 2.2 KYC Verification Upgrade ✦ MEDIUM PRIORITY
**Goal:** Document upload + admin review flow (automated provider deferred to Phase 6).

- [ ] Create `kyc_documents` storage bucket (private)
- [ ] Build KYC document upload UI: ID front/back + selfie
- [ ] Store documents in storage bucket with user_id folder structure
- [ ] Update `kyc_verifications` table: add `document_urls`, `selfie_url`, `rejection_reason`
- [ ] Admin KYC review panel: view documents, approve/reject with notes
- [ ] Notifications on KYC status changes
- [ ] Block withdrawal requests if KYC not approved

### 2.3 Direct Messaging Completion ✦ MEDIUM PRIORITY
**Goal:** Functional artist↔fan messaging with real-time updates.

- [ ] Build full chat UI component with message list, input, send button
- [ ] Add real-time message subscription using Supabase Realtime
- [ ] Add read receipts (update `read_at` timestamp on message view)
- [ ] Add unread message count badge on navigation
- [ ] Fan club group chat: create conversation per tier, auto-add members
- [ ] Message notification integration (in-app + future push)

### 2.4 Artist Analytics Enhancement ✦ MEDIUM PRIORITY
**Goal:** Artists get actionable revenue and growth insights.

- [ ] Revenue breakdown chart: tips vs competition winnings vs track sales vs fan club
- [ ] Follower growth line chart (daily/weekly/monthly)
- [ ] Top tracks by plays/revenue table
- [ ] Geographic listener distribution (if data available)
- [ ] CSV export for all analytics data
- [ ] Compare periods: this week vs last week

---

## Sprint 3: Platform Polish & Remaining Features (Weeks 5–6) ✅ COMPLETED

### 3.1 Push Notifications ✦ MEDIUM PRIORITY ✅
**Goal:** Native push notifications on mobile (PWA + Capacitor).

- [x] Create `push_tokens` table to store device tokens per user
- [x] Create `notification_preferences` table for per-category toggles
- [x] Edge function `send-push-notification` to send push via FCM (ready for FCM key)
- [x] Notification preferences UI: toggle per category (follows, tips, competitions, messages, track updates, marketing)
- [x] Integrated into Profile page as "Alerts" tab
- [ ] Configure Capacitor Push Notifications plugin (requires native build)
- [ ] Update PWA service worker for background notification handling (deferred)

### 3.2 Brand Dashboard Completion ✦ LOW PRIORITY ✅
**Goal:** Brands can manage sponsorships and discover artists.

- [x] Campaign management: create/edit campaigns with budget tracking and ROI metrics
- [x] Artist discovery with filters: genre, location, follower count, verified status, talent score
- [x] ROI dashboard: total campaigns, active count, budget utilization percentage
- [x] Brand↔Artist partnership request system (notification-based)
- [x] Sort by talent score, followers, tracks, earnings

### 3.3 Live Streaming Foundation ✦ LOW PRIORITY ✅
**Goal:** Basic streaming capability using third-party infrastructure.

- [x] Artist "Go Live" flow: schedule stream → go live → end stream
- [x] Viewer page: watch stream with real-time chat sidebar (Supabase Realtime)
- [x] Live tipping: fans send BAKCoins during stream via send-tip function
- [x] Stream chat messages table with realtime subscription
- [ ] Integrate with streaming provider (Mux/Agora) — requires API key (deferred)
- [ ] Stream recording and replay capability (deferred)

### 3.4 Listening History Insights ✦ LOW PRIORITY ✅
**Goal:** Fans get personalized listening stats.

- [x] "Your Top Artists" section (most listened in 30 days)
- [x] "Your Top Genres" breakdown chart with percentage bars
- [x] Total listening time stat (estimated from plays)
- [x] Listening streak tracker (consecutive days)
- [x] Shareable "My BAK55 Wrapped" style card (Web Share API / clipboard)


---

## Implementation Order (Recommended)

| Priority | Feature | Sprint | Est. Effort |
|----------|---------|--------|-------------|
| 🔴 P0 | Fan Club Content Gating | 1 | 3 days |
| 🔴 P0 | Withdrawal Pipeline | 1 | 3 days |
| 🔴 P0 | OG Image PNG | 1 | 1 day |
| 🔴 P0 | Webhook Validation | 1 | 1 day |
| 🟡 P1 | Artist Course Content | 2 | 2 days |
| 🟡 P1 | KYC Document Upload | 2 | 3 days |
| 🟡 P1 | Direct Messaging | 2 | 3 days |
| 🟡 P1 | Artist Analytics | 2 | 2 days |
| 🟢 P2 | Push Notifications | 3 | 3 days |
| 🟢 P2 | Brand Dashboard | 3 | 3 days |
| 🟢 P2 | Live Streaming | 3 | 4 days |
| 🟢 P2 | Listening Insights | 3 | 1 day |

---

## Dependencies & Blockers

| Feature | Dependency | Notes |
|---------|-----------|-------|
| Withdrawal Pipeline | M-Pesa B2C production credentials | Need PesaPal production API access |
| Push Notifications | FCM server key | Need Firebase project + secret |
| Live Streaming | Streaming provider account | Mux/Agora/LiveKit API key needed |
| KYC (automated) | Smile ID or similar | Deferred — manual review first |
| OG Image PNG | Edge function runtime | Verify Deno supports resvg-js WASM |

---

## Success Criteria

- [ ] Fan club members can ONLY access tier-gated content
- [ ] Withdrawals flow end-to-end: request → admin approve → M-Pesa payout → user notified
- [ ] OG images render as PNG on all social platforms
- [ ] All 10 course lessons accessible and completable
- [ ] KYC documents uploadable and reviewable by admin
- [ ] Real-time chat works between artists and fans
- [ ] Artist analytics show revenue breakdown and follower growth
- [ ] Payment webhooks reject invalid signatures
