# BAK55 Platform Development Plan
**Created:** March 8, 2026  
**Status:** Active  
**Goal:** Launch-ready platform with complete monetization, scalability, and user growth systems

---

## Phase 1: Critical Fixes & Launch Readiness (Weeks 1–2)

### 1.1 OG Image — PNG Conversion
- Convert SVG output to PNG using canvas rendering in edge function
- Test on WhatsApp, Facebook, Instagram, X (Twitter)
- Ensure fallback image works for missing data
- **Priority:** 🔴 Critical — social sharing drives organic growth

### 1.2 Fix Known Bugs
- [ ] Fan club content gating — implement actual access control on tier-exclusive content
- [ ] Add database indexes on hot queries: `votes(submission_id)`, `tracks(artist_id, moderation_status)`, `followers(artist_id)`
- [ ] Fix 1000-row query limit — add pagination to leaderboard, catalog, and admin panels
- [ ] Verify Selar/PesaPal webhook signature validation

### 1.3 Security Hardening
- [ ] Audit all edge functions for proper CORS headers
- [ ] Verify all RLS policies cover edge cases
- [ ] Add rate limiting to voting endpoint (prevent bot abuse)
- [ ] Validate webhook signatures on payment callbacks

---

## Phase 2: Revenue & Monetization (Weeks 3–4)

### 2.1 Complete Withdrawal Pipeline
- [ ] Integrate automated KYC provider (Smile ID recommended for Africa)
- [ ] Build withdrawal request UI with status tracking
- [ ] Admin withdrawal approval dashboard with fraud checks
- [ ] M-Pesa payout testing with PesaPal production credentials
- **Revenue Impact:** Unblocks artist payouts — critical for retention

### 2.2 Fan Club Content Gating
- [ ] Implement tier-based content access control on track pages
- [ ] Create exclusive content upload flow for artists
- [ ] Add "Members Only" badge/lock UI on gated content
- [ ] Recurring subscription billing (auto-deduct BAKCoins monthly)

### 2.3 Payment Reconciliation
- [ ] Build financial dashboard for admin showing all money flows
- [ ] Track platform revenue vs artist payouts vs escrow holds
- [ ] Export transaction reports (CSV)

---

## Phase 3: User Growth & Engagement (Weeks 5–8)

### 3.1 Social Login
- [ ] Add Google OAuth via Lovable Cloud Auth
- [ ] Add Apple Sign-In
- [ ] Merge existing email accounts with social logins
- **Growth Impact:** Reduces signup friction by ~40%

### 3.2 Push Notifications
- [ ] Configure Capacitor Push plugin with FCM
- [ ] Trigger notifications for: new followers, tips, competition updates, track approvals
- [ ] Notification preferences UI (opt-in/out per category)

### 3.3 Real-Time Chat
- [ ] Build artist↔fan messaging system using Lovable Cloud realtime
- [ ] Fan club group chat per tier
- [ ] Message moderation tools for artists
- [ ] Notification integration

### 3.4 Artist Course Content
- [ ] Populate 10 onboarding lessons in `course_lessons` table
- [ ] Topics: uploading music, growing followers, entering competitions, earning BAKCoins, KYC process
- [ ] Track completion progress with certificates/badges

---

## Phase 4: Platform Polish & Analytics (Weeks 9–10)

### 4.1 Advanced Analytics Dashboard
- [ ] Artist: revenue breakdown by source (tips, votes, sales)
- [ ] Artist: follower growth chart over time
- [ ] Fan: listening history insights, spending breakdown
- [ ] Admin: daily active users, revenue trends, competition participation rates
- [ ] Export capabilities for all reports

### 4.2 Brand Dashboard Upgrade
- [ ] Campaign management — brands can sponsor competitions
- [ ] Artist discovery filters for brand partnerships
- [ ] Sponsorship placement tracking and ROI metrics

### 4.3 UI/UX Polish
- [ ] Consistent 8px spacing grid across all pages
- [ ] Loading skeleton states for all data-fetching pages
- [ ] Error boundary improvements with retry buttons
- [ ] Mobile-first responsive audit (all pages)
- [ ] Accessibility audit (ARIA labels, keyboard navigation)

---

## Phase 5: Scale & Performance (Weeks 11–12)

### 5.1 Database Optimization
- [ ] Add composite indexes based on query patterns
- [ ] Implement materialized views for leaderboard data
- [ ] Set up connection pooling for high-traffic periods
- [ ] Archive old transactions/votes (> 6 months)

### 5.2 CDN & Media
- [ ] Move audio file serving to CDN
- [ ] Image optimization pipeline (WebP, responsive sizes)
- [ ] Lazy load all images and audio players

### 5.3 Caching Strategy
- [ ] Cache leaderboard data (refresh every 5 min)
- [ ] Cache exchange rates (refresh every hour)
- [ ] Cache public artist/track data at edge

### 5.4 Monitoring
- [ ] Error tracking and alerting
- [ ] Database query performance monitoring
- [ ] Edge function execution time tracking

---

## Phase 6: Future Vision (Month 4+)

### 6.1 Content Distribution
- [ ] DistroKid/TuneCore integration for external streaming
- [ ] Automatic royalty tracking

### 6.2 Advanced AI
- [ ] ML-based fraud detection
- [ ] AI playlist curation
- [ ] Personalized artist growth recommendations

### 6.3 Live Streaming
- [ ] WebRTC live streaming infrastructure
- [ ] Live tipping during streams
- [ ] Virtual concert ticketing

### 6.4 Marketplace
- [ ] Artist merch store
- [ ] Event ticketing
- [ ] Collaboration marketplace

### 6.5 Multi-Language
- [ ] Swahili (primary market)
- [ ] French (West Africa)
- [ ] i18n framework

---

## Success Metrics

| Metric | 3-Month Target | 6-Month Target |
|--------|---------------|----------------|
| Registered users | 5,000 | 25,000 |
| Active artists | 500 | 2,000 |
| Monthly active users | 2,000 | 10,000 |
| Tracks uploaded | 1,000 | 5,000 |
| Monthly BAKCoin txns | 10,000 | 50,000 |
| Competition participation | 100/comp | 500/comp |
| Platform revenue | $500/mo | $5,000/mo |

---

## Technical Debt Tracker

| Item | Priority | Phase |
|------|----------|-------|
| OG images return SVG not PNG | 🔴 High | 1 |
| KYC is manual only | 🔴 High | 2 |
| No payment reconciliation | 🔴 High | 2 |
| Fan club content not gated | 🟡 Medium | 2 |
| No push notifications | 🟡 Medium | 3 |
| No social login | 🟡 Medium | 3 |
| Artist course empty | 🟡 Medium | 3 |
| 1000-row query limit | 🟡 Medium | 1 |
| Live Streams UI-only | 🟢 Low | 6 |
| No multi-language | 🟢 Low | 6 |
| No offline PWA | 🟢 Low | 6 |

---

## Domain Issue Notes

### Meta In-App Browser 404 (Previously Diagnosed)
The custom domain `bak55talent.co.ke` may show 404 in Facebook/Instagram browsers. This is a CDN binding issue, not a code bug. Fix: re-publish, verify domain in Settings → Domains, clear Meta cache via [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).
