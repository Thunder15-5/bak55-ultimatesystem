

## Bugs Identified

### Bug 1: Queue processor silently fails — edge-to-edge function invocation
`process-email-queue` calls `supabase.functions.invoke("send-email")` using a service-role Supabase client. Edge-to-edge function invocation via `functions.invoke` is unreliable and often times out or fails silently inside Deno edge runtime. The logs confirm: the function boots but produces zero processing output — no "Processed X emails" or error messages.

**Fix**: Inline the SMTP sending logic directly in `process-email-queue` instead of calling the `send-email` edge function. Load templates from DB, substitute variables, and send via SMTP directly — same pattern as `send-email` but without the inter-function call.

### Bug 2: Duplicate emails in sent logs
Looking at the sent log data, the same user receives the same template twice within seconds (e.g., `hirwabertrand49@gmail.com` got 2 welcome emails at 06:48:41 and 06:48:42). The `send-bulk-welcome` function has no deduplication — it sends to ALL profiles without checking `email_sent_log`.

**Fix**: Add a check in `send-bulk-welcome` to skip users who already received a welcome email (query `email_sent_log` for `template_name = 'welcome'`).

### Bug 3: Stale pending queue items never cleared
Queue has 30+ items from Feb 17-26 stuck as "pending" because the queue processor never runs successfully. Even when manually triggered from admin, it fails silently per Bug 1.

**Fix**: Resolved by fixing Bug 1. Additionally, add a "Retry Failed" and "Clear Stale" button in the admin panel.

---

## Implementation Plan

### 1. Rewrite `process-email-queue` edge function
- Import SMTP sending logic directly (denomailer) instead of calling `send-email`
- Load DB templates inline using `loadTemplateFromDB` pattern
- Fall back to hardcoded template aliases (`first_upload_guide` → `onboarding_upload`, etc.)
- Add proper error logging for each email
- Keep the 500ms throttle between sends

### 2. Fix `send-bulk-welcome` to prevent duplicates
- Query `email_sent_log` for existing `welcome` template sends
- Build a Set of user IDs already sent
- Skip those users in the loop

### 3. Add queue management actions in admin panel
- "Retry Failed" button: resets `failed` queue items back to `pending`
- "Clear Stale" button: deletes queue items older than 7 days that are still pending
- Show count of stale items in the queue header

