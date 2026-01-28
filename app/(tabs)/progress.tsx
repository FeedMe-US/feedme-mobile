/**
 * Progress Screen - Analytics with Daily/Weekly/Monthly/Yearly views
 * Matches SwiftUI design from screenshots
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { SegmentedControl } from '@/src/ui/SegmentedControl';
import { MacroRing } from '@/src/components/MacroRing';
import { BarChart, BarChartData } from '@/src/components/BarChart';
import { LineChart, LineChartData } from '@/src/components/LineChart';
import { useDailyTracking } from '@/src/store/DailyTrackingContext';
import { haptics } from '@/src/utils/haptics';
import { getOnboardingData } from '@/src/lib/onboardingData';
import {
  analyticsService,
  DailyStats,
  WeeklyStats,
  MonthlyStats,
} from '@/src/services/analyticsService';
import { userService } from '@/src/services/userService';
import { LockIcon } from '@/src/components/icons';

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type MetricType = 'protein' | 'calories' | 'weight' | 'consistency';

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism
  const { tracking } = useDailyTracking();
  const [period, setPeriod] = useState<TimePeriod>('weekly');
  const [metric, setMetric] = useState<MetricType>('protein');
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklyStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [dailyData, setDailyData] = useState<DailyStats[]>([]);
  const [selectedVitamins, setSelectedVitamins] = useState<string[]>(['vitamin_d_mcg', 'vitamin_b12_mcg', 'iron_mg']);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);

  // Load user's selected vitamins from profile/onboarding data
  useEffect(() => {
    const loadSelectedVitamins = async () => {
      try {
        const onboardingData = await getOnboardingData();
        if (onboardingData?.selectedVitamins && onboardingData.selectedVitamins.length > 0) {
          setSelectedVitamins(onboardingData.selectedVitamins);
        }
      } catch (error) {
        console.warn('Error loading selected vitamins:', error);
      }
    };
    loadSelectedVitamins();
  }, []);

  // Load user's account creation date
  useEffect(() => {
    const loadAccountCreatedAt = async () => {
      try {
        const profile = await userService.getProfile();
        if (profile?.created_at) {
          setAccountCreatedAt(profile.created_at);
        }
      } catch (error) {
        console.warn('Error loading account creation date:', error);
      }
    };
    loadAccountCreatedAt();
  }, []);

  // Check if account has been around long enough for each period
  const getAccountAgeDays = (): number => {
    if (!accountCreatedAt) return 0;
    const created = new Date(accountCreatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const isPeriodUnlocked = (period: TimePeriod): boolean => {
    const ageDays = getAccountAgeDays();
    switch (period) {
      case 'daily':
        return true; // Always unlocked
      case 'weekly':
        return ageDays >= 7;
      case 'monthly':
        return ageDays >= 30;
      case 'yearly':
        return ageDays >= 365;
      default:
        return false;
    }
  };

  // Load analytics data based on period
  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Analytics service now always returns mock data immediately
      if (period === 'weekly') {
        const data = await analyticsService.getWeeklyStats(4);
        setWeeklyData(data);
      } else if (period === 'monthly') {
        const data = await analyticsService.getMonthlyStats(4);
        setMonthlyData(data);
      } else if (period === 'yearly') {
        const data = await analyticsService.getMonthlyStats(12);
        setMonthlyData(data);
      } else {
        const data = await analyticsService.getDailyStats(7);
        setDailyData(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set fallback data on error
      if (period === 'weekly') {
        setWeeklyData([]);
      } else if (period === 'monthly' || period === 'yearly') {
        setMonthlyData([]);
      } else {
        setDailyData([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  // Load data when period changes
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const handlePeriodChange = (value: string) => {
    haptics.selection();
    setPeriod(value as TimePeriod);
  };

  // Calculate macro split
  const macroSplit = tracking.consumed.calories > 0
    ? Math.round(
        ((tracking.consumed.protein * 4 +
          tracking.consumed.carbs * 4 +
          tracking.consumed.fats * 9) /
          tracking.consumed.calories) *
          100
      )
    : 0;

  return (
    <Screen safeBottom={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1" weight="bold" style={styles.title}>
            Progress
          </Text>
        </View>


        {/* Period Selector - Compact */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodSelector}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as TimePeriod[]).map((p) => {
            const isLocked = !isPeriodUnlocked(p);
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodTab,
                  period === p && { backgroundColor: themeColors.primary + '30' },
                  isLocked && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (!isLocked) {
                    handlePeriodChange(p);
                  }
                }}
                disabled={isLocked}>
                <View style={styles.periodTabContent}>
                  <Text
                    variant="bodySmall"
                    weight={period === p ? 'semibold' : 'medium'}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={{
                      color: period === p ? themeColors.primary : themeColors.textSecondary,
                      fontSize: 12,
                    }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                  {isLocked && (
                    <View style={{ marginLeft: 4 }}>
                      <LockIcon size={12} color={themeColors.textSecondary} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Metric Selector */}
        {(period === 'weekly' || period === 'monthly' || period === 'yearly') && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.metricSelector}>
            {([
              { label: 'Protein', value: 'protein' },
              { label: 'Calories', value: 'calories' },
              { label: 'Weight', value: 'weight' },
              { label: 'Consistency', value: 'consistency' },
            ] as Array<{ label: string; value: MetricType }>).map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.metricTab,
                  metric === m.value && { backgroundColor: themeColors.primary + '30' },
                ]}
                onPress={() => {
                  setMetric(m.value);
                  haptics.light();
                }}>
                <Text
                  variant="bodySmall"
                  weight={metric === m.value ? 'semibold' : 'medium'}
                  numberOfLines={1}
                  style={{
                    color: metric === m.value ? themeColors.primary : themeColors.textSecondary,
                    fontSize: 12,
                  }}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={themeColors.primary} />
          </View>
        )}

        {/* Content based on period */}
        {!isLoading && period === 'daily' && <DailyView tracking={tracking} macroSplit={macroSplit} selectedVitamins={selectedVitamins} />}
        {!isLoading && period === 'weekly' && (
          isPeriodUnlocked('weekly') ? (
            <WeeklyView metric={metric} data={weeklyData} />
          ) : (
            <LockedPeriodView period="weekly" accountAgeDays={getAccountAgeDays()} themeColors={themeColors} />
          )
        )}
        {!isLoading && period === 'monthly' && (
          isPeriodUnlocked('monthly') ? (
            <MonthlyView metric={metric} data={monthlyData} tracking={tracking} />
          ) : (
            <LockedPeriodView period="monthly" accountAgeDays={getAccountAgeDays()} themeColors={themeColors} />
          )
        )}
        {!isLoading && period === 'yearly' && (
          isPeriodUnlocked('yearly') ? (
            <YearlyView metric={metric} data={monthlyData} tracking={tracking} />
          ) : (
            <LockedPeriodView period="yearly" accountAgeDays={getAccountAgeDays()} themeColors={themeColors} />
          )
        )}
      </ScrollView>
    </Screen>
  );
}

function DailyView({ tracking, macroSplit, selectedVitamins }: { tracking: any; macroSplit: number; selectedVitamins: string[] }) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism

  // Map backend vitamin keys (snake_case) to display abbreviations
  // This mapping is critical for matching backend API response keys
  const vitaminDisplayMap: Record<string, string> = {
    'vitamin_d_mcg': 'Vit D',
    'vitamin_b12_mcg': 'B12',
    'vitamin_c_mg': 'Vit C',
    'vitamin_a_mcg': 'Vit A',
    'vitamin_b6_mg': 'B6',
    'iron_mg': 'Iron',
    'calcium_mg': 'Ca',
    'potassium_mg': 'K',
  };

  // Build a lookup from micronutrient key to its progress data
  // tracking.micronutrients comes from the backend API response
  const micronutrientByKey = (tracking.micronutrients || []).reduce(
    (acc: Record<string, any>, m: any) => {
      acc[m.key] = m;
      return acc;
    },
    {} as Record<string, any>
  );

  // Get display value for a vitamin - shows percentage or "--" if no data
  const getVitaminDisplay = (vitaminKey: string): string => {
    const data = micronutrientByKey[vitaminKey];
    if (data && typeof data.pct === 'number') {
      return `${data.pct}%`;
    }
    return '--';
  };

  return (
    <>
      {/* Daily Snapshot Card */}
      <Card
        variant="elevated"
        padding="lg"
        style={styles.snapshotCard}>
        <Text variant="h4" weight="semibold" style={styles.cardTitle}>
          Daily Snapshot
        </Text>

        <View style={styles.ringContainer}>
          <MacroRing
            value={tracking.consumed.calories}
            max={tracking.targets.calories}
            size={200}
            strokeWidth={24}
            color={themeColors.calories}
            unit="kcal today"
          />
        </View>

        <View style={styles.macroBreakdown}>
          <View style={styles.macroItem}>
            <Text
              variant="body"
              weight="semibold"
              style={{ color: themeColors.protein }}>
              {tracking.consumed.protein} g
            </Text>
            <Text variant="caption" color="secondary">
              Protein
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text
              variant="body"
              weight="semibold"
              style={{ color: themeColors.carbs }}>
              {tracking.consumed.carbs} g
            </Text>
            <Text variant="caption" color="secondary">
              Carbs
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text
              variant="body"
              weight="semibold"
              style={{ color: themeColors.fats }}>
              {tracking.consumed.fats} g
            </Text>
            <Text variant="caption" color="secondary">
              Fat
            </Text>
          </View>
        </View>
      </Card>

      {/* Key Vitamins Today */}
      <Card variant="elevated" padding="lg" style={styles.vitaminCard}>
        <Text variant="h4" weight="semibold" style={styles.cardTitle}>
          Key Vitamins Today
        </Text>
        <Text variant="caption" color="secondary" style={{ marginBottom: spacing.sm }}>
          Tracking based on logged meals
        </Text>
        <View style={styles.vitaminGrid}>
          {selectedVitamins.map((vitamin) => (
            <View key={vitamin} style={styles.vitaminPill}>
              <Text variant="bodySmall" weight="semibold">
                {vitaminDisplayMap[vitamin] || vitamin} {getVitaminDisplay(vitamin)}
              </Text>
            </View>
          ))}
        </View>
        {selectedVitamins.length === 0 && (
          <Text variant="bodySmall" color="secondary">
            Select vitamins to track in Profile settings
          </Text>
        )}
      </Card>
    </>
  );
}

function WeeklyView({ metric, data }: { metric: MetricType; data: WeeklyStats[] }) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism

  // Convert WeeklyStats to chart data based on metric
  const getWeeklyData = (): BarChartData[] => {
    if (data.length === 0) return [];

    const dayLabels = ['W1', 'W2', 'W3', 'W4'];

    return data.slice(0, 4).map((week, index) => {
      let value: number;
      switch (metric) {
        case 'protein':
          value = week.avg_protein;
          break;
        case 'calories':
          value = week.avg_calories;
          break;
        case 'consistency':
          value = week.consistency_score;
          break;
        case 'weight':
          // Weight data would come from a separate endpoint
          value = 165 + index * 0.3;
          break;
        default:
          value = 0;
      }
      return { label: dayLabels[index] || `W${index + 1}`, value };
    });
  };

  const chartData = getWeeklyData();
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.value)) * 1.1 : 100;

  const chartColor =
    metric === 'protein'
      ? themeColors.protein
      : metric === 'calories'
        ? themeColors.calories
        : metric === 'weight'
          ? themeColors.primary
          : themeColors.success;

  const getWeeklyGoal = () => {
    if (data.length === 0) return '';
    const latestWeek = data[data.length - 1];
    switch (metric) {
      case 'protein':
        return `Average: ${Math.round(latestWeek?.avg_protein || 0)}g/day`;
      case 'calories':
        return `Average: ${Math.round(latestWeek?.avg_calories || 0).toLocaleString()} cal/day`;
      case 'weight':
        return 'Trending: +0.2 lbs this week';
      case 'consistency':
        return `${latestWeek?.consistency_score || 0}% consistency this week`;
      default:
        return '';
    }
  };

  return (
    <>
      <Card variant="elevated" padding="lg" style={styles.trendCard}>
        <Text variant="h4" weight="semibold" style={styles.cardTitle}>
          Weekly {metric.charAt(0).toUpperCase() + metric.slice(1)} Trend
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
          {getWeeklyGoal()}
        </Text>
        <BarChart
          data={chartData}
          height={200}
          maxValue={maxValue}
          color={chartColor}
          style={styles.chart}
        />
      </Card>

      {/* AI insights removed for MVP */}
    </>
  );
}

function MonthlyView({ metric, data, tracking }: { metric: MetricType; data: MonthlyStats[]; tracking: any }) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism

  // Convert MonthlyStats to chart data based on metric
  const getMonthlyData = (): LineChartData[] => {
    if (data.length === 0) return [];

    return data.slice(0, 4).map((month, index) => {
      let value: number;
      switch (metric) {
        case 'protein':
          value = month.avg_protein;
          break;
        case 'calories':
          value = month.avg_calories;
          break;
        case 'consistency':
          value = month.consistency_score;
          break;
        case 'weight':
          value = month.weight_end || 165 + index * 0.5;
          break;
        default:
          value = 0;
      }
      return { label: `W${index + 1}`, value };
    });
  };

  const chartData = getMonthlyData();
  const chartColor = metric === 'protein' ? themeColors.protein : themeColors.primary;

  // Get goal value based on metric
  const getGoalValue = () => {
    switch (metric) {
      case 'protein':
        return tracking.targets.protein;
      case 'calories':
        return tracking.targets.calories;
      case 'consistency':
        return 100; // 100% consistency goal
      case 'weight':
        return undefined; // Weight goal would come from profile
      default:
        return undefined;
    }
  };

  const goalValue = getGoalValue();
  const maxValue = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.value), goalValue || 0) * 1.2
    : metric === 'calories' ? 3000 : metric === 'weight' ? 180 : metric === 'consistency' ? 100 : 250;

  return (
    <>
      <Card variant="elevated" padding="lg" style={styles.trendCard}>
        <Text variant="h4" weight="semibold" style={styles.cardTitle}>
          Monthly Trend
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
          {metric === 'protein' ? 'Average protein intake per week' :
           metric === 'calories' ? 'Average calories per week' :
           metric === 'weight' ? 'Weight progression' :
           'Consistency score (%)'}
        </Text>
        <LineChart
          data={chartData}
          height={200}
          maxValue={maxValue}
          color={chartColor}
          style={styles.chart}
          showYAxis={true}
          goalValue={goalValue}
        />
      </Card>

      {/* AI insights removed for MVP */}
    </>
  );
}

function YearlyView({ metric, data, tracking }: { metric: MetricType; data: MonthlyStats[]; tracking: any }) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism

  // Convert MonthlyStats to yearly chart data
  const getYearlyData = (): LineChartData[] => {
    if (data.length === 0) return [];

    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

    return data.map((month, index) => {
      let value: number;
      switch (metric) {
        case 'protein':
          value = month.avg_protein;
          break;
        case 'calories':
          value = month.avg_calories;
          break;
        case 'consistency':
          value = month.consistency_score;
          break;
        case 'weight':
          value = month.weight_end || 165 + index * 0.5;
          break;
        default:
          value = 0;
      }
      return { label: monthLabels[index % 12] || `M${index + 1}`, value };
    });
  };

  const chartData = getYearlyData();
  const chartColor = metric === 'protein' ? themeColors.protein : themeColors.primary;

  // Get goal value based on metric
  const getGoalValue = () => {
    switch (metric) {
      case 'protein':
        return tracking.targets.protein;
      case 'calories':
        return tracking.targets.calories;
      case 'consistency':
        return 100; // 100% consistency goal
      case 'weight':
        return undefined; // Weight goal would come from profile
      default:
        return undefined;
    }
  };

  const goalValue = getGoalValue();
  const maxValue = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.value), goalValue || 0) * 1.2
    : metric === 'calories' ? 3000 : metric === 'weight' ? 180 : metric === 'consistency' ? 100 : 250;

  return (
    <>
      <Card variant="elevated" padding="lg" style={styles.trendCard}>
        <Text variant="h4" weight="semibold" style={styles.cardTitle}>
          Yearly Trend
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
          {metric === 'protein' ? 'Protein intake over the year' :
           metric === 'calories' ? 'Calories over the year' :
           metric === 'weight' ? 'Weight progression' :
           'Consistency over the year'}
        </Text>
        <LineChart
          data={chartData}
          height={200}
          maxValue={maxValue}
          color={chartColor}
          style={styles.chart}
          showYAxis={true}
          goalValue={goalValue}
        />
      </Card>

      {/* AI insights removed for MVP */}
    </>
  );
}

function LockedPeriodView({
  period,
  accountAgeDays,
  themeColors
}: {
  period: 'weekly' | 'monthly' | 'yearly';
  accountAgeDays: number;
  themeColors: any;
}) {
  const getPeriodInfo = () => {
    switch (period) {
      case 'weekly':
        return {
          requiredDays: 7,
          label: 'Weekly',
          description: 'Track your progress week by week',
        };
      case 'monthly':
        return {
          requiredDays: 30,
          label: 'Monthly',
          description: 'See your monthly trends and patterns',
        };
      case 'yearly':
        return {
          requiredDays: 365,
          label: 'Yearly',
          description: 'View your year-long journey',
        };
    }
  };

  const info = getPeriodInfo();
  const daysRemaining = Math.max(0, info.requiredDays - accountAgeDays);
  const progress = Math.min(100, (accountAgeDays / info.requiredDays) * 100);

  return (
    <Card variant="elevated" padding="lg" style={styles.lockedCard}>
      <View style={styles.lockedContent}>
        <View style={[styles.lockIcon, { backgroundColor: themeColors.primary + '20' }]}>
          <LockIcon size={40} color={themeColors.primary} />
        </View>
        <Text variant="h4" weight="semibold" style={styles.lockedTitle}>
          {info.label} View Locked
        </Text>
        <Text variant="body" color="secondary" style={styles.lockedDescription}>
          {info.description}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: themeColors.primary
                }
              ]}
            />
          </View>
          <Text variant="bodySmall" color="secondary" style={styles.progressText}>
            {accountAgeDays} of {info.requiredDays} days
          </Text>
        </View>

        {daysRemaining > 0 && (
          <View style={styles.milestoneInfo}>
            <Text variant="bodySmall" color="secondary" style={styles.milestoneText}>
              Unlock in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  periodTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  periodTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
  },
  metricTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  snapshotCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    marginBottom: spacing.md,
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  macroBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  macroItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  vitaminCard: {
    marginBottom: spacing.lg,
  },
  vitaminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  vitaminPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
  },
  trendCard: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  chart: {
    marginTop: spacing.md,
  },
  insightCard: {
    marginBottom: spacing.lg,
  },
  insightText: {
    marginTop: spacing.xs,
  },
  tipCard: {
    marginBottom: spacing.lg,
  },
  lockedCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  lockedContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  lockedTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  lockedDescription: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
  },
  milestoneInfo: {
    marginTop: spacing.sm,
  },
  milestoneText: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
