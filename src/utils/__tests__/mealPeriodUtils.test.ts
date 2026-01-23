/**
 * Meal Period Utils Tests
 * Tests for isOpeningSoon and getLocationStatus utilities
 */

import {
  isOpeningSoon,
  getLocationStatus,
  isAnyOpeningSoon,
  getGroupLocationStatus,
} from '../mealPeriodUtils';
import { DiningHall } from '../../services/mealService';
import * as dateUtils from '../dateUtils';

// Mock dateUtils to control current time
jest.mock('../dateUtils', () => ({
  getPacificTimeString: jest.fn(),
}));

const mockGetPacificTimeString = dateUtils.getPacificTimeString as jest.Mock;

// Helper to create a minimal DiningHall for testing
function createMockHall(overrides: Partial<DiningHall> = {}): DiningHall {
  return {
    id: 1,
    name: 'Test Hall',
    slug: 'test-hall',
    is_open_now: false,
    next_meal_time: undefined,
    ...overrides,
  };
}

describe('isOpeningSoon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false when hall is already open', () => {
    mockGetPacificTimeString.mockReturnValue('12:00');
    const hall = createMockHall({
      is_open_now: true,
      next_meal_time: '12:30',
    });
    expect(isOpeningSoon(hall)).toBe(false);
  });

  it('returns false when hall has no next_meal_time', () => {
    mockGetPacificTimeString.mockReturnValue('12:00');
    const hall = createMockHall({
      is_open_now: false,
      next_meal_time: undefined,
    });
    expect(isOpeningSoon(hall)).toBe(false);
  });

  it('returns true when hall opens within 30 minutes', () => {
    mockGetPacificTimeString.mockReturnValue('11:45');
    const hall = createMockHall({
      is_open_now: false,
      next_meal_time: '12:00',
    });
    expect(isOpeningSoon(hall)).toBe(true);
  });

  it('returns true when hall opens exactly in 30 minutes', () => {
    mockGetPacificTimeString.mockReturnValue('11:30');
    const hall = createMockHall({
      is_open_now: false,
      next_meal_time: '12:00',
    });
    expect(isOpeningSoon(hall)).toBe(true);
  });

  it('returns false when hall opens in more than 30 minutes', () => {
    mockGetPacificTimeString.mockReturnValue('11:00');
    const hall = createMockHall({
      is_open_now: false,
      next_meal_time: '12:00',
    });
    expect(isOpeningSoon(hall)).toBe(false);
  });

  it('returns false when next meal time is earlier than current time', () => {
    mockGetPacificTimeString.mockReturnValue('23:00');
    const hall = createMockHall({
      is_open_now: false,
      next_meal_time: '07:00',
    });
    expect(isOpeningSoon(hall)).toBe(false);
  });

  it('handles custom withinMinutes parameter', () => {
    mockGetPacificTimeString.mockReturnValue('11:00');
    const hall = createMockHall({
      is_open_now: false,
      next_meal_time: '12:00',
    });
    expect(isOpeningSoon(hall)).toBe(false);
    expect(isOpeningSoon(hall, 60)).toBe(true);
  });
});

describe('getLocationStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns open status when hall is open', () => {
    mockGetPacificTimeString.mockReturnValue('12:00');
    const hall = createMockHall({ is_open_now: true });
    const status = getLocationStatus(hall);
    expect(status.status).toBe('open');
    expect(status.label).toBe('Open');
    expect(status.colorKey).toBe('success');
  });

  it('returns opening_soon status when hall opens within 30 min', () => {
    mockGetPacificTimeString.mockReturnValue('11:45');
    const hall = createMockHall({
      is_open_now: false,
      next_meal_time: '12:00',
    });
    const status = getLocationStatus(hall);
    expect(status.status).toBe('opening_soon');
    expect(status.label).toBe('Opening Soon');
    expect(status.colorKey).toBe('warning');
  });

  it('returns closed status when not opening soon', () => {
    mockGetPacificTimeString.mockReturnValue('10:00');
    const hall = createMockHall({
      is_open_now: false,
      next_meal_time: '12:00',
    });
    const status = getLocationStatus(hall);
    expect(status.status).toBe('closed');
    expect(status.label).toBe('Closed');
    expect(status.colorKey).toBe('error');
  });
});

describe('isAnyOpeningSoon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false if any location is open', () => {
    mockGetPacificTimeString.mockReturnValue('11:45');
    const locations = [
      createMockHall({ id: 1, is_open_now: true }),
      createMockHall({ id: 2, is_open_now: false, next_meal_time: '12:00' }),
    ];
    expect(isAnyOpeningSoon(locations)).toBe(false);
  });

  it('returns true if none open but one is opening soon', () => {
    mockGetPacificTimeString.mockReturnValue('11:45');
    const locations = [
      createMockHall({ id: 1, is_open_now: false, next_meal_time: '14:00' }),
      createMockHall({ id: 2, is_open_now: false, next_meal_time: '12:00' }),
    ];
    expect(isAnyOpeningSoon(locations)).toBe(true);
  });

  it('returns false if all closed and none opening soon', () => {
    mockGetPacificTimeString.mockReturnValue('10:00');
    const locations = [
      createMockHall({ id: 1, is_open_now: false, next_meal_time: '14:00' }),
      createMockHall({ id: 2, is_open_now: false, next_meal_time: '13:00' }),
    ];
    expect(isAnyOpeningSoon(locations)).toBe(false);
  });
});

describe('getGroupLocationStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns open if any location is open', () => {
    mockGetPacificTimeString.mockReturnValue('11:45');
    const locations = [
      createMockHall({ id: 1, is_open_now: true }),
      createMockHall({ id: 2, is_open_now: false }),
    ];
    const status = getGroupLocationStatus(locations);
    expect(status.status).toBe('open');
    expect(status.label).toBe('Open');
    expect(status.colorKey).toBe('success');
  });

  it('returns opening_soon if none open but some opening soon', () => {
    mockGetPacificTimeString.mockReturnValue('11:45');
    const locations = [
      createMockHall({ id: 1, is_open_now: false, next_meal_time: '14:00' }),
      createMockHall({ id: 2, is_open_now: false, next_meal_time: '12:00' }),
    ];
    const status = getGroupLocationStatus(locations);
    expect(status.status).toBe('opening_soon');
    expect(status.label).toBe('Opening Soon');
    expect(status.colorKey).toBe('warning');
  });

  it('returns closed if all closed and none opening soon', () => {
    mockGetPacificTimeString.mockReturnValue('10:00');
    const locations = [
      createMockHall({ id: 1, is_open_now: false, next_meal_time: '14:00' }),
      createMockHall({ id: 2, is_open_now: false }),
    ];
    const status = getGroupLocationStatus(locations);
    expect(status.status).toBe('closed');
    expect(status.label).toBe('Closed');
    expect(status.colorKey).toBe('error');
  });
});
