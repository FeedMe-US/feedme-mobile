import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="goal" />
      <Stack.Screen name="sex" />
      <Stack.Screen name="age" />
      <Stack.Screen name="height" />
      <Stack.Screen name="weight" />
      <Stack.Screen name="goal-weight" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="meal-plan" />
      <Stack.Screen name="dining-locations" />
      <Stack.Screen name="dietary-requirements" />
      <Stack.Screen name="allergies" />
      <Stack.Screen name="ingredients-avoid" />
      <Stack.Screen name="meal-times" />
      <Stack.Screen name="mood-preferences" />
      <Stack.Screen name="diet-strictness" />
      {/* Reminders screen temporarily removed from flow - code kept in reminders.tsx */}
      {/* <Stack.Screen name="reminders" /> */}
      {/* Swipe seed screen removed from flow - code kept in swipe-seed.tsx */}
      {/* <Stack.Screen name="swipe-seed" /> */}
      {/* Meals per day screen removed from flow - code kept in meals-per-day.tsx */}
      {/* <Stack.Screen name="meals-per-day" /> */}
      <Stack.Screen name="complete" />
    </Stack>
  );
}

