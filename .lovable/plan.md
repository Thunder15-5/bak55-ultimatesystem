
# Fix Competition Creation Stage Type Validation Error

## Problem Identified
The database has a check constraint that only allows these `stage_type` values:
- `onboarding`
- `mini_edition` 
- `studio_session`
- `grand_finale`

The error occurs when trying to insert a row into `competition_stages` with an invalid stage type.

## Root Cause Analysis
After reviewing the current code in `CreateCompetition.tsx`, the stage type values have already been updated to use valid values. However, the error persists. This could be due to:

1. **Cached Code**: The browser may be serving a cached version of the JavaScript bundle
2. **PWA Service Worker Cache**: This project uses `vite-plugin-pwa` with aggressive caching that may be serving old code
3. **Incomplete Deployment**: Recent changes may not have fully deployed

## Solution

### Step 1: Force Cache Busting
Add a verification step to ensure the form is using the correct values, and add console logging to help debug what's actually being sent to the database.

### Step 2: Validate Stage Types Before Submission
Add a validation check in the `handleSubmit` function that explicitly validates all stage types match the allowed values before attempting the database insert. This will:
- Catch any invalid values before they hit the database
- Provide a clear error message to help identify where bad values are coming from

### Step 3: Add Fallback Default
Update the stage type handling to have an explicit fallback to `mini_edition` if an invalid type somehow makes it through.

## Technical Implementation

**File: `src/pages/admin/CreateCompetition.tsx`**

1. Add a constant array of valid stage types for reference:
```typescript
const VALID_STAGE_TYPES = ['onboarding', 'mini_edition', 'studio_session', 'grand_finale'] as const;
```

2. Update the `handleSubmit` function to validate stage types before insertion:
```typescript
// Before inserting stages, validate all stage types
if (multiStageEnabled) {
  const invalidStages = stages.filter(s => 
    !VALID_STAGE_TYPES.includes(s.stage_type as any)
  );
  if (invalidStages.length > 0) {
    toast({
      title: "Invalid Stage Type",
      description: `Stage "${invalidStages[0].stage_name}" has invalid type "${invalidStages[0].stage_type}". Valid types: ${VALID_STAGE_TYPES.join(', ')}`,
      variant: "destructive",
    });
    setLoading(false);
    return;
  }
}
```

3. Update the stage insert mapping to ensure type safety:
```typescript
const stageInserts = stages.map(stage => ({
  ...stage,
  competition_id: competition.id,
  stage_type: VALID_STAGE_TYPES.includes(stage.stage_type as any) 
    ? stage.stage_type 
    : 'mini_edition', // Fallback to prevent database errors
  // ... rest of mapping
}));
```

4. Ensure the `updateStage` function enforces valid types:
```typescript
const updateStage = (index: number, field: keyof Stage, value: any) => {
  const newStages = [...stages];
  if (field === 'stage_type' && !VALID_STAGE_TYPES.includes(value)) {
    value = 'mini_edition'; // Fallback for invalid types
  }
  newStages[index] = { ...newStages[index], [field]: value };
  setStages(newStages);
};
```

## User Action Required
After the fix is deployed:
1. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. If using the installed PWA app, uninstall and reinstall, or clear app data
3. Try creating the competition again

## Files to Modify
- `src/pages/admin/CreateCompetition.tsx` - Add validation, constants, and fallbacks
