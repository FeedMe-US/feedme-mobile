/**
 * Onboarding data storage and management
 * Stores user responses from onboarding flow
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DATA_KEY = '@onboarding_data';

export interface OnboardingData {
  // Goal
  goal?: 'bulk' | 'lean' | 'maintain' | 'perform';
  
  // Personal info
  sex?: 'male' | 'female';
  age?: number;
  heightFeet?: number;
  heightInches?: number;
  weight?: number;
  goalWeight?: number;
  
  // Activity & preferences
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'very';
  mealPlan?: string;
  preferredDiningLocations?: string[]; // Array of location slugs
  mealsPerDay?: number;
  
  // Dietary
  dietaryRequirements?: string[];
  allergies?: string[];
  ingredientsAvoid?: string[];
  
  // Meal times
  mealTimes?: {
    breakfast?: string; // "HH:MM AM/PM"
    lunch?: string;
    dinner?: string;
    differentOnWeekends?: boolean;
  };

  // Taste & mood preferences
  moodPreferences?: {
    /** 0 (American Staples) → 4 (World Flavors) */
    cuisine?: number;
    /** 0 (Keep it mild) → 4 (Actually spicy) */
    spice?: number;
    /** 0 (Something light) → 4 (Hearty & Filling) */
    heaviness?: number;
    /** 0 (Stick to the regulars) → 4 (Try something new) */
    adventurousness?: number;
    /** 0 (Smooth & Soft) → 4 (Properly Crunchy) */
    texture?: number;
  };

  // Diet strictness
  dietStrictness?: 'strict' | 'balanced' | 'relaxed';

  // Custom macro targets
  useCustomTargets?: boolean; // If true, user has set custom macro values
  selectedVitamins?: string[]; // Vitamins to track in progress page
  carbFatRatio?: number; // User's preferred carb/fat ratio (0-100, where 0 = all fats, 100 = all carbs)

  // Meal preference seeding (from swipe onboarding)
  likedMealIds?: string[];
  dislikedMealIds?: string[];
}

/**
 * Save onboarding data
 */
export async function saveOnboardingData(data: Partial<OnboardingData>): Promise<void> {
  try {
    const existing = await getOnboardingData();
    const updated = { ...existing, ...data };
    await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving onboarding data:', error);
  }
}

/**
 * Get all onboarding data
 */
export async function getOnboardingData(): Promise<OnboardingData> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
    return value ? JSON.parse(value) : {};
  } catch (error) {
    console.error('Error reading onboarding data:', error);
    return {};
  }
}

/**
 * Clear onboarding data
 */
export async function clearOnboardingData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
  } catch (error) {
    console.error('Error clearing onboarding data:', error);
  }
}

/**
 * Convert onboarding data to profile format for API
 */
export function onboardingDataToProfile(data: OnboardingData) {
  // Map activity levels
  const activityMap: Record<string, string> = {
    'sedentary': 'Sedentary',
    'light': 'Lightly Active',
    'moderate': 'Moderately Active',
    'very': 'Very Active',
  };

  // Map goal types
  const goalMap: Record<string, string> = {
    'bulk': 'Bulk Up',
    'lean': 'Get Lean',
    'maintain': 'Maintain',
    'perform': 'Perform Better',
  };

  // Convert dining location slugs to IDs (must match database IDs!)
  const locationSlugToId: Record<string, number> = {
    // Residential dining
    'de-neve': 28,
    'de-neve-dining': 28,
    'b-plate': 29,
    'bruin-plate': 29,
    'epicuria': 31,
    'epicuria-at-covel': 31,
    'feast': 30,
    'spice-kitchen': 30,
    // Hill / campus restaurants
    'rendezvous': 39,
    'the-study': 37,
    'the-study-at-hedrick': 37,
    'the-drey': 38,
    'bruin-cafe': 34,
    'cafe-1919': 36,
    'epicuria-at-ackerman': 41,
    // ASUCLA / LuValle / satellite locations
    'anderson-cafe': 100,
    'bombshelter': 101,
    'luvalle-fusion': 102,
    'luvalle-pizza': 103,
    'luvalle-epazote': 104,
    'luvalle-burger': 105,
    'luvalle-poke': 106,
    'luvalle-panini': 107,
    'synapse': 108,
  };

  const preferredLocationIds = data.preferredDiningLocations
    ?.map(slug => locationSlugToId[slug])
    .filter(id => id !== undefined) || [];

  // Calculate height - check for undefined/null explicitly since 0 is valid for inches
  const heightInches = data.heightFeet !== undefined && data.heightFeet !== null
    ? data.heightFeet * 12 + (data.heightInches ?? 0)
    : undefined;

  // Build meal times object if provided
  const mealTimes = data.mealTimes ? {
    breakfast: data.mealTimes.breakfast,
    lunch: data.mealTimes.lunch,
    dinner: data.mealTimes.dinner,
  } : undefined;

  // Combine allergies and ingredients to avoid into allergen_exclusions
  const allergenExclusions = [
    ...(data.allergies || []),
    ...(data.ingredientsAvoid || []),
  ];

  return {
    age: data.age,
    sex: data.sex,
    height_inches: heightInches,
    weight_lbs: data.weight,
    goal_weight_lbs: data.goalWeight,
    activity_level: data.activityLevel ? activityMap[data.activityLevel] : undefined,
    goal_type: data.goal ? goalMap[data.goal] : undefined,
    dietary_restrictions: data.dietaryRequirements || [],
    allergen_exclusions: allergenExclusions,
    preferred_locations: preferredLocationIds,
    meals_per_day: data.mealsPerDay,
    meal_times: mealTimes,
  };
}

