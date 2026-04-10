/**
 * Canonical dining location list — single source of truth used by
 * onboarding, home page, and profile. Only official UCLA Dining locations.
 */

export type DiningLocationSlug =
  | 'de-neve-dining'
  | 'b-plate'
  | 'epicuria-at-covel'
  | 'spice-kitchen'
  | 'bruin-cafe'
  | 'cafe-1919'
  | 'rendezvous'
  | 'the-study-at-hedrick'
  | 'the-drey'
  | 'epicuria-at-ackerman'
  | 'northern-lights'
  | 'epazote'
  | 'burger-assembly'
  | 'fusion'
  | 'all-rise-pizza';

export interface DiningLocation {
  slug: DiningLocationSlug;
  name: string;
  id: number; // database location ID
}

/** All supported dining locations, ordered residential-first then campus. */
export const DINING_LOCATIONS: DiningLocation[] = [
  // Residential dining
  { slug: 'de-neve-dining', name: 'De Neve Dining', id: 28 },
  { slug: 'b-plate', name: 'Bruin Plate', id: 29 },
  { slug: 'epicuria-at-covel', name: 'Epicuria at Covel', id: 31 },
  { slug: 'spice-kitchen', name: 'Feast at Rieber', id: 30 },
  // Hill / campus restaurants
  { slug: 'bruin-cafe', name: 'Bruin Cafe', id: 34 },
  { slug: 'cafe-1919', name: 'Cafe 1919', id: 36 },
  { slug: 'rendezvous', name: 'Rendezvous', id: 39 },
  { slug: 'the-study-at-hedrick', name: 'The Study at Hedrick', id: 37 },
  { slug: 'the-drey', name: 'The Drey', id: 38 },
  { slug: 'epicuria-at-ackerman', name: 'Epicuria at Ackerman', id: 41 },
  // ASUCLA campus restaurants
  { slug: 'northern-lights', name: 'Northern Lights', id: 100 },
  { slug: 'epazote', name: 'Epazote', id: 102 },
  { slug: 'burger-assembly', name: 'Burger Assembly', id: 103 },
  { slug: 'fusion', name: 'Fusion', id: 104 },
  { slug: 'all-rise-pizza', name: 'All Rise Pizza', id: 105 },
];

/** Slug → display name (includes legacy slug aliases). */
export const SLUG_TO_NAME: Record<string, string> = Object.fromEntries([
  ...DINING_LOCATIONS.map(l => [l.slug, l.name]),
  // Legacy slug aliases from older onboarding data
  ['de-neve', 'De Neve Dining'],
  ['bruin-plate', 'Bruin Plate'],
  ['epicuria', 'Epicuria at Covel'],
  ['feast', 'Feast at Rieber'],
  ['the-study', 'The Study at Hedrick'],
]);

/** Database ID → display name. */
export const ID_TO_NAME: Record<number, string> = Object.fromEntries(
  DINING_LOCATIONS.map(l => [l.id, l.name]),
);
