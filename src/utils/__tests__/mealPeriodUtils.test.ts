/**
 * Tests for mealPeriodUtils - Hall-Specific Meal Period Logic
 *
 * TDD: Written before implementation to define expected behavior.
 *
 * These utility functions replace the global hard-coded meal period logic
 * with hall-specific period detection using actual operating hours.
 */

import type { DiningHall } from '@/src/services/mealService';

// Import functions that will be implemented
// import {
//   getAvailableMealPeriods,
//   getCurrentOrNextMealPeriod,
//   isAllDayLocation,
//   parseTimeToMinutes,
//   getCurrentPacificMinutes,
// } from '../mealPeriodUtils';

// Mock types for testing
type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'late_night';

interface TimeRange {
  open: string;
  close: string;
}

interface LocationHours {
  breakfast?: TimeRange | null;
  lunch?: TimeRange | null;
  dinner?: TimeRange | null;
  late_night?: TimeRange | null;
}

// =============================================================================
// TEST FIXTURES
// =============================================================================

const createMockHall = (overrides: Partial<DiningHall> = {}): DiningHall => ({
  id: 1,
  name: 'Test Hall',
  slug: 'test-hall',
  is_residential: true,
  is_open_now: true,
  current_meal: 'lunch',
  hours_today: {
    breakfast: { open: '07:00', close: '10:00' },
    lunch: { open: '11:30', close: '14:00' },
    dinner: { open: '17:00', close: '21:00' },
    late_night: null,
  },
  ...overrides,
});

const DE_NEVE_HOURS: LocationHours = {
  breakfast: { open: '07:00', close: '10:00' },
  lunch: { open: '11:30', close: '14:00' },
  dinner: { open: '17:00', close: '21:00' },
  late_night: null,
};

const BRUIN_PLATE_HOURS: LocationHours = {
  breakfast: { open: '07:00', close: '09:30' },
  lunch: { open: '11:00', close: '15:00' },
  dinner: { open: '17:00', close: '20:00' },
  late_night: null,
};

const RENDEZVOUS_HOURS: LocationHours = {
  breakfast: null,
  lunch: { open: '11:00', close: '14:00' },
  dinner: { open: '17:00', close: '21:00' },
  late_night: { open: '21:00', close: '00:00' },
};

const ALL_DAY_HOURS: LocationHours = {
  breakfast: null,
  lunch: null,
  dinner: null,
  late_night: null,
};

// =============================================================================
// UNIT TESTS: parseTimeToMinutes
// =============================================================================

describe('parseTimeToMinutes', () => {
  // Importing will fail until implementation exists - these tests define expected behavior

  it('should convert "07:00" to 420 minutes', () => {
    const { parseTimeToMinutes } = require('../mealPeriodUtils');
    expect(parseTimeToMinutes('07:00')).toBe(420);
  });

  it('should convert "12:30" to 750 minutes', () => {
    const { parseTimeToMinutes } = require('../mealPeriodUtils');
    expect(parseTimeToMinutes('12:30')).toBe(750);
  });

  it('should convert "00:00" to 0 minutes', () => {
    const { parseTimeToMinutes } = require('../mealPeriodUtils');
    expect(parseTimeToMinutes('00:00')).toBe(0);
  });

  it('should convert "23:59" to 1439 minutes', () => {
    const { parseTimeToMinutes } = require('../mealPeriodUtils');
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });
});

// =============================================================================
// UNIT TESTS: getAvailableMealPeriods
// =============================================================================

describe('getAvailableMealPeriods', () => {
  it('should return all periods that have hours defined', () => {
    const { getAvailableMealPeriods } = require('../mealPeriodUtils');
    const hall = createMockHall({ hours_today: DE_NEVE_HOURS });

    const periods = getAvailableMealPeriods(hall);

    expect(periods).toContain('breakfast');
    expect(periods).toContain('lunch');
    expect(periods).toContain('dinner');
    expect(periods).not.toContain('late_night'); // null in DE_NEVE_HOURS
  });

  it('should return only lunch, dinner, late_night for Rendezvous', () => {
    const { getAvailableMealPeriods } = require('../mealPeriodUtils');
    const hall = createMockHall({
      name: 'Rendezvous',
      hours_today: RENDEZVOUS_HOURS,
    });

    const periods = getAvailableMealPeriods(hall);

    expect(periods).not.toContain('breakfast'); // null
    expect(periods).toContain('lunch');
    expect(periods).toContain('dinner');
    expect(periods).toContain('late_night');
  });

  it('should return empty array for all-day location', () => {
    const { getAvailableMealPeriods } = require('../mealPeriodUtils');
    const hall = createMockHall({
      name: 'Cafe 1919',
      hours_today: ALL_DAY_HOURS,
    });

    const periods = getAvailableMealPeriods(hall);

    expect(periods).toEqual([]);
  });

  it('should return empty array when hours_today is undefined', () => {
    const { getAvailableMealPeriods } = require('../mealPeriodUtils');
    const hall = createMockHall({ hours_today: undefined });

    const periods = getAvailableMealPeriods(hall);

    expect(periods).toEqual([]);
  });
});

// =============================================================================
// UNIT TESTS: getCurrentOrNextMealPeriod
// =============================================================================

describe('getCurrentOrNextMealPeriod', () => {
  // Note: These tests mock the current time

  it('should return current_meal from API if available', () => {
    const { getCurrentOrNextMealPeriod } = require('../mealPeriodUtils');
    const hall = createMockHall({
      current_meal: 'lunch',
      hours_today: DE_NEVE_HOURS,
    });

    const result = getCurrentOrNextMealPeriod(hall);

    expect(result).toBe('lunch');
  });

  it('should return next_meal if current_meal is null', () => {
    const { getCurrentOrNextMealPeriod } = require('../mealPeriodUtils');
    const hall = createMockHall({
      current_meal: undefined,
      next_meal: 'dinner',
      hours_today: DE_NEVE_HOURS,
    });

    const result = getCurrentOrNextMealPeriod(hall);

    expect(result).toBe('dinner');
  });

  it('should return first available period if no current or next meal', () => {
    const { getCurrentOrNextMealPeriod } = require('../mealPeriodUtils');
    const hall = createMockHall({
      current_meal: undefined,
      next_meal: undefined,
      hours_today: DE_NEVE_HOURS,
    });

    const result = getCurrentOrNextMealPeriod(hall);

    // Should return the first period that has hours
    expect(['breakfast', 'lunch', 'dinner', 'late_night']).toContain(result);
  });

  it('should return null for all-day location', () => {
    const { getCurrentOrNextMealPeriod } = require('../mealPeriodUtils');
    const hall = createMockHall({
      current_meal: undefined,
      hours_today: ALL_DAY_HOURS,
    });

    const result = getCurrentOrNextMealPeriod(hall);

    expect(result).toBeNull();
  });
});

// =============================================================================
// UNIT TESTS: isAllDayLocation
// =============================================================================

describe('isAllDayLocation', () => {
  it('should return true for location with no meal periods', () => {
    const { isAllDayLocation } = require('../mealPeriodUtils');
    const hall = createMockHall({ hours_today: ALL_DAY_HOURS });

    expect(isAllDayLocation(hall)).toBe(true);
  });

  it('should return false for location with meal periods', () => {
    const { isAllDayLocation } = require('../mealPeriodUtils');
    const hall = createMockHall({ hours_today: DE_NEVE_HOURS });

    expect(isAllDayLocation(hall)).toBe(false);
  });

  it('should return false for location with only lunch', () => {
    const { isAllDayLocation } = require('../mealPeriodUtils');
    const hall = createMockHall({
      hours_today: {
        breakfast: null,
        lunch: { open: '11:00', close: '14:00' },
        dinner: null,
        late_night: null,
      },
    });

    expect(isAllDayLocation(hall)).toBe(false);
  });

  it('should return true when hours_today is undefined', () => {
    const { isAllDayLocation } = require('../mealPeriodUtils');
    const hall = createMockHall({ hours_today: undefined });

    expect(isAllDayLocation(hall)).toBe(true);
  });
});

// =============================================================================
// INTEGRATION TESTS: Hall-Specific vs Global
// =============================================================================

describe('Hall-Specific Period Detection (Regression Prevention)', () => {
  it('should NOT use global time-based logic', () => {
    // This test ensures we're using hall-specific hours, not global time ranges
    const { getAvailableMealPeriods } = require('../mealPeriodUtils');

    // A hall with only dinner should only return dinner
    const dinnerOnlyHall = createMockHall({
      hours_today: {
        breakfast: null,
        lunch: null,
        dinner: { open: '17:00', close: '21:00' },
        late_night: null,
      },
    });

    const periods = getAvailableMealPeriods(dinnerOnlyHall);

    // Should NOT include breakfast or lunch even if global time says so
    expect(periods).toEqual(['dinner']);
  });

  it('different halls at same time should have different current periods', () => {
    const { getCurrentOrNextMealPeriod } = require('../mealPeriodUtils');

    // At 9:45 AM:
    // - De Neve still has breakfast (ends 10:00)
    // - Bruin Plate finished breakfast (ends 9:30)
    const deNeve = createMockHall({
      name: 'De Neve',
      current_meal: 'breakfast', // API says breakfast
      hours_today: DE_NEVE_HOURS,
    });

    const bruinPlate = createMockHall({
      name: 'Bruin Plate',
      current_meal: undefined, // API says between periods
      next_meal: 'lunch',
      hours_today: BRUIN_PLATE_HOURS,
    });

    expect(getCurrentOrNextMealPeriod(deNeve)).toBe('breakfast');
    expect(getCurrentOrNextMealPeriod(bruinPlate)).toBe('lunch');
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('Edge Cases', () => {
  it('should handle overnight late night periods', () => {
    const { getAvailableMealPeriods } = require('../mealPeriodUtils');
    const hall = createMockHall({
      hours_today: {
        breakfast: null,
        lunch: null,
        dinner: { open: '17:00', close: '21:00' },
        late_night: { open: '21:00', close: '02:00' }, // Crosses midnight
      },
    });

    const periods = getAvailableMealPeriods(hall);

    expect(periods).toContain('late_night');
  });

  it('should handle malformed hours gracefully', () => {
    const { getAvailableMealPeriods } = require('../mealPeriodUtils');
    const hall = createMockHall({
      hours_today: {
        breakfast: { open: '', close: '' }, // Empty strings
        lunch: { open: '11:00', close: '14:00' },
        dinner: null,
        late_night: null,
      },
    });

    // Should not crash, should filter out invalid periods
    expect(() => getAvailableMealPeriods(hall)).not.toThrow();
  });

  it('should handle closed halls', () => {
    const { getCurrentOrNextMealPeriod } = require('../mealPeriodUtils');
    const closedHall = createMockHall({
      is_open_now: false,
      current_meal: undefined,
      next_meal: undefined,
      hours_today: {
        breakfast: null,
        lunch: null,
        dinner: null,
        late_night: null,
      },
    });

    const result = getCurrentOrNextMealPeriod(closedHall);

    // Should return null for completely closed hall
    expect(result).toBeNull();
  });
});
