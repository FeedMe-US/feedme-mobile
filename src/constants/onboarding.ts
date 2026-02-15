/**
 * Onboarding flow configuration
 * Single source of truth for step order and navigation
 */

export const ONBOARDING_STEPS = [
  { route: 'goal', title: "What's your current goal?" },
  { route: 'mood-preferences', title: 'Tastes & Preferences' },
  { route: 'dietary-requirements', title: 'Dietary Requirements' },
  { route: 'allergies', title: 'Any allergies?' },
  { route: 'ingredients-avoid', title: 'Ingredients you avoid?' },
  { route: 'dining-locations', title: 'Where do you usually eat?' },
  { route: 'sex', title: 'Biological Sex' },
  { route: 'age', title: 'How old are you?' },
  { route: 'height', title: 'How tall are you?' },
  { route: 'weight', title: 'What is your weight?' },
  { route: 'activity', title: 'How active are you?' },
  { route: 'diet-strictness', title: 'Diet strictness' },
] as const;

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

/**
 * Get the step number (0-indexed) for a given route
 */
export function getStepIndex(route: string): number {
  const index = ONBOARDING_STEPS.findIndex((step) => step.route === route);
  return index >= 0 ? index : 0;
}

/**
 * Get the next route in the onboarding flow
 */
export function getNextRoute(currentRoute: string): string | null {
  const currentIndex = getStepIndex(currentRoute);
  if (currentIndex >= 0 && currentIndex < ONBOARDING_STEPS.length - 1) {
    return ONBOARDING_STEPS[currentIndex + 1].route;
  }
  return 'complete'; // Last step goes to complete
}

/**
 * Get the full path for an onboarding route
 */
export function getOnboardingPath(route: string): string {
  return `/(onboarding)/${route}`;
}
