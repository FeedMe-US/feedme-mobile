/**
 * Jest Configuration for FeedMe React Native App
 *
 * This configuration sets up Jest with React Native Testing Library
 * for component and integration testing.
 */

module.exports = {
  // Use jest-expo preset
  preset: 'jest-expo',

  // Setup files run before each test
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Module name mapping for path aliases and problematic modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Map expo winter modules to empty mocks
    '^expo/src/winter/(.*)$': '<rootDir>/__mocks__/emptyModule.js',
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
