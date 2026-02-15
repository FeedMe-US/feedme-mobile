# Onboarding Flow Changes

## Summary
Successfully reordered the onboarding flow and added a progress bar to improve UX.

## Changes Made

### A) Reordered Onboarding Steps

**New Flow Order (12 steps):**
1. What's your current goal? (`goal`)
2. Tastes & Preferences (`mood-preferences`) - **Moved from step 11 to step 2**
3. Dietary Requirements (`dietary-requirements`)
4. Any allergies? (`allergies`)
5. Ingredients you avoid? (`ingredients-avoid`)
6. Where do you usually eat? (`dining-locations`)
7. Biological Sex (`sex`)
8. How old are you? (`age`)
9. How tall are you? (`height`)
10. What is your weight? (`weight`)
11. How active are you? (`activity`)
12. Diet strictness (`diet-strictness`)

### B) Added Progress Bar

**New Components:**
- `ProgressBar` - Reusable linear progress indicator
- `OnboardingProgressBar` - Wrapper that auto-detects current step
- `src/constants/onboarding.ts` - Single source of truth for step order

**Progress Bar Features:**
- Thin (6px) rounded bar in theme blue
- Automatically positioned below safe area at top of screen
- Shows progress as (currentStep + 1) / totalSteps
- Hidden on complete screen
- No layout shift - consistent spacing

## Files Changed

### New Files Created
1. **`src/constants/onboarding.ts`** - Onboarding flow configuration (single source of truth)
2. **`src/ui/ProgressBar.tsx`** - Reusable progress bar component
3. **`src/ui/OnboardingProgressBar.tsx`** - Auto-detecting progress bar wrapper

### Modified Files

#### Navigation Updates (6 files)
1. **`app/(onboarding)/goal.tsx`**
   - Changed: `sex` → `mood-preferences`

2. **`app/(onboarding)/mood-preferences.tsx`**
   - Changed: `diet-strictness` → `dietary-requirements`

3. **`app/(onboarding)/ingredients-avoid.tsx`**
   - Changed: `mood-preferences` → `dining-locations`

4. **`app/(onboarding)/dining-locations.tsx`**
   - Changed: `dietary-requirements` → `sex`

5. **`app/(onboarding)/activity.tsx`**
   - Changed: `dining-locations` → `diet-strictness`

6. **`app/(onboarding)/_layout.tsx`**
   - Updated Stack.Screen order with comments documenting the flow

#### UI Infrastructure (2 files)
7. **`src/ui/Screen.tsx`**
   - Added auto-detection for onboarding screens
   - Conditionally renders `OnboardingProgressBar` at top

8. **`src/ui/index.ts`**
   - Exported new ProgressBar and OnboardingProgressBar components

## Configuration Source of Truth

**File:** `src/constants/onboarding.ts`

This file defines:
- `ONBOARDING_STEPS` - Array of all steps in order with routes and titles
- `TOTAL_STEPS` - Total number of steps (12)
- `getStepIndex(route)` - Get step number for a route
- `getNextRoute(route)` - Get next route in flow (for future refactoring)
- `getOnboardingPath(route)` - Get full path for a route

## Progress Calculation

Progress is calculated as: `(currentStepIndex + 1) / TOTAL_STEPS`

- Step 1 (goal): 1/12 ≈ 8.3%
- Step 6 (dining-locations): 6/12 = 50%
- Step 12 (diet-strictness): 12/12 = 100%

## Conditional Flows

Currently, there are **no conditional skips** in the flow:
- The weight screen shows both current weight and goal weight on the same screen
- All 12 steps are always shown
- Progress bar uses fixed total of 12 steps

If conditional flows are added in the future, the `getStepIndex` function in `onboarding.ts` can be enhanced to calculate dynamic totals based on user state.

## Manual Test Checklist

### Forward Navigation
- [ ] Start at goal screen, progress bar shows ~8%
- [ ] Navigate through all 12 steps
- [ ] Progress bar fills incrementally
- [ ] Final step (diet-strictness) shows 100%
- [ ] Complete screen has no progress bar

### Back Navigation
- [ ] Back button works on all screens (except goal)
- [ ] Progress bar updates correctly when going back
- [ ] Form state persists when navigating back

### Visual Verification
- [ ] Progress bar appears at top of all onboarding screens
- [ ] Progress bar has consistent spacing (no layout shifts)
- [ ] Bar is thin (~6px), rounded, theme blue
- [ ] No visual glitches during navigation

### Edge Cases
- [ ] Navigating directly to a middle screen shows correct progress
- [ ] Progress bar handles theme switching (light/dark mode)
- [ ] Safe area insets don't interfere with progress bar

## Notes

1. **No screen redesigns** - All existing UI, validation, and persistence logic preserved
2. **Form state** - All `saveOnboardingData()` calls remain unchanged
3. **Analytics** - No analytics tracking was modified
4. **Backwards compatibility** - Direct navigation to specific screens still works
5. **Future refactoring** - The `getNextRoute()` function in `onboarding.ts` can replace hardcoded router.push() calls for centralized navigation management

## Development Notes

- TypeScript compilation: Two pre-existing errors in `profile.tsx` (unrelated to these changes)
- No new dependencies added
- No breaking changes to existing screens
- Progress bar uses basic React Native Animated (no third-party libraries)
