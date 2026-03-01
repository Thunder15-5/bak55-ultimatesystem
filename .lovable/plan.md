

## Issue Found: Vote link added to wrong navigation component

The "Vote Now" link was added to `Navbar.tsx`, but the **homepage uses `Navigation.tsx`** — a separate component. `Navbar.tsx` is only used on secondary pages (About, FAQ, Legal, etc.). The main navigation that users see on the homepage and when logged in has no voting link.

## Fix

### 1. Add "Vote Now" to `Navigation.tsx` — logged-out desktop nav (lines 219-255)
Add a highlighted "Vote Now" link between the existing nav links and the Login/Join buttons, matching the style used in `Navbar.tsx`.

### 2. Add "Vote Now" to `Navigation.tsx` — logged-out mobile nav (lines 383-443)
Add a styled "Vote Now — Rising Stars" link in the mobile dropdown for unauthenticated users.

### 3. Add "Vote Now" to `Navigation.tsx` — logged-in fan desktop nav (lines 56-95)
Add a "Vote" link in the fan's desktop navigation items.

### 4. Add "Vote Now" to `Navigation.tsx` — logged-in fan mobile nav (lines 274-301)
Add a "Vote" link in the fan's mobile menu items.

### Files
- `src/components/Navigation.tsx` — 4 insertions

