import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';

type MealType = 'breakfast' | 'lunch' | 'dinner';

interface MealTime {
  type: MealType;
  label: string;
  time: Date | null;
}

const getDefaultTime = (hours: number, minutes: number): Date => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const meals: MealTime[] = [
  { type: 'breakfast', label: 'Breakfast', time: null },
  { type: 'lunch', label: 'Lunch', time: getDefaultTime(12, 30) },
  { type: 'dinner', label: 'Dinner', time: null },
];

const formatTime = (date: Date | null): string => {
  if (!date) return '--:-- --';
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

export default function MealTimesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [mealTimes, setMealTimes] = useState<MealTime[]>(meals);
  const [editingMeal, setEditingMeal] = useState<MealType | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const handleMealPress = (mealType: MealType) => {
    const meal = mealTimes.find((m) => m.type === mealType);
    if (meal) {
      setEditingMeal(mealType);
      setTempTime(meal.time || new Date());
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setEditingMeal(null);
      if (selectedDate && editingMeal) {
        setMealTimes(
          mealTimes.map((meal) =>
            meal.type === editingMeal ? { ...meal, time: selectedDate } : meal
          )
        );
      }
    } else {
      if (selectedDate) {
        setTempTime(selectedDate);
      }
    }
  };

  const handleTimeSave = () => {
    if (editingMeal) {
      setMealTimes(
        mealTimes.map((meal) =>
          meal.type === editingMeal ? { ...meal, time: tempTime } : meal
        )
      );
    }
    setEditingMeal(null);
  };

  const handleContinue = async () => {
    const mealTimesData = {
      breakfast: mealTimes.find(m => m.type === 'breakfast')?.time ? formatTime(mealTimes.find(m => m.type === 'breakfast')?.time || null) : undefined,
      lunch: mealTimes.find(m => m.type === 'lunch')?.time ? formatTime(mealTimes.find(m => m.type === 'lunch')?.time || null) : undefined,
      dinner: mealTimes.find(m => m.type === 'dinner')?.time ? formatTime(mealTimes.find(m => m.type === 'dinner')?.time || null) : undefined,
    };
    await saveOnboardingData({ mealTimes: mealTimesData });
    router.push('/(onboarding)/complete');
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text variant="h1" weight="bold" style={styles.title}>
              When do you usually eat?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              We&apos;ll send you reminders at these times
            </Text>
          </View>

          {/* Meal Time Inputs */}
          <View style={styles.mealsContainer}>
            {mealTimes.map((meal) => (
              <TouchableOpacity
                key={meal.type}
                style={[
                  styles.mealCard,
                  { backgroundColor: themeColors.backgroundSecondary },
                ]}
                onPress={() => handleMealPress(meal.type)}
                activeOpacity={0.7}>
                <Text variant="h4" weight="bold" style={styles.mealLabel}>
                  {meal.label}
                </Text>
                <View style={[styles.timeInput, { backgroundColor: themeColors.background }]}>
                  <Text
                    variant="body"
                    style={{
                      color: meal.time ? themeColors.text : themeColors.textSecondary,
                    }}>
                    {formatTime(meal.time)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleContinue}>
          Continue
        </Button>
      </View>

      {/* iOS Time Picker - Opaque and Centered */}
      {Platform.OS === 'ios' && editingMeal && (
        <View style={styles.iosPickerOverlay}>
          <View style={[styles.iosPickerContainer, { backgroundColor: themeColors.background }]}>
            <View style={[styles.iosPickerHeader, { backgroundColor: themeColors.backgroundSecondary }]}>
              <TouchableOpacity onPress={() => setEditingMeal(null)}>
                <Text variant="body" weight="semibold" style={{ color: themeColors.primary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text variant="h4" weight="bold">
                Set Time
              </Text>
              <TouchableOpacity onPress={handleTimeSave}>
                <Text variant="body" weight="semibold" style={{ color: themeColors.primary }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor={themeColors.text}
                style={styles.picker}
              />
            </View>
          </View>
        </View>
      )}

      {/* Android Time Picker */}
      {Platform.OS === 'android' && editingMeal && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.xxl + spacing.sm,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  mealsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  mealCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  mealLabel: {
    flex: 1,
  },
  timeInput: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
  iosPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    width: '100%',
    alignItems: 'center',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  pickerWrapper: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: '100%',
  },
  picker: {
    width: '100%',
    height: 200,
  },
});
