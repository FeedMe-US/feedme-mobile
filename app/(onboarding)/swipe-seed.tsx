import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { haptics } from '@/src/utils/haptics';
import { formatCalories, formatMacro } from '@/src/utils/format';
import { fetchMealCardPool, pickMealCardsFromPool, MealCard } from '@/src/services/mealCards';
import { saveOnboardingData } from '@/src/lib/onboardingData';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.22;

// Comprehensive image mapping for accurate meal visuals
const MEAL_IMAGE_MAP: { keywords: string[]; url: string }[] = [
  // Salads
  { keywords: ['salad', 'caesar', 'garden', 'greens', 'lettuce', 'spinach', 'arugula'], url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' },
  
  // Pasta & Italian
  { keywords: ['pasta', 'penne', 'spaghetti', 'fettuccine', 'linguine', 'ravioli', 'lasagna', 'macaroni'], url: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg' },
  { keywords: ['pizza', 'margherita', 'pepperoni'], url: 'https://images.pexels.com/photos/2619967/pexels-photo-2619967.jpeg' },
  
  // Rice & Grains
  { keywords: ['rice', 'fried rice', 'risotto', 'paella', 'jasmine', 'basmati'], url: 'https://images.pexels.com/photos/1629790/pexels-photo-1629790.jpeg' },
  { keywords: ['bowl', 'grain bowl', 'quinoa', 'farro', 'bulgur'], url: 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg' },
  
  // Chicken & Poultry
  { keywords: ['chicken', 'poultry', 'grilled chicken', 'chicken breast', 'roast chicken', 'teriyaki chicken'], url: 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg' },
  { keywords: ['turkey', 'turkey breast'], url: 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg' },
  
  // Fish & Seafood
  { keywords: ['salmon', 'grilled salmon', 'baked salmon'], url: 'https://images.pexels.com/photos/725997/pexels-photo-725997.jpeg' },
  { keywords: ['fish', 'tuna', 'cod', 'tilapia', 'halibut', 'sea bass'], url: 'https://images.pexels.com/photos/725997/pexels-photo-725997.jpeg' },
  { keywords: ['shrimp', 'prawn', 'seafood', 'lobster', 'crab'], url: 'https://images.pexels.com/photos/725997/pexels-photo-725997.jpeg' },
  
  // Beef & Red Meat
  { keywords: ['beef', 'steak', 'burger', 'hamburger', 'meatball', 'roast beef'], url: 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg' },
  { keywords: ['pork', 'pork chop', 'bacon', 'ham'], url: 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg' },
  
  // Vegetarian & Vegan
  { keywords: ['tofu', 'tempeh', 'vegan', 'plant-based'], url: 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg' },
  { keywords: ['vegetable', 'veggie', 'roasted vegetables', 'stir fry'], url: 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg' },
  
  // Breakfast
  { keywords: ['oat', 'oatmeal', 'granola', 'cereal'], url: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg' },
  { keywords: ['pancake', 'waffle', 'french toast'], url: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg' },
  { keywords: ['egg', 'scrambled', 'omelet', 'omelette', 'frittata'], url: 'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg' },
  
  // Bread & Baked Goods
  { keywords: ['bread', 'toast', 'bagel', 'muffin', 'scone'], url: 'https://images.pexels.com/photos/1824353/pexels-photo-1824353.jpeg' },
  { keywords: ['quickbread', 'banana bread', 'zucchini bread'], url: 'https://images.pexels.com/photos/1824353/pexels-photo-1824353.jpeg' },
  
  // Sandwiches & Wraps
  { keywords: ['sandwich', 'wrap', 'panini', 'sub', 'hoagie'], url: 'https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg' },
  
  // Soups & Stews
  { keywords: ['soup', 'stew', 'chili', 'chowder', 'bisque'], url: 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg' },
  
  // Mexican & Latin
  { keywords: ['taco', 'burrito', 'quesadilla', 'enchilada', 'fajita'], url: 'https://images.pexels.com/photos/2087748/pexels-photo-2087748.jpeg' },
  { keywords: ['salsa', 'guacamole', 'nachos'], url: 'https://images.pexels.com/photos/2087748/pexels-photo-2087748.jpeg' },
  
  // Asian
  { keywords: ['sushi', 'poke', 'sashimi'], url: 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg' },
  { keywords: ['curry', 'thai', 'pad thai', 'noodle'], url: 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg' },
  { keywords: ['stir fry', 'lo mein', 'chow mein'], url: 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg' },
  
  // Desserts & Sweets
  { keywords: ['dessert', 'cake', 'cookie', 'brownie', 'pie', 'tart'], url: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg' },
  { keywords: ['ice cream', 'gelato', 'frozen yogurt'], url: 'https://images.pexels.com/photos/1625235/pexels-photo-1625235.jpeg' },
  
  // Sides & Snacks
  { keywords: ['fries', 'potato', 'mashed', 'roasted potato'], url: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg' },
  { keywords: ['chips', 'crisps'], url: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg' },
];

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg', // mixed plate
  'https://images.pexels.com/photos/5591719/pexels-photo-5591719.jpeg', // bowl
  'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg', // oats
  'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg', // veggie plate
];

function stableIndexFromName(name: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

function getMealImageUrl(name: string): string {
  const lower = name.toLowerCase();
  
  // Check each category for keyword matches (most specific first)
  for (const category of MEAL_IMAGE_MAP) {
    for (const keyword of category.keywords) {
      if (lower.includes(keyword)) {
        return category.url;
      }
    }
  }
  
  // Fallback to hash-based selection for unmatched items
  const idx = stableIndexFromName(name, FALLBACK_IMAGES.length);
  return FALLBACK_IMAGES[idx];
}

export default function SwipeSeedScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pool, setPool] = useState<MealCard[]>([]);
  const [cards, setCards] = useState<MealCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [dislikedIds, setDislikedIds] = useState<string[]>([]);

  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  const currentCard = useMemo(() => cards[currentIndex], [cards, currentIndex]);
  const remaining = useMemo(() => Math.max(0, cards.length - currentIndex), [cards, currentIndex]);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const poolData = await fetchMealCardPool(50);
      if (!poolData.length) {
        setError('We could not load sample meals right now. Please try again.');
        setPool([]);
        setCards([]);
        setCurrentIndex(0);
        return;
      }
      const selection = pickMealCardsFromPool(poolData, 5);
      if (selection.length < 5) {
        setError('Not enough meals matched your preferences. Please try again.');
        setPool(poolData);
        setCards(selection);
        setCurrentIndex(0);
        return;
      }
      setPool(poolData);
      setCards(selection);
      setCurrentIndex(0);
      setLikedIds([]);
      setDislikedIds([]);
    } catch (e) {
      console.error('[SwipeSeed] Failed to load meal cards', e);
      setError('We had trouble loading meals. Please check your connection and try again.');
      setPool([]);
      setCards([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
      translateX.value = 0;
      rotateZ.value = 0;
    }
  };

  const completeOnboarding = async () => {
    try {
      await saveOnboardingData({
        likedMealIds: likedIds,
        dislikedMealIds: dislikedIds,
      });
    } catch (e) {
      console.error('[SwipeSeed] Failed to persist swipe preferences', e);
    } finally {
      router.replace('/(tabs)');
    }
  };

  const handleDecision = (direction: 'left' | 'right') => {
    if (!currentCard) return;

    if (direction === 'right') {
      setLikedIds((prev) => [...prev, currentCard.id]);
      haptics.success();
    } else {
      setDislikedIds((prev) => [...prev, currentCard.id]);
      haptics.light();
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= cards.length) {
      // All 5 swiped
      completeOnboarding();
    } else {
      setCurrentIndex(nextIndex);
      translateX.value = 0;
      rotateZ.value = 0;
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      rotateZ.value = (e.translationX / width) * 12;
    })
    .onEnd((e) => {
      const shouldLike = e.translationX > SWIPE_THRESHOLD;
      const shouldDislike = e.translationX < -SWIPE_THRESHOLD;

      if (shouldLike) {
        translateX.value = withTiming(width * 1.2, { duration: 200 }, () => {
          runOnJS(handleDecision)('right');
        });
        return;
      }
      if (shouldDislike) {
        translateX.value = withTiming(-width * 1.2, { duration: 200 }, () => {
          runOnJS(handleDecision)('left');
        });
        return;
      }

      translateX.value = withTiming(0, { duration: 180 });
      rotateZ.value = withTiming(0, { duration: 180 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: translateX.value },
        { rotateZ: `${rotateZ.value}deg` },
      ] as const,
    };
  });

  const likeBadgeStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.max(translateX.value / SWIPE_THRESHOLD, 0), 1);
    return {
      opacity: progress,
      transform: [{ scale: 0.9 + 0.2 * progress }],
    };
  });

  const dislikeBadgeStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.max(-translateX.value / SWIPE_THRESHOLD, 0), 1);
    return {
      opacity: progress,
      transform: [{ scale: 0.9 + 0.2 * progress }],
    };
  });

  const renderCard = () => {
    if (!currentCard) return null;

    const calories = currentCard.calories ?? 0;
    const protein = currentCard.protein ?? 0;
    const carbs = currentCard.carbs ?? 0;
    const fat = currentCard.fat ?? 0;
    const imageUrl = getMealImageUrl(currentCard.name);

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardWrapper, animatedStyle]}>
          <Animated.View style={[styles.badge, styles.badgeLike, likeBadgeStyle]}>
            <MaterialIcons name="check" size={28} color="#0f172a" />
          </Animated.View>
          <Animated.View style={[styles.badge, styles.badgeDislike, dislikeBadgeStyle]}>
            <MaterialIcons name="close" size={28} color="#0f172a" />
          </Animated.View>
          <Card variant="elevated" padding="lg" style={styles.card}>
            <View style={styles.header}>
              <Text variant="h4" weight="semibold" style={styles.title}>
                {currentCard.name}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {currentCard.locationLabel}
              </Text>
            </View>

            <Image
              source={{ uri: imageUrl }}
              style={styles.imagePlaceholder}
              contentFit="cover"
            />

            <View style={styles.macroSummary}>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text
                    variant="body"
                    weight="bold"
                    style={[styles.macroValue, { color: themeColors.text }]}>
                    {formatCalories(calories)}
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.macroLabel}>
                    cal
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text
                    variant="body"
                    weight="bold"
                    style={[styles.macroValue, { color: themeColors.protein }]}>
                    {formatMacro(protein)}g
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.macroLabel}>
                    protein
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text
                    variant="body"
                    weight="bold"
                    style={[styles.macroValue, { color: themeColors.carbs }]}>
                    {formatMacro(carbs)}g
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.macroLabel}>
                    carbs
                  </Text>
                </View>
                <View style={styles.macroItem}>
                  <Text
                    variant="body"
                    weight="bold"
                    style={[styles.macroValue, { color: themeColors.fats }]}>
                    {formatMacro(fat)}g
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.macroLabel}>
                    fat
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>
      </GestureDetector>
    );
  };

  const handleManualComplete = () => {
    // Escape hatch: if something goes wrong, allow user into app
    router.replace('/(tabs)');
  };

  const showContent = !loading && !error && currentCard;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <Text variant="h1" weight="bold" style={styles.heading}>
            Help us learn your taste
          </Text>
          <Text variant="body" color="secondary" style={styles.subheading}>
            Swipe right if you’d eat this, left if you wouldn’t. Just 5 cards.
          </Text>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text variant="body" color="secondary" style={styles.centerText}>
              Loading meals from campus…
            </Text>
          </View>
        )}

        {!!error && !loading && (
          <View style={styles.center}>
            <Text variant="body" color="secondary" style={styles.centerText}>
              {error}
            </Text>
            <View style={styles.retryButtons}>
              <Button variant="primary" size="md" onPress={loadCards}>
                Try again
              </Button>
              <Button variant="ghost" size="md" onPress={handleManualComplete}>
                Skip for now
              </Button>
            </View>
          </View>
        )}

        {showContent && (
          <View style={styles.cardArea}>
            {renderCard()}
          </View>
        )}

        {showContent && (
          <View style={styles.footer}>
            <Text variant="bodySmall" color="secondary">
              {remaining} card{remaining === 1 ? '' : 's'} left
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerArea: {
    marginBottom: spacing.lg,
  },
  heading: {
    marginBottom: spacing.sm,
  },
  subheading: {
    marginTop: spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '100%',
    position: 'relative',
  },
  card: {
    borderRadius: radius.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  macroSummary: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  badge: {
    position: 'absolute',
    top: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  badgeLike: {
    left: 24,
    backgroundColor: 'rgba(34,197,94,0.9)',
  },
  badgeDislike: {
    right: 24,
    backgroundColor: 'rgba(239,68,68,0.9)',
  },
});

