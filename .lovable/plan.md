

## Problem: Approved submissions stuck with `status = 'pending'`

The `auto_publish_approved_submission` trigger correctly sets `status = 'approved'` when `moderation_status` changes to `'approved'` — but it was added after 12 existing submissions were already approved. Those songs still have `status = 'pending'`, so the voting page query (which filters on `status = 'approved'`) returns zero results.

## Fix

**One database migration** to backfill the existing data:

```sql
UPDATE public.submissions
SET status = 'approved'
WHERE moderation_status = 'approved'
  AND status = 'pending';
```

This will immediately make all 12 approved songs visible on the voting page. Future submissions will be handled correctly by the existing trigger. No code changes needed.

