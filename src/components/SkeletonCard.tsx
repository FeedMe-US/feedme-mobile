/**
 * SkeletonCard - Pulsing placeholder shown while a recommendation loads.
 * Mirrors MealCard dimensions so the layout doesn't shift when real data arrives.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Card } from '@/src/ui/Card';
import { Text } from '@/src/ui/Text';

function SkeletonBar({ width, height = 14, style }: { width: number | string; height?: number; style?: object }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius.sm,
          backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.wrapper}>
      <Card variant="elevated" padding="lg">
        {/* Header: hall name + action buttons */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <SkeletonBar width="55%" height={20} />
            <SkeletonBar width="35%" height={12} style={{ marginTop: spacing.xs }} />
          </View>
          <View style={styles.headerButtons}>
            <SkeletonBar width={36} height={36} style={{ borderRadius: 18 }} />
            <SkeletonBar width={36} height={36} style={{ borderRadius: 18 }} />
          </View>
        </View>

        {/* Meal items (3 placeholder rows) */}
        <View style={styles.items}>
          <View style={styles.itemRow}>
            <SkeletonBar width="60%" height={14} />
            <SkeletonBar width={40} height={14} />
          </View>
          <View style={styles.itemRow}>
            <SkeletonBar width="50%" height={14} />
            <SkeletonBar width={40} height={14} />
          </View>
          <View style={styles.itemRow}>
            <SkeletonBar width="45%" height={14} />
            <SkeletonBar width={40} height={14} />
          </View>
        </View>

        {/* Macro row (4 columns) */}
        <View style={styles.macros}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.macroCol}>
              <SkeletonBar width={32} height={18} />
              <SkeletonBar width={28} height={10} style={{ marginTop: spacing.xs }} />
            </View>
          ))}
        </View>

        {/* Action button */}
        <SkeletonBar width="100%" height={44} style={{ borderRadius: radius.md }} />
      </Card>

      {/* Subtitle below card */}
      <Text variant="caption" color="secondary" style={styles.subtitle}>
        Finding your perfect plate...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  items: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  macroCol: {
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
