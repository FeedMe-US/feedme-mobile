/**
 * Walking Time Service - UCLA-specific walking time estimates
 *
 * Uses campus zones and pre-computed walking times based on:
 * - Daily Bruin "Walking to Class" analysis (gradients, actual paths)
 * - UCLA Housing walking estimates
 * - Campus topology (hills, stairs, Bruin Walk gradient 8.2%)
 *
 * Reference: https://stack.dailybruin.com/2020/01/17/walking-to-class/
 */

// =============================================================================
// CAMPUS ZONES
// =============================================================================

export type CampusZone =
  | 'hill_north'    // Hedrick Summit area
  | 'hill_central'  // Rieber, De Neve, Rendezvous area
  | 'hill_south'    // Covel, Carnesale (Bruin Plate) area
  | 'bruin_walk'    // Lower Hill / Bruin Walk transition
  | 'central'       // Ackerman, Royce, Powell area
  | 'south'         // Engineering, Science buildings
  | 'north';        // Arts, Research Library, North Campus

// Zone boundaries defined by GPS coordinates (bounding boxes)
// UCLA campus center: 34.0700, -118.4398
interface ZoneBoundary {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const ZONE_BOUNDARIES: Record<CampusZone, ZoneBoundary> = {
  // Hedrick Summit - northernmost part of the Hill
  hill_north: {
    minLat: 34.0720,
    maxLat: 34.0750,
    minLng: -118.4520,
    maxLng: -118.4450,
  },
  // Central Hill - Rieber, De Neve, Rendezvous
  hill_central: {
    minLat: 34.0700,
    maxLat: 34.0720,
    minLng: -118.4520,
    maxLng: -118.4440,
  },
  // Lower Hill - Covel, Carnesale
  hill_south: {
    minLat: 34.0675,
    maxLat: 34.0700,
    minLng: -118.4500,
    maxLng: -118.4440,
  },
  // Central campus - Ackerman, Royce Hall (check before bruin_walk to avoid overlap)
  central: {
    minLat: 34.0695,
    maxLat: 34.0730,
    minLng: -118.4445,
    maxLng: -118.4380,
  },
  // Bruin Walk area - narrow corridor from Hill to campus
  bruin_walk: {
    minLat: 34.0688,
    maxLat: 34.0705,
    minLng: -118.4475,
    maxLng: -118.4445,
  },
  // South campus - Engineering, Science
  south: {
    minLat: 34.0655,
    maxLat: 34.0695,
    minLng: -118.4445,
    maxLng: -118.4370,
  },
  // North campus - Arts, Murphy Sculpture Garden
  north: {
    minLat: 34.0730,
    maxLat: 34.0760,
    minLng: -118.4420,
    maxLng: -118.4360,
  },
};

// =============================================================================
// DINING HALL LOCATIONS
// =============================================================================

// Map dining hall IDs to their campus zone
const HALL_ZONES: Record<number, CampusZone> = {
  // Hill North
  37: 'hill_north',  // The Study at Hedrick
  38: 'hill_north',  // The Drey

  // Hill Central
  28: 'hill_central', // De Neve Dining
  30: 'hill_central', // Feast at Rieber
  36: 'hill_central', // Cafe 1919
  39: 'hill_central', // Rendezvous

  // Hill South
  29: 'hill_south',   // Bruin Plate
  31: 'hill_south',   // Epicuria at Covel

  // Bruin Walk area
  34: 'bruin_walk',   // Bruin Cafe

  // Central Campus
  41: 'central',      // Epicuria at Ackerman

  // ASUCLA Campus Restaurants
  100: 'north',       // Northern Lights (near Rolfe Hall)
  102: 'central',     // Epazote (LuValle Commons)
  103: 'central',     // Burger Assembly (LuValle Commons)
  104: 'central',     // Fusion (LuValle Commons)
  105: 'central',     // All Rise Pizza (LuValle Commons)
};

// =============================================================================
// WALKING TIME MATRIX (minutes)
// =============================================================================

// Walking times from each zone to each dining hall zone
// Based on UCLA terrain, stairs, and actual paths
// Row = from zone, Column = to zone
const WALKING_TIME_MATRIX: Record<CampusZone, Record<CampusZone, number>> = {
  hill_north: {
    hill_north: 2,      // Within Hedrick area
    hill_central: 5,    // Down to Rieber/De Neve
    hill_south: 8,      // Down to Covel/Bruin Plate
    bruin_walk: 12,     // Down to Bruin Walk
    central: 18,        // Down Bruin Walk to Ackerman
    south: 22,          // Far walk to South Campus
    north: 15,          // Across to North Campus
  },
  hill_central: {
    hill_north: 6,      // Up to Hedrick (uphill penalty)
    hill_central: 2,    // Within Rieber/De Neve area
    hill_south: 5,      // Down to Covel/Bruin Plate
    bruin_walk: 8,      // Down to Bruin Walk
    central: 15,        // Down to Ackerman
    south: 18,          // To South Campus
    north: 12,          // To North Campus
  },
  hill_south: {
    hill_north: 10,     // Up to Hedrick (long uphill)
    hill_central: 6,    // Up to Rieber/De Neve
    hill_south: 2,      // Within Covel/Carnesale
    bruin_walk: 6,      // Short walk to Bruin Walk
    central: 12,        // Down to Ackerman
    south: 15,          // To South Campus
    north: 10,          // To North Campus
  },
  bruin_walk: {
    hill_north: 15,     // Up to Hedrick (steep)
    hill_central: 10,   // Up to Rieber/De Neve
    hill_south: 7,      // Up to Covel area
    bruin_walk: 2,      // Within Bruin Walk area
    central: 5,         // Short walk to Ackerman
    south: 10,          // To South Campus
    north: 8,           // To North Campus
  },
  central: {
    hill_north: 20,     // Long uphill to Hedrick
    hill_central: 17,   // Up Bruin Walk to Rieber
    hill_south: 14,     // Up to Covel area
    bruin_walk: 6,      // Short walk to Bruin Walk
    central: 2,         // Within Ackerman area
    south: 8,           // To South Campus
    north: 8,           // To North Campus
  },
  south: {
    hill_north: 25,     // Very long uphill
    hill_central: 20,   // Long uphill
    hill_south: 17,     // Uphill to Covel
    bruin_walk: 12,     // To Bruin Walk area
    central: 8,         // To Ackerman
    south: 2,           // Within South Campus
    north: 12,          // Across campus to North
  },
  north: {
    hill_north: 18,     // Across and up to Hedrick
    hill_central: 14,   // Across and up
    hill_south: 12,     // Across and up to Covel
    bruin_walk: 10,     // To Bruin Walk
    central: 8,         // To Ackerman
    south: 12,          // Across to South Campus
    north: 2,           // Within North Campus
  },
};

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Determine which campus zone a GPS coordinate falls into
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @returns The campus zone, or 'central' as fallback
 */
export function getZoneFromCoordinates(
  latitude: number,
  longitude: number
): CampusZone {
  // Check each zone's bounding box
  for (const [zone, bounds] of Object.entries(ZONE_BOUNDARIES)) {
    if (
      latitude >= bounds.minLat &&
      latitude <= bounds.maxLat &&
      longitude >= bounds.minLng &&
      longitude <= bounds.maxLng
    ) {
      return zone as CampusZone;
    }
  }

  // If not in any defined zone, use distance to zone centers
  // Fall back to 'central' as default (most neutral position)
  return 'central';
}

/**
 * Get the campus zone for a dining hall
 * @param locationId The dining hall's ID
 * @returns The zone the hall is in, or undefined if unknown
 */
export function getHallZone(locationId: number): CampusZone | undefined {
  return HALL_ZONES[locationId];
}

/**
 * Get walking time in minutes from a user's zone to a dining hall
 * @param fromZone The user's current campus zone
 * @param toLocationId The dining hall's ID
 * @returns Walking time in minutes, or Infinity if unknown
 */
export function getWalkingTimeToHall(
  fromZone: CampusZone,
  toLocationId: number
): number {
  const toZone = HALL_ZONES[toLocationId];
  if (!toZone) {
    return Infinity; // Unknown location
  }
  return WALKING_TIME_MATRIX[fromZone][toZone];
}

/**
 * Get walking time from GPS coordinates to a dining hall
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param toLocationId The dining hall's ID
 * @returns Walking time in minutes
 */
export function getWalkingTimeFromCoordinates(
  latitude: number,
  longitude: number,
  toLocationId: number
): number {
  const fromZone = getZoneFromCoordinates(latitude, longitude);
  return getWalkingTimeToHall(fromZone, toLocationId);
}

/**
 * Sort dining halls by walking time from user's location
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param locationIds Array of dining hall IDs to sort
 * @returns Array of { locationId, walkingMinutes } sorted by time (ascending)
 */
export function sortHallsByWalkingTime(
  latitude: number,
  longitude: number,
  locationIds: number[]
): Array<{ locationId: number; walkingMinutes: number }> {
  const fromZone = getZoneFromCoordinates(latitude, longitude);

  return locationIds
    .map((locationId) => ({
      locationId,
      walkingMinutes: getWalkingTimeToHall(fromZone, locationId),
    }))
    .filter((item) => item.walkingMinutes < Infinity)
    .sort((a, b) => a.walkingMinutes - b.walkingMinutes);
}

/**
 * Get the nearest dining hall from a list by walking time
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param locationIds Array of dining hall IDs to consider
 * @returns The nearest hall's ID and walking time, or null if none found
 */
export function getNearestHall(
  latitude: number,
  longitude: number,
  locationIds: number[]
): { locationId: number; walkingMinutes: number } | null {
  const sorted = sortHallsByWalkingTime(latitude, longitude, locationIds);
  return sorted.length > 0 ? sorted[0] : null;
}

// Export constants for testing
export { ZONE_BOUNDARIES, HALL_ZONES, WALKING_TIME_MATRIX };