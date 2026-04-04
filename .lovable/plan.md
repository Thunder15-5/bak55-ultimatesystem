
# Phase 3: User Flow Optimization + Artist Dashboard Redesign

## Part A: Artist Dashboard Rebuild

### Current Problems
- Dashboard is functional but not inspiring — lacks energy and visual hierarchy
- Stats feel flat; no sense of progress or momentum
- Competition section only shows when featured competition exists
- No promotion/sharing tools integrated
- No notifications or opportunities section
- Empty states are basic

### New Dashboard Structure (Top → Bottom)

1. **Hero Header** — Greeting + artist level badge + primary CTA (Upload Track)
2. **Progress Ring** — Visual artist level progress (streams/followers to next level)
3. **4 Stats Cards** — BAKCoins, Tracks, Plays, Followers (keep existing, polish)
4. **Active Competition Card** — Full-width, urgent, with countdown timer + submission status
5. **Quick Actions Grid** — 6 actions: Upload, Analytics, Wallet, Competitions, My Tracks, Beats
6. **Share & Grow Section** — NEW: Profile share card with copy link, social share buttons, referral stats
7. **Recent Activity** — Transaction feed (keep, polish)
8. **Opportunities Feed** — NEW: Open competitions, trending challenges, brand campaigns
9. **Top Track Performance** — Keep existing card

### What Gets Removed
- Redundant OnboardingChecklist (merge into HeroAction contextual logic)
- TrackRecommendations from dashboard (move to Discover page)

### What Gets Added
- `ShareAndGrow` component — profile sharing + referral mini-dashboard
- `OpportunitiesFeed` component — open competitions + challenges
- Artist level progress visualization in header
- Countdown timer on active competition

### Files to Modify
- `src/pages/artist/ArtistDashboard.tsx` — Full restructure
- `src/components/dashboard/DashboardHeader.tsx` — Add level badge
- NEW: `src/components/dashboard/ShareAndGrow.tsx`
- NEW: `src/components/dashboard/OpportunitiesFeed.tsx`
- NEW: `src/components/dashboard/ActiveCompetitionCard.tsx`

### Design Principles
- Mobile-first: single column, thumb-friendly
- Visual hierarchy: Competition urgency > Stats > Actions > Growth
- Every section should answer: "What should I do next?"
- Premium dark aesthetic with gradient accents

No database changes needed.
