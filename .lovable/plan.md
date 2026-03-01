

## Problem

The Rising Stars voting page (`/rising-stars/voting`) has no discoverable entry point. It is not linked from:
- The main Navbar (desktop or mobile)
- The BottomNavigation (mobile)
- The Competitions page
- The homepage

The fan's "Vote" button in BottomNavigation points to `/competitions/active`, not the voting page.

## Plan

### 1. Add "Vote" link to Navbar (desktop + mobile)
In `src/components/Navbar.tsx`, add a prominent "Vote" nav link pointing to `/rising-stars/voting` in both the desktop nav bar and the mobile hamburger menu. Style it with a highlight (e.g., gold/primary color or a small badge) so it stands out.

### 2. Update BottomNavigation "Vote" target
In `src/components/BottomNavigation.tsx`, change the fan role's Trophy/Vote item href from `/competitions/active` to `/rising-stars/voting`.

### 3. Add a voting CTA on the homepage
In `src/pages/Index.tsx` or `src/components/CompetitionBanner.tsx`, add a visible "Vote Now" button/banner linking to `/rising-stars/voting` so first-time visitors can find it immediately.

### 4. Add voting link on the Competitions page
In `src/pages/Competitions.tsx` or `src/pages/CompetitionsActive.tsx`, add a prominent card or banner linking to the Rising Stars voting page.

