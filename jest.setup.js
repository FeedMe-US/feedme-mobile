/**
 * Jest Setup File
 *
 * This file runs before each test file.
 * Configure global mocks and extend Jest here.
 */

// Silence React Native warnings in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: ({ children }) => children,
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Extend expect with testing-library matchers
import '@testing-library/react-native/extend-expect';
