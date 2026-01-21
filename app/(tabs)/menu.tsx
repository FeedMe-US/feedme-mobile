/**
 * Menu Screen - Dining hall menus with popup-based hall selection
 * Tapping a hall opens a bottom sheet with that hall's specific meal periods
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { DiningHallDetailSheet } from '@/src/components/DiningHallDetailSheet';
import { LuValleDetailSheet } from '@/src/components/LuValleDetailSheet';
import { mealService, DiningHall } from '@/src/services/mealService';
import { haptics } from '@/src/utils/haptics';

// LuValle Commons location IDs (grouped together)
const LUVALLE_IDS = [102, 103, 104, 105, 106, 107];

// Hill locations (geographic distinction - these go in "Dining Halls" section)
// Includes residential halls AND hill boutiques
const HILL_SLUGS = [
  'bruin-plate', 'epicuria-at-covel', 'de-neve', 'feast', 'drey',
  'bruin-cafe', 'bcafe', 'rendezvous', 'the-study-at-hedrick', 'cafe-1919'
];
const HILL_KEYWORDS = ['bruin plate', 'epicuria at covel', 'de neve', 'feast', 'drey', 'rieber', 'bruin cafe', 'rendezvous', 'the study', '1919'];

function isHillLocation(location: DiningHall): boolean {
  const slug = location.slug?.toLowerCase() || '';
  const name = location.name?.toLowerCase() || '';

  // Explicitly exclude Epic at Ackerman (it's campus, not hill)
  if (slug.includes('ackerman') || name.includes('ackerman')) return false;

  // Check slug first
  if (HILL_SLUGS.some(s => slug.includes(s))) return true;

  // Check name keywords
  if (HILL_KEYWORDS.some(k => name.includes(k))) return true;

  // Also include residential halls (they're all on the hill)
  if (location.is_residential) return true;

  return false;
}

function isLuvalleLocation(location: DiningHall): boolean {
  return (
    LUVALLE_IDS.includes(location.id) ||
    location.slug?.toLowerCase().includes('luvalle') ||
    location.name?.toLowerCase().includes('luvalle')
  );
}

export default function MenuScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  const [diningHalls, setDiningHalls] = useState<DiningHall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHall, setSelectedHall] = useState<DiningHall | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [luvalleSheetVisible, setLuvalleSheetVisible] = useState(false);

  useEffect(() => {
    loadDiningHalls();
  }, []);

  // Close sheets when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSheetVisible(false);
        setSelectedHall(null);
        setLuvalleSheetVisible(false);
      };
    }, [])
  );

  const loadDiningHalls = async () => {
    setLoading(true);
    try {
      const halls = await mealService.getDiningHalls();
      setDiningHalls(halls);
    } catch (error) {
      console.error('Failed to load dining halls:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    mealService.clearCache();
    await loadDiningHalls();
    setRefreshing(false);
  };

  const handleHallPress = (hall: DiningHall) => {
    haptics.light();
    setSelectedHall(hall);
    setSheetVisible(true);
  };

  const handleSheetClose = () => {
    setSheetVisible(false);
    // Small delay before clearing hall to avoid visual glitch
    setTimeout(() => setSelectedHall(null), 300);
  };

  const handleLuvallePress = () => {
    haptics.light();
    setLuvalleSheetVisible(true);
  };

  const handleLuvalleSheetClose = () => {
    setLuvalleSheetVisible(false);
  };

  // Sort halls: open first, then closed
  const sortedHalls = useMemo(() => {
    return [...diningHalls].sort((a, b) => {
      if (a.is_open_now && !b.is_open_now) return -1;
      if (!a.is_open_now && b.is_open_now) return 1;
      return 0;
    });
  }, [diningHalls]);

  // Separate dining halls into categories (open and closed)
  // Hill locations: BPlate, Epicuria, De Neve, Feast, Drey, Bruin Cafe, Rendezvous, The Study, Cafe 1919
  const openHillLocations = useMemo(
    () => sortedHalls.filter(h => isHillLocation(h) && !isLuvalleLocation(h) && h.is_open_now),
    [sortedHalls]
  );
  const closedHillLocations = useMemo(
    () => sortedHalls.filter(h => isHillLocation(h) && !isLuvalleLocation(h) && !h.is_open_now),
    [sortedHalls]
  );
  // LuValle locations (kept separate for grouping)
  const luvalleLocations = useMemo(
    () => sortedHalls.filter(h => isLuvalleLocation(h)),
    [sortedHalls]
  );
  // Campus restaurants: everything NOT on the hill and NOT LuValle
  const openCampusLocations = useMemo(
    () => sortedHalls.filter(h => !isHillLocation(h) && !isLuvalleLocation(h) && h.is_open_now),
    [sortedHalls]
  );
  const closedCampusLocations = useMemo(
    () => sortedHalls.filter(h => !isHillLocation(h) && !isLuvalleLocation(h) && !h.is_open_now),
    [sortedHalls]
  );
  // Check if LuValle is open
  const isLuvalleOpen = useMemo(
    () => luvalleLocations.some(l => l.is_open_now),
    [luvalleLocations]
  );

  const renderLocationCard = (location: DiningHall) => {
    return (
      <Card key={location.id} variant="elevated" padding="none" style={styles.locationCard}>
        <TouchableOpacity
          style={styles.locationHeader}
          onPress={() => handleHallPress(location)}
          activeOpacity={0.7}
        >
          <View style={styles.locationInfo}>
            <Text variant="h4" weight="semibold" numberOfLines={1} style={styles.locationName}>
              {location.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: location.is_open_now
                    ? themeColors.success + '30'
                    : themeColors.error + '30',
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  color: location.is_open_now ? themeColors.success : themeColors.error,
                }}
              >
                {location.is_open_now ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>{'>'}</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  // Render LuValle as a single grouped card (used within Campus Restaurants section)
  const renderLuvalleCard = () => {
    if (luvalleLocations.length === 0) return null;

    // Check if any LuValle location is open
    const anyLuvalleOpen = luvalleLocations.some(l => l.is_open_now);

    return (
      <Card key="luvalle-grouped" variant="elevated" padding="none" style={styles.locationCard}>
        <TouchableOpacity
          style={styles.locationHeader}
          onPress={handleLuvallePress}
          activeOpacity={0.7}
        >
          <View style={styles.locationInfo}>
            <View style={styles.luvalleInfo}>
              <Text variant="h4" weight="semibold" numberOfLines={1}>
                LuValle Commons
              </Text>
              <Text variant="caption" color="secondary">
                {luvalleLocations.length} restaurants
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: anyLuvalleOpen
                    ? themeColors.success + '30'
                    : themeColors.error + '30',
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  color: anyLuvalleOpen ? themeColors.success : themeColors.error,
                }}
              >
                {anyLuvalleOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>{'>'}</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  // Render a section with title and locations
  const renderOpenSection = (title: string, locations: DiningHall[], includeLuValle: boolean = false) => {
    const hasLocations = locations.length > 0 || (includeLuValle && luvalleLocations.length > 0 && isLuvalleOpen);
    if (!hasLocations) return null;

    return (
      <View style={styles.section}>
        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
          {title}
        </Text>
        {locations.map(renderLocationCard)}
        {includeLuValle && isLuvalleOpen && renderLuvalleCard()}
      </View>
    );
  };

  const renderClosedSection = (title: string, locations: DiningHall[], includeLuValle: boolean = false) => {
    const hasLocations = locations.length > 0 || (includeLuValle && luvalleLocations.length > 0 && !isLuvalleOpen);
    if (!hasLocations) return null;

    return (
      <View style={styles.section}>
        <Text variant="h3" weight="bold" style={styles.sectionTitle}>
          {title}
        </Text>
        {locations.map(renderLocationCard)}
        {includeLuValle && !isLuvalleOpen && renderLuvalleCard()}
      </View>
    );
  };

  return (
    <Screen safeBottom={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text variant="h1" weight="bold" style={styles.title}>
            Menu
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingScreen}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text variant="body" color="secondary" style={styles.loadingText}>
              Loading dining locations...
            </Text>
          </View>
        ) : diningHalls.length === 0 ? (
          <View style={styles.loadingScreen}>
            <Text variant="h3" weight="semibold" style={styles.loadingText}>
              No dining halls available
            </Text>
            <Text variant="body" color="secondary" style={styles.loadingText}>
              Pull down to refresh
            </Text>
          </View>
        ) : (
          <>
            {/* Open locations first */}
            {renderOpenSection('Dining Halls', openHillLocations)}
            {renderOpenSection('Campus Restaurants', openCampusLocations, true)}
            {/* Closed locations below */}
            {renderClosedSection('Closed Dining Halls', closedHillLocations)}
            {renderClosedSection('Closed Campus Restaurants', closedCampusLocations, true)}
          </>
        )}
      </ScrollView>

      <DiningHallDetailSheet
        visible={sheetVisible}
        hall={selectedHall}
        onClose={handleSheetClose}
      />

      <LuValleDetailSheet
        visible={luvalleSheetVisible}
        locations={luvalleLocations}
        onClose={handleLuvalleSheetClose}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  locationCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  locationName: {
    flex: 1,
  },
  luvalleInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  chevron: {
    fontSize: 20,
    opacity: 0.4,
    marginLeft: spacing.sm,
  },
  loadingScreen: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
});
