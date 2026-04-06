
# BAK55 Competition Experience Redesign

## Design Philosophy
Premium entertainment-tech aesthetic (think Apple Keynote meets Spotify Wrapped). Every screen should feel like an event, not a form.

---

## Phase 1: Competition Discovery & Detail Pages
**Files:** `Competitions.tsx`, `CompetitionDetails.tsx`, `CompetitionBanner.tsx`

### Competition Landing Page (`/competitions`)
- **Hero Section**: Full-width gradient banner with active competition spotlight, animated countdown timer, and "Enter Now" CTA
- **Active Competitions Grid**: Card-based layout with cover art, prize amount, spots remaining, and phase badges (Submissions Open / Voting Live / Finals)
- **Past Winners Showcase**: Social proof section showing previous winners with their prize amounts
- **Trust Bar**: "Fair Voting • AI-Verified • Transparent Results" trust signals

### Competition Detail Page (`/competition/:id`)
- **Immersive Header**: Cover image with glassmorphism overlay, competition title, prize pool breakdown
- **Phase Timeline**: Horizontal stepper showing current phase (Submissions → Voting → Semi-Finals → Finals → Winners)
- **Prize Breakdown Card**: Visual prize distribution (1st, 2nd, 3rd) with amounts
- **Rules & Fairness Section**: Collapsible rules with trust badges (anti-fraud, verified voting)
- **Leaderboard Preview**: Top 5 entries with vote counts (if voting is live)
- **Smart CTA**: Context-aware button that changes based on phase and user state

---

## Phase 2: Submission & Voting Experience
**Files:** `RisingStarsVoting.tsx`, submission flow components

### Artist Submission Flow
- **Eligibility Check**: Pre-submission screen showing requirements (subscription, track upload)
- **Track Selector**: Choose from existing catalog or upload new track
- **Submission Confirmation**: Success celebration with share prompt and "Track your votes" CTA

### Voting Experience
- **Voting Cards**: Audio-enabled cards with play button, artist info, vote button
- **Vote Feedback**: Confetti burst + balance deduction animation on successful vote
- **Insufficient Balance**: Inline upgrade prompt (not a jarring redirect)
- **Real-time Updates**: Vote count ticks up live via Supabase Realtime

---

## Phase 3: Leaderboard & Progression
**Files:** `Leaderboard.tsx`, `StageNavigator.tsx`

### Leaderboard
- **Rank Visualization**: Top 3 with podium-style display, rest in clean list
- **Live Indicators**: Pulse animation on entries receiving votes now
- **Filter/Sort**: By votes, by genre, by recent activity
- **Artist Cards**: Photo, stage name, track title, vote count, trend arrow (↑↓)

### Weekly Progression
- **Stage Cards**: Visual timeline of competition phases with status indicators
- **Elimination Reveal**: Dramatic reveal of who advances (blur → reveal animation)
- **Artist Journey Tracker**: Personal progress card for participating artists

---

## Phase 4: Finals & Winner Announcement
**Files:** New components for finals and winner experience

### Finals Experience
- **Spotlight Layout**: Featured finalist cards with full bios and track players
- **Live Vote Counter**: Real-time vote accumulation with animated counters
- **Countdown to Results**: Timer counting down to winner announcement

### Winner Announcement
- **Reveal Moment**: Dramatic blur-to-reveal with confetti and sound
- **Winner Profile Card**: Full-width celebration card with prize amount
- **Social Share Kit**: Pre-made share cards for winner and voters
- **Prize Visibility**: Clear breakdown of prize distribution with payout timeline

---

## Trust & Fairness Signals (Across All Pages)
- Anti-fraud badge on every voting interface
- "Verified by AI" badge on judged submissions
- Transparent vote audit trail link
- Self-vote limit disclosure
- Real-time vote monitoring indicator

## Emotional Design Strategy
- **Anticipation**: Countdown timers, "spots remaining" urgency
- **Achievement**: Confetti, rank badges, milestone celebrations
- **Social Proof**: "X fans voted today", trending indicators
- **Fairness**: Transparent rules, fraud detection badges, audit links
- **Belonging**: "You're part of history" messaging for Founders Season

## CTA Strategy
- Phase-aware CTAs (never show "Vote" during submissions phase)
- Urgency copy: "Only 12 spots left" / "Voting ends in 3 days"
- Post-action CTAs: After voting → "Share to help them win"
- Empty state CTAs: "No submissions yet → Be the first to enter"
