

## Problem: Double-Wrapped Email Templates

The `send-email` edge function has a critical bug in `loadTemplateFromDB()` (line 696). Database templates stored in the `email_templates` table are **complete HTML documents** (with `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` tags, their own CSS, and footer). But the function wraps them again inside `emailWrapper()`, producing:

```text
<!DOCTYPE html>
<html>  ← outer wrapper
  <body>
    <div class="ec">  ← wrapper header/footer
      <!DOCTYPE html>  ← DB template (NESTED!)
      <html>
        <body>
          ... actual content ...
        </body>
      </html>
    </div>
  </body>
</html>
```

This causes email clients to render broken layouts, duplicate headers/footers, garbled styles, and generally unprofessional-looking emails.

## Fix

**One change in `supabase/functions/send-email/index.ts`**, line 696:

In `loadTemplateFromDB()`, detect if the DB template is already a complete HTML document. If so, return it directly without wrapping. Only wrap if it's a content fragment.

```typescript
// Before (broken):
return emailWrapper(html);

// After (fixed):
if (html.trim().toLowerCase().startsWith('<!doctype') || html.trim().toLowerCase().startsWith('<html')) {
  return html; // Already a complete email — don't double-wrap
}
return emailWrapper(html);
```

This is a single-line change that fixes all DB-sourced emails immediately. No migration or frontend changes needed.

