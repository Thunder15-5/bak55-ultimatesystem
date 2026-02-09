
# BAK55 Talent Platform Flow Improvements Plan

## Executive Summary
This plan addresses 15 critical issues across the platform that create friction, broken experiences, and missed opportunities for user engagement. The fixes are organized by priority and dependency to ensure a smooth rollout.

---

## Phase 1: Critical Data Fixes (Highest Priority)

### 1.1 Remove Hardcoded Competition IDs
**Problem:** Four files use the hardcoded UUID `627488d7-abe5-4469-bb7a-0863225fea34`, causing banners to break or show empty when that specific competition is inactive.

**Files to Fix:**
- `src/pages/fan/FanDashboard.tsx` (line 42)
- `src/pages/artist/ArtistDashboard.tsx` (line 82)
- `src/pages/Competitions.tsx` (line 23)
- `src/pages/CompetitionsActive.tsx` (line 126)

**Solution:** Replace static ID queries with dynamic fetching:
```text
Before:
  .eq('id', '627488d7-abe5-4469-bb7a-0863225fea34')
  .single();

After:
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

**Impact:** Competitions will always display the latest active competition dynamically.

---

### 1.2 Fix Broken Navigation Routes
**Problem:** Quick action buttons point to non-existent routes.

**Files to Fix:**
- `src/pages/fan/FanDashboard.tsx` (line 272): `/buy-coins` should be `/fan/wallet/buy-coins`
- `src/pages/artist/ArtistDashboard.tsx` (lines 176, 389-395): `/catalog` and `/discover` missing role prefix

**Solution:** Standardize all internal links to use role-prefixed paths:
```text
Fan: /fan/wallet/buy-coins, /fan/playlists, /fan/discover
Artist: /artist/catalog, /artist/discover, /artist/wallet
```

---

## Phase 2: Onboarding Flow Consolidation

### 2.1 Merge Join + Signup Flows
**Problem:** `/join` acts as a waitlist "dead end" that collects emails but doesn't actually register users. The real registration happens at `/signup`, creating confusion.

**Current State:**
```text
/join -> Collects email -> Saves to early_access_signups -> Dead end
/signup -> Full registration -> Creates auth user -> Dashboard
```

**Solution:** Transform `/join` into a redirect gateway:
1. Add "Continue to Register" button on Join page that redirects to `/signup` with role pre-selected
2. Pass role selection via URL query parameter: `/signup?role=artist&from=join`
3. Keep early access tracking for marketing purposes

**Files to Modify:**
- `src/pages/Join.tsx`: Add registration redirect flow
- `src/pages/Signup.tsx`: Accept `role` query param to pre-select user type

---

### 2.2 Welcome BAKCoin Bonus System
**Problem:** New users start with 0 BAKCoins, preventing immediate participation in voting.

**Solution:** Award welcome bonus upon email verification:
1. Create database trigger on email confirmation
2. Award 10 BAK for fans, 20 BAK for artists
3. Show welcome toast: "Welcome to BAK55! You've received your starter BAKCoins!"

**Technical Implementation:**
- Modify `verify-activation-code` edge function to award bonus
- Add `signup_bonus_awarded` flag to profiles table to prevent duplicate bonuses

---

## Phase 3: Navigation and Mobile UX

### 3.1 Simplify Mobile Navigation
**Problem:** Mobile menu shows 11+ items for artists, overwhelming users on small screens.

**Current Mobile Nav (Artist):**
```text
Dashboard | Upload | My Music | Browse | Analytics | Competitions | Wallet | [Badge] | Profile | Logout
```

**Solution:** Implement bottom tab navigation for core actions:
```text
Bottom Tabs: Home | Upload | Discover | Wallet | Profile
Menu (Secondary): Analytics, Competitions, Settings, Logout
```

**Files to Create:**
- `src/components/BottomNavigation.tsx`: Mobile-only bottom tab bar
- Modify `src/components/Navigation.tsx`: Hide mobile menu for logged-in users on small screens

---

### 3.2 Empty State Improvements
**Problem:** Stats cards showing "0" don't guide users on what to do next.

**Current:**
```text
| BAKCoins: 0 | Tracks: 0 | Plays: 0 |
```

**Solution:** Replace zero-state cards with actionable prompts:
```text
| BAKCoins: 0 → "Get your first coins" CTA |
| Tracks: 0 → "Upload your first track" CTA |
```

**Files to Modify:**
- `src/pages/fan/FanDashboard.tsx`: Add empty state CTAs
- `src/pages/artist/ArtistDashboard.tsx`: Add empty state CTAs

---

## Phase 4: Competition Flow Polish

### 4.1 Consistent Competition Phase Display
**Problem:** Competition status logic is duplicated and inconsistent across pages.

**Solution:** Create shared utility hook:
```text
// src/hooks/useCompetitionPhase.ts
export function useCompetitionPhase(competition) {
  const phase = useMemo(() => {
    // Unified phase calculation: opening_soon | submissions_open | voting_soon | voting_open | completed
  }, [competition]);
  return phase;
}
```

**Usage across:**
- `CompetitionDetails.tsx`
- `CompetitionBanner.tsx`
- `CompetitionsActive.tsx`

---

### 4.2 Fix Featured Competition Banner Text
**Problem:** `Competitions.tsx` still hardcodes "BAK55 Genesis" as the featured competition title.

**Location:** Line 73-77 in `src/pages/Competitions.tsx`

**Fix:** Use dynamic title from fetched competition:
```text
Before: "Live Now: BAK55 Genesis"
After: "Live Now: {featuredCompetition.title}"
```

---

## Phase 5: Post-Login Redirect Enhancements

### 5.1 Smart Post-Signup Redirect
**Problem:** After signup, users see a generic verification message but no clear next step.

**Solution:** Implement role-specific post-signup guidance:
```text
Fan: "Verification email sent! After verifying, start discovering music."
Artist: "Verification email sent! After verifying, upload your first track."
```

---

## Implementation Order

```text
+------------------+     +------------------+     +------------------+
|   Phase 1        |---->|   Phase 2        |---->|   Phase 3        |
| Fix Hardcoded    |     | Merge Flows      |     | Mobile UX        |
| IDs + Routes     |     | Welcome Bonus    |     | Empty States     |
| (4 files)        |     | (2 edge funcs)   |     | (3 components)   |
+------------------+     +------------------+     +------------------+
         |                                                   |
         v                                                   v
+------------------+                             +------------------+
|   Phase 4        |<----------------------------|   Phase 5        |
| Competition      |                             | Post-Auth        |
| Polish           |                             | Guidance         |
+------------------+                             +------------------+
```

---

## Technical Details

### Files to Modify (Existing):
| File | Changes |
|------|---------|
| `src/pages/fan/FanDashboard.tsx` | Dynamic competition fetch, fix `/buy-coins` route, empty state CTAs |
| `src/pages/artist/ArtistDashboard.tsx` | Dynamic competition fetch, fix routes, empty state CTAs |
| `src/pages/Competitions.tsx` | Dynamic competition fetch, fix hardcoded title |
| `src/pages/CompetitionsActive.tsx` | Remove hardcoded featured ID check |
| `src/pages/Join.tsx` | Add "Continue to Register" redirect button |
| `src/pages/Signup.tsx` | Accept pre-selected role from URL params |
| `src/components/Navigation.tsx` | Simplify mobile menu for logged-in users |

### Files to Create (New):
| File | Purpose |
|------|---------|
| `src/hooks/useCompetitionPhase.ts` | Shared competition phase calculation |
| `src/components/BottomNavigation.tsx` | Mobile bottom tab bar |
| `src/components/EmptyStateCard.tsx` | Reusable empty state with CTA |

### Database Changes:
| Change | Purpose |
|--------|---------|
| Add `signup_bonus_awarded` boolean to `profiles` table | Track welcome bonus to prevent duplicates |

### Edge Function Modifications:
| Function | Changes |
|----------|---------|
| `verify-activation-code` | Add logic to award welcome BAKCoins bonus |

---

## Success Metrics
After implementation:
1. Competition banners never show empty/broken
2. All navigation links work correctly
3. New users receive starter BAKCoins
4. Mobile experience feels native with bottom tabs
5. Zero-state dashboards guide users to take action

---

## Estimated Effort
- **Phase 1:** 1 hour (straightforward find/replace)
- **Phase 2:** 2-3 hours (flow changes + edge function)
- **Phase 3:** 2-3 hours (new components)
- **Phase 4:** 1 hour (refactoring)
- **Phase 5:** 30 minutes (text changes)

**Total:** 6-8 hours of development work
