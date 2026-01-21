/**
 * Location Service - Stub service for location
 * TODO: Replace with real Expo Location API calls
 */

import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export const locationService = {
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch {
      // Return null if location unavailable
      return null;
    }
  },
};

