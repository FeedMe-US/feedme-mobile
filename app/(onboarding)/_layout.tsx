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
      <Stack.Screen name="meals-per-day" />
      <Stack.Screen name="dietary-requirements" />
      <Stack.Screen name="allergies" />
      <Stack.Screen name="ingredients-avoid" />
      <Stack.Screen name="meal-times" />
      {/* Reminders screen temporarily removed from flow - code kept in reminders.tsx */}
      {/* <Stack.Screen name="reminders" /> */}
      <Stack.Screen name="swipe-seed" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}

