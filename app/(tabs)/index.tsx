/**
 * Home Screen - Main meal planning interface
 * Matches SwiftUI design from screenshots
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Chip } from '@/src/components/Chip';
import { MacroRing } from '@/src/components/MacroRing';
import { MealCard } from '@/src/components/MealCard';
import { ClosedHallCard } from '@/src/components/ClosedHallCard';
import { AppIcon } from '@/src/components/AppIcon';
import { locationService } from '@/src/services/locationService';
import { MealRecommendation, mealService, MealPeriod } from '@/src/services/mealService';
import { useDailyTracking } from '@/src/store/DailyTrackingContext';
import { colors, spacing, radius } from '@/src/theme';
import { Card } from '@/src/ui/Card';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { haptics } from '@/src/utils/haptics';
import { formatCalories, formatMacro } from '@/src/utils/formatNutrition';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { userService } from '@/src/services/userService';
import { getOnboardingData } from '@/src/lib/onboardingData';
import type { DiningHall } from '@/src/services/mealService';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tracking, addMeal, refreshFromBackend } = useDailyTracking();

  // Hall selection state - default to "Any Hill" mode so content shows on scroll
  const [selectedHallSlug, setSelectedHallSlug] = useState<string | null>(null);
  const [selectedHallMode, setSelectedHallMode] = useState<'specific' | 'hill' | 'campus'>('hill');
  const [diningHalls, setDiningHalls] = useState<string[]>([]);
  const [diningHallsData, setDiningHallsData] = useState<Map<string, { isOpen: boolean; availablePeriods?: string[] }>>(new Map());
  const [closestHallSlug, setClosestHallSlug] = useState<string | null>(null);

  // Meal period and mood selection
  const [selectedMealPeriod, setSelectedMealPeriod] = useState<MealPeriod | null>(null);
  const [moodText, setMoodText] = useState<string>('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendedMeal, setRecommendedMeal] = useState<MealRecommendation | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastGenerationKey = useRef<string>('');

  const [likedMeals, setLikedMeals] = useState<Set<string>>(new Set());
  const [greeting, setGreeting] = useState('Good Evening');
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef<number>(0);
  const hasLoadedOnce = useRef(false);
  const [selectedVitamins, setSelectedVitamins] = useState<string[]>([]);

  // Modal state for craving selection
  const [showCravingModal, setShowCravingModal] = useState(false);

  // Mood suggestion chips
  const moodSuggestions = ['High protein', 'Light meal', 'Comfort food', 'Spicy'];

  // Get current/next meal period based on time
  const getCurrentMealPeriod = useCallback((): MealPeriod => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      hour12: false,
    });
    const hour = parseInt(formatter.formatToParts(new Date()).find(p => p.type === 'hour')?.value || '12', 10);
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 21) return 'dinner';
    return 'late_night';
  }, []);

  // Get available periods for the current selection
  const getAvailablePeriods = useCallback((): MealPeriod[] => {
    if (selectedHallMode === 'hill' || selectedHallMode === 'campus') {
      // For "Any Hill" or "Any Campus", show all periods
      return ['breakfast', 'lunch', 'dinner', 'late_night'];
    }
    if (selectedHallSlug) {
      const hallData = diningHallsData.get(selectedHallSlug);
      if (hallData?.availablePeriods && hallData.availablePeriods.length > 0) {
        return hallData.availablePeriods as MealPeriod[];
      }
    }
    // Default to all periods
    return ['breakfast', 'lunch', 'dinner', 'late_night'];
  }, [selectedHallMode, selectedHallSlug, diningHallsData]);

  // Handle generate recommendation
  const handleGenerate = useCallback(async (includeMood: boolean = true, excludedRecipeIds?: string[]) => {
    if (!selectedMealPeriod) return;
    if (selectedHallMode === 'specific' && !selectedHallSlug) return;

    setIsGenerating(true);
    try {
      const result = await mealService.getRecommendedMealWithOptions(
        selectedHallSlug,
        selectedMealPeriod,
        {
          mood: includeMood ? (moodText || undefined) : undefined,
          mode: selectedHallMode,
          excluded_recipe_ids: excludedRecipeIds,
        }
      );
      setRecommendedMeal(result);
      haptics.success();
    } catch (error) {
      console.error('Failed to generate recommendation:', error);
      // Don't show alert on auto-generation, only on manual refresh
      if (!isInitialized) {
        // Silently fail on initial load
        console.warn('[Home] Initial recommendation generation failed, will retry when user interacts');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [selectedMealPeriod, selectedHallMode, selectedHallSlug, moodText, isInitialized]);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Load selected vitamins from profile/onboarding
  useEffect(() => {
    const loadSelectedVitamins = async () => {
      try {
        // Mapping between display names and backend keys
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

        // Try to get from backend first if authenticated
        let vitaminDisplayNames: string[] = [];
        try {
          const profile = await userService.getProfile();
          if (profile?.tracked_micronutrients?.length) {
            // Map backend keys to display names
            const keyToDisplay: Record<string, string> = Object.fromEntries(
              Object.entries(vitaminDisplayToKey).map(([k, v]) => [v, k])
            );
            vitaminDisplayNames = profile.tracked_micronutrients
              .map(key => keyToDisplay[key])
              .filter(name => name !== undefined);
          }
        } catch (error) {
          console.warn('[Home] Error loading vitamins from backend:', error);
        }

        // Fall back to local onboarding data if no backend data
        if (vitaminDisplayNames.length === 0) {
          const onboardingData = await getOnboardingData();
          vitaminDisplayNames = onboardingData.selectedVitamins || [];
        }

        // Convert display names to backend keys for filtering
        const vitaminKeys = vitaminDisplayNames
          .map(name => vitaminDisplayToKey[name])
          .filter(key => key !== undefined);
        
        setSelectedVitamins(vitaminKeys);
      } catch (error) {
        console.warn('[Home] Error loading selected vitamins:', error);
      }
    };
    loadSelectedVitamins();
  }, []);

  // Refresh daily tracking (including micronutrients) when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refreshFromBackend();
    }, [refreshFromBackend])
  );

  // Handle navigation from menu with built plate
  useEffect(() => {
    if (params.buildPlate === 'true' && params.recommendation && params.hallSlug && params.mealPeriod) {
      try {
        const recommendation = JSON.parse(params.recommendation as string) as MealRecommendation;
        const hallSlug = params.hallSlug as string;
        const mealPeriod = params.mealPeriod as MealPeriod;
        
        // Set the dining hall selection
        setSelectedHallMode('specific');
        setSelectedHallSlug(hallSlug);
        setSelectedMealPeriod(mealPeriod);
        
        // Set the recommendation directly (skip auto-generation)
        setRecommendedMeal(recommendation);
        setIsInitialized(true);
        
        // Update generation key to prevent auto-regeneration
        lastGenerationKey.current = `specific-${hallSlug}-${mealPeriod}-from-menu`;
        
        // Clear params to prevent re-triggering
        router.setParams({ 
          buildPlate: undefined, 
          recommendation: undefined, 
          hallSlug: undefined, 
          mealPeriod: undefined,
          hallName: undefined 
        });
        
        // Scroll to bottom to show the meal card
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 500); // Delay to ensure the meal card is rendered
        
        haptics.success();
      } catch (error) {
        console.error('Failed to parse recommendation from params:', error);
      }
    }
  }, [params, router]);

  // Auto-select "Any Hill" and current meal period on mount
  useEffect(() => {
    if (!isInitialized && diningHalls.length > 0 && params.buildPlate !== 'true') {
      setSelectedHallMode('hill');
      setSelectedHallSlug(null);
      const currentPeriod = getCurrentMealPeriod();
      setSelectedMealPeriod(currentPeriod);
      setIsInitialized(true);
    }
  }, [diningHalls.length, isInitialized, getCurrentMealPeriod, params.buildPlate]);

  // Auto-generate recommendation when hall or meal period changes (but not mood)
  useEffect(() => {
    if (!isInitialized) return;
    if (!selectedMealPeriod) return;
    if (selectedHallMode === 'specific' && !selectedHallSlug) return;

    // Create a key for this combination (excluding mood)
    const generationKey = `${selectedHallMode}-${selectedHallSlug || 'none'}-${selectedMealPeriod}`;
    
    // Only generate if the key changed (hall or period changed, not mood)
    if (generationKey !== lastGenerationKey.current) {
      lastGenerationKey.current = generationKey;
      handleGenerate(false); // Don't include mood in auto-generation
    }
  }, [selectedHallMode, selectedHallSlug, selectedMealPeriod, isInitialized, handleGenerate]);

  // Handle mood chip tap
  const handleMoodChipTap = (suggestion: string) => {
    haptics.selection();
    if (moodText.includes(suggestion)) {
      // Remove the suggestion if already present
      setMoodText(prev => {
        const parts = prev.split(', ').filter(p => p !== suggestion);
        return parts.join(', ');
      });
    } else {
      // Add the suggestion
      setMoodText(prev => prev ? `${prev}, ${suggestion}` : suggestion);
    }
  };

// Load dining halls on mount and when screen gains focus (to pick up profile changes)
// Using useFocusEffect to reload when returning from profile screen
useFocusEffect(
  useCallback(() => {
    const loadDiningHalls = async () => {
    try {
      // Get user location for finding closest hall
      const userLocation = await locationService.getCurrentLocation();
      
      // Get all dining halls from the API
      const allHalls = await mealService.getDiningHalls();
      console.log('[Home] Loaded', allHalls.length, 'dining halls from API');

      // Get preferred halls from backend (if authenticated) or local onboarding data
      let preferredSlugs: string[] = [];
      
      try {
        // Try to get from backend first if authenticated
        const profile = await userService.getProfile();
        if (profile?.preferred_locations?.length) {
          // Map location IDs to slugs
          const locationIdToSlug: Record<number, string> = {
            // Residential dining
            28: 'de-neve-dining',
            29: 'bruin-plate',
            30: 'spice-kitchen',
            31: 'epicuria-at-covel',
            // Hill / campus restaurants
            34: 'bruin-cafe',
            36: 'cafe-1919',
            37: 'the-study-at-hedrick',
            38: 'the-drey',
            39: 'rendezvous',
            41: 'epicuria-at-ackerman',
            // ASUCLA / LuValle / satellite locations
            100: 'anderson-cafe',
            101: 'bombshelter',
            102: 'luvalle-fusion',
            103: 'luvalle-pizza',
            104: 'luvalle-epazote',
            105: 'luvalle-burger',
            106: 'luvalle-poke',
            107: 'luvalle-panini',
            108: 'synapse',
          };
          preferredSlugs = profile.preferred_locations
            .map(id => locationIdToSlug[id])
            .filter(slug => slug !== undefined);
        }
        
        // Fall back to local onboarding data if no backend data
        if (preferredSlugs.length === 0) {
          const onboardingData = await getOnboardingData();
          preferredSlugs = onboardingData.preferredDiningLocations || [];
        }
      } catch (error) {
        console.warn('[Home] Error loading preferred halls, using local data:', error);
        const onboardingData = await getOnboardingData();
        preferredSlugs = onboardingData.preferredDiningLocations || [];
      }

      // Normalize slugs (map b-plate to bruin-plate, etc.)
      preferredSlugs = preferredSlugs.map(slug => {
        if (slug === 'b-plate') return 'bruin-plate';
        if (slug === 'de-neve') return 'de-neve-dining';
        if (slug === 'epicuria') return 'epicuria-at-covel';
        if (slug === 'the-study') return 'the-study-at-hedrick';
        if (slug === 'feast') return 'spice-kitchen';
        return slug;
      });

      // Deduplicate preferred slugs after normalization to avoid duplicates
      preferredSlugs = Array.from(new Set(preferredSlugs));

      // Create a complete mapping of all possible dining halls (fallback data)
      const allPossibleHalls: DiningHall[] = [
        // Residential dining
        { id: 29, name: 'Bruin Plate', slug: 'bruin-plate', type: 'residential', is_residential: true, campus_area: 'Hill', is_open_now: false },
        { id: 28, name: 'De Neve Dining', slug: 'de-neve-dining', type: 'residential', is_residential: true, campus_area: 'Hill', is_open_now: false },
        { id: 31, name: 'Epicuria at Covel', slug: 'epicuria-at-covel', type: 'residential', is_residential: true, campus_area: 'Hill', is_open_now: false },
        { id: 30, name: 'Feast at Rieber', slug: 'spice-kitchen', type: 'boutique', is_residential: false, campus_area: 'Hill', is_open_now: false },
        // Hill / campus restaurants
        { id: 39, name: 'Rendezvous', slug: 'rendezvous', type: 'boutique', is_residential: false, campus_area: 'South', is_open_now: false },
        { id: 37, name: 'The Study at Hedrick', slug: 'the-study-at-hedrick', type: 'boutique', is_residential: false, campus_area: 'Central', is_open_now: false },
        { id: 38, name: 'The Drey', slug: 'the-drey', type: 'boutique', is_residential: false, campus_area: 'North', is_open_now: false },
        { id: 34, name: 'Bruin Cafe', slug: 'bruin-cafe', type: 'boutique', is_residential: false, campus_area: 'Hill', is_open_now: false },
        { id: 36, name: 'Cafe 1919', slug: 'cafe-1919', type: 'boutique', is_residential: false, campus_area: 'Hill', is_open_now: false },
        { id: 41, name: 'Epicuria at Ackerman', slug: 'epicuria-at-ackerman', type: 'boutique', is_residential: false, campus_area: 'Central', is_open_now: false },
        // ASUCLA / LuValle / satellite locations
        { id: 100, name: 'Anderson Café', slug: 'anderson-cafe', type: 'boutique', is_residential: false, campus_area: 'North Campus', is_open_now: false },
        { id: 101, name: 'Court of Sciences: Bombshelter', slug: 'bombshelter', type: 'boutique', is_residential: false, campus_area: 'South Campus', is_open_now: false },
        { id: 102, name: 'LuValle: Fusion', slug: 'luvalle-fusion', type: 'boutique', is_residential: false, campus_area: 'Central Campus', is_open_now: false },
        { id: 103, name: 'LuValle: All Rise Pizza', slug: 'luvalle-pizza', type: 'boutique', is_residential: false, campus_area: 'Central Campus', is_open_now: false },
        { id: 104, name: 'LuValle: Epazote', slug: 'luvalle-epazote', type: 'boutique', is_residential: false, campus_area: 'Central Campus', is_open_now: false },
        { id: 105, name: 'LuValle: Burger Assemble', slug: 'luvalle-burger', type: 'boutique', is_residential: false, campus_area: 'Central Campus', is_open_now: false },
        { id: 106, name: 'LuValle: Northern Lights Poke', slug: 'luvalle-poke', type: 'boutique', is_residential: false, campus_area: 'Central Campus', is_open_now: false },
        { id: 107, name: 'LuValle: Northern Lights Panini', slug: 'luvalle-panini', type: 'boutique', is_residential: false, campus_area: 'Central Campus', is_open_now: false },
        { id: 108, name: 'Synapse', slug: 'synapse', type: 'boutique', is_residential: false, campus_area: 'South Campus', is_open_now: false },
      ];

      // Merge API data with fallback data (API data takes precedence for open status)
      const hallsMap = new Map<string, DiningHall>();
      allPossibleHalls.forEach(hall => hallsMap.set(hall.slug, { ...hall }));
      allHalls.forEach(hall => {
        const existing = hallsMap.get(hall.slug);
        if (existing) {
          // Update with API data (especially is_open_now)
          hallsMap.set(hall.slug, { ...existing, ...hall });
        } else {
          // Add new hall from API
          hallsMap.set(hall.slug, hall);
        }
      });
      const mergedHalls = Array.from(hallsMap.values());

      // Get preferred halls (even if closed) - use merged data to ensure all preferred halls are included
      const preferredHalls = preferredSlugs
        .map(slug => mergedHalls.find(h => h.slug === slug))
        .filter((hall): hall is DiningHall => hall !== undefined);
      
      // If a preferred hall is missing, create a fallback entry
      preferredSlugs.forEach(slug => {
        if (!preferredHalls.find(h => h.slug === slug)) {
          const fallbackHall = allPossibleHalls.find(h => h.slug === slug);
          if (fallbackHall) {
            preferredHalls.push(fallbackHall);
          }
        }
      });

      // Only show preferred halls (no other open halls)
      // Sort: open preferred first, then closed preferred
      const sortedHalls = [
        ...preferredHalls.filter(h => h.is_open_now),
        ...preferredHalls.filter(h => !h.is_open_now),
      ].sort((a, b) => {
        // Within each group, sort alphabetically
        return a.name.localeCompare(b.name);
      });

      // Find closest hall if user location is available
      let closestSlug: string | null = null;
      if (userLocation) {
        const sortedByDistance = await mealService.getDiningHallsSorted(
          userLocation.latitude,
          userLocation.longitude,
          preferredSlugs
        );
        // Get the closest hall that's in our preferred halls list
        const closestHall = sortedByDistance.find(hall => 
          preferredHalls.some(ph => ph.slug === hall.slug)
        );
        if (closestHall) {
          closestSlug = closestHall.slug;
        }
      }

      // Get slugs for all halls to show (deduplicated to ensure unique React keys)
      // Put closest hall first if found
      let hallSlugs = Array.from(new Set(sortedHalls.map(h => h.slug)));
      if (closestSlug && hallSlugs.includes(closestSlug)) {
        hallSlugs = [closestSlug, ...hallSlugs.filter(slug => slug !== closestSlug)];
      }

      // Store open/closed status and available periods for each hall (use merged data)
      const hallsDataMap = new Map<string, { isOpen: boolean; availablePeriods?: string[] }>();
      mergedHalls.forEach(hall => {
        hallsDataMap.set(hall.slug, {
          isOpen: hall.is_open_now || false,
          availablePeriods: hall.available_periods || ['breakfast', 'lunch', 'dinner', 'late_night'],
        });
      });
      setDiningHallsData(hallsDataMap);

      setDiningHalls(hallSlugs);
      setClosestHallSlug(closestSlug);
      // Don't auto-select a hall - user must explicitly choose
    } catch (error) {
      console.error('Error loading dining halls:', error);
      // Fallback to all known halls
      setDiningHalls([
        'bruin-plate', 'de-neve-dining', 'epicuria-at-covel',
        'spice-kitchen', 'rendezvous', 'the-study-at-hedrick',
        'the-drey', 'bruin-cafe', 'cafe-1919'
      ]);
    }
  };
  loadDiningHalls();
  }, [])
);

  // Determine meal type based on time of day
  const getMealType = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 17) return 'lunch';
    if (hour >= 17 && hour < 22) return 'dinner';
    return 'snack';
  };

  const handleLogAll = () => {
    if (!recommendedMeal) {
      console.warn('[Home] handleLogAll: No recommended meal available');
      return;
    }

    if (!recommendedMeal.mealItems || recommendedMeal.mealItems.length === 0) {
      console.warn('[Home] handleLogAll: Meal has no items');
      Alert.alert('No Items', 'This meal has no items to log.');
      return;
    }

    haptics.success();

    const mealType = getMealType();
    const itemCount = recommendedMeal.mealItems.length;
    let loggedCount = 0;
    let totalCaloriesLogged = 0;

    // Add each item as a separate meal entry
    // Use per-item nutrition if available, otherwise fall back to averaged
    recommendedMeal.mealItems.forEach((item) => {
      try {
        const itemCalories = item.calories ?? Math.round(recommendedMeal.calories / itemCount);
        const itemProtein = item.protein ?? Math.round(recommendedMeal.protein / itemCount);
        const itemCarbs = item.carbs ?? Math.round(recommendedMeal.carbs / itemCount);
        const itemFat = item.fat ?? Math.round(recommendedMeal.fat / itemCount);

        // Validate nutrition values are reasonable
        if (itemCalories < 0 || itemProtein < 0 || itemCarbs < 0 || itemFat < 0) {
          console.warn('[Home] handleLogAll: Invalid nutrition for item:', item.name);
          return;
        }

        addMeal({
          name: item.name,
          mealType: mealType,
          calories: itemCalories,
          protein: itemProtein,
          carbs: itemCarbs,
          fats: itemFat,
          quantity: 1,
        });

        loggedCount++;
        totalCaloriesLogged += itemCalories;
      } catch (error) {
        console.error('[Home] handleLogAll: Error logging item:', item.name, error);
      }
    });

    // Log summary for debugging
    console.log(`[Home] handleLogAll: Logged ${loggedCount}/${itemCount} items, ${totalCaloriesLogged} total calories`);

    // Show feedback if some items failed
    if (loggedCount < itemCount) {
      Alert.alert(
        'Partial Log',
        `Logged ${loggedCount} of ${itemCount} items. Some items could not be logged.`
      );
    }
    // Otherwise, confirmation is handled by progress ring animation
  };

  const handleSwipeLeft = () => {
    handleLogAll();
  };

  const handleSwipeRight = () => {
    haptics.medium();
    router.push('/manual-log');
  };

  const handleRefresh = () => {
    haptics.medium();
    // Force regeneration by updating the key
    const generationKey = `${selectedHallMode}-${selectedHallSlug || 'none'}-${selectedMealPeriod}`;
    lastGenerationKey.current = generationKey + '-refresh';

    // Extract recipe IDs from current meal to exclude them from the new recommendation
    const currentRecipeIds = recommendedMeal?.mealItems
      ?.map(item => item.recipe_id)
      .filter((id): id is string => id !== undefined) || [];

    handleGenerate(true, currentRecipeIds);
  };

  const handleRingPress = () => {
    router.push('/progress');
  };

  const handleRingLongPress = () => {
    haptics.heavy();
    // TODO: Open macro logging modal
    Alert.alert('Macro Logging', 'Macro logging feature coming soon');
  };

  return (
    <Screen safeBottom={false}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={true}
          onScroll={(event) => {
            scrollPositionRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="h2" weight="bold" style={styles.headerTitle}>
              Let&apos;s plan your next meal
            </Text>
            <Text variant="h3" weight="semibold" style={styles.greeting}>
              {greeting}
            </Text>
          </View>
        </View>

        {/* Daily Snapshot Card */}
        <Card
          variant="elevated"
          padding="lg"
          style={styles.snapshotCard}>
          <View style={styles.snapshotHeader}>
            <Text variant="h4" weight="semibold">
              Daily Snapshot
            </Text>
            <TouchableOpacity onPress={() => router.push('/progress')}>
              <Text variant="bodySmall" color="primary">
                View details →
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleRingPress}
            onLongPress={handleRingLongPress}
            activeOpacity={0.8}
            style={styles.ringContainer}>
            <MacroRing
              value={tracking.consumed.calories}
              max={tracking.targets.calories}
              size={180}
              strokeWidth={20}
              color={themeColors.calories}
              unit="kcal today"
            />
          </TouchableOpacity>

          <View style={styles.macroBreakdown}>
            <View style={styles.macroItem}>
              <Text
                variant="body"
                weight="semibold"
                style={{ color: themeColors.protein }}>
                {formatMacro(tracking.consumed.protein)} g
              </Text>
              <Text variant="caption" color="secondary">
                Protein
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text
                variant="body"
                weight="semibold"
                style={{ color: themeColors.carbs }}>
                {formatMacro(tracking.consumed.carbs)} g
              </Text>
              <Text variant="caption" color="secondary">
                Carbs
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text
                variant="body"
                weight="semibold"
                style={{ color: themeColors.fats }}>
                {formatMacro(tracking.consumed.fats)} g
              </Text>
              <Text variant="caption" color="secondary">
                Fat
              </Text>
            </View>
          </View>

          {/* Micronutrient Progress - HIDDEN FOR MVP: Will be re-enabled for premium subscription */}
          {/* 
          {(() => {
            // Filter to only show selected vitamins that have data
            const filteredNutrients = tracking.micronutrients.filter(
              nutrient => selectedVitamins.includes(nutrient.key) && nutrient.pct > 0
            );
            
            if (filteredNutrients.length === 0) return null;
            
            return (
              <View style={styles.micronutrientSection}>
                <View style={styles.micronutrientHeader}>
                  <Text variant="caption" color="secondary">
                    Vitamins & Minerals
                  </Text>
                </View>
                <View style={styles.micronutrientGrid}>
                  {filteredNutrients.slice(0, 4).map((nutrient) => (
                    <View key={nutrient.key} style={styles.micronutrientItem}>
                      <View style={styles.micronutrientProgress}>
                        <View
                          style={[
                            styles.micronutrientBar,
                            {
                              backgroundColor: themeColors.border,
                            },
                          ]}>
                          <View
                            style={[
                              styles.micronutrientBarFill,
                              {
                                backgroundColor: nutrient.pct >= 100 ? themeColors.success : themeColors.primary,
                                width: `${Math.min(100, nutrient.pct)}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text variant="caption" color="secondary" style={styles.micronutrientPct}>
                          {nutrient.pct}%
                        </Text>
                      </View>
                      <Text variant="caption" color="secondary" style={styles.micronutrientLabel}>
                        {nutrient.display_name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}
          */}
        </Card>

        {/* Dining Hall Selector */}
        {diningHalls.length > 0 ? (
          <View style={styles.diningHallSection}>
            <View style={styles.diningHallLabel}>
              <Text variant="h4" weight="semibold">
                Where are you eating?
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.diningHallChips, { paddingLeft: spacing.lg, paddingRight: spacing.lg }]}>
              {/* Regular hall chips - closest hall first with location icon */}
              {diningHalls.map((hallSlug) => {
                // Map slugs to proper display names
              const hallNameMap: Record<string, string> = {
                // Residential dining
                'bruin-plate': 'Bruin Plate',
                'b-plate': 'BPlate',
                'de-neve-dining': 'De Neve Dining',
                'de-neve': 'De Neve Dining',
                'epicuria-at-covel': 'Epicuria at Covel',
                'epicuria': 'Epicuria at Covel',
                'spice-kitchen': 'Feast',
                'feast': 'Feast',
                // Hill / campus restaurants
                'rendezvous': 'Rendezvous',
                'the-study-at-hedrick': 'The Study',
                'the-study': 'The Study',
                'the-drey': 'The Drey',
                'bruin-cafe': 'Bruin Cafe',
                'cafe-1919': 'Cafe 1919',
                'epicuria-at-ackerman': 'Epicuria at Ackerman',
                // ASUCLA / LuValle / satellite locations
                'anderson-cafe': 'Anderson Café',
                'bombshelter': 'Court of Sciences: Bombshelter',
                'luvalle-fusion': 'LuValle: Fusion',
                'luvalle-pizza': 'LuValle: All Rise Pizza',
                'luvalle-epazote': 'LuValle: Epazote',
                'luvalle-burger': 'LuValle: Burger Assemble',
                'luvalle-poke': 'LuValle: Northern Lights Poke',
                'luvalle-panini': 'LuValle: Northern Lights Panini',
                'synapse': 'Synapse',
              };
                // Clean up hall name - remove any "Closed" suffix that might be in the name
                let hallName = hallNameMap[hallSlug] || hallSlug
                  .split('-')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                // Remove "Closed" suffix if present
                hallName = hallName.replace(/\s*\(?Closed\)?/gi, '').trim();
                const isOpen = diningHallsData.get(hallSlug)?.isOpen ?? true;
                const chipStyle = !isOpen
                  ? { ...styles.diningHallChip, opacity: 0.6 }
                  : styles.diningHallChip;
                const isClosest = closestHallSlug === hallSlug;
                return (
                  <Chip
                    key={hallSlug}
                    label={hallName}
                    selected={selectedHallMode === 'specific' && selectedHallSlug === hallSlug}
                    onPress={() => {
                      haptics.light();
                      setSelectedHallMode('specific');
                      setSelectedHallSlug(hallSlug);
                      // Auto-generate will happen via useEffect
                    }}
                    style={chipStyle}
                    icon={isClosest ? (
                      <AppIcon type="location" size={16} color={themeColors.primary} />
                    ) : undefined}
                  />
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <ClosedHallCard
            onSwipeRight={() => {
              haptics.medium();
              router.push('/manual-log');
            }}
            style={styles.closedCard}
          />
        )}

        {/* Meal Period Selector - REMOVED: App automatically determines meal period based on time of day */}
        {/* The meal period is automatically set via getCurrentMealPeriod() and used by the API */}

        {/* Recommended Meal Card - show loading state or meal card */}
        {isGenerating && !recommendedMeal ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text variant="body" color="secondary" style={styles.loadingText}>
              Generating your meal...
            </Text>
          </View>
        ) : null}

        {/* Recommended Meal Card or Closed Message */}
        {recommendedMeal && recommendedMeal.isClosed && (
          <ClosedHallCard
            diningHallName={recommendedMeal.diningHall}
            onSwipeRight={() => {
              haptics.medium();
              router.push('/manual-log');
            }}
            style={styles.closedCard}
          />
        )}
        {recommendedMeal && !recommendedMeal.isClosed && (
          <MealCard
            diningHall={recommendedMeal.diningHall}
            mealItems={recommendedMeal.mealItems}
            calories={recommendedMeal.calories}
            protein={recommendedMeal.protein}
            carbs={recommendedMeal.carbs}
            fat={recommendedMeal.fat}
            onSelectItems={() => {
              haptics.medium();
              router.push({
                pathname: '/select-items',
                params: {
                  items: JSON.stringify(
                    recommendedMeal.mealItems.map((item) => ({
                      name: item.name,
                      amount: item.amount,
                      recipe_id: item.recipe_id,
                      // Use per-item nutrition if available, fallback to averaged
                      calories: item.calories ?? Math.round(recommendedMeal.calories / recommendedMeal.mealItems.length),
                      protein: item.protein ?? Math.round(recommendedMeal.protein / recommendedMeal.mealItems.length),
                      carbs: item.carbs ?? Math.round(recommendedMeal.carbs / recommendedMeal.mealItems.length),
                      fat: item.fat ?? Math.round(recommendedMeal.fat / recommendedMeal.mealItems.length),
                    }))
                  ),
                },
              });
            }}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onRefresh={handleRefresh}
            onLike={() => {
              if (recommendedMeal) {
                const mealId = `${recommendedMeal.diningHall}-${recommendedMeal.calories}`;
                setLikedMeals((prev) => {
                  const next = new Set(prev);
                  if (next.has(mealId)) {
                    next.delete(mealId);
                  } else {
                    next.add(mealId);
                  }
                  return next;
                });
              }
            }}
            isLiked={recommendedMeal ? likedMeals.has(`${recommendedMeal.diningHall}-${recommendedMeal.calories}`) : false}
          />
        )}

        {/* Craving Button - below meal card (only when not closed) */}
        {recommendedMeal && !recommendedMeal.isClosed && (
          <View style={styles.cravingButtonSection}>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => {
                haptics.light();
                setShowCravingModal(true);
              }}>
              Craving something specific?
            </Button>
          </View>
        )}

        {/* Craving Modal */}
        <Modal
          visible={showCravingModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCravingModal(false)}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowCravingModal(false)}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
                <ScrollView
                  style={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <Text variant="h3" weight="semibold">
                      What are you craving?
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        haptics.light();
                        setShowCravingModal(false);
                      }}
                      style={styles.modalCloseButton}>
                      <Text variant="h4" color="secondary">✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modalMoodChips}>
                    {moodSuggestions.map((suggestion) => (
                      <Chip
                        key={suggestion}
                        label={suggestion}
                        selected={moodText.includes(suggestion)}
                        onPress={() => handleMoodChipTap(suggestion)}
                        style={styles.moodChip}
                      />
                    ))}
                  </ScrollView>

                  <View style={styles.modalInputContainer}>
                    <TextInput
                      style={[
                        styles.moodInput,
                        {
                          backgroundColor: themeColors.background,
                          color: themeColors.text,
                          borderColor: themeColors.border,
                        }
                      ]}
                      placeholder="What are you craving? (optional)"
                      placeholderTextColor={themeColors.textTertiary}
                      value={moodText}
                      onChangeText={setMoodText}
                      multiline={false}
                    />
                    {moodText.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                          haptics.light();
                          setMoodText('');
                        }}>
                        <Text variant="bodySmall" color="secondary">Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.modalActions}>
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      onPress={() => {
                        haptics.light();
                        setShowCravingModal(false);
                      }}
                      style={styles.modalCancelButton}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onPress={async () => {
                        haptics.success();
                        setShowCravingModal(false);
                        // Regenerate with new mood - update the generation key to force regeneration
                        const generationKey = `${selectedHallMode}-${selectedHallSlug || 'none'}-${selectedMealPeriod}`;
                        lastGenerationKey.current = generationKey + '-mood-updated';
                        await handleGenerate(true);
                      }}
                      style={styles.modalApplyButton}>
                      Apply
                    </Button>
                  </View>
                </ScrollView>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl, // Extra padding for card shadows and tab bar clearance
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    marginBottom: spacing.xs,
  },
  greeting: {
    opacity: 0.8,
  },
  diningHallSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  diningHallLabel: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  diningHallChips: {
    gap: spacing.sm,
  },
  diningHallChip: {
    marginRight: spacing.sm,
  },
  checklistIcon: {
    fontSize: 24,
    color: '#4FC3F7',
  },
  snapshotCard: {
    marginBottom: spacing.lg,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  macroBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  macroItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  // Micronutrient progress styles
  micronutrientSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  micronutrientHeader: {
    marginBottom: spacing.sm,
  },
  micronutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  micronutrientItem: {
    flex: 1,
    minWidth: '45%',
  },
  micronutrientProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  micronutrientBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  micronutrientBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  micronutrientPct: {
    fontSize: 10,
    minWidth: 28,
    textAlign: 'right',
  },
  micronutrientLabel: {
    fontSize: 11,
  },
  actionCard: {
    marginBottom: spacing.md,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionIcon: {
    fontSize: 32,
  },
  actionTextContainer: {
    flex: 1,
  },
  arrowIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  closedCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  closedTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  closedMessage: {
    textAlign: 'center',
  },
  closedMessageCard: {
    marginBottom: spacing.md,
  },
  closedMessageText: {
    textAlign: 'center',
  },
  // Meal period section styles
  mealPeriodSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  mealPeriodChips: {
    gap: spacing.sm,
  },
  mealPeriodChip: {
    marginRight: spacing.sm,
  },
  // Mood section styles
  moodSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  moodChips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  moodChip: {
    marginRight: spacing.sm,
  },
  moodInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  moodInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    minHeight: 44,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // Generate section styles
  generateSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  // Loading state
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  // Craving button section
  cravingButtonSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '60%',
    marginBottom: 0,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalCloseButton: {
    padding: spacing.sm,
  },
  modalMoodChips: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalApplyButton: {
    flex: 1,
  },
});
