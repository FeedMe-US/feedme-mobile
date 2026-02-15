import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      {/* Onboarding flow order (12 steps): */}
      {/* 1. What's your current goal? */}
      <Stack.Screen name="goal" />
      {/* 2. Tastes & Preferences */}
      <Stack.Screen name="mood-preferences" />
      {/* 3. Dietary Requirements */}
      <Stack.Screen name="dietary-requirements" />
      {/* 4. Any allergies? */}
      <Stack.Screen name="allergies" />
      {/* 5. Ingredients you avoid? */}
      <Stack.Screen name="ingredients-avoid" />
      {/* 6. Where do you usually eat? */}
      <Stack.Screen name="dining-locations" />
      {/* 7. Biological Sex */}
      <Stack.Screen name="sex" />
      {/* 8. How old are you? */}
      <Stack.Screen name="age" />
      {/* 9. How tall are you? */}
      <Stack.Screen name="height" />
      {/* 10. What is your weight? */}
      <Stack.Screen name="weight" />
      {/* 11. How active are you? */}
      <Stack.Screen name="activity" />
      {/* 12. Diet strictness */}
      <Stack.Screen name="diet-strictness" />
      {/* Final: Complete onboarding */}
      <Stack.Screen name="complete" />

      {/* Screens removed from flow but kept for reference: */}
      {/* <Stack.Screen name="meal-plan" /> */}
      {/* <Stack.Screen name="meal-times" /> */}
      {/* <Stack.Screen name="reminders" /> */}
      {/* <Stack.Screen name="swipe-seed" /> */}
      {/* <Stack.Screen name="meals-per-day" /> */}
    </Stack>
  );
}

