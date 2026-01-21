import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';
import { saveOnboardingData } from '@/src/lib/onboardingData';

type DiningLocation =
  // Residential dining (legacy slugs preserved for compatibility)
  | 'de-neve'
  | 'de-neve-dining'
  | 'b-plate'
  | 'bruin-plate'
  | 'epicuria'
  | 'epicuria-at-covel'
  | 'feast'
  | 'spice-kitchen'
  // Hill / campus restaurants
  | 'rendezvous'
  | 'the-study'
  | 'the-study-at-hedrick'
  | 'the-drey'
  | 'bruin-bowl'
  | 'bruin-cafe'
  | 'cafe-1919'
  | 'epicuria-at-ackerman'
  // ASUCLA / LuValle / satellite locations
  | 'anderson-cafe'
  | 'luvalle-fusion'
  | 'luvalle-pizza'
  | 'luvalle-epazote'
  | 'luvalle-burger'
  | 'luvalle-poke'
  | 'luvalle-panini'
  | 'synapse';

const diningLocations: { id: DiningLocation; name: string }[] = [
  // Residential dining
  { id: 'de-neve-dining', name: 'De Neve Dining' },
  { id: 'b-plate', name: 'BPlate' },
  { id: 'epicuria-at-covel', name: 'Epicuria at Covel' },
  { id: 'spice-kitchen', name: 'Feast' },
  // Hill / campus restaurants
  { id: 'rendezvous', name: 'Rendezvous' },
  { id: 'the-study-at-hedrick', name: 'The Study' },
  { id: 'the-drey', name: 'The Drey' },
  { id: 'bruin-bowl', name: 'Bruin Bowl' },
  { id: 'bruin-cafe', name: 'Bruin Cafe' },
  { id: 'cafe-1919', name: 'Cafe 1919' },
  { id: 'epicuria-at-ackerman', name: 'Epicuria at Ackerman' },
  // ASUCLA / LuValle / satellite locations
  { id: 'anderson-cafe', name: 'Anderson Café' },
  { id: 'luvalle-fusion', name: 'LuValle: Fusion' },
  { id: 'luvalle-pizza', name: 'LuValle: All Rise Pizza' },
  { id: 'luvalle-epazote', name: 'LuValle: Epazote' },
  { id: 'luvalle-burger', name: 'LuValle: Burger Assemble' },
  { id: 'luvalle-poke', name: 'LuValle: Northern Lights Poke' },
  { id: 'luvalle-panini', name: 'LuValle: Northern Lights Panini' },
  { id: 'synapse', name: 'Synapse' },
];

export default function DiningLocationsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [selectedLocations, setSelectedLocations] = useState<Set<DiningLocation>>(new Set());

  const handleToggleLocation = (locationId: DiningLocation) => {
    const newSelection = new Set(selectedLocations);
    if (newSelection.has(locationId)) {
      newSelection.delete(locationId);
    } else {
      newSelection.add(locationId);
    }
    setSelectedLocations(newSelection);
  };

  const handleContinue = async () => {
    if (selectedLocations.size > 0) {
      const locationSlugs = Array.from(selectedLocations);
      await saveOnboardingData({ preferredDiningLocations: locationSlugs });
      router.push('/(onboarding)/meals-per-day');
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
              Where do you usually eat?
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Select all that apply
            </Text>
          </View>

          {/* Dining Location Options */}
          <View style={styles.optionsContainer}>
            {diningLocations.map((location) => {
              const isSelected = selectedLocations.has(location.id);
              return (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isSelected
                        ? themeColors.primary
                        : themeColors.backgroundSecondary,
                      borderColor: isSelected
                        ? themeColors.primary
                        : themeColors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => handleToggleLocation(location.id)}
                  activeOpacity={0.7}>
                  <Text
                    variant="body"
                    weight={isSelected ? 'semibold' : 'normal'}
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? themeColors.textInverse : themeColors.text,
                      },
                    ]}>
                    {location.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={selectedLocations.size === 0}
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
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    minWidth: 100,
    alignItems: 'center',
  },
  chipText: {
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
});
