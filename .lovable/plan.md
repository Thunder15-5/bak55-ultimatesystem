
# Moderation System - Comprehensive Fix Plan

## Root Cause Analysis

After investigating the database logs, RLS policies, and code, I've identified **three critical issues** preventing the moderation system from working:

### Issue 1: Missing Admin UPDATE Policy on `tracks` Table
**Current state:** The tracks table only allows artists to update their own tracks:
```sql
-- Current policy: Artists can update own tracks
qual: (auth.uid() = artist_id)
```

**Problem:** Admins cannot update tracks because they're not the `artist_id`. When an admin tries to approve/reject, the RLS policy silently blocks the update (0 rows affected).

### Issue 2: Missing INSERT Policies on `admin_activity_log` Table
**Current state:** The table only has a SELECT policy for admins - no INSERT policy exists.

**Database errors observed:**
```
ERROR: new row violates row-level security policy for table "admin_activity_log"
```

This causes the code to fail after attempting to log the moderation activity.

### Issue 3: Missing INSERT Policy on `notifications` Table
**Current state:** The table only has SELECT and UPDATE policies for `auth.uid() = user_id`. There's NO INSERT policy.

**Database errors observed:**
```
ERROR: new row violates row-level security policy for table "notifications"
```

Admins cannot insert notifications for artists, so the code fails when trying to notify the artist of approval/rejection.

### Issue 4: Missing Admin UPDATE Policy on `submissions` Table
Same issue as tracks - only artists can update their own submissions.

---

## Implementation Plan

### Step 1: Add Missing RLS Policies via Database Migration

Create a new migration to add the following policies:

**A) Tracks table - Admin UPDATE policy:**
```sql
CREATE POLICY "Admins can update any track"
ON public.tracks FOR UPDATE
USING (public.is_admin(auth.uid()));
```

**B) Submissions table - Admin UPDATE policy:**
```sql
CREATE POLICY "Admins can update any submission"
ON public.submissions FOR UPDATE
USING (public.is_admin(auth.uid()));
```

**C) Admin activity log - INSERT policy:**
```sql
CREATE POLICY "Admins can insert activity logs"
ON public.admin_activity_log FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));
```

**D) Notifications table - INSERT policies:**
```sql
-- Allow users to insert notifications for themselves
CREATE POLICY "Users can create own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins to insert notifications for any user
CREATE POLICY "Admins can create notifications for any user"
ON public.notifications FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));
```

### Step 2: Improve Code Resilience in ModerationPanel

Even with RLS fixes, we should make the code more resilient:

**A) Wrap logging/notification calls in try-catch:**
The main moderation action (update) should succeed even if logging/notifications fail. Currently, a notification failure rolls back the entire operation.

**B) Move logging/notifications to non-blocking operations:**
- Log activity and send notifications in separate try-catch blocks
- Don't let their failure prevent the main moderation action

**C) Improve error feedback:**
- Distinguish between "update failed" vs "update succeeded but notification failed"
- Provide better user feedback

### Step 3: Verify Query Keys Alignment

Ensure all components use the centralized `trackKeys` from `useTracks.ts`:
- `ModerationPanel.tsx` uses `MODERATION_KEY = ['moderation', 'pending']`
- This doesn't match `trackKeys.pending()` which returns `['tracks', 'pending']`
- Need to ensure consistent invalidation patterns

---

## Files to Modify

1. **New database migration** - Add missing RLS policies
2. **src/components/ModerationPanel.tsx** - Improve error handling and resilience

---

## Expected Results After Fix

1. Admin clicks "Approve" → Track status updates to "approved" in database
2. Track immediately disappears from moderation list (optimistic UI)
3. Track appears in streaming/discover pages (React Query invalidation)
4. Activity logged and artist notified (non-blocking)
5. No more "Item not found" or RLS policy errors

---

## Technical Details

### Why the current code appears to work but doesn't:
1. Admin clicks approve
2. `UPDATE tracks SET moderation_status = 'approved' WHERE id = x` runs
3. RLS policy `(auth.uid() = artist_id)` blocks the update silently
4. 0 rows affected → code interprets as "already processed"
5. Item removed from cache optimistically, but database still shows "pending"
6. On refresh, item reappears because it was never actually updated

### The fix ensures:
1. RLS allows admins to update any track
2. UPDATE actually changes the status
3. Cache invalidation correctly refreshes all dependent queries
4. Approved tracks show in streaming/discover, rejected ones don't
