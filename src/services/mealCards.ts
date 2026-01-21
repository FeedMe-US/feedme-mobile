/**
 * Meal cards service for onboarding swipe-seed step
 *
 * READ-ONLY Supabase access:
 * - Uses anon key + RLS
 * - Only performs SELECT queries
 *
 * All logic here is frontend-only and safe to remove.
 */

import { supabase } from '@/src/lib/supabase';
import { getOnboardingData } from '@/src/lib/onboardingData';

// Shape of records coming from Supabase (be defensive: all fields optional)
interface MenuItemRow {
  id?: number;
  name?: string | null;
  recipe_id?: string | null;
  location_id?: number | null;
  tags?: string[] | null;
}

interface NutritionRow {
  recipe_id?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
}

interface AllergensRow {
  recipe_id?: string | null;
  contains?: Record<string, unknown> | null;
}

export interface MealCard {
  id: string;
  name: string;
  imageUrl?: string;
  locationLabel: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  allergens: string[];
  contains: string[];
}

export interface MealCardFilters {}

function normalizeStringArray(value: string[] | null | undefined): string[] {
  if (!value) return [];
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .map((v) => v.toLowerCase());
}

const MEAT_KEYS = ['beef', 'pork', 'chicken', 'turkey', 'lamb', 'meat', 'bacon', 'ham'];
const FISH_KEYS = ['fish', 'salmon', 'tuna', 'cod', 'tilapia'];
const SHELLFISH_KEYS = ['shellfish', 'shrimp', 'prawn', 'crab', 'lobster'];
const DAIRY_KEYS = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'ice_cream'];
const EGG_KEYS = ['egg', 'eggs'];
const GLUTEN_KEYS = ['gluten', 'wheat', 'barley', 'rye'];
const NUT_KEYS = ['peanut', 'tree_nut', 'almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio'];

// Mirror backend dietary restriction logic using tags
const DIETARY_TAGS: Record<string, string[]> = {
  vegetarian: ['vegetarian', 'vegan'],
  vegan: ['vegan'],
  'gluten-free': ['gluten-free'],
  halal: ['halal'],
  kosher: ['kosher'],
};

function checkDietaryByTags(tags: string[], restrictions: string[]): boolean {
  if (!restrictions.length) return true;
  const lowerTags = tags.map((t) => t.toLowerCase());

  for (const r of restrictions) {
    const required = DIETARY_TAGS[r.toLowerCase()];
    if (required && !required.some((t) => lowerTags.includes(t))) {
      return false;
    }
  }

  return true;
}

function matchesRestrictions(
  meal: {
    allergens: string[];
    contains: string[];
    tags: string[];
  },
  opts: {
    allergies: string[];
    ingredientsAvoid: string[];
    dietaryRequirements: string[];
  }
): boolean {
  const allergenSet = new Set(normalizeStringArray(meal.allergens));
  const containsSet = new Set(normalizeStringArray(meal.contains));

  const lowerAllergies = opts.allergies.map((a) => a.toLowerCase());
  const lowerAvoid = opts.ingredientsAvoid.map((a) => a.toLowerCase());
  const dietary = opts.dietaryRequirements.map((d) => d.toLowerCase());

  // Exclude if any allergy or ingredient-to-avoid appears in allergens or contains
  for (const a of lowerAllergies) {
    if (allergenSet.has(a) || containsSet.has(a)) {
      return false;
    }
  }
  for (const a of lowerAvoid) {
    if (allergenSet.has(a) || containsSet.has(a)) {
      return false;
    }
  }

  // Tag-based dietary checks (mirrors backend recommender)
  if (!checkDietaryByTags(meal.tags, dietary)) {
    return false;
  }

  return true;
}

// Lightweight mapping from location_id to human-readable label for swipe cards
const LOCATION_LABELS: Record<number, string> = {
  28: 'De Neve Dining',
  29: 'Bruin Plate',
  30: 'Feast at Rieber',
  31: 'Epicuria at Covel',
  34: 'Bruin Café',
  35: 'Bruin Bowl',
  36: 'Cafe 1919',
  37: 'The Study at Hedrick',
  38: 'The Drey',
  39: 'Rendezvous',
  41: 'Epicuria at Ackerman',
  100: 'Anderson Café',
  101: 'Bombshelter',
  102: 'LuValle Fusion',
  103: 'LuValle All Rise Pizza',
  104: 'LuValle Epazote',
  105: 'LuValle Burger Assemble',
  106: 'LuValle Northern Lights Poke',
  107: 'LuValle Northern Lights Panini',
  108: 'Synapse',
};

function toMealCard(
  menu: MenuItemRow,
  nutrition: NutritionRow | undefined,
  allergensFromDb: string[]
): MealCard | null {
  if (!menu.id || !menu.name) {
    return null;
  }

  const calories = nutrition?.calories ?? undefined;
  const protein = nutrition?.protein_g ?? undefined;
  const carbs = nutrition?.carbs_g ?? undefined;
  const fat = nutrition?.fat_g ?? undefined;

  const locationLabel =
    (menu.location_id && LOCATION_LABELS[menu.location_id]) || 'Dining hall';

  return {
    id: String(menu.id),
    name: menu.name,
    imageUrl: undefined, // No images in schema yet; placeholder handled at UI layer
    locationLabel,
    calories: calories ?? undefined,
    protein: protein ?? undefined,
    carbs: carbs ?? undefined,
    fat: fat ?? undefined,
    allergens: normalizeStringArray(allergensFromDb),
    contains: normalizeStringArray(allergensFromDb),
  };
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Fetch a pool of candidate meals and filter them client-side.
 * Returns up to `poolSize` meals that respect the user's onboarding restrictions.
 */
export async function fetchMealCardPool(poolSize = 50): Promise<MealCard[]> {
  if (!supabase) {
    console.warn('[MealCards] Supabase client not configured; returning empty pool');
    return [];
  }

  // Pull onboarding data to honor allergies / ingredients to avoid
  const onboarding = await getOnboardingData();
  const allergies = onboarding.allergies || [];
  const ingredientsAvoid = onboarding.ingredientsAvoid || [];
  const dietaryRequirements = onboarding.dietaryRequirements || [];

  // 1) Fetch menu items from expanded view (no user-specific filters for onboarding)
  const { data: menuData, error: menuError } = await supabase
    .from('menu_items_expanded')
    .select('id, name, recipe_id, location_id, tags')
    .limit(250);

  if (menuError) {
    console.error('[MealCards] Failed to fetch menu_items_expanded from Supabase:', menuError);
    return [];
  }

  const menuRows: MenuItemRow[] = Array.isArray(menuData) ? menuData : [];
  const recipeIds = Array.from(
    new Set(
      menuRows
        .map((m) => m.recipe_id)
        .filter((id): id is string => !!id)
    )
  );

  if (recipeIds.length === 0) {
    return [];
  }

  // 2) Fetch nutrition for those recipes
  const { data: nutritionData, error: nutritionError } = await supabase
    .from('nutrition')
    .select('recipe_id, calories, protein_g, carbs_g, fat_g')
    .in('recipe_id', recipeIds);

  if (nutritionError) {
    console.error('[MealCards] Failed to fetch nutrition from Supabase:', nutritionError);
    return [];
  }

  const nutritionRows: NutritionRow[] = Array.isArray(nutritionData) ? nutritionData : [];
  const nutritionByRecipe = new Map<string, NutritionRow>();
  for (const n of nutritionRows) {
    if (n.recipe_id) {
      nutritionByRecipe.set(n.recipe_id, n);
    }
  }

  // 3) Fetch allergens for those recipes
  const { data: allergensData, error: allergensError } = await supabase
    .from('allergens')
    .select('recipe_id, contains')
    .in('recipe_id', recipeIds);

  if (allergensError) {
    console.error('[MealCards] Failed to fetch allergens from Supabase:', allergensError);
    return [];
  }

  const allergensRows: AllergensRow[] = Array.isArray(allergensData) ? allergensData : [];
  const allergensByRecipe = new Map<string, string[]>();
  for (const a of allergensRows) {
    if (!a.recipe_id) continue;
    const containsObj = (a.contains || {}) as Record<string, unknown>;
    const keys = Object.keys(containsObj);
    allergensByRecipe.set(a.recipe_id, keys);
  }

  const mapped: MealCard[] = [];
  for (const menu of menuRows) {
    const recipeId = menu.recipe_id;
    if (!recipeId) continue;

    const nutrition = nutritionByRecipe.get(recipeId);
    if (!nutrition) continue;

    const allergens = allergensByRecipe.get(recipeId) || [];

    // Apply client-side restriction filtering
    if (
      !matchesRestrictions(
        {
          allergens,
          contains: allergens,
          tags: normalizeStringArray(menu.tags || []),
        },
        { allergies, ingredientsAvoid, dietaryRequirements }
      )
    ) {
      continue;
    }

    const meal = toMealCard(menu, nutrition, allergens);
    if (meal) {
      mapped.push(meal);
    }
  }

  if (mapped.length === 0) {
    return [];
  }

  shuffleInPlace(mapped);

  return mapped.slice(0, poolSize);
}

/**
 * Pick exactly `count` unique meals from a pre-fetched pool.
 * If there are fewer than `count` meals, returns all of them.
 */
export function pickMealCardsFromPool(pool: MealCard[], count = 5): MealCard[] {
  if (!pool.length) return [];
  const copy = [...pool];
  shuffleInPlace(copy);
  return copy.slice(0, count);
}

