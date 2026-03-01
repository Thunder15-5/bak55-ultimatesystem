

## Enterprise Email Template Upgrade

### Current State
The `send-email` edge function has 25+ hardcoded templates using a shared wrapper with BAK55 purple branding, responsive CSS, and a dark footer. The structure is solid but uses minimal styling — single-column layout with basic typography and abbreviated CSS class names.

### Upgrade Plan

**Single file change**: `supabase/functions/send-email/index.ts`

#### 1. Redesign `emailWrapper()` with enterprise-grade HTML email standards
- Replace CSS classes with **inline styles** (Gmail, Outlook strip `<style>` blocks in many cases)
- Use **table-based layout** for bulletproof cross-client rendering (Outlook desktop requires tables)
- Add **dark mode media queries** (`@media (prefers-color-scheme: dark)`)
- Add **MSO conditionals** (`<!--[if mso]>`) for Outlook desktop compatibility
- Improve the header: add the BAK55 logo image from `/icons/icon-512x512.png`, subtle gradient, tagline
- Upgrade footer: social media links (Instagram, Twitter, Facebook, LinkedIn), unsubscribe text, physical address (Zanzi Court, Riara Rd, Nairobi)
- Add anti-spam headers: List-Unsubscribe placeholder

#### 2. Upgrade all 25+ template bodies
- Use full descriptive inline styles instead of abbreviated class names (`.ec`, `.hc`, `.bc`, etc.)
- Add subtle dividers, improved spacing, and card-like sections with soft shadows
- Improve CTAs: larger buttons with hover-state colors, rounded corners, proper padding
- Use professional copy: clear subject lines, benefit-oriented messaging
- Add a "Need help?" footer block in every template with support email + FAQ link

#### 3. Add missing enterprise templates
- `subscription_activated` — when a user subscribes to a plan
- `subscription_expiring` — 3 days before expiry warning
- `weekly_digest` — weekly activity summary for artists
- `vote_received` — notify artist when they receive votes in Rising Stars

#### 4. Keep the double-wrap fix intact
The recently added detection for complete HTML documents in `loadTemplateFromDB()` will remain unchanged.

### Technical Details
- All changes are in one file: `supabase/functions/send-email/index.ts`
- No database migrations needed
- No frontend changes needed
- The edge function will be auto-deployed after edit
- Estimated: ~800 lines rewritten (wrapper + all templates), keeping the same function signatures and handler logic

