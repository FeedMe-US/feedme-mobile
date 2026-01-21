/**
 * BarChart - Simple bar chart component
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';

export interface BarChartData {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartData[];
  height?: number;
  maxValue?: number;
  color?: string;
  style?: ViewStyle;
}

export function BarChart({
  data,
  height = 200,
  maxValue,
  color,
  style,
}: BarChartProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const chartColor = color || themeColors.primary;

  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={styles.barsContainer}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * (height - 40);
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: chartColor,
                    },
                  ]}
                />
              </View>
              <Text variant="caption" color="secondary" style={styles.label}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: spacing.sm,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '80%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: radius.xs,
    minHeight: 4,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 10,
  },
});

