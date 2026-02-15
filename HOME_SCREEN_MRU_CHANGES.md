# Home Screen MRU Changes

## Summary
Updated the Home screen dining hall chip behavior to use MRU (Most Recently Used) ordering instead of location-based "Nearest Open" selection.

## Changes Made

### 1. Removed Features
- **"Nearest Open" chip** - Completely removed from UI (was lines 851-859)
- **`handleNearestHall()` function** - Removed location-based hall selection (was lines 640-691)
- **`isFindingNearest` state** - Removed state tracking for "finding nearest" (was line 638)
- **Location service integration** - Removed all location fetching and distance sorting
  - Removed `locationService.getCurrentLocation()` call (was line 337-338)
  - Removed `getDiningHallsSorted()` call (was lines 474-478)
  - Removed `closestHallSlug` state and logic (was lines 43, 472-493, 906)
  - Removed location icon from chips (was lines 919-921)
- **Auto-selection on first load** - No longer auto-selects "Any Hill" mode
  - Removed auto-selection logic (was lines 289-298)

### 2. Added Features

#### A. MRU Persistence System
**New file:** `src/lib/diningHallHistory.ts`

**Storage Keys:**
- `@feedme:dining_hall_history` - Stores MRU-ordered array of dining hall slugs
- `@feedme:last_selected_hall` - Stores the last selected dining hall slug

**Exported Functions:**
- `getMRUOrder()` - Get the MRU-ordered array of slugs
- `getLastSelectedHall()` - Get the last selected hall slug
- `selectDiningHall(slug)` - Update MRU order and last selected (moves slug to front)
- `clearHistory()` - Clear all history (for testing/reset)
- `sortByMRU(slugs, mruOrder)` - Sort an array of slugs by MRU order

**Data Structure:**
```typescript
interface DiningHallHistory {
  mruOrder: string[];        // Most recent first
  lastUpdated: number;       // Timestamp
}
```

#### B. Updated Home Screen Behavior

**Chip Ordering:**
- Chips now display in MRU order (most recently selected first)
- When a chip is tapped:
  1. That hall loads normally
  2. The hall slug is moved to the front of the MRU array
  3. Both MRU order and last selected are persisted to AsyncStorage
  4. On next load, chips will reflect the new order

**First Load (Fresh Install):**
- No hall is auto-selected
- Shows "Select a Dining Hall" empty state
- User must tap a chip to get a recommendation

**Subsequent Loads:**
- Automatically loads the last selected hall
- Chips appear in MRU order
- Last recommendation is regenerated

**Empty States:**
1. **No preferred dining halls set:**
   - Shows message: "No Dining Halls Selected"
   - Provides CTA button: "Set Dining Preferences" → routes to /profile

2. **No hall selected yet:**
   - Shows message: "Select a Dining Hall"
   - Prompts user to choose from chips above

### 3. Modified Code Sections

**File:** `app/(tabs)/index.tsx`

**Imports:**
- Added: `getMRUOrder, getLastSelectedHall, selectDiningHall, sortByMRU` from `@/src/lib/diningHallHistory`
- Removed: `locationService` import
- Removed: `AppIcon` import (was only used for location icon)

**State Changes:**
- Removed: `closestHallSlug` state
- Removed: `isFindingNearest` state
- Changed: `selectedHallMode` default from `'hill'` to `'specific'`

**loadDiningHalls() Function:**
- Removed location fetching (`locationService.getCurrentLocation()`)
- Removed closest hall logic (lines 472-493)
- Added MRU order loading (`await getMRUOrder()`)
- Added MRU sorting (`sortByMRU(hallSlugs, mruOrder)`)
- Added last selected restoration (if valid)
- Now logs: `'[Home] Loaded MRU order:'` and `'[Home] Restoring last selected hall:'`

**Chip Rendering:**
- Removed "Nearest Open" chip
- Removed location icon from chips
- Updated `onPress` handler to call `await selectDiningHall(hallSlug)`
- Updated `onPress` to set `isInitialized = true`
- Chips now render in MRU order

**Auto-Selection Logic:**
- No longer auto-selects "Any Hill" mode
- Only sets meal period automatically (not hall selection)
- `isInitialized` only set when a hall is actually selected

**Empty States:**
- Added UI for no preferred halls (with CTA to profile)
- Added UI for no hall selected (with prompt to select)

---

## Files Changed

### New Files (1)
1. **`src/lib/diningHallHistory.ts`**
   - MRU persistence utility
   - AsyncStorage integration
   - MRU sorting logic

### Modified Files (1)
1. **`app/(tabs)/index.tsx`**
   - Removed "Nearest Open" feature
   - Removed location-based logic
   - Added MRU ordering
   - Added empty states
   - Updated chip behavior

---

## MRU History Storage

### Storage Keys
| Key | Type | Description |
|-----|------|-------------|
| `@feedme:dining_hall_history` | JSON | Full history object with MRU array and timestamp |
| `@feedme:last_selected_hall` | String | Last selected hall slug (for quick access) |

### Storage Format

**`@feedme:dining_hall_history`:**
```json
{
  "mruOrder": ["bruin-plate", "de-neve-dining", "epicuria-at-covel"],
  "lastUpdated": 1709251200000
}
```

**`@feedme:last_selected_hall`:**
```
"bruin-plate"
```

### Data Flow

```
User taps dining hall chip
         ↓
selectDiningHall(slug)
         ↓
1. Load current MRU order
2. Remove slug if exists
3. Add slug to front
4. Save updated MRU array
5. Save as last selected
         ↓
AsyncStorage persisted
         ↓
On next app launch:
  → Chips render in MRU order
  → Last selected hall auto-loads
```

---

## Manual Test Checklist

### First Run (Fresh Install)
- [ ] Open app for the first time (or clear AsyncStorage)
- [ ] **Expected:** No dining hall is selected
- [ ] **Expected:** Chips show preferred halls in default order (open first, then alphabetical)
- [ ] **Expected:** Empty state shows: "Select a Dining Hall" message
- [ ] **Expected:** No meal recommendation is generated
- [ ] Tap a dining hall chip (e.g., BPlate)
- [ ] **Expected:** Hall loads, meal recommendation generates
- [ ] **Expected:** Chip appears selected
- [ ] Close and reopen app
- [ ] **Expected:** BPlate is still selected and loads automatically
- [ ] **Expected:** BPlate chip appears first in the list

### Selecting Different Halls
- [ ] With BPlate selected, tap De Neve chip
- [ ] **Expected:** De Neve loads, new recommendation generates
- [ ] **Expected:** De Neve chip moves to the front
- [ ] **Expected:** Chip order is now: De Neve, BPlate, [others...]
- [ ] Tap Epicuria chip
- [ ] **Expected:** Epicuria loads, new recommendation generates
- [ ] **Expected:** Chip order is now: Epicuria, De Neve, BPlate, [others...]
- [ ] Close and reopen app
- [ ] **Expected:** Epicuria is auto-selected
- [ ] **Expected:** Chip order persists: Epicuria, De Neve, BPlate, [others...]

### Restart App (MRU Persistence)
- [ ] Force close app completely
- [ ] Reopen app
- [ ] **Expected:** Last selected hall loads automatically
- [ ] **Expected:** Chips appear in MRU order (most recent first)
- [ ] **Expected:** Meal recommendation regenerates for selected hall
- [ ] Navigate to profile and change preferred halls
- [ ] Return to Home
- [ ] **Expected:** Chip list updates to show only new preferred halls
- [ ] **Expected:** MRU order still applies to halls that remain

### Chip Ordering Updates
- [ ] Note the current chip order
- [ ] Tap a chip that's not first (e.g., 3rd chip)
- [ ] **Expected:** That chip immediately moves to the front
- [ ] **Expected:** Other chips shift right
- [ ] **Expected:** Horizontal scroll position may adjust
- [ ] Tap different chips in sequence: 1st, 3rd, 2nd
- [ ] **Expected:** Order changes to reflect taps: 2nd, 3rd, 1st, [others...]

### No Preferred Dining Halls
- [ ] Go to profile settings
- [ ] Deselect all preferred dining halls (if possible)
- [ ] Return to Home
- [ ] **Expected:** Empty state shows: "No Dining Halls Selected"
- [ ] **Expected:** CTA button: "Set Dining Preferences"
- [ ] Tap CTA button
- [ ] **Expected:** Navigates to /profile
- [ ] Select dining halls in profile
- [ ] Return to Home
- [ ] **Expected:** Chips now appear
- [ ] **Expected:** "Select a Dining Hall" empty state shows

### Hall No Longer Available
- [ ] Select a hall (e.g., BPlate) and close app
- [ ] Manually edit AsyncStorage to have a non-existent hall as last selected
  - Or: remove that hall from preferred list in profile
- [ ] Reopen app
- [ ] **Expected:** No hall is auto-selected
- [ ] **Expected:** "Select a Dining Hall" empty state shows
- [ ] **Expected:** Invalid hall is removed from MRU order
- [ ] **Expected:** Other valid halls still appear in MRU order

### Closed Halls
- [ ] Wait for a hall to be closed (or check at a time when halls are closed)
- [ ] **Expected:** Closed hall chip appears with reduced opacity (0.6)
- [ ] Tap closed hall chip
- [ ] **Expected:** Hall selects normally
- [ ] **Expected:** Closed hall card appears instead of meal recommendation
- [ ] **Expected:** MRU order updates (closed hall moves to front)

### Build Plate Navigation
- [ ] Navigate to Menu screen
- [ ] Build a custom plate
- [ ] Navigate back to Home with build plate
- [ ] **Expected:** Built plate appears as recommendation
- [ ] **Expected:** Selected hall matches the hall from menu
- [ ] **Expected:** MRU order does NOT update yet (until user manually taps again)
- [ ] Close and reopen app
- [ ] **Expected:** Last manually selected hall loads (not build plate hall)

### Edge Cases
- [ ] App is backgrounded for a long time (hours)
- [ ] Return to app
- [ ] **Expected:** Last selected hall still loads
- [ ] **Expected:** MRU order persists
- [ ] Multiple quick taps on different chips
- [ ] **Expected:** Each tap updates MRU correctly
- [ ] **Expected:** No race conditions or incorrect ordering
- [ ] Very long list of preferred halls (10+)
- [ ] **Expected:** Horizontal scroll works
- [ ] **Expected:** MRU order visible (scroll to see older halls)

---

## Backward Compatibility

### Existing Users
- Users who already have preferred halls set will see them in default order (open first, alphabetical)
- No MRU history exists yet, so chips appear in default order
- Once a user taps a chip, MRU tracking begins
- Over time, chip order will adapt to their usage

### Data Migration
- No migration needed - MRU history starts empty
- Existing onboarding data and profile preferences work unchanged
- AsyncStorage keys are new, no conflicts

---

## Testing Notes

### Console Logs to Watch
```
[Home] Loaded X dining halls from API
[Home] Loaded MRU order: [...]
[Home] Restoring last selected hall: <slug>
[Home] No valid last selected hall, waiting for user selection
[DiningHallHistory] Updated MRU order: [...]
```

### Manual Testing Tools

**Clear MRU History (for testing):**
```typescript
import { clearHistory } from '@/src/lib/diningHallHistory';
await clearHistory();
```

**Inspect MRU Order:**
```typescript
import { getMRUOrder, getLastSelectedHall } from '@/src/lib/diningHallHistory';
const mruOrder = await getMRUOrder();
const lastSelected = await getLastSelectedHall();
console.log('MRU Order:', mruOrder);
console.log('Last Selected:', lastSelected);
```

**Manual AsyncStorage Inspection:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get MRU history
const history = await AsyncStorage.getItem('@feedme:dining_hall_history');
console.log('MRU History:', JSON.parse(history));

// Get last selected
const lastSelected = await AsyncStorage.getItem('@feedme:last_selected_hall');
console.log('Last Selected:', lastSelected);
```

---

## Implementation Quality

### Preserved Functionality
✅ Rest of Home screen works unchanged
✅ Meal recommendation generation
✅ Mood/craving selection
✅ Meal logging
✅ Daily tracking
✅ Macro ring
✅ Navigation to other screens
✅ Build plate integration
✅ Closed hall detection

### Clean Implementation
✅ Single source of truth for MRU (diningHallHistory.ts)
✅ No location permissions requested
✅ Graceful handling of missing halls
✅ TypeScript types for MRU data
✅ Console logging for debugging
✅ Empty states for edge cases
✅ No breaking changes to existing data

### Performance
✅ AsyncStorage is fast (local storage)
✅ MRU sorting is O(n) - efficient
✅ No network requests for MRU data
✅ Minimal re-renders (state updates on selection only)

---

## Future Enhancements (Optional)

### Potential Improvements
1. **Analytics**: Track MRU effectiveness (do users stick to top 2-3 halls?)
2. **Smart Ordering**: Combine MRU with open/closed status (open MRU halls first)
3. **Time-based Preferences**: "You usually eat at BPlate for lunch, De Neve for dinner"
4. **Limit MRU History**: Keep only last 5-10 halls to prevent unbounded growth
5. **Sync to Backend**: Store MRU order in user profile for cross-device sync
6. **Visual Indicator**: Show "recently used" badge or subtle marker on MRU chips

### Maintenance Notes
- If hall slugs change, update the normalization logic in loadDiningHalls
- If AsyncStorage is replaced, update diningHallHistory.ts accordingly
- If user can star/favorite specific halls, MRU order should respect favorites
