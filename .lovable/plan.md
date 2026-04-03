
# BAK55 Full Product Redesign — Implementation Plan

## Phase 1: Homepage Rebuild (This Message)

### Above the Fold
- **Hero**: Bold headline "Where African Artists Launch Careers", animated gradient text, 2 CTAs (Join Free + Explore Music), live platform stats pulled from DB
- **Trust Bar**: "Trusted by 500+ artists" + security badge + payout badge — immediately below hero

### Below the Fold (Scroll Order)
1. **"How BAK55 Works"** — 3-step visual flow (Upload → Compete → Earn)
2. **"Who is BAK55 For?"** — 3 audience cards (Artists/Fans/Brands) with clear value props
3. **Social Proof** — Testimonial cards or artist success highlights
4. **Features/Benefits** — 3 pillars: Upload & Earn, Compete & Win, Engage & Grow
5. **Live Competition Banner** — Dynamic, pulls active competition
6. **Featured Artists Carousel**
7. **FAQ Section** — New, addresses trust concerns (How do payouts work? Is voting fair? etc.)
8. **Final CTA** — "Start Your Journey Today"
9. **Footer** — Streamlined with trust badges

### What Gets Removed
- Redundant TrendingArtists section (FeaturedArtistsCarousel covers this)
- Economy section (too abstract for homepage — move to /about)
- StatsBar (merge into Hero stats)

### Design Principles
- Dark premium aesthetic with gradient accents
- 16px/24px spacing rhythm
- Mobile-first: single column, thumb-friendly CTAs
- Typography: large bold headlines, muted body text

## Phase 2: Auth & Onboarding (Next Message)
- Multi-step signup (Role → Credentials → Welcome)
- Trust badges on auth pages
- Post-signup activation flow

## Phase 3: User Flow Optimization (Following Message)
- Dashboard contextual actions
- Competition entry simplification
- Fan voting flow polish

### Files to modify:
- `src/pages/Index.tsx` — Section reorder, add FAQ
- `src/components/Hero.tsx` — Polish copy and stats
- `src/components/HowItWorks.tsx` — Already good, minor polish
- `src/components/Features.tsx` — Benefit-focused rewrite
- `src/components/CTA.tsx` — Stronger closing CTA
- `src/components/Footer.tsx` — Add trust elements
- **New**: `src/components/FAQ.tsx` — Trust-building FAQ section

No database changes needed.
