/**
 * Shared constants for allergen and disliked food options.
 * Used by both onboarding screens and profile settings.
 *
 * ALLERGEN IDs MUST match backend contract exactly:
 *   wheat, milk, eggs, fish, shellfish, tree_nuts, peanuts, soy, sesame
 * See: feedme-docs/architecture/BEHAVIORAL_CONTRACT.md §3.1
 */

export interface PreferenceOption {
  id: string;
  name: string;
}

/**
 * Allergen option with user-friendly label and synonyms for local search.
 * The `id` is the canonical backend key stored in `allergen_exclusions`.
 */
export interface AllergenOption {
  /** Backend contract ID — must match exactly */
  id: string;
  /** User-friendly display name */
  name: string;
  /** Synonyms for frontend-only search matching */
  synonyms: string[];
}

/**
 * Standard allergen options — FDA top 9 major food allergens.
 * IDs are the backend-contract values (stored in allergen_exclusions).
 */
export const ALLERGEN_OPTIONS: AllergenOption[] = [
  { id: 'peanuts', name: 'Peanuts', synonyms: ['peanut', 'peanut butter', 'groundnut'] },
  { id: 'tree_nuts', name: 'Tree Nuts', synonyms: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'nuts'] },
  { id: 'milk', name: 'Milk/Dairy', synonyms: ['dairy', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'whey', 'casein'] },
  { id: 'wheat', name: 'Wheat/Gluten', synonyms: ['gluten', 'bread', 'flour', 'pasta', 'cereal', 'couscous', 'semolina'] },
  { id: 'shellfish', name: 'Shellfish', synonyms: ['shrimp', 'crab', 'lobster', 'crawfish', 'prawn', 'clam', 'mussel', 'oyster', 'scallop'] },
  { id: 'soy', name: 'Soy', synonyms: ['soybean', 'soya', 'tofu', 'edamame', 'tempeh', 'miso'] },
  { id: 'eggs', name: 'Eggs', synonyms: ['egg', 'albumin', 'mayonnaise'] },
  { id: 'fish', name: 'Fish', synonyms: ['salmon', 'tuna', 'cod', 'tilapia', 'anchovy', 'bass', 'trout', 'halibut'] },
  { id: 'sesame', name: 'Sesame', synonyms: ['sesame seed', 'tahini', 'sesame oil', 'hummus'] },
];

/** Default disliked food options (shown when search query is empty) */
export const DISLIKED_FOOD_OPTIONS: PreferenceOption[] = [
  { id: 'mushrooms', name: 'Mushrooms' },
  { id: 'cilantro', name: 'Cilantro' },
  { id: 'olives', name: 'Olives' },
  { id: 'spicy-food', name: 'Spicy Food' },
  { id: 'mayonnaise', name: 'Mayonnaise' },
  { id: 'onions', name: 'Onions' },
  { id: 'pickles', name: 'Pickles' },
  { id: 'blue-cheese', name: 'Blue Cheese' },
  { id: 'anchovies', name: 'Anchovies' },
  { id: 'tomatoes', name: 'Tomatoes' },
];
