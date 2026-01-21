/**
 * Color system for FeedMe app
 * Supports light and dark modes with semantic color tokens
 */

export const colors = {
  light: {
    // Primary brand colors (teal/cyan from screenshots)
    primary: '#0a7ea4',
    primaryDark: '#086a8a',
    primaryLight: '#4da3c4',
    
    // Backgrounds - Neumorphism 2.0 palette (improved contrast)
    background: '#FAF9F6', // Warm off-white background
    backgroundSecondary: '#F8F9FA',
    backgroundTertiary: '#F1F3F5',
    surface: '#F3F2EE', // Card/box color - improved contrast from background (was #F0EFEA)
    
    // Text - Neumorphism 2.0 palette (improved contrast)
    text: '#1A1A1A', // Primary text color (meal names) - strong, dark
    textPrimary: '#1A1A1A', // Alias for primary text
    textSecondary: '#5A5A5A', // Improved contrast - darker gray for better readability
    textTertiary: '#8A8A8A', // Improved contrast
    textInverse: '#FFFFFF',
    
    // Accent colors (for future palette completeness - matcha/pastel theme)
    accentMatcha: '#A8D8B9', // Soft matcha green
    accentPeach: '#FFD5C2', // Pastel peach/blush
    accentBlush: '#FFD5C2', // Alias for peach
    
    // Borders and dividers - subtle for Neumorphism (improved visibility)
    border: '#E5E3DD', // Subtle border for Neumorphism cards - slightly darker for better visibility
    borderLight: '#EDEBE5', // Lighter border variant
    divider: '#E5E3DD',
    
    // Status colors
    success: '#22C55E',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    
    // Nutrition-specific colors (matching screenshots)
    calories: '#EF4444',
    protein: '#22C55E', // Green from screenshots
    carbs: '#A78BFA', // Purple from screenshots
    fats: '#F87171', // Pink from screenshots
    
    // Interactive states
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
    
    // Tab bar
    tabBarBackground: '#FFFFFF',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
    
    // Card colors - Neumorphism 2.0 (surface color replaces dark cards)
    cardBackground: '#F3F2EE', // Use surface color for Neumorphism - improved contrast
    cardBackgroundSecondary: '#F5F4F0', // Slightly lighter variant for nested surfaces
  },
  dark: {
    // Primary brand colors (same as light mode)
    primary: '#0a7ea4',
    primaryDark: '#086a8a',
    primaryLight: '#4da3c4',
    
    // Backgrounds (True Dark)
    background: '#121212', // Main background
    backgroundSecondary: '#1C1C1E',
    backgroundTertiary: '#2C2C2E',
    
    // Text
    text: '#FFFFFF', // Primary text (meal names)
    textSecondary: '#8E8E93', // Secondary text (labels/quantities)
    textTertiary: '#636366',
    textInverse: '#000000',
    
    // Borders and dividers
    border: '#3A3A3C', // Card border
    borderLight: '#2C2C2E',
    divider: '#3A3A3C',
    
    // Status colors (same as light mode)
    success: '#22C55E',
    successLight: '#064E3B',
    warning: '#F59E0B',
    warningLight: '#78350F',
    error: '#EF4444',
    errorLight: '#7F1D1D',
    info: '#3B82F6',
    infoLight: '#1E3A8A',
    
    // Nutrition-specific colors (same as light mode)
    calories: '#EF4444',
    protein: '#22C55E', // Green
    carbs: '#A78BFA', // Purple
    fats: '#F87171', // Pink
    
    // Interactive states
    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    
    // Tab bar (dark)
    tabBarBackground: '#121212',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#0a7ea4', // Same as light mode
    
    // Card colors (Meal Bundle Square)
    cardBackground: '#2C2C2E', // Meal bundle square
    cardBackgroundSecondary: '#3A3A3C', // Slightly lighter variant
    surface: '#2C2C2E', // Alias for cardBackground
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorKey = keyof typeof colors.light;

