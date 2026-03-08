

# Plan: Enable Likes & Comments

## What We're Doing
Flip the feature flags to enable likes and comments, and wire the `CommentSection` component into the `TrackDetails` page where it's currently missing.

## Changes

### 1. Flip Feature Flags
**File:** `src/lib/featureFlags.ts`
- Set `LIKES_ENABLED: true`
- Set `COMMENTS_ENABLED: true`

### 2. Add CommentSection to TrackDetails
**File:** `src/pages/TrackDetails.tsx`
- Import `CommentSection` from `@/components/CommentSection`
- Import `isFeatureEnabled` from `@/lib/featureFlags`
- Render `<CommentSection trackId={id} />` at the bottom of the track details page, gated by `isFeatureEnabled('COMMENTS_ENABLED')`

### 3. Add Track Likes to TrackDetails
**File:** `src/pages/TrackDetails.tsx`
- The existing Heart/like button in the UI should be functional — verify and connect it to the `track_likes` table, gated by `isFeatureEnabled('LIKES_ENABLED')`
- Add like/unlike toggle using `track_likes` insert/delete with optimistic UI update

### 4. Gate Existing Engagement in Artist Dashboard
**File:** `src/pages/artist/ArtistDashboard.tsx` — already queries `track_likes` and `comments` counts, no changes needed (stats will now have data)

**File:** `src/pages/artist/ArtistCatalog.tsx` — already queries `track_likes` and `comments` counts, no changes needed

## Summary
- 2 files modified (`featureFlags.ts`, `TrackDetails.tsx`)
- No database changes needed — `comments`, `comment_likes`, and `track_likes` tables already exist with RLS
- `CommentSection` component is fully built with replies, likes, realtime subscriptions, and input validation

