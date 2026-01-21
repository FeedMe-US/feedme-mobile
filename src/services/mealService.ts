/**
 * Meal Service
 * Handles dining location and menu data from the backend API
 */

import { apiClient } from './api';
import { MealType } from '../store/DailyTrackingContext';

// Meal period type for API requests
export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'late_night';

// Types matching backend schemas
export interface TimeRange {
  open: string;
  close: string;
}

export interface LocationHours {
  breakfast?: TimeRange;
  lunch?: TimeRange;
  dinner?: TimeRange;
  late_night?: TimeRange;
}

export interface DiningHall {
  id: number;
  name: string;
  slug: string;
  type?: string;
  is_residential?: boolean;
  campus_area?: string;
  is_open_now?: boolean;
  current_meal?: string;
  hours_today?: LocationHours;
  // New fields for explicit recommendation generation
  next_meal?: string;
  next_meal_time?: string;
  available_periods?: string[];
  is_all_day?: boolean;
  area_type?: 'hill' | 'campus' | null;
  // Legacy fields for compatibility
  latitude?: number;
  longitude?: number;
  isPreferred?: boolean;
}

export interface MenuItem {
  recipe_id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  tags: string[];
  allergens: string[];
  // Extended nutrition
  serving_size?: string | null;
  fiber_g?: number | null;
  sodium_mg?: number | null;
  sugar_g?: number | null;
  saturated_fat_g?: number | null;
  trans_fat_g?: number | null;
  cholesterol_mg?: number | null;
  added_sugars_g?: number | null;
  // Micronutrients
  calcium_mg?: number | null;
  iron_mg?: number | null;
  potassium_mg?: number | null;
  vitamin_d_mcg?: number | null;
  vitamin_a_mcg?: number | null;
  vitamin_b6_mg?: number | null;
  vitamin_b12_mcg?: number | null;
  vitamin_c_mg?: number | null;
  // Ingredients
  ingredients?: string | null;
  // BYO flag
  is_byo_item?: boolean;
}

// BYO (Build-Your-Own) types
export interface BYOComponent {
  recipe_id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_default: boolean;
  display_order: number;
}

export interface BYOCategory {
  category: string;
  display_name: string;
  min_selections: number;
  max_selections: number | null;
  components: BYOComponent[];
}

export interface BYOComponentsResponse {
  parent_recipe_id: string;
  parent_name: string;
  categories: BYOCategory[];
  default_build: {
    component_ids: string[];
    totals: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
  } | null;
  is_byo_item: boolean;
}

export interface BYONutritionResponse {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MenuSection {
  name: string;
  items: MenuItem[];
}

export interface MealMenu {
  sections: MenuSection[];
}

export interface MenuResponse {
  location: DiningHall;
  date: string;
  meals: Record<string, MealMenu>;
}

export interface MealItem {
  name: string;
  amount: string;
  icon?: string;
  recipe_id?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealRecommendation {
  diningHall: string;
  mealItems: MealItem[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType?: MealType;
}

// API response types for /recommend endpoint
interface PlateItemResponse {
  recipe_id: string;
  name: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface PlateResponse {
  items: PlateItemResponse[];
  totals: MacroTotals;
  fit_score: number;
  preference_score: number;
  engine: 'ortools' | 'rag';
  fallback_used: boolean;
}

interface LocationBrief {
  id: number;
  name: string;
}

interface RecommendResponse {
  plate: PlateResponse;
  targets: MacroTotals;
  location: LocationBrief;
  meal_period: string;
  date: string;
}

// Fallback data for offline scenarios (IDs match database)
const FALLBACK_DINING_HALLS: DiningHall[] = [
  { id: 29, name: 'Bruin Plate', slug: 'bruin-plate', type: 'residential', is_residential: true, campus_area: 'Hill', is_open_now: false, latitude: 34.0689, longitude: -118.4452 },
  { id: 28, name: 'De Neve Dining', slug: 'de-neve-dining', type: 'residential', is_residential: true, campus_area: 'Hill', is_open_now: false, latitude: 34.0705, longitude: -118.4468 },
  { id: 31, name: 'Epicuria at Covel', slug: 'epicuria-at-covel', type: 'residential', is_residential: true, campus_area: 'Hill', is_open_now: false, latitude: 34.0680, longitude: -118.4455 },
  { id: 30, name: 'Feast at Rieber', slug: 'spice-kitchen', type: 'boutique', is_residential: false, campus_area: 'Hill', is_open_now: false, latitude: 34.0695, longitude: -118.4445 },
  { id: 39, name: 'Rendezvous', slug: 'rendezvous', type: 'boutique', is_residential: false, campus_area: 'Hill', is_open_now: false, latitude: 34.0710, longitude: -118.4470 },
  { id: 37, name: 'The Study at Hedrick', slug: 'the-study-at-hedrick', type: 'boutique', is_residential: false, campus_area: 'Hill', is_open_now: false, latitude: 34.0690, longitude: -118.4450 },
  { id: 38, name: 'The Drey', slug: 'the-drey', type: 'boutique', is_residential: false, campus_area: 'North', is_open_now: false, latitude: 34.0700, longitude: -118.4460 },
  { id: 35, name: 'Bruin Bowl', slug: 'bruin-bowl', type: 'boutique', is_residential: false, campus_area: 'Hill', is_open_now: false, latitude: 34.0688, longitude: -118.4448 },
  { id: 34, name: 'Bruin Cafe', slug: 'bruin-cafe', type: 'boutique', is_residential: false, campus_area: 'Hill', is_open_now: false, latitude: 34.0692, longitude: -118.4455 },
  { id: 36, name: 'Cafe 1919', slug: 'cafe-1919', type: 'boutique', is_residential: false, campus_area: 'Hill', is_open_now: false, latitude: 34.0685, longitude: -118.4460 },
  { id: 41, name: 'Epicuria at Ackerman', slug: 'epicuria-at-ackerman', type: 'boutique', is_residential: false, campus_area: 'Central', is_open_now: false, latitude: 34.0705, longitude: -118.4430 },
];

// Fallback meal recommendations for offline/error scenarios
const FALLBACK_MEALS: Record<string, MealRecommendation> = {
  'bruin-plate': {
    diningHall: 'Bruin Plate',
    mealItems: [
      { name: 'Grilled Salmon', amount: '6 oz' },
      { name: 'Quinoa Pilaf', amount: '1 cup' },
      { name: 'Roasted Vegetables', amount: '1 cup' },
    ],
    calories: 650,
    protein: 45,
    carbs: 55,
    fat: 22,
  },
  'de-neve-dining': {
    diningHall: 'De Neve Dining',
    mealItems: [
      { name: 'Chicken Parmesan', amount: '8 oz' },
      { name: 'Pasta Marinara', amount: '1.5 cups' },
      { name: 'Caesar Salad', amount: '1 cup' },
    ],
    calories: 780,
    protein: 42,
    carbs: 72,
    fat: 28,
  },
  'epicuria-at-covel': {
    diningHall: 'Epicuria at Covel',
    mealItems: [
      { name: 'Mediterranean Bowl', amount: '1 bowl' },
      { name: 'Hummus & Pita', amount: '1 serving' },
    ],
    calories: 620,
    protein: 28,
    carbs: 68,
    fat: 24,
  },
};

// Service status tracking
interface ServiceStatus {
  isAvailable: boolean;
  lastError: string | null;
  lastFetch: number | null;
}

let serviceStatus: ServiceStatus = {
  isAvailable: true,
  lastError: null,
  lastFetch: null,
};

// Cache for locations
let cachedLocations: DiningHall[] | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class MealService {
  /**
   * Get all dining halls from the API
   */
  async getDiningHalls(): Promise<DiningHall[]> {
    // Ensure API client is initialized before making request
    await apiClient.waitForInit();

    // Check cache first
    if (cachedLocations && serviceStatus.lastFetch) {
      const age = Date.now() - serviceStatus.lastFetch;
      if (age < CACHE_DURATION) {
        console.log('[MealService] Using cached locations:', cachedLocations.length);
        return cachedLocations;
      }
    }

    console.log('[MealService] Fetching dining halls from API...');
    const response = await apiClient.get<{ locations: DiningHall[] }>('/menu/locations');
    console.log('[MealService] Response:', response.status, response.error ? `error: ${response.error}` : 'ok');

    if (response.error) {
      console.error('[MealService] API error, using fallback');
      serviceStatus.lastError = response.error;
      serviceStatus.isAvailable = false;
      // Return cached or fallback data
      const fallback = cachedLocations || FALLBACK_DINING_HALLS;
      console.log('[MealService] Returning fallback:', fallback.length, 'locations');
      return fallback;
    }

    const locations = response.data?.locations || [];
    console.log('[MealService] Got', locations.length, 'locations from API');

    // Merge with fallback data to ensure coordinates are available
    const mergedLocations = locations.map(loc => {
      const fallback = FALLBACK_DINING_HALLS.find(f => f.slug === loc.slug || f.id === loc.id);
      return {
        ...loc,
        latitude: loc.latitude || fallback?.latitude,
        longitude: loc.longitude || fallback?.longitude,
      };
    });

    cachedLocations = mergedLocations;
    serviceStatus.isAvailable = true;
    serviceStatus.lastError = null;
    serviceStatus.lastFetch = Date.now();

    return mergedLocations;
  }

  /**
   * Get dining halls sorted by distance and preferences
   */
  async getDiningHallsSorted(
    userLat?: number,
    userLng?: number,
    preferredSlugs?: string[],
  ): Promise<DiningHall[]> {
    let halls = await this.getDiningHalls();

    // Sort by preferences first
    if (preferredSlugs && preferredSlugs.length > 0) {
      halls = [...halls].sort((a, b) => {
        const aPreferred = preferredSlugs.includes(a.slug);
        const bPreferred = preferredSlugs.includes(b.slug);
        if (aPreferred && !bPreferred) return -1;
        if (!aPreferred && bPreferred) return 1;
        return 0;
      });
    }

    // Then sort by distance if location provided
    if (userLat !== undefined && userLng !== undefined) {
      halls = [...halls].sort((a, b) => {
        const distA = this.getDistance(userLat, userLng, a.latitude || 0, a.longitude || 0);
        const distB = this.getDistance(userLat, userLng, b.latitude || 0, b.longitude || 0);
        return distA - distB;
      });
    }

    return halls;
  }

  /**
   * Get menu for a specific location and date
   */
  async getMenu(locationId: number, date: string): Promise<MenuResponse | null> {
    console.log(`[MealService] Fetching menu for location ${locationId} on ${date}...`);
    const response = await apiClient.get<MenuResponse>(`/menu/${locationId}/${date}`);
    console.log(`[MealService] Menu response:`, response.status, response.error ? `error: ${response.error}` : 'ok');

    if (response.error) {
      console.error(`[MealService] Menu fetch failed:`, response.error);
      serviceStatus.lastError = response.error;
      return null;
    }

    if (response.data) {
      const mealPeriods = Object.keys(response.data.meals || {});
      console.log(`[MealService] Menu has periods:`, mealPeriods);
    }

    return response.data || null;
  }

  /**
   * Get menu items for a specific meal period at a location
   */
  async getMealMenuItems(
    locationId: number,
    date: string,
    mealPeriod: string,
  ): Promise<MenuItem[]> {
    const menu = await this.getMenu(locationId, date);

    if (!menu || !menu.meals[mealPeriod]) {
      return [];
    }

    // Flatten all sections into a single list
    return menu.meals[mealPeriod].sections.flatMap(section => section.items);
  }

  /**
   * Get open dining halls
   */
  async getOpenDiningHalls(): Promise<DiningHall[]> {
    const halls = await this.getDiningHalls();
    return halls.filter(hall => hall.is_open_now);
  }

  /**
   * Find dining hall by slug
   */
  async getDiningHallBySlug(slug: string): Promise<DiningHall | null> {
    const halls = await this.getDiningHalls();
    return halls.find(hall => hall.slug === slug) || null;
  }

  /**
   * Find dining hall by ID
   */
  async getDiningHallById(id: number): Promise<DiningHall | null> {
    const halls = await this.getDiningHalls();
    return halls.find(hall => hall.id === id) || null;
  }

  /**
   * Get service status
   */
  getStatus(): ServiceStatus {
    return { ...serviceStatus };
  }

  /**
   * Clear cached data (useful for forcing refresh)
   */
  clearCache(): void {
    cachedLocations = null;
    serviceStatus.lastFetch = null;
  }

  /**
   * Get current meal period based on Pacific time (UCLA's timezone)
   */
  private getCurrentMealPeriod(): 'breakfast' | 'lunch' | 'dinner' {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      hour12: false,
    });
    const hour = parseInt(formatter.formatToParts(new Date()).find(p => p.type === 'hour')?.value || '12', 10);
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    return 'dinner'; // 4pm onwards (including late night hours)
  }

  /**
   * Get a recommended meal for a dining hall
   * Calls POST /recommend to get optimized plate from OR-Tools solver
   */
  async getRecommendedMeal(diningHallSlug: string): Promise<MealRecommendation> {
    console.log('[MealService] getRecommendedMeal called for:', diningHallSlug);

    // Ensure API client is initialized with auth token before making authenticated request
    await apiClient.waitForInit();

    // Check if user is authenticated - /recommend requires auth
    if (!apiClient.hasAuthToken()) {
      console.log('[MealService] No auth token available, using fallback');
      return this.getFallbackMeal(diningHallSlug);
    }

    // Look up the dining hall to get ID and name
    const hall = await this.getDiningHallBySlug(diningHallSlug);

    if (!hall) {
      console.log('[MealService] Hall not found for slug:', diningHallSlug, '- using fallback');
      return this.getFallbackMeal(diningHallSlug);
    }

    console.log('[MealService] Found hall:', hall.name, 'ID:', hall.id);
    const mealPeriod = this.getCurrentMealPeriod();
    console.log('[MealService] Current meal period:', mealPeriod);

    // Call the recommendation API
    console.log('[MealService] Calling POST /recommend with location_id:', hall.id, 'meal_period:', mealPeriod);
    const response = await apiClient.post<RecommendResponse>('/recommend', {
      location_id: hall.id,
      meal_period: mealPeriod,
    });

    console.log('[MealService] Response status:', response.status, 'error:', response.error);

    // Handle 204 No Content (no plate found) - this is a valid response, not an error
    if (response.status === 204) {
      console.log('[MealService] No plate available for this meal period (204), using fallback');
      return this.getFallbackMeal(diningHallSlug, hall.name);
    }

    // Handle actual errors
    if (response.error || !response.data) {
      console.error('[MealService] Recommendation API error:', response.error, 'code:', (response as any).errorCode);
      return this.getFallbackMeal(diningHallSlug, hall.name);
    }

    const plate = response.data.plate;
    console.log('[MealService] Got plate with', plate.items.length, 'items');

    // Log item details for debugging
    plate.items.forEach((item, idx) => {
      const isByo = this.isBYOItem({
        recipe_id: item.recipe_id,
        name: item.name,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        tags: [],
        allergens: []
      });
      if (isByo) {
        console.log(`[MealService] Item ${idx}: "${item.name}" is BYO, recipe_id: ${item.recipe_id}`);
      }
    });

    // Transform API response to MealRecommendation format
    // Preserve recipe_id and individual nutrition for BYO support
    return {
      diningHall: hall.name,
      mealItems: plate.items.map(item => ({
        name: item.name,
        amount: item.servings > 1 ? `${item.servings} servings` : '1 serving',
        recipe_id: item.recipe_id,
        calories: Math.round(item.calories),
        protein: Math.round(item.protein_g),
        carbs: Math.round(item.carbs_g),
        fat: Math.round(item.fat_g),
      })),
      calories: Math.round(plate.totals.calories),
      protein: Math.round(plate.totals.protein_g),
      carbs: Math.round(plate.totals.carbs_g),
      fat: Math.round(plate.totals.fat_g),
      mealType: mealPeriod,
    };
  }

  /**
   * Get a recommended meal with explicit options
   * Supports specific hall, "Any Hill" mode, or "Any Campus" mode
   */
  async getRecommendedMealWithOptions(
    hallSlug: string | null,
    mealPeriod: MealPeriod,
    options?: {
      mood?: string;
      mode?: 'specific' | 'hill' | 'campus';
      date?: string; // ISO date string (YYYY-MM-DD) for future menu recommendations
    }
  ): Promise<MealRecommendation> {
    console.log('[MealService] getRecommendedMealWithOptions called:', {
      hallSlug,
      mealPeriod,
      options
    });

    // Ensure API client is initialized with auth token
    await apiClient.waitForInit();

    // Check if user is authenticated - /recommend requires auth
    if (!apiClient.hasAuthToken()) {
      console.log('[MealService] No auth token available, using fallback');
      return this.getFallbackMeal(hallSlug || 'default');
    }

    // For "specific" mode, get the hall ID
    let locationId: number | null = null;
    let hallName: string | undefined;
    if (options?.mode === 'specific' && hallSlug) {
      const hall = await this.getDiningHallBySlug(hallSlug);
      if (hall) {
        locationId = hall.id;
        hallName = hall.name;
      }
    }

    // Determine area filter for "any hall" modes
    let area: 'hill' | 'campus' | undefined;
    if (options?.mode === 'hill') {
      area = 'hill';
    } else if (options?.mode === 'campus') {
      area = 'campus';
    }

    // Build request body
    const requestBody: {
      location_id?: number | null;
      meal_period: MealPeriod;
      mood?: string;
      area?: 'hill' | 'campus';
      date?: string;
    } = {
      meal_period: mealPeriod,
    };

    if (locationId !== null) {
      requestBody.location_id = locationId;
    }

    if (options?.mood) {
      requestBody.mood = options.mood;
    }

    if (area) {
      requestBody.area = area;
    }

    if (options?.date) {
      requestBody.date = options.date;
    }

    console.log('[MealService] Calling POST /recommend with:', requestBody);
    const response = await apiClient.post<RecommendResponse>('/recommend', requestBody);

    console.log('[MealService] Response status:', response.status, 'error:', response.error);

    // Handle 204 No Content (no plate found)
    if (response.status === 204) {
      console.log('[MealService] No plate available (204), using fallback');
      return this.getFallbackMeal(hallSlug || 'default', hallName);
    }

    // Handle actual errors
    if (response.error || !response.data) {
      console.error('[MealService] Recommendation API error:', response.error);
      return this.getFallbackMeal(hallSlug || 'default', hallName);
    }

    const plate = response.data.plate;
    const locationName = response.data.location?.name || hallName || 'Dining Hall';
    console.log('[MealService] Got plate with', plate.items.length, 'items from', locationName);

    // Convert MealPeriod to MealType (late_night -> snack)
    const mealTypeMap: Record<MealPeriod, MealType> = {
      breakfast: 'breakfast',
      lunch: 'lunch',
      dinner: 'dinner',
      late_night: 'snack',
    };

    // Transform API response to MealRecommendation format
    return {
      diningHall: locationName,
      mealItems: plate.items.map(item => ({
        name: item.name,
        amount: item.servings > 1 ? `${item.servings} servings` : '1 serving',
        recipe_id: item.recipe_id,
        calories: Math.round(item.calories),
        protein: Math.round(item.protein_g),
        carbs: Math.round(item.carbs_g),
        fat: Math.round(item.fat_g),
      })),
      calories: Math.round(plate.totals.calories),
      protein: Math.round(plate.totals.protein_g),
      carbs: Math.round(plate.totals.carbs_g),
      fat: Math.round(plate.totals.fat_g),
      mealType: mealTypeMap[mealPeriod],
    };
  }

  /**
   * Get fallback meal data when API is unavailable
   */
  private getFallbackMeal(slug: string, hallName?: string): MealRecommendation {
    // Check for exact match first
    if (FALLBACK_MEALS[slug]) {
      return { ...FALLBACK_MEALS[slug] };
    }

    // Try partial match (e.g., 'de-neve' matches 'de-neve-dining')
    const partialMatch = Object.keys(FALLBACK_MEALS).find(key =>
      key.includes(slug) || slug.includes(key)
    );
    if (partialMatch) {
      return { ...FALLBACK_MEALS[partialMatch] };
    }

    // Return generic fallback
    return {
      diningHall: hallName || 'Dining Hall',
      mealItems: [
        { name: 'Grilled Chicken', amount: '6 oz' },
        { name: 'Steamed Rice', amount: '1 cup' },
        { name: 'Mixed Vegetables', amount: '1 cup' },
      ],
      calories: 550,
      protein: 38,
      carbs: 48,
      fat: 16,
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ==================== BYO (Build-Your-Own) Methods ====================

  /**
   * Get available components for a BYO menu item
   */
  async getBYOComponents(recipeId: string): Promise<BYOComponentsResponse | null> {
    console.log(`[MealService] Fetching BYO components for recipe ${recipeId}...`);
    const response = await apiClient.get<BYOComponentsResponse>(`/menu/byo/${recipeId}/components`);

    if (response.error) {
      console.error('[MealService] BYO components fetch failed:', response.error);
      return null;
    }

    console.log(`[MealService] Got ${response.data?.categories?.length || 0} categories`);
    return response.data || null;
  }

  /**
   * Calculate nutrition for a custom BYO build
   */
  async calculateBYONutrition(componentIds: string[]): Promise<BYONutritionResponse | null> {
    console.log(`[MealService] Calculating BYO nutrition for ${componentIds.length} components...`);
    const response = await apiClient.post<BYONutritionResponse>('/menu/byo/calculate', {
      component_recipe_ids: componentIds,
    });

    if (response.error) {
      console.error('[MealService] BYO nutrition calculation failed:', response.error);
      return null;
    }

    return response.data || null;
  }

  /**
   * Check if a menu item is a BYO item based on is_byo_item flag or name pattern
   * @param item - The menu item to check
   * @returns true if the item is a BYO item
   */
  isBYOItem(item: MenuItem): boolean {
    // Check explicit flag first
    if (item.is_byo_item) return true;

    const name = item.name.toLowerCase();

    // Common BYO patterns in dining hall menus
    const patterns = [
      'build-your-own',
      'build your own',
      'craft your own',
      'create your own',
      'make your own',
      'custom bowl',
      'custom salad',
      'custom burrito',
      'custom wrap',
      'byo ',  // "BYO Salad", "BYO Bowl"
      ' byo',  // "Salad BYO"
    ];

    return patterns.some(pattern => name.includes(pattern));
  }
}

export const mealService = new MealService();
