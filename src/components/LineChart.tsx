/**
 * LineChart - Simple line chart component
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing } from '@/src/theme';
import { Text } from '@/src/ui/Text';

export interface LineChartData {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LineChartData[];
  height?: number;
  maxValue?: number;
  color?: string;
  style?: ViewStyle;
  showYAxis?: boolean;
  goalValue?: number;
}

export function LineChart({
  data,
  height = 200,
  maxValue,
  color,
  style,
  showYAxis = false,
  goalValue,
}: LineChartProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const chartColor = color || themeColors.primary;

  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 40;
  const chartWidth = showYAxis ? 260 : 300;
  const padding = spacing.md;
  const yAxisWidth = showYAxis ? 40 : 0;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - (item.value / max) * (chartHeight - padding * 2) + padding;
    return `${x},${y}`;
  }).join(' ');

  // Calculate Y-axis labels
  const getYAxisLabels = () => {
    if (!showYAxis) return [];
    const numLabels = 4;
    const labels = [];
    for (let i = 0; i <= numLabels; i++) {
      const value = (max / numLabels) * (numLabels - i);
      labels.push(Math.round(value));
    }
    return labels;
  };

  const yAxisLabels = getYAxisLabels();

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={styles.chartContainer}>
        {showYAxis && (
          <View style={styles.yAxisContainer}>
            {yAxisLabels.map((value, index) => (
              <Text key={index} variant="caption" color="secondary" style={styles.yAxisLabel}>
                {value}
              </Text>
            ))}
          </View>
        )}
        <Svg width={chartWidth} height={chartHeight}>
          {/* Goal line if provided */}
          {goalValue !== undefined && goalValue <= max && (
            <Polyline
              points={`${padding},${chartHeight - (goalValue / max) * (chartHeight - padding * 2) + padding} ${chartWidth - padding},${chartHeight - (goalValue / max) * (chartHeight - padding * 2) + padding}`}
              fill="none"
              stroke={themeColors.textSecondary}
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity={0.3}
            />
          )}
          <Polyline
            points={points}
            fill="none"
            stroke={chartColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {data.map((item, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding * 2);
            const y = chartHeight - (item.value / max) * (chartHeight - padding * 2) + padding;
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={chartColor}
              />
            );
          })}
        </Svg>
      </View>
      <View style={[styles.labelsContainer, showYAxis && styles.labelsContainerWithYAxis]}>
        {data.map((item, index) => (
          <Text key={index} variant="caption" color="secondary" style={styles.label}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  yAxisContainer: {
    height: 160, // Match chartHeight
    justifyContent: 'space-between',
    paddingRight: spacing.xs,
    alignItems: 'flex-end',
  },
  yAxisLabel: {
    fontSize: 9,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.sm,
  },
  labelsContainerWithYAxis: {
    paddingLeft: 40, // Offset for Y-axis
  },
  label: {
    fontSize: 10,
  },
});

