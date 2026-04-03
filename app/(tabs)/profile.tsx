/**
 * Profile & Settings Screen
 * Matches SwiftUI design from screenshots
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Text as RNText } from 'react-native';
// TEMPORARILY REMOVED - Platform & Linking were used by notification preferences
// import { Platform, Linking } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { Chip } from '@/src/components/Chip';
import { SegmentedControl } from '@/src/ui/SegmentedControl';
import { Button } from '@/src/ui/Button';
import { useDailyTracking } from '@/src/store/DailyTrackingContext';
import { useThemeStore } from '@/src/store/themeStore';
import { haptics } from '@/src/utils/haptics';
import { formatCalories, formatMacro } from '@/src/utils/formatNutrition';
import { AppIcon } from '@/src/components/AppIcon';
import { CarbFatSlider } from '@/src/components/CarbFatSlider';
import { resetOnboarding } from '@/src/lib/onboarding';
import { useRouter } from 'expo-router';
import { getOnboardingData, saveOnboardingData } from '@/src/lib/onboardingData';
import { useIsAuthenticated, useAuthStore } from '@/src/store/authStore';
import { apiClient } from '@/src/services/api';
import { userService } from '@/src/services/userService';
// TEMPORARILY REMOVED - Notification preferences feature
// import DateTimePicker from '@react-native-community/datetimepicker';
import { ItemManagementModal, ItemOption } from '@/src/components/settings/ItemManagementModal';
import { AllergenPickerModal } from '@/src/components/settings/AllergenPickerModal';
import { ALLERGEN_OPTIONS, DISLIKED_FOOD_OPTIONS } from '@/src/constants/preferences';
import { DINING_LOCATIONS, ID_TO_NAME, SLUG_TO_NAME } from '@/src/constants/diningLocations';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism
  const { tracking, updateTargets } = useDailyTracking();
  const appearance = useThemeStore((s) => s.theme);
  const setAppearanceMode = useThemeStore((s) => s.setTheme);
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const [userName, setUserName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [age, setAge] = useState('21');
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('10');
  const [weight, setWeight] = useState('165');
  const [goalWeight, setGoalWeight] = useState('175');
  const [activityLevel, setActivityLevel] = useState('Moderate');
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [dietStrictness, setDietStrictness] = useState<'strict' | 'balanced' | 'relaxed'>('balanced');
  const [showStrictnessPicker, setShowStrictnessPicker] = useState(false);
  const [goalType, setGoalType] = useState('Lean Muscle Growth');
  const [showGoalTypePicker, setShowGoalTypePicker] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAllergenModal, setShowAllergenModal] = useState(false);
  const [showDislikedFoodModal, setShowDislikedFoodModal] = useState(false);
  const [editingMacro, setEditingMacro] = useState<string | null>(null);
  const [macroEditValue, setMacroEditValue] = useState('');
  const [useCustomTargets, setUseCustomTargets] = useState(false); // When true, skip auto-calculation
  const [carbFatRatio, setCarbFatRatio] = useState(1.5); // Default 60/40 carb/fat split
  const [proteinLocked, setProteinLocked] = useState(true); // Protein auto-calculates by default

  const dietaryRestrictions = ['Vegetarian', 'Vegan', 'Pescatarian', 'Halal', 'Kosher', 'Gluten-free', 'None'];

  // Use shared constants for allergen and disliked food options
  // Map AllergenOption (with synonyms) to ItemOption for display
  const allergenOptions: ItemOption[] = ALLERGEN_OPTIONS.map(a => ({ id: a.id, name: a.name }));
  const dislikedFoodOptions = DISLIKED_FOOD_OPTIONS;

  // Mapping between display names and backend keys for micronutrients
  const vitaminDisplayToKey: Record<string, string> = {
    'Vitamin D': 'vitamin_d_mcg',
    'Vitamin B12': 'vitamin_b12_mcg',
    'Vitamin C': 'vitamin_c_mg',
    'Iron': 'iron_mg',
    'Calcium': 'calcium_mg',
    'Potassium': 'potassium_mg',
    'Vitamin A': 'vitamin_a_mcg',
    'Vitamin B6': 'vitamin_b6_mg',
  };
  const vitaminKeyToDisplay: Record<string, string> = Object.fromEntries(
    Object.entries(vitaminDisplayToKey).map(([k, v]) => [v, k])
  );

  const diningHalls = DINING_LOCATIONS.map(l => l.name);
  // Micronutrients available from backend (matching nutrition table columns)
  const vitamins = ['Vitamin D', 'Vitamin B12', 'Vitamin C', 'Iron', 'Calcium', 'Potassium', 'Vitamin A', 'Vitamin B6'];
  const goalTypes = ['Cut', 'Maintain', 'Lean Muscle Growth', 'Bulk'];

  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [allergenExclusions, setAllergenExclusions] = useState<string[]>([]); // Safety - hard filter (stored as IDs from onboarding)
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]); // Preference - soft filter (stored as display names)
  const [selectedHalls, setSelectedHalls] = useState<string[]>(['BPlate', 'De Neve Dining']);
  const [selectedVitamins, setSelectedVitamins] = useState<string[]>(['Vitamin D', 'Vitamin B12', 'Iron']);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Get custom allergens (not in standard list)
  const customAllergens = (allergenExclusions || []).filter(
    id => !allergenOptions.find(opt => opt.id === id)
  );

  // Get custom disliked foods (not in standard list)
  const dislikedFoodNames = dislikedFoodOptions.map(opt => opt.name);
  const customDislikedFoods = (dislikedFoods || []).filter(f => !dislikedFoodNames.includes(f));

  // TEMPORARILY REMOVED - Notification preferences feature
  // const [reminderTimes, setReminderTimes] = useState<{
  //   breakfast: Date | null;
  //   lunch: Date | null;
  //   dinner: Date | null;
  // }>({
  //   breakfast: null,
  //   lunch: null,
  //   dinner: null,
  // });
  // const [editingReminder, setEditingReminder] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  // const [tempReminderTime, setTempReminderTime] = useState<Date>(new Date());

  // Load profile data - prefer backend if authenticated, fall back to local
  React.useEffect(() => {
    const loadProfileData = async () => {

      try {
        // If authenticated, try to fetch from backend first
        if (isAuthenticated) {
          const response = await apiClient.get<{
            id?: string;
            email?: string;
            sex?: 'male' | 'female';
            age?: number;
            height_inches?: number;
            weight_lbs?: number;
            goal_weight_lbs?: number;
            activity_level?: string;
            goal_type?: string;
            dietary_restrictions?: string[];
            allergen_exclusions?: string[];
            preferred_locations?: number[];
            tracked_micronutrients?: string[];
            macro_adherence?: 'strict' | 'balanced' | 'relaxed' | null;
            targets?: {
              daily_calories: number;
              daily_protein_g: number;
              daily_carbs_g: number;
              daily_fat_g: number;
            };
          }>('/user/profile');

          if (response.data && !response.error) {
            const profile = response.data;

            // Set user email and derive name from email
            if (profile.email) {
              setUserEmail(profile.email);
              // Extract name from email (part before @)
              const namePart = profile.email.split('@')[0];
              setUserName(namePart);
            }
            if (profile.weight_lbs) {
              setWeight(profile.weight_lbs.toString());
            }
            if (profile.goal_weight_lbs) {
              setGoalWeight(profile.goal_weight_lbs.toString());
            } else if (profile.weight_lbs) {
              setGoalWeight(profile.weight_lbs.toString());
            }
            if (profile.sex) setGender(profile.sex);
            if (profile.age) setAge(profile.age.toString());
            if (profile.height_inches) {
              const feet = Math.floor(profile.height_inches / 12);
              const inches = profile.height_inches % 12;
              setHeightFeet(feet.toString());
              setHeightInches(inches.toString());
            }
            // Map backend activity level to display value
            if (profile.activity_level) {
              const activityBackendToDisplay: Record<string, string> = {
                'Sedentary': 'Sedentary',
                'Lightly Active': 'Light',
                'Moderately Active': 'Moderate',
                'Very Active': 'Very Active',
              };
              setActivityLevel(activityBackendToDisplay[profile.activity_level] || profile.activity_level);
            }
            // Map backend goal type to display value
            if (profile.goal_type) {
              const goalBackendToDisplay: Record<string, string> = {
                'Bulk Up': 'Bulk',
                'Get Lean': 'Cut',
                'Maintain': 'Maintain',
                'Perform Better': 'Lean Muscle Growth',
              };
              setGoalType(goalBackendToDisplay[profile.goal_type] || profile.goal_type);
            }
            // Map backend macro_adherence to diet strictness
            if (profile.macro_adherence) {
              setDietStrictness(profile.macro_adherence as 'strict' | 'balanced' | 'relaxed');
            }
            if (profile.dietary_restrictions?.length) {
              setSelectedRestrictions(profile.dietary_restrictions);
            }
            if (profile.allergen_exclusions?.length) {
              setAllergenExclusions(profile.allergen_exclusions);
            }
            // Load disliked foods from onboarding data (ingredientsAvoid)
            // Backend doesn't have a separate endpoint yet, so we use local data
            if (profile.preferred_locations?.length) {
              const mappedHalls = profile.preferred_locations
                .map(id => ID_TO_NAME[id])
                .filter(Boolean) as string[];
              if (mappedHalls.length > 0) setSelectedHalls(mappedHalls);
            }
            // Update macro targets from backend (calculated values)
            if (profile.targets) {
              updateTargets({
                calories: profile.targets.daily_calories,
                protein: profile.targets.daily_protein_g,
                carbs: profile.targets.daily_carbs_g,
                fats: profile.targets.daily_fat_g,
              });
            }
            // Load tracked micronutrients from backend (map keys to display names)
            if (profile.tracked_micronutrients?.length) {
              const mappedVitamins = profile.tracked_micronutrients
                .map(key => vitaminKeyToDisplay[key])
                .filter(Boolean) as string[];
              if (mappedVitamins.length > 0) setSelectedVitamins(mappedVitamins);
            }
            setIsInitialLoad(false);
            return; // Backend data loaded successfully
          }
        }

        // Fall back to local onboarding data
        const data = await getOnboardingData();

        if (data.sex) setGender(data.sex);
        if (data.age) setAge(data.age.toString());
        if (data.heightFeet !== undefined) {
          setHeightFeet(data.heightFeet.toString());
          setHeightInches((data.heightInches ?? 0).toString());
        }
        if (data.weight) setWeight(data.weight.toString());
        // Goal weight: use saved value, or fall back to current weight
        if (data.goalWeight) {
          setGoalWeight(data.goalWeight.toString());
        } else if (data.weight) {
          // Fallback to current weight if no goal weight set
          setGoalWeight(data.weight.toString());
        }
        if (data.activityLevel) {
          const activityMap: Record<string, string> = {
            'sedentary': 'Sedentary',
            'light': 'Light',
            'moderate': 'Moderate',
            'very': 'Very Active',
          };
          setActivityLevel(activityMap[data.activityLevel] || 'Moderate');
        }
        if (data.goal) {
          const goalMap: Record<string, string> = {
            'bulk': 'Bulk',
            'lean': 'Lean Muscle Growth',
            'maintain': 'Maintain',
            'perform': 'Lean Muscle Growth',
          };
          setGoalType(goalMap[data.goal] || 'Lean Muscle Growth');
        }
        if (data.dietStrictness) {
          setDietStrictness(data.dietStrictness);
        }
        if (data.dietaryRequirements?.length) {
          setSelectedRestrictions(data.dietaryRequirements);
        }
        // Load allergens from onboarding (stored as IDs like 'peanuts', 'tree-nuts', etc.)
        if (data.allergies?.length) {
          setAllergenExclusions(data.allergies);
        }
        // Load disliked foods from onboarding (stored as display names)
        if (data.ingredientsAvoid?.length) {
          setDislikedFoods(data.ingredientsAvoid);
        }
        if (data.preferredDiningLocations?.length) {
          const mappedHalls = data.preferredDiningLocations
            .map(slug => SLUG_TO_NAME[slug])
            .filter(Boolean) as string[];
          if (mappedHalls.length > 0) setSelectedHalls(mappedHalls);
        }
        // TEMPORARILY REMOVED - Notification preferences feature
        // if (data.mealTimes) {
        //   setReminderTimes({
        //     breakfast: parseTimeStringToDate(data.mealTimes.breakfast),
        //     lunch: parseTimeStringToDate(data.mealTimes.lunch),
        //     dinner: parseTimeStringToDate(data.mealTimes.dinner),
        //   });
        // }
        // Load custom targets flag
        if (data.useCustomTargets !== undefined) {
          setUseCustomTargets(data.useCustomTargets);
        }
        // Load selected vitamins
        if (data.selectedVitamins?.length) {
          setSelectedVitamins(data.selectedVitamins);
        }
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error loading profile data:', error);
        setIsInitialLoad(false);
      }
    };
    loadProfileData();
  }, [isAuthenticated]);

  // TEMPORARILY REMOVED - Notification preferences feature
  // React.useEffect(() => {
  //   if (isInitialLoad) return;
  //   const persistReminderTimes = async () => {
  //     const mealTimesData = {
  //       breakfast: reminderTimes.breakfast ? formatReminderTime(reminderTimes.breakfast) : undefined,
  //       lunch: reminderTimes.lunch ? formatReminderTime(reminderTimes.lunch) : undefined,
  //       dinner: reminderTimes.dinner ? formatReminderTime(reminderTimes.dinner) : undefined,
  //     };
  //     await saveOnboardingData({ mealTimes: mealTimesData });
  //   };
  //   persistReminderTimes();
  // }, [reminderTimes, isInitialLoad]);

  // Save preferred dining halls when they change
  React.useEffect(() => {
    if (isInitialLoad) return; // Don't save on initial load

    const savePreferredHalls = async () => {
      // Derive lookup maps from the shared DINING_LOCATIONS constant
      const nameToLocationId = Object.fromEntries(DINING_LOCATIONS.map(l => [l.name, l.id]));
      const nameToSlug = Object.fromEntries(DINING_LOCATIONS.map(l => [l.name, l.slug]));

      const locationIds = selectedHalls
        .map(name => nameToLocationId[name])
        .filter((id): id is number => id !== undefined);

      const locationSlugs = selectedHalls
        .map(name => nameToSlug[name])
        .filter(Boolean);

      try {
        // Save to backend if authenticated
        if (isAuthenticated && locationIds.length > 0) {
          await userService.updateProfile({ preferred_locations: locationIds });
        }

        // Always save to local onboarding data as fallback
        if (locationSlugs.length > 0) {
          await saveOnboardingData({ preferredDiningLocations: locationSlugs });
        }
      } catch (error) {
        console.error('Error saving preferred dining halls:', error);
      }
    };

    savePreferredHalls();
  }, [selectedHalls, isAuthenticated, isInitialLoad]);

  // Save selected vitamins when they change - sync to backend and local storage
  React.useEffect(() => {
    if (isInitialLoad) return;

    const saveVitamins = async () => {
      // Save to local storage (display names)
      await saveOnboardingData({ selectedVitamins });

      // Sync to backend if authenticated (convert to backend keys)
      if (isAuthenticated) {
        const trackedKeys = selectedVitamins
          .map(name => vitaminDisplayToKey[name])
          .filter(Boolean) as string[];

        try {
          await userService.updateProfile({ tracked_micronutrients: trackedKeys });
        } catch (error) {
          console.warn('[profile] Failed to sync tracked vitamins to backend:', error);
        }
      }
    };

    saveVitamins();
  }, [selectedVitamins, isInitialLoad, isAuthenticated]);

  // Save allergens when they change - sync to backend and local storage
  React.useEffect(() => {
    if (isInitialLoad) return;

    const saveAllergens = async () => {
      // Save to local onboarding data (as IDs)
      await saveOnboardingData({ allergies: allergenExclusions });

      // Sync to backend if authenticated
      if (isAuthenticated && allergenExclusions.length >= 0) {
        try {
          await userService.updateProfile({ allergen_exclusions: allergenExclusions });
        } catch (error) {
          console.warn('[profile] Failed to sync allergens to backend:', error);
        }
      }
    };

    saveAllergens();
  }, [allergenExclusions, isInitialLoad, isAuthenticated]);

  // Save dietary restrictions when they change - sync to backend and local storage
  React.useEffect(() => {
    if (isInitialLoad) return;

    const saveRestrictions = async () => {
      // Save to local onboarding data
      await saveOnboardingData({ dietaryRequirements: selectedRestrictions });

      // Sync to backend if authenticated
      if (isAuthenticated) {
        try {
          await userService.updateProfile({ dietary_restrictions: selectedRestrictions });
        } catch (error) {
          console.warn('[profile] Failed to sync dietary restrictions to backend:', error);
        }
      }
    };

    saveRestrictions();
  }, [selectedRestrictions, isInitialLoad, isAuthenticated]);

  // Save disliked foods when they change - sync to local storage
  React.useEffect(() => {
    if (isInitialLoad) return;

    const saveDislikedFoods = async () => {
      // Save to local onboarding data (backend endpoint not available yet)
      await saveOnboardingData({ ingredientsAvoid: dislikedFoods });
    };

    saveDislikedFoods();
  }, [dislikedFoods, isInitialLoad]);

  // Save diet strictness when it changes - sync to backend and local storage
  React.useEffect(() => {
    if (isInitialLoad) return;

    const saveDietStrictness = async () => {
      // Save to backend if authenticated
      if (isAuthenticated) {
        try {
          await userService.updateProfile({ macro_adherence: dietStrictness });
        } catch (error) {
          console.warn('[profile] Failed to sync diet strictness to backend:', error);
        }
      }
      // Always save to local onboarding data as fallback
      await saveOnboardingData({ dietStrictness });
    };

    saveDietStrictness();
  }, [dietStrictness, isAuthenticated, isInitialLoad]);

  const toggleSelection = (
    item: string,
    selected: string[],
    setSelected: (items: string[]) => void
  ) => {
    haptics.light();
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const activityLevels = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];

  const strictnessOptions: { id: 'strict' | 'balanced' | 'relaxed'; label: string; description: string }[] = [
    { id: 'relaxed', label: 'Relaxed', description: 'Prioritize taste while still avoiding overeating' },
    { id: 'balanced', label: 'Balanced', description: 'Equal balance between enjoying food and eating well' },
    { id: 'strict', label: 'Strict', description: 'More priority on health, less on taste' },
  ];
  const strictnessDisplayMap: Record<string, string> = { strict: 'Strict', balanced: 'Balanced', relaxed: 'Relaxed' };

  const calculateMacros = () => {
    // BMR calculation (Mifflin-St Jeor Equation)
    const weightKg = parseFloat(weight) * 0.453592;
    const heightCm = (parseFloat(heightFeet) * 30.48) + (parseFloat(heightInches) * 2.54);
    const ageNum = parseFloat(age);
    
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5;
    } else if (gender === 'female') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;
    } else {
      // Default to male calculation if gender not set
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      'Sedentary': 1.2,
      'Light': 1.375,
      'Moderate': 1.55,
      'Active': 1.725,
      'Very Active': 1.9,
    };

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);
    
    // Adjust for goal type
    let targetCalories = tdee;
    if (goalType === 'Cut') {
      targetCalories = tdee - 500;
    } else if (goalType === 'Bulk') {
      targetCalories = tdee + 500;
    } else if (goalType === 'Lean Muscle Growth') {
      targetCalories = tdee + 300;
    } else {
      // Maintain
      targetCalories = tdee;
    }

    // Calculate protein based on body weight (g per lb of bodyweight)
    // Using evidence-based multipliers matching backend (targets.py)
    // References: Morton et al. (2018), Helms et al. (2014)
    const weightLbs = parseFloat(weight) || 165;
    let proteinPerLb = 1.0; // Default: 1.0g per lb (Maintain)

    if (goalType === 'Cut') {
      proteinPerLb = 1.1; // Higher protein when cutting to preserve muscle (Get Lean)
    } else if (goalType === 'Bulk') {
      proteinPerLb = 1.3; // Higher protein for muscle building (Bulk Up)
    } else if (goalType === 'Lean Muscle Growth') {
      proteinPerLb = 1.1; // Moderate-high protein for athletes (Perform Better)
    } else {
      // Maintain
      proteinPerLb = 1.0;
    }

    // Calculate protein in grams
    const protein = Math.round(weightLbs * proteinPerLb);
    const proteinCalories = protein * 4;

    // Distribute remaining calories between carbs and fat
    const remainingCalories = targetCalories - proteinCalories;

    // Fat should be ~25-30% of total calories for hormone health
    const fatPercent = goalType === 'Cut' ? 0.25 : 0.3;
    const fats = Math.round((targetCalories * fatPercent) / 9);
    const fatCalories = fats * 9;

    // Carbs get the rest
    const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
    const carbs = Math.round(carbCalories / 4);

    return {
      calories: Math.round(targetCalories),
      protein,
      carbs,
      fats,
    };
  };

  // Constraint enforcement: When editing one macro, redistribute to stay within calories
  // Formula: Protein*4 + Carbs*4 + Fat*9 = Calories
  const handleMacroEdit = (macro: string, newValue: number) => {
    const current = tracking.targets;

    if (macro === 'calories') {
      // When changing calories, scale all macros proportionally
      const ratio = newValue / current.calories;
      updateTargets({
        calories: newValue,
        protein: Math.round(current.protein * ratio),
        carbs: Math.round(current.carbs * ratio),
        fats: Math.round(current.fats * ratio),
      });
    } else if (macro === 'protein') {
      // When changing protein, keep fat% the same, adjust carbs
      const proteinCalories = newValue * 4;
      const fatCalories = current.fats * 9;
      const remainingForCarbs = current.calories - proteinCalories - fatCalories;
      const newCarbs = Math.max(0, Math.round(remainingForCarbs / 4));
      updateTargets({
        protein: newValue,
        carbs: newCarbs,
      });
    } else if (macro === 'carbs') {
      // When changing carbs, keep fat% the same, adjust protein
      const carbCalories = newValue * 4;
      const fatCalories = current.fats * 9;
      const remainingForProtein = current.calories - carbCalories - fatCalories;
      const newProtein = Math.max(0, Math.round(remainingForProtein / 4));
      updateTargets({
        carbs: newValue,
        protein: newProtein,
      });
    } else if (macro === 'fats') {
      // When changing fat, keep protein the same, adjust carbs
      const fatCalories = newValue * 9;
      const proteinCalories = current.protein * 4;
      const remainingForCarbs = current.calories - proteinCalories - fatCalories;
      const newCarbs = Math.max(0, Math.round(remainingForCarbs / 4));
      updateTargets({
        fats: newValue,
        carbs: newCarbs,
      });
    }

    // Mark as using custom targets and save
    setUseCustomTargets(true);
    saveOnboardingData({ useCustomTargets: true });
  };

  // Reset to calculated values
  const handleResetToCalculated = () => {
    haptics.medium();
    setUseCustomTargets(false);
    saveOnboardingData({ useCustomTargets: false });
    const macros = calculateMacros();
    updateTargets(macros);
  };

  // Handle carb/fat ratio slider change
  const handleCarbFatRatioChange = async (newRatio: number) => {
    setCarbFatRatio(newRatio);

    // Recalculate carbs and fat based on new ratio
    const current = tracking.targets;
    const proteinCalories = current.protein * 4;
    const remainingCalories = Math.max(0, current.calories - proteinCalories);

    // carb_cals = ratio * fat_cals
    // carb_cals + fat_cals = remaining
    // (ratio + 1) * fat_cals = remaining
    const fatCalories = remainingCalories / (newRatio + 1);
    const carbCalories = remainingCalories - fatCalories;

    const newFats = Math.round(fatCalories / 9);
    const newCarbs = Math.round(carbCalories / 4);

    updateTargets({
      carbs: newCarbs,
      fats: newFats,
    });

    // Save ratio preference locally
    saveOnboardingData({ carbFatRatio: newRatio });

    // Sync to backend if authenticated
    if (isAuthenticated) {
      try {
        await userService.updateMacroPreferences({ carb_fat_ratio: newRatio });
      } catch (error) {
        console.warn('[profile] Failed to sync carb_fat_ratio to backend:', error);
      }
    }
  };

  React.useEffect(() => {
    // Skip auto-calculation if user has set custom targets
    if (useCustomTargets) return;
    const macros = calculateMacros();
    updateTargets(macros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [age, heightFeet, heightInches, weight, goalWeight, gender, activityLevel, goalType, useCustomTargets]);

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleSaveField = async () => {
    if (!editingField) return;

    haptics.success();
    const numericValue = parseFloat(editValue);

    switch (editingField) {
      case 'age':
        setAge(editValue);
        // Save to backend and local storage
        if (!isNaN(numericValue)) {
          if (isAuthenticated) {
            userService.updateProfile({ age: Math.round(numericValue) });
          }
          saveOnboardingData({ age: Math.round(numericValue) });
        }
        break;
      case 'heightFeet':
        setHeightFeet(editValue);
        // Save height to backend and local storage
        if (!isNaN(numericValue)) {
          const totalInches = Math.round(numericValue) * 12 + parseInt(heightInches || '0');
          if (isAuthenticated) {
            userService.updateProfile({ height_inches: totalInches });
          }
          saveOnboardingData({ heightFeet: Math.round(numericValue), heightInches: parseInt(heightInches || '0') });
        }
        break;
      case 'heightInches':
        setHeightInches(editValue);
        // Save height to backend and local storage
        if (!isNaN(numericValue)) {
          const totalInches = parseInt(heightFeet || '0') * 12 + Math.round(numericValue);
          if (isAuthenticated) {
            userService.updateProfile({ height_inches: totalInches });
          }
          saveOnboardingData({ heightFeet: parseInt(heightFeet || '0'), heightInches: Math.round(numericValue) });
        }
        break;
      case 'weight':
        setWeight(editValue);
        // Save to backend (logs to weight history) and local storage
        if (!isNaN(numericValue)) {
          if (isAuthenticated) {
            // Use logWeight to track history and recalculate targets
            userService.logWeight(Math.round(numericValue));
          }
          saveOnboardingData({ weight: Math.round(numericValue) });
        }
        break;
      case 'goalWeight':
        setGoalWeight(editValue);
        if (!isNaN(numericValue)) {
          saveOnboardingData({ goalWeight: Math.round(numericValue) });
          if (isAuthenticated) {
            try {
              await userService.updateProfile({ goal_weight_lbs: Math.round(numericValue) });
            } catch { /* best-effort sync */ }
          }
        }
        break;
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleGenderChange = (newGender: 'male' | 'female') => {
    if (gender === null) {
      // First time selection - no confirmation needed
      setGender(newGender);
      setShowGenderPicker(false);
      haptics.selection();
    } else {
      // Changing gender - require confirmation
      Alert.alert(
        'Change Gender?',
        'This will update your profile and may affect your macro calculations. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: () => {
              setGender(newGender);
              setShowGenderPicker(false);
              haptics.selection();
            },
          },
        ]
      );
    }
  };


  const handleRemoveDislikedFood = (food: string) => {
    haptics.light();
    setDislikedFoods(dislikedFoods.filter(f => f !== food));
  };

  // TEMPORARILY REMOVED - Notification preferences feature
  // const handleReminderPress = (meal: 'breakfast' | 'lunch' | 'dinner') => {
  //   const current = reminderTimes[meal] || defaultReminderTime(meal);
  //   setEditingReminder(meal);
  //   setTempReminderTime(current);
  // };
  // const handleReminderTimeChange = (event: any, selectedDate?: Date) => {
  //   if (Platform.OS === 'android') {
  //     const date = selectedDate || tempReminderTime;
  //     if (editingReminder && date) {
  //       setReminderTimes(prev => ({ ...prev, [editingReminder]: date }));
  //     }
  //     setEditingReminder(null);
  //   } else {
  //     if (selectedDate) { setTempReminderTime(selectedDate); }
  //   }
  // };
  // const handleReminderTimeSave = () => {
  //   if (editingReminder) {
  //     setReminderTimes(prev => ({ ...prev, [editingReminder]: tempReminderTime }));
  //   }
  //   setEditingReminder(null);
  // };
  // const handleOpenNotificationSettings = async () => {
  //   try {
  //     if (Linking.openSettings) { await Linking.openSettings(); return; }
  //     await Linking.openURL('app-settings:');
  //   } catch (error) {
  //     console.error('Error opening notification settings:', error);
  //     Alert.alert('Unable to open Settings', 'Please open the iOS Settings app, find FeedMe, and update notification permissions there.');
  //   }
  // };

  // Original return restored
  return (
    <Screen safeBottom={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text variant="h1" weight="bold" style={styles.title}>
          Profile & Settings
        </Text>

        {/* Personal Info Card - Matching screenshot design */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Personal Info
          </Text>

          {/* Avatar and User Info */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: themeColors.cardBackgroundSecondary }]}>
              <AppIcon type="profile" size={24} />
            </View>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => {
                setEditNameValue(userName || '');
                setIsEditingName(true);
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text variant="h4" weight="semibold">
                  {userName || 'User'}
                </Text>
                <AppIcon type="edit" size={16} />
              </View>
              <Text variant="bodySmall" color="secondary">
                {userEmail || 'Loading...'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Display Name Edit Modal */}
          <Modal
            visible={isEditingName}
            transparent
            animationType="fade"
            onRequestClose={() => setIsEditingName(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setIsEditingName(false)}>
              <View
                style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}
                onStartShouldSetResponder={() => true}>
                <Text variant="h4" weight="semibold" style={{ marginBottom: 16 }}>
                  Edit Display Name
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: themeColors.cardBackgroundSecondary,
                      color: themeColors.text,
                      borderColor: themeColors.border,
                    },
                  ]}
                  value={editNameValue}
                  onChangeText={setEditNameValue}
                  placeholder="Enter your name"
                  placeholderTextColor={themeColors.textSecondary}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <Button
                    variant="secondary"
                    size="md"
                    onPress={() => setIsEditingName(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={isSavingName}
                    onPress={async () => {
                      if (!editNameValue.trim()) return;
                      setIsSavingName(true);
                      const result = await userService.updateProfile({ display_name: editNameValue.trim() });
                      setIsSavingName(false);
                      if (result) {
                        setUserName(editNameValue.trim());
                        setIsEditingName(false);
                        haptics.success();
                      } else {
                        Alert.alert('Error', 'Failed to update name');
                      }
                    }}>
                    {isSavingName ? 'Saving...' : 'Save'}
                  </Button>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Gender Selection - Pill Buttons */}
          <View style={styles.genderSection}>
            <Text variant="body" color="secondary" style={styles.genderLabel}>
              Gender
            </Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderPill,
                  gender === 'male' && {
                    backgroundColor: themeColors.primary + '30',
                    borderColor: themeColors.primary,
                    borderWidth: 1.5,
                  },
                  gender !== 'male' && {
                    backgroundColor: themeColors.cardBackgroundSecondary,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => {
                  if (gender === 'male') return;
                  haptics.medium();
                  Alert.alert(
                    'Change Gender?',
                    'This will affect your macro calculations and onboarding data. Are you sure you want to change your gender?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm',
                        style: 'default',
                        onPress: () => setGender('male'),
                      },
                    ]
                  );
                }}>
                <Text
                  variant="body"
                  weight={gender === 'male' ? 'semibold' : 'medium'}
                  style={{ color: gender === 'male' ? themeColors.primary : themeColors.text }}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderPill,
                  gender === 'female' && {
                    backgroundColor: themeColors.primary + '30',
                    borderColor: themeColors.primary,
                    borderWidth: 1.5,
                  },
                  gender !== 'female' && {
                    backgroundColor: themeColors.cardBackgroundSecondary,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => {
                  if (gender === 'female') return;
                  haptics.medium();
                  Alert.alert(
                    'Change Gender?',
                    'This will affect your macro calculations and onboarding data. Are you sure you want to change your gender?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm',
                        style: 'default',
                        onPress: () => setGender('female'),
                      },
                    ]
                  );
                }}>
                <Text
                  variant="body"
                  weight={gender === 'female' ? 'semibold' : 'medium'}
                  style={{ color: gender === 'female' ? themeColors.primary : themeColors.text }}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <TouchableOpacity
              style={[
                styles.metricBox,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary || themeColors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => handleEditField('age', age)}>
              <Text variant="bodySmall" color="secondary" style={styles.metricLabel}>
                Age
              </Text>
              <Text variant="h4" weight="bold" style={styles.metricValue}>
                {age}
              </Text>
              <Text variant="caption" color="tertiary">
                years
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.metricBox,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary || themeColors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                handleEditField('heightFeet', heightFeet);
              }}>
              <Text variant="bodySmall" color="secondary" style={styles.metricLabel}>
                Height
              </Text>
              <Text variant="h4" weight="bold" style={styles.metricValue}>
                {heightFeet}&apos;{heightInches}&quot;
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.metricBox,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary || themeColors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => handleEditField('weight', weight)}>
              <Text variant="bodySmall" color="secondary" style={styles.metricLabel}>
                Weight
              </Text>
              <Text variant="h4" weight="bold" style={styles.metricValue}>
                {weight}
              </Text>
              <Text variant="caption" color="tertiary">
                lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.metricBox,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary || themeColors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => handleEditField('goalWeight', goalWeight)}>
              <Text variant="bodySmall" color="secondary" style={styles.metricLabel}>
                Goal Weight
              </Text>
              <Text variant="h4" weight="bold" style={styles.metricValue}>
                {goalWeight}
              </Text>
              <Text variant="caption" color="tertiary">
                lbs
              </Text>
            </TouchableOpacity>
          </View>

          {/* Activity Level */}
          <View style={styles.activitySection}>
            <Text variant="body" color="secondary" style={styles.activityLabel}>
              Activity Level
            </Text>
            <TouchableOpacity
              style={[
                styles.activityButton,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                haptics.medium();
                setShowActivityPicker(true);
              }}>
              <Text variant="body" weight="semibold">
                {activityLevel}
              </Text>
              <AppIcon type="chevron-up-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Dietary Strictness */}
          <View style={styles.activitySection}>
            <Text variant="body" color="secondary" style={styles.activityLabel}>
              Dietary Strictness
            </Text>
            <TouchableOpacity
              style={[
                styles.activityButton,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                haptics.medium();
                setShowStrictnessPicker(true);
              }}>
              <Text variant="body" weight="semibold">
                {strictnessDisplayMap[dietStrictness] || 'Balanced'}
              </Text>
              <AppIcon type="chevron-up-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Macro Targets Card - Matching screenshot design */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Macro Targets
          </Text>

          {/* Goal Type Selector - Polished rounded input */}
          <View style={styles.goalTypeSection}>
            <Text variant="bodySmall" color="secondary" style={styles.goalTypeLabel}>
              Goal Type
            </Text>
            <TouchableOpacity
              style={[
                styles.goalTypeSelector,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                haptics.medium();
                setShowGoalTypePicker(true);
              }}>
              <Text variant="body" weight="medium" style={{ color: themeColors.text }}>
                {goalType}
              </Text>
              <AppIcon type="chevron-up-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.macroTargetsGrid}>
            <TouchableOpacity
              style={[
                styles.macroTargetItem,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary || themeColors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                setEditingMacro('calories');
                setMacroEditValue(tracking.targets.calories.toString());
              }}>
              <Text variant="caption" color="secondary" style={styles.macroLabel}>
                Calories
              </Text>
              {editingMacro === 'calories' ? (
                <TextInput
                  style={[
                    styles.macroInput,
                    {
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      borderColor: themeColors.primary,
                    },
                  ]}
                  value={macroEditValue}
                  onChangeText={setMacroEditValue}
                  keyboardType="numeric"
                  autoFocus
                  onSubmitEditing={() => {
                    const value = parseInt(macroEditValue);
                    if (!isNaN(value) && value > 0) {
                      handleMacroEdit('calories', value);
                      setEditingMacro(null);
                    }
                  }}
                  onBlur={() => {
                    const value = parseInt(macroEditValue);
                    if (!isNaN(value) && value > 0) {
                      handleMacroEdit('calories', value);
                    }
                    setEditingMacro(null);
                  }}
                />
              ) : (
                <Text variant="body" weight="bold" style={[styles.macroValue, { color: themeColors.calories }]}>
                  {formatCalories(tracking.targets.calories)}
                </Text>
              )}
              <Text variant="caption" color="tertiary" style={styles.macroUnit}>
                kcal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.macroTargetItem,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary || themeColors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                setEditingMacro('protein');
                setMacroEditValue(tracking.targets.protein.toString());
              }}>
              <Text variant="caption" color="secondary" style={styles.macroLabel}>
                Protein
              </Text>
              {editingMacro === 'protein' ? (
                <TextInput
                  style={[
                    styles.macroInput,
                    {
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      borderColor: themeColors.protein,
                    },
                  ]}
                  value={macroEditValue}
                  onChangeText={setMacroEditValue}
                  keyboardType="numeric"
                  autoFocus
                  onSubmitEditing={() => {
                    const value = parseInt(macroEditValue);
                    if (!isNaN(value) && value > 0) {
                      handleMacroEdit('protein', value);
                      setEditingMacro(null);
                    }
                  }}
                  onBlur={() => {
                    const value = parseInt(macroEditValue);
                    if (!isNaN(value) && value > 0) {
                      handleMacroEdit('protein', value);
                    }
                    setEditingMacro(null);
                  }}
                />
              ) : (
                <Text variant="body" weight="bold" style={[styles.macroValue, { color: themeColors.protein }]}>
                  {formatMacro(tracking.targets.protein)}
                </Text>
              )}
              <Text variant="caption" color="tertiary" style={styles.macroUnit}>
                g
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.macroTargetItem,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary || themeColors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                setEditingMacro('carbs');
                setMacroEditValue(tracking.targets.carbs.toString());
              }}>
              <Text variant="caption" color="secondary" style={styles.macroLabel}>
                Carbs
              </Text>
              {editingMacro === 'carbs' ? (
                <TextInput
                  style={[
                    styles.macroInput,
                    {
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      borderColor: themeColors.carbs,
                    },
                  ]}
                  value={macroEditValue}
                  onChangeText={setMacroEditValue}
                  keyboardType="numeric"
                  autoFocus
                  onSubmitEditing={() => {
                    const value = parseInt(macroEditValue);
                    if (!isNaN(value) && value > 0) {
                      handleMacroEdit('carbs', value);
                      setEditingMacro(null);
                    }
                  }}
                  onBlur={() => {
                    const value = parseInt(macroEditValue);
                    if (!isNaN(value) && value > 0) {
                      handleMacroEdit('carbs', value);
                    }
                    setEditingMacro(null);
                  }}
                />
              ) : (
                <Text variant="body" weight="bold" style={[styles.macroValue, { color: themeColors.carbs }]}>
                  {formatMacro(tracking.targets.carbs)}
                </Text>
              )}
              <Text variant="caption" color="tertiary" style={styles.macroUnit}>
                g
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.macroTargetItem,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary || themeColors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                setEditingMacro('fats');
                setMacroEditValue(tracking.targets.fats.toString());
              }}>
              <Text variant="caption" color="secondary" style={styles.macroLabel}>
                Fat
              </Text>
              {editingMacro === 'fats' ? (
                <TextInput
                  style={[
                    styles.macroInput,
                    {
                      backgroundColor: themeColors.background,
                      color: themeColors.text,
                      borderColor: themeColors.fats,
                    },
                  ]}
                  value={macroEditValue}
                  onChangeText={setMacroEditValue}
                  keyboardType="numeric"
                  autoFocus
                  onSubmitEditing={() => {
                    const value = parseInt(macroEditValue);
                    if (!isNaN(value) && value > 0) {
                      handleMacroEdit('fats', value);
                      setEditingMacro(null);
                    }
                  }}
                  onBlur={() => {
                    const value = parseInt(macroEditValue);
                    if (!isNaN(value) && value > 0) {
                      handleMacroEdit('fats', value);
                    }
                    setEditingMacro(null);
                  }}
                />
              ) : (
                <Text variant="body" weight="bold" style={[styles.macroValue, { color: themeColors.fats }]}>
                  {formatMacro(tracking.targets.fats)}
                </Text>
              )}
              <Text variant="caption" color="tertiary" style={styles.macroUnit}>
                g
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reset to Calculated - only show when custom targets are active */}
          {useCustomTargets && (
            <TouchableOpacity
              style={[
                styles.resetButton,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={handleResetToCalculated}>
              <Text variant="bodySmall" weight="medium" style={{ color: themeColors.textSecondary }}>
                Reset to Calculated
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Key Vitamins to Track - HIDDEN FOR MVP: Will be re-enabled for premium subscription */}
        {/*
        <Card variant="elevated" padding="lg" style={styles.card}>
          <View style={styles.vitaminHeader}>
            <View>
              <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
                Key Vitamins to Track
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
                Vitamins shown in Daily Snapshot
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.plusButton, { backgroundColor: themeColors.primary + '30' }]}
              onPress={() => {
                haptics.medium();
                Alert.alert('Add Vitamin', 'Vitamin selection coming soon');
              }}>
              <Text style={[styles.plusIcon, { color: themeColors.primary }]}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scrollViewContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}>
              {vitamins.map((vitamin) => (
              <Chip
                key={vitamin}
                label={vitamin}
                selected={selectedVitamins.includes(vitamin)}
                onPress={() =>
                  toggleSelection(vitamin, selectedVitamins, setSelectedVitamins)
                }
                style={styles.chip}
              />
              ))}
            </ScrollView>
          </View>
        </Card>
        */}

        {/* Dietary Restrictions */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Dietary Restrictions
          </Text>
          <View style={styles.scrollViewContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}>
              {dietaryRestrictions.map((restriction) => (
              <Chip
                key={restriction}
                label={restriction}
                selected={selectedRestrictions.includes(restriction)}
                onPress={() =>
                  toggleSelection(restriction, selectedRestrictions, setSelectedRestrictions)
                }
                style={styles.chip}
              />
              ))}
            </ScrollView>
          </View>
        </Card>

        {/* Allergies - Safety (hard filter) */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <View style={styles.vitaminHeader}>
            <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
              Allergies
            </Text>
            <TouchableOpacity
              style={[styles.plusButton, { backgroundColor: themeColors.primary + '30' }]}
              onPress={() => {
                haptics.medium();
                setShowAllergenModal(true);
              }}>
              <Text style={[styles.plusIcon, { color: themeColors.primary }]}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scrollViewContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}>
              {/* Show standard allergen options */}
              {allergenOptions.map((allergen) => (
                <Chip
                  key={allergen.id}
                  label={allergen.name}
                  selected={allergenExclusions.includes(allergen.id)}
                  onPress={() => {
                    toggleSelection(allergen.id, allergenExclusions, setAllergenExclusions);
                  }}
                  style={styles.chip}
                />
              ))}
              {/* Show custom allergens from onboarding (not in standard list) */}
              {customAllergens.map((customAllergen) => (
                <Chip
                  key={customAllergen}
                  label={customAllergen}
                  selected={true}
                  onPress={() => {
                    toggleSelection(customAllergen, allergenExclusions, setAllergenExclusions);
                  }}
                  style={styles.chip}
                />
              ))}
            </ScrollView>
          </View>
        </Card>

        {/* Disliked Foods - Preference (soft filter) */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <View style={styles.vitaminHeader}>
            <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
              Disliked Foods
            </Text>
            <TouchableOpacity
              style={[styles.plusButton, { backgroundColor: themeColors.primary + '30' }]}
              onPress={() => {
                haptics.medium();
                setShowDislikedFoodModal(true);
              }}>
              <Text style={[styles.plusIcon, { color: themeColors.primary }]}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scrollViewContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}>
              {/* Show all available options plus any custom ones from onboarding */}
              {[...dislikedFoodNames, ...customDislikedFoods].map((food) => (
                <Chip
                  key={food}
                  label={food}
                  selected={dislikedFoods.includes(food)}
                  onPress={() => {
                    toggleSelection(food, dislikedFoods, setDislikedFoods);
                  }}
                  style={styles.chip}
                />
              ))}
            </ScrollView>
          </View>
        </Card>

        {/* Dining Hall Preferences */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Dining Hall Preferences
          </Text>
          <View style={styles.scrollViewContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}>
              {diningHalls.map((hall) => (
              <Chip
                key={hall}
                label={hall}
                selected={selectedHalls.includes(hall)}
                onPress={() => toggleSelection(hall, selectedHalls, setSelectedHalls)}
                style={styles.chip}
              />
              ))}
            </ScrollView>
          </View>
        </Card>

        {/* TEMPORARILY REMOVED - Notification Preferences card */}
        {/* <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Notification Preferences
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
            We&apos;ll send reminders around these times
          </Text>
          <View style={styles.notificationSection}>
            {([
              { key: 'breakfast', label: 'Breakfast Reminder' },
              { key: 'lunch', label: 'Lunch Reminder' },
              { key: 'dinner', label: 'Dinner Reminder' },
            ] as const).map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.notificationRow}
                onPress={() => handleReminderPress(item.key)}>
                <Text variant="body" style={{ color: themeColors.text }}>
                  {item.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Text variant="bodySmall" color="secondary">
                    {formatReminderTime(reminderTimes[item.key])}
                  </Text>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card> */}

        {/* App Settings - Matching screenshot */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            App Settings
          </Text>

          {/* Settings Options */}
          <View style={styles.themeSettingRow}>
            <Text variant="body" style={{ color: themeColors.text, marginBottom: spacing.sm }}>
              Appearance
            </Text>
            <SegmentedControl
              options={['Light', 'Dark', 'Auto']}
              selectedIndex={appearance === 'light' ? 0 : appearance === 'dark' ? 1 : 2}
              onSelectionChange={(index) => {
                haptics.selection();
                const themeModes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
                setAppearanceMode(themeModes[index]);
              }}
            />
          </View>
          {/* TEMPORARILY REMOVED - Notification Permissions row */}
          {/* <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              haptics.light();
              handleOpenNotificationSettings();
            }}>
            <Text variant="body" style={{ color: themeColors.text }}>
              Notification Permissions
            </Text>
            <Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>→</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              haptics.light();
              router.push('/privacy-settings');
            }}>
            <Text variant="body" style={{ color: themeColors.text }}>
              Privacy Settings
            </Text>
            <Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>→</Text>
          </TouchableOpacity>

          {/* Account Actions */}
          <View style={styles.accountSection}>
            <TouchableOpacity
              style={[
                styles.logOutButton,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={() => {
                haptics.medium();
                Alert.alert('Log Out', 'Are you sure you want to log out?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                      await signOut();
                      router.replace('/(auth)/select-school');
                    },
                  },
                ]);
              }}>
              <Text variant="body" weight="semibold" style={{ color: themeColors.text }}>
                Log Out
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.deleteAccountButton,
                {
                  borderTopWidth: 1,
                  borderTopColor: themeColors.divider,
                },
              ]}
              onPress={() => {
                haptics.medium();
                Alert.alert(
                  'Delete Account',
                  'This will permanently delete your account and all data. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        setIsDeletingAccount(true);
                        const result = await deleteAccount();
                        setIsDeletingAccount(false);

                        if (result.success) {
                          router.replace('/(auth)/select-school');
                        } else {
                          Alert.alert('Error', result.error || 'Failed to delete account');
                        }
                      },
                    },
                  ]
                );
              }}
              disabled={isDeletingAccount}>
              <Text variant="bodySmall" weight="semibold" style={{ color: themeColors.error }}>
                {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reset Food Preferences */}
          <View style={styles.accountSection}>
            <TouchableOpacity
              style={[
                styles.logOutButton,
                {
                  backgroundColor: themeColors.cardBackgroundSecondary,
                  borderWidth: 1,
                  borderColor: themeColors.warning,
                },
              ]}
              onPress={() => {
                haptics.medium();
                Alert.alert(
                  'Reset Food Preferences?',
                  'This will reset all learned food preferences.\n\nYour dietary restrictions and allergies will NOT be affected.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: async () => {
                        const success = await userService.resetPreferences();
                        if (success) {
                          haptics.success();
                          Alert.alert('Success', 'Your food preferences have been reset.');
                        } else {
                          haptics.error();
                          Alert.alert('Error', 'Failed to reset preferences. Please try again.');
                        }
                      },
                    },
                  ]
                );
              }}>
              <Text variant="body" weight="semibold" style={{ color: themeColors.warning }}>
                Reset Food Preferences
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dev Only: Reset Onboarding */}
          {__DEV__ && (
            <View style={styles.accountSection}>
              <TouchableOpacity
                style={[styles.logOutButton, { backgroundColor: themeColors.warning + '30', borderWidth: 1, borderColor: themeColors.warning }]}
                onPress={async () => {
                  haptics.medium();
                  Alert.alert(
                    'Reset Onboarding',
                    'This will clear the onboarding completion flag and show onboarding on next app launch.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset',
                        style: 'default',
                        onPress: async () => {
                          await resetOnboarding();
                          haptics.success();
                          Alert.alert('Success', 'Onboarding has been reset. Reload the app to see onboarding.');
                        },
                      },
                    ]
                  );
                }}>
                <Text variant="body" weight="semibold" style={{ color: themeColors.warning }}>
                  [DEV] Reset Onboarding
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

      </ScrollView>

      {/* Edit Field Modal */}
      <Modal
        visible={editingField !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingField(null)}>
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.modalCard}>
            <Text variant="h4" weight="semibold" style={styles.modalTitle}>
              Edit {editingField === 'age' ? 'Age' : editingField === 'weight' ? 'Weight' : editingField === 'goalWeight' ? 'Goal Weight' : 'Height'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.cardBackground, color: themeColors.text }]}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="numeric"
              placeholder={editingField === 'age' ? 'Age' : editingField === 'weight' || editingField === 'goalWeight' ? 'Weight (lbs)' : 'Feet'}
              placeholderTextColor={themeColors.textSecondary}
              autoFocus
            />
            {editingField === 'heightFeet' && (
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.cardBackground, color: themeColors.text, marginTop: spacing.sm }]}
                value={heightInches}
                onChangeText={setHeightInches}
                keyboardType="numeric"
                placeholder="Inches"
                placeholderTextColor={themeColors.textSecondary}
              />
            )}
            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setEditingField(null)} style={styles.modalButton}>
                Cancel
              </Button>
              <Button variant="primary" onPress={handleSaveField} style={styles.modalButton}>
                Save
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Gender Picker */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}>
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text variant="h4" weight="semibold" style={styles.modalTitle}>
                Select Gender
              </Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <AppIcon type="close" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.genderOptions}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  gender === 'male' && { backgroundColor: themeColors.primary + '20' },
                ]}
                onPress={() => handleGenderChange('male')}>
                <Text
                  variant="h4"
                  weight={gender === 'male' ? 'bold' : 'medium'}
                  style={{ color: gender === 'male' ? themeColors.primary : themeColors.text }}>
                  Male
                </Text>
                {gender === 'male' && (
                  <AppIcon type="check" size={20} color={themeColors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  gender === 'female' && { backgroundColor: themeColors.primary + '20' },
                ]}
                onPress={() => handleGenderChange('female')}>
                <Text
                  variant="h4"
                  weight={gender === 'female' ? 'bold' : 'medium'}
                  style={{ color: gender === 'female' ? themeColors.primary : themeColors.text }}>
                  Female
                </Text>
                {gender === 'female' && (
                  <AppIcon type="check" size={20} color={themeColors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Activity Level Picker - Scrollable */}
      <Modal
        visible={showActivityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActivityPicker(false)}>
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text variant="h4" weight="semibold" style={styles.modalTitle}>
                Activity Level
              </Text>
              <TouchableOpacity onPress={() => setShowActivityPicker(false)}>
                <AppIcon type="close" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.activityScroll}
              contentContainerStyle={styles.activityScrollContent}
              showsVerticalScrollIndicator={true}>
              {activityLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.activityOption,
                    activityLevel === level && { backgroundColor: themeColors.primary + '20' },
                  ]}
                  onPress={() => {
                    setActivityLevel(level);
                    setShowActivityPicker(false);
                    haptics.selection();
                  }}>
                  <Text
                    variant="body"
                    weight={activityLevel === level ? 'semibold' : 'medium'}
                    style={{ color: activityLevel === level ? themeColors.primary : themeColors.text }}>
                    {level}
                  </Text>
                  {activityLevel === level && (
                    <AppIcon type="check" size={18} color={themeColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        </View>
      </Modal>

      {/* Dietary Strictness Picker */}
      <Modal
        visible={showStrictnessPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStrictnessPicker(false)}>
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text variant="h4" weight="semibold" style={styles.modalTitle}>
                Dietary Strictness
              </Text>
              <TouchableOpacity onPress={() => setShowStrictnessPicker(false)}>
                <AppIcon type="close" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.activityScroll}
              contentContainerStyle={styles.activityScrollContent}
              showsVerticalScrollIndicator={true}>
              {strictnessOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.activityOption,
                    dietStrictness === option.id && { backgroundColor: themeColors.primary + '20' },
                  ]}
                  onPress={() => {
                    setDietStrictness(option.id);
                    setShowStrictnessPicker(false);
                    haptics.selection();
                  }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="body"
                      weight={dietStrictness === option.id ? 'semibold' : 'medium'}
                      style={{ color: dietStrictness === option.id ? themeColors.primary : themeColors.text }}>
                      {option.label}
                    </Text>
                    <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                      {option.description}
                    </Text>
                  </View>
                  {dietStrictness === option.id && (
                    <AppIcon type="check" size={18} color={themeColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        </View>
      </Modal>

      {/* Goal Type Picker */}
      <Modal
        visible={showGoalTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalTypePicker(false)}>
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text variant="h4" weight="semibold" style={styles.modalTitle}>
                Goal Type
              </Text>
              <TouchableOpacity onPress={() => setShowGoalTypePicker(false)}>
                <AppIcon type="close" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.activityScroll}
              contentContainerStyle={styles.activityScrollContent}
              showsVerticalScrollIndicator={true}>
              {goalTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.activityOption,
                    goalType === type && { backgroundColor: themeColors.primary + '20' },
                  ]}
                  onPress={() => {
                    setGoalType(type);
                    setShowGoalTypePicker(false);
                    haptics.selection();
                  }}>
                  <Text
                    variant="body"
                    weight={goalType === type ? 'semibold' : 'medium'}
                    style={{ color: goalType === type ? themeColors.primary : themeColors.text }}>
                    {type}
                  </Text>
                  {goalType === type && (
                    <AppIcon type="check" size={18} color={themeColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        </View>
      </Modal>

      {/* TEMPORARILY REMOVED - Notification time pickers */}
      {/* {Platform.OS === 'ios' && editingReminder && (
        <View style={styles.iosPickerOverlay}>
          <Card variant="elevated" padding="lg" style={styles.iosPickerContainer}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={() => setEditingReminder(null)}>
                <Text variant="body" weight="semibold" style={{ color: themeColors.primary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text variant="h4" weight="bold">
                Set Time
              </Text>
              <TouchableOpacity onPress={handleReminderTimeSave}>
                <Text variant="body" weight="semibold" style={{ color: themeColors.primary }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={tempReminderTime}
                mode="time"
                display="spinner"
                onChange={handleReminderTimeChange}
                textColor={themeColors.text}
              />
            </View>
          </Card>
        </View>
      )}
      {Platform.OS === 'android' && editingReminder && (
        <DateTimePicker
          value={tempReminderTime}
          mode="time"
          display="default"
          onChange={handleReminderTimeChange}
        />
      )} */}

      {/* Allergen Management Modal — fixed taxonomy, local-only search */}
      <AllergenPickerModal
        visible={showAllergenModal}
        onClose={() => setShowAllergenModal(false)}
        selectedAllergens={allergenExclusions}
        onSave={(allergens) => {
          setAllergenExclusions(allergens);
        }}
        onNavigateToFoodsToAvoid={() => {
          setShowAllergenModal(false);
          setTimeout(() => setShowDislikedFoodModal(true), 300);
        }}
      />

      {/* Disliked Foods Management Modal — backend /food/search */}
      <ItemManagementModal
        visible={showDislikedFoodModal}
        onClose={() => setShowDislikedFoodModal(false)}
        title="Foods to Avoid"
        subtitle="Foods you'd rather skip (we'll deprioritize these)"
        selectedItems={dislikedFoods}
        standardOptions={dislikedFoodOptions}
        customItems={customDislikedFoods}
        onSave={(selectedItems, updatedCustomItems) => {
          setDislikedFoods(selectedItems);
        }}
        placeholder="Search foods..."
        isDislikedFoods={true}
      />
    </Screen>
  );
}

// TEMPORARILY REMOVED - Notification preference helpers
// const defaultReminderTime = (meal: 'breakfast' | 'lunch' | 'dinner'): Date => {
//   const date = new Date();
//   if (meal === 'breakfast') {
//     date.setHours(8, 0, 0, 0);
//   } else if (meal === 'lunch') {
//     date.setHours(12, 0, 0, 0);
//   } else {
//     date.setHours(18, 0, 0, 0);
//   }
//   return date;
// };
// const formatReminderTime = (date: Date | null): string => {
//   if (!date) return '--:-- --';
//   const hours = date.getHours();
//   const minutes = date.getMinutes();
//   const ampm = hours >= 12 ? 'PM' : 'AM';
//   const displayHours = hours % 12 || 12;
//   const displayMinutes = minutes.toString().padStart(2, '0');
//   return `${displayHours}:${displayMinutes} ${ampm}`;
// };
// const parseTimeStringToDate = (time?: string): Date | null => {
//   if (!time) return null;
//   const parts = time.split(' ');
//   if (parts.length !== 2) return null;
//   const [hm, ampm] = parts;
//   const [hStr, mStr] = hm.split(':');
//   const hoursNum = parseInt(hStr, 10);
//   const minutesNum = parseInt(mStr, 10);
//   if (isNaN(hoursNum) || isNaN(minutesNum)) return null;
//   let hours24 = hoursNum % 12;
//   if (ampm.toUpperCase() === 'PM') { hours24 += 12; }
//   const date = new Date();
//   date.setHours(hours24, minutesNum, 0, 0);
//   return date;
// };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  subtitle: {
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  genderSection: {
    marginBottom: spacing.lg,
  },
  genderLabel: {
    marginBottom: spacing.sm,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  metricLabel: {
    marginBottom: spacing.xs,
    fontSize: 10,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 24,
    marginBottom: spacing.xs / 2,
  },
  activitySection: {
    marginTop: spacing.sm,
  },
  activityLabel: {
    marginBottom: spacing.sm,
  },
  activityButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  chevronIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  notificationSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  deliverySection: {
    marginTop: spacing.lg,
  },
  subsectionLabel: {
    marginBottom: spacing.sm,
    fontSize: 11,
  },
  deliveryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  deliveryButton: {
    minWidth: 80,
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  logOutButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroTargetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  macroTargetItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  macroLabel: {
    marginBottom: spacing.xs,
    fontSize: 10,
  },
  macroValue: {
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 2,
  },
  macroUnit: {
    fontSize: 10,
    marginTop: 1,
  },
  carbFatSliderSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  goalTypeSection: {
    marginBottom: spacing.md,
  },
  goalTypeLabel: {
    marginBottom: spacing.sm,
    fontSize: 11,
  },
  goalTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.xs,
  },
  macroInput: {
    fontSize: 28,
    lineHeight: 32,
    marginBottom: spacing.xs / 2,
    borderWidth: 2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: 'center',
    minWidth: 80,
  },
  resetButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollViewContainer: {
    marginHorizontal: -spacing.lg, // Negative margin to offset Card padding for edge-to-edge
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg, // Restore padding for proper spacing
  },
  vitaminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  themeSettingRow: {
    marginBottom: spacing.md,
  },
  arrow: {
    fontSize: 18,
    opacity: 0.5,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  logoutButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    marginRight: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    flex: 1,
  },
  activityScroll: {
    maxHeight: 400,
  },
  activityScrollContent: {
    paddingBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  activityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: spacing.md,
  },
  dislikedFoodInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  dislikedFoodInput: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 44,
  },
  addFoodButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dislikedFoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  chipText: {
    fontSize: 12,
  },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 16,
  },
  genderOptions: {
    gap: spacing.sm,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  iosPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    width: '100%',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pickerWrapper: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: '100%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 60,
  },
  cancelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
});

