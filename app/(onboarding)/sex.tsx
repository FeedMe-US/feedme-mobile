import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { saveOnboardingData } from '@/src/lib/onboardingData';

type SexOption = 'male' | 'female';

export default function SexScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedSex, setSelectedSex] = useState<SexOption | null>(null);

  const handleContinue = async () => {
    if (selectedSex) {
      await saveOnboardingData({ sex: selectedSex });
      router.push('/(onboarding)/age');
    }
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
              Biological Sex
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Required for accurate calorie calculation
            </Text>
          </View>

          {/* Sex Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: themeColors.backgroundSecondary,
                  borderColor: selectedSex === 'male'
                    ? themeColors.primary
                    : themeColors.border,
                  borderWidth: selectedSex === 'male' ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedSex('male')}
              activeOpacity={0.7}>
              <MaterialIcons
                name="person"
                size={48}
                color={selectedSex === 'male' ? themeColors.primary : themeColors.text}
                style={styles.icon}
              />
              <Text variant="h4" weight="bold" style={styles.optionTitle}>
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: themeColors.backgroundSecondary,
                  borderColor: selectedSex === 'female'
                    ? themeColors.primary
                    : themeColors.border,
                  borderWidth: selectedSex === 'female' ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedSex('female')}
              activeOpacity={0.7}>
              <MaterialIcons
                name="person"
                size={48}
                color={selectedSex === 'female' ? themeColors.primary : themeColors.text}
                style={styles.icon}
              />
              <Text variant="h4" weight="bold" style={styles.optionTitle}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedSex}
          onPress={handleContinue}>
          Continue
        </Button>
      </View>
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
    top: spacing.xl,
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
    marginTop: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionCard: {
    flex: 1,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  icon: {
    marginBottom: spacing.md,
  },
  optionTitle: {
    marginTop: spacing.sm,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
