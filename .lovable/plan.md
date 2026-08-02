## Objective

Reposition BAK55 from "BAK55 hosts competitions" to "anyone in the music industry hosts competitions on BAK55" — without breaking any existing artist, fan, producer, or brand functionality. Everything already built stays; we add an organizer layer on top and re-point the public surface at it.

## What already exists (reused, not rebuilt)

- `competitions`, `submissions`, `votes`, `competition_stages`, `competition_prizes`, `competition_escrow` tables
- Voting flow, escrow, settlement (65/35), wallet, withdrawals, fraud/trust console
- Role system (`app_role`: artist, brand, admin, fan, producer) + `has_role`
- Existing create-competition page at `/admin|brand|producer/competitions/create`

## Phase 1 — Organizer foundation (backend + accounts)

New `organizer` role and `organizers` table (owner, name, type, slug, logo, cover, description, website, socials, verification status, stats). Organizer types: studio, producer, label, brand, event, university, NGO, agency, government, festival.

- `organizer_followers`, `organizer_reviews` (schema only, UI later)
- `competitions.organizer_id` added (nullable — existing rows stay BAK55-owned)
- `competition_revenue_config` per competition: entry-fee split, voting split, platform fee, organizer share — defaults from a global `platform_revenue_defaults` row editable only by super admin
- RLS: organizers manage their own rows; public reads verified organizers; admins manage all
- Signup/onboarding gains "Host competitions" path → organizer profile creation

## Phase 2 — Organizer dashboard + Competition Builder

`/organizer/dashboard` with: competitions list (draft/live/paused/ended), contestants & application approvals, votes, analytics, revenue, payouts.

Guided multi-step Competition Builder replacing the single-form create flow:
1. Basics — title, category, genre, country, description, banner
2. Entry & voting — entry fee, vote price, max contestants
3. Schedule — registration window, competition/voting dates, stages
4. Judging — fan-only / judge-only / hybrid (70/30 default), judges list
5. Prizes — prize pool + position split, sponsors
6. Rules & terms → review → save draft or publish (publish gated on organizer verification)

Existing brand/producer/admin create routes redirect into the builder so nothing 404s.

## Phase 3 — Public marketplace + homepage repositioning

- `/competitions` becomes the marketplace: filters for country, genre, organizer, prize range, registration status, competition type; sort by prize/closing soon/newest
- `/organizers` directory + `/organizer/:slug` public profile (logo, cover, bio, verification, followers, competition history, stats)
- Homepage rebuilt around: featured competitions → verified organizers → why host on BAK55 (organizer CTA) → featured artists → trending music → top producers → how it works → live stats → three CTAs (host / compete / vote)

## Phase 4 — Role expansions + super admin

- Studios as an organizer type with facilities/services showcase; booking requests schema-ready
- Producers: host + judge competitions, beat packs, artist discovery
- Brands: sponsorship of other organizers' competitions, campaign analytics
- Artists: competition history, wins, rankings, earnings, tips, followers, fan club members on one dashboard tab
- Fans: favorite competitions/organizers, reminders, leaderboards, activity feed
- Super admin: verify organizers, verify/feature competitions, approve payouts, edit global revenue splits, platform analytics

## Technical notes

- All new public tables get GRANTs + RLS in the same migration
- Revenue math continues to route through `deduct_wallet()` and escrow; settlement reads per-competition config with fallback to platform defaults
- Design system unchanged: existing tokens, `ResponsiveModal`/BottomSheet on mobile, `PressableButton` + `actionToast` for primary actions
- No fake data — organizer stats and marketplace counts read live from the database

## Suggested order

Phase 1 → 2 → 3 → 4. Phases 1 and 2 unlock the business model; 3 makes it visible; 4 broadens it.
