

## Bugs Identified from Screenshot

1. **"Unknown Artist" labels** — The query fetches `profiles.username` but many artists have their name in `artist_profiles.stage_name` or `profiles.display_name` instead. Need to fall back through: `stage_name → display_name → username → 'Unknown Artist'`.

2. **Broken mobile layout** — The card uses a single horizontal flex row with 5 elements (rank, cover, info, votes, actions). On mobile this causes text truncation ("SIK...", "Sina..."), the competition title badge wrapping/overlapping, and cramped spacing.

3. **Competition title badge overflow** — "BAK55 Rising Stars – Founder Season 2026" is too long for the inline badge on mobile, causing layout breakage.

## Fix — Single file: `src/pages/RisingStarsVoting.tsx`

### 1. Fix artist name resolution
- Also fetch `display_name` from `profiles` and `stage_name` from `artist_profiles`
- Use priority: `stage_name → display_name → username → 'Unknown Artist'`

### 2. Fix mobile card layout
- Change from single-row flex to a stacked layout on mobile:
  - Top row: rank + cover + artist info (name, truncated title)
  - Right side: vote count + vote/share buttons
  - Bottom: audio player
- Hide the long competition title badge on mobile (show on sm+ only)
- Use `flex-wrap` and responsive classes to prevent overflow

### 3. Truncate competition title
- Add `truncate max-w-[150px]` to the badge so long titles don't break layout

