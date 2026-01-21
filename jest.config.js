/**
 * Jest Configuration for FeedMe React Native App
 *
 * This configuration sets up Jest with React Native Testing Library
 * for component and integration testing.
 *
 * Note: Using jest-expo/ios preset for Expo 54 compatibility.
 */

module.exports = {
  // Use iOS preset for Expo 54 compatibility
  preset: 'jest-expo/ios',

  // Setup files run before each test
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js|jsx)',
    '**/*.test.(ts|tsx|js|jsx)',
    '**/*.spec.(ts|tsx|js|jsx)',
  ],

  // Files to ignore during transform
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Increase timeout for slower machines
  testTimeout: 10000,
};
