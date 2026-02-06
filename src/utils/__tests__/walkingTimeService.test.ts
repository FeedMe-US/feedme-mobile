/**
 * Tests for Walking Time Service
 * Verifies UCLA-specific walking time calculations.
 */

import {
  CampusZone,
  getZoneFromCoordinates,
  getHallZone,
  getWalkingTimeToHall,
  getWalkingTimeFromCoordinates,
  sortHallsByWalkingTime,
  getNearestHall,
  WALKING_TIME_MATRIX,
} from '../walkingTimeService';

// Sample coordinates
const COORDS = {
  hedrickSummit: { lat: 34.0735, lng: -118.4485 },
  ackermanUnion: { lat: 34.0705, lng: -118.4430 },
  covelCommons: { lat: 34.0680, lng: -118.4455 },
  westwood: { lat: 34.0620, lng: -118.4450 },
};

const HALLS = {
  deNeve: 28,
  bruinPlate: 29,
  theStudy: 37,
  epicuriaAckerman: 41,
};

describe('getZoneFromCoordinates', () => {
  it('detects hill_north zone', () => {
    expect(getZoneFromCoordinates(COORDS.hedrickSummit.lat, COORDS.hedrickSummit.lng)).toBe('hill_north');
  });

  it('detects central zone', () => {
    expect(getZoneFromCoordinates(COORDS.ackermanUnion.lat, COORDS.ackermanUnion.lng)).toBe('central');
  });

  it('falls back to central for off-campus', () => {
    expect(getZoneFromCoordinates(COORDS.westwood.lat, COORDS.westwood.lng)).toBe('central');
  });
});

describe('getHallZone', () => {
  it('maps The Study to hill_north', () => {
    expect(getHallZone(HALLS.theStudy)).toBe('hill_north');
  });

  it('maps Epicuria at Ackerman to central', () => {
    expect(getHallZone(HALLS.epicuriaAckerman)).toBe('central');
  });

  it('returns undefined for unknown ID', () => {
    expect(getHallZone(999)).toBeUndefined();
  });
});

describe('getWalkingTimeToHall', () => {
  it('returns short time for same-zone halls', () => {
    expect(getWalkingTimeToHall('hill_central', HALLS.deNeve)).toBe(2);
  });

  it('uphill takes longer than downhill', () => {
    const uphill = getWalkingTimeToHall('central', HALLS.theStudy);
    const downhill = getWalkingTimeToHall('hill_north', HALLS.epicuriaAckerman);
    expect(uphill).toBeGreaterThan(downhill);
  });

  it('returns Infinity for unknown hall', () => {
    expect(getWalkingTimeToHall('central', 999)).toBe(Infinity);
  });
});

describe('getNearestHall', () => {
  it('returns nearest hall from Hedrick', () => {
    const result = getNearestHall(
      COORDS.hedrickSummit.lat,
      COORDS.hedrickSummit.lng,
      [HALLS.theStudy, HALLS.deNeve, HALLS.bruinPlate]
    );
    expect(result?.locationId).toBe(HALLS.theStudy);
  });

  it('returns null for empty list', () => {
    expect(getNearestHall(COORDS.hedrickSummit.lat, COORDS.hedrickSummit.lng, [])).toBeNull();
  });
});

describe('WALKING_TIME_MATRIX', () => {
  it('has same-zone time of 2 minutes', () => {
    const zones: CampusZone[] = ['hill_north', 'hill_central', 'hill_south', 'bruin_walk', 'central', 'south', 'north'];
    zones.forEach(zone => {
      expect(WALKING_TIME_MATRIX[zone][zone]).toBe(2);
    });
  });
});
