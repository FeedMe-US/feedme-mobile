/**
 * StepByStepBYOModal - Step-by-step wizard for Build-Your-Own menu items
 * Guides users through BYO customization one category at a time with running nutrition totals
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { Button } from '@/src/ui/Button';
import {
  MenuItem,
  BYOComponent,
  BYOCategory,
  mealService,
} from '@/src/services/mealService';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Props interface
export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface StepByStepBYOModalProps {
  visible: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onLog: (item: MenuItem, components: BYOComponent[], totalNutrition: NutritionTotals) => void;
}

export function StepByStepBYOModal({
  visible,
  item,
  onClose,
  onLog,
}: StepByStepBYOModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<BYOCategory[]>([]);
  const [selections, setSelections] = useState<Map<string, string[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Reset state when modal opens or item changes
  useEffect(() => {
    if (visible && item) {
      setCurrentStep(0);
      setSelections(new Map());
      setError(null);
      setValidationMessage(null);
      fetchCategories();
    }
  }, [visible, item?.recipe_id]);

  // Fetch BYO categories from API
  const fetchCategories = async () => {
    if (!item) return;

    // Validate recipe_id exists
    if (!item.recipe_id || item.recipe_id.trim() === '') {
      setError('This item does not have a valid recipe ID and cannot be customized.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await mealService.getBYOComponents(item.recipe_id);

      if (data && data.categories && data.categories.length > 0) {
        setCategories(data.categories);

        // Initialize selections with defaults if available
        if (data.default_build && data.default_build.component_ids) {
          const defaultSelections = new Map<string, string[]>();

          // Map default component IDs to their categories
          for (const category of data.categories) {
            const categoryDefaults = category.components
              .filter(c => data.default_build!.component_ids.includes(c.recipe_id))
              .map(c => c.recipe_id);

            if (categoryDefaults.length > 0) {
              defaultSelections.set(category.category, categoryDefaults);
            }
          }

          setSelections(defaultSelections);
        }
      } else {
        setError('No customization options are available for this item.');
      }
    } catch (err) {
      console.error('[StepByStepBYOModal] Error fetching components:', err);
      setError('Failed to load customization options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate running nutrition totals
  const calculateRunningTotals = useCallback((): NutritionTotals => {
    let totals: NutritionTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    selections.forEach((componentIds, categoryName) => {
      const category = categories.find(c => c.category === categoryName);
      if (!category) return;

      componentIds.forEach(id => {
        const component = category.components.find(c => c.recipe_id === id);
        if (component) {
          totals.calories += component.calories;
          totals.protein += component.protein_g;
          totals.carbs += component.carbs_g;
          totals.fat += component.fat_g;
        }
      });
    });

    return totals;
  }, [selections, categories]);

  // Memoized running totals
  const runningTotals = useMemo(() => calculateRunningTotals(), [calculateRunningTotals]);

  // Get current category
  const currentCategory = categories[currentStep];
  const isLastStep = currentStep === categories.length - 1;
  const isSummaryStep = currentStep === categories.length;

  // Get selected component IDs for current category
  const getCurrentSelections = (): string[] => {
    if (!currentCategory) return [];
    return selections.get(currentCategory.category) || [];
  };

  // Check if component is selected
  const isComponentSelected = (componentId: string): boolean => {
    return getCurrentSelections().includes(componentId);
  };

  // Handle component selection
  const handleSelectComponent = (component: BYOComponent) => {
    if (!currentCategory) return;

    const categoryName = currentCategory.category;
    const currentSelections = selections.get(categoryName) || [];
    const maxSelections = currentCategory.max_selections;

    setValidationMessage(null);

    if (maxSelections === 1) {
      // Radio button behavior - replace selection
      const newSelections = new Map(selections);
      newSelections.set(categoryName, [component.recipe_id]);
      setSelections(newSelections);
    } else {
      // Checkbox behavior - toggle selection
      const newSelections = new Map(selections);

      if (currentSelections.includes(component.recipe_id)) {
        // Deselect
        const filtered = currentSelections.filter(id => id !== component.recipe_id);
        if (filtered.length > 0) {
          newSelections.set(categoryName, filtered);
        } else {
          newSelections.delete(categoryName);
        }
      } else {
        // Select (if under max)
        if (!maxSelections || currentSelections.length < maxSelections) {
          newSelections.set(categoryName, [...currentSelections, component.recipe_id]);
        } else {
          setValidationMessage(`Maximum ${maxSelections} selections allowed`);
        }
      }

      setSelections(newSelections);
    }
  };

  // Validate current step before proceeding
  const validateCurrentStep = (): boolean => {
    if (!currentCategory) return true;

    const currentSelections = selections.get(currentCategory.category) || [];
    const minSelections = currentCategory.min_selections;

    if (currentSelections.length < minSelections) {
      setValidationMessage(
        minSelections === 1
          ? 'Please select at least one option'
          : `Please select at least ${minSelections} options`
      );
      return false;
    }

    return true;
  };

  // Handle next button
  const handleNext = () => {
    if (!validateCurrentStep()) return;

    setValidationMessage(null);
    setCurrentStep(prev => prev + 1);
  };

  // Handle back button
  const handleBack = () => {
    setValidationMessage(null);
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // Handle log action
  const handleLog = () => {
    if (!item) return;

    // Gather all selected components
    const selectedComponents: BYOComponent[] = [];

    selections.forEach((componentIds, categoryName) => {
      const category = categories.find(c => c.category === categoryName);
      if (!category) return;

      componentIds.forEach(id => {
        const component = category.components.find(c => c.recipe_id === id);
        if (component) {
          selectedComponents.push(component);
        }
      });
    });

    // Create modified item with custom nutrition
    const customItem: MenuItem = {
      ...item,
      calories: runningTotals.calories,
      protein_g: runningTotals.protein,
      carbs_g: runningTotals.carbs,
      fat_g: runningTotals.fat,
      name: `${item.name} (Custom)`,
    };

    onLog(customItem, selectedComponents, runningTotals);
    onClose();
  };

  // Handle retry
  const handleRetry = () => {
    fetchCategories();
  };

  // Render loading state
  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={themeColors.primary} />
      <Text variant="body" color="secondary" style={styles.loadingText}>
        Loading customization options...
      </Text>
    </View>
  );

  // Render error state
  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text variant="h4" weight="semibold" style={styles.errorTitle}>
        Unable to Load
      </Text>
      <Text variant="body" color="secondary" style={styles.errorMessage}>
        {error}
      </Text>
      <Button variant="outline" onPress={handleRetry} style={styles.retryButton}>
        Try Again
      </Button>
      <Button variant="ghost" onPress={onClose} style={styles.cancelButton}>
        Cancel
      </Button>
    </View>
  );

  // Render step content (category selection)
  const renderStepContent = () => {
    if (!currentCategory) return null;

    const isRadioStyle = currentCategory.max_selections === 1;
    const selectionCount = getCurrentSelections().length;

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category header */}
        <View style={styles.categoryHeader}>
          <Text variant="h4" weight="semibold">
            {currentCategory.display_name || currentCategory.category}
          </Text>
          <Text variant="caption" color="secondary">
            {isRadioStyle
              ? 'Select one'
              : currentCategory.max_selections
                ? `Select ${currentCategory.min_selections}-${currentCategory.max_selections} (${selectionCount} selected)`
                : `Select at least ${currentCategory.min_selections} (${selectionCount} selected)`
            }
          </Text>
        </View>

        {/* Validation message */}
        {validationMessage && (
          <View style={[styles.validationBanner, { backgroundColor: themeColors.warningLight }]}>
            <Text variant="bodySmall" style={{ color: themeColors.warning }}>
              {validationMessage}
            </Text>
          </View>
        )}

        {/* Component options */}
        <View style={styles.componentList}>
          {currentCategory.components.map((component) => {
            const isSelected = isComponentSelected(component.recipe_id);

            return (
              <TouchableOpacity
                key={component.recipe_id}
                style={[
                  styles.componentCard,
                  {
                    backgroundColor: isSelected
                      ? themeColors.primaryLight + '30'
                      : themeColors.cardBackground,
                    borderColor: isSelected
                      ? themeColors.primary
                      : themeColors.border,
                  },
                ]}
                onPress={() => handleSelectComponent(component)}
                activeOpacity={0.7}
              >
                {/* Selection indicator */}
                <View
                  style={[
                    isRadioStyle ? styles.radioOuter : styles.checkboxOuter,
                    {
                      borderColor: isSelected ? themeColors.primary : themeColors.textSecondary,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        isRadioStyle ? styles.radioInner : styles.checkboxInner,
                        { backgroundColor: themeColors.primary },
                      ]}
                    >
                      {!isRadioStyle && (
                        <Text variant="caption" style={{ color: '#fff', fontSize: 10 }}>
                          ✓
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Component info */}
                <View style={styles.componentInfo}>
                  <Text
                    variant="body"
                    weight={isSelected ? 'semibold' : 'normal'}
                    numberOfLines={2}
                  >
                    {component.name}
                  </Text>
                  <View style={styles.componentMacros}>
                    <Text variant="caption" color="calories">
                      {Math.round(component.calories)} cal
                    </Text>
                    <Text variant="caption" color="secondary">
                      {' '}•{' '}
                    </Text>
                    <Text variant="caption" color="protein">
                      {Math.round(component.protein_g)}g protein
                    </Text>
                    <Text variant="caption" color="secondary">
                      {' '}•{' '}
                    </Text>
                    <Text variant="caption" color="carbs">
                      {Math.round(component.carbs_g)}g carbs
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  // Render summary step
  const renderSummary = () => {
    // Group selected components by category
    const selectedByCategory: { category: BYOCategory; components: BYOComponent[] }[] = [];

    categories.forEach(category => {
      const selectedIds = selections.get(category.category) || [];
      const selectedComponents = category.components.filter(c =>
        selectedIds.includes(c.recipe_id)
      );

      if (selectedComponents.length > 0) {
        selectedByCategory.push({ category, components: selectedComponents });
      }
    });

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="h3" weight="bold" style={styles.summaryTitle}>
          Your Build
        </Text>

        {/* Selected items by category */}
        {selectedByCategory.map(({ category, components }) => (
          <View key={category.category} style={styles.summaryCategory}>
            <Text variant="bodySmall" color="secondary" style={styles.summaryCategoryLabel}>
              {category.display_name || category.category}
            </Text>
            {components.map(component => (
              <View key={component.recipe_id} style={styles.summaryItem}>
                <Text variant="body" weight="medium">
                  {component.name}
                </Text>
                <Text variant="caption" color="secondary">
                  {Math.round(component.calories)} cal
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Final nutrition totals */}
        <Card variant="elevated" style={styles.finalTotalsCard}>
          <Text variant="h4" weight="semibold" style={styles.finalTotalsTitle}>
            Total Nutrition
          </Text>
          <View style={styles.finalTotalsGrid}>
            <View style={styles.finalTotalItem}>
              <Text variant="h2" weight="bold" color="calories">
                {Math.round(runningTotals.calories)}
              </Text>
              <Text variant="caption" color="secondary">calories</Text>
            </View>
            <View style={styles.finalTotalItem}>
              <Text variant="h3" weight="bold" color="protein">
                {Math.round(runningTotals.protein)}g
              </Text>
              <Text variant="caption" color="secondary">protein</Text>
            </View>
            <View style={styles.finalTotalItem}>
              <Text variant="h3" weight="bold" color="carbs">
                {Math.round(runningTotals.carbs)}g
              </Text>
              <Text variant="caption" color="secondary">carbs</Text>
            </View>
            <View style={styles.finalTotalItem}>
              <Text variant="h3" weight="bold" color="fats">
                {Math.round(runningTotals.fat)}g
              </Text>
              <Text variant="caption" color="secondary">fat</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    );
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text variant="body" color="secondary">
              ✕
            </Text>
          </TouchableOpacity>

          {!isLoading && !error && categories.length > 0 && (
            <View style={styles.headerTitleContainer}>
              <Text variant="h3" weight="bold">
                {isSummaryStep
                  ? 'Review Your Build'
                  : `Step ${currentStep + 1} of ${categories.length}`
                }
              </Text>
              {!isSummaryStep && currentCategory && (
                <Text variant="bodySmall" color="secondary">
                  {currentCategory.display_name || currentCategory.category}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Progress indicator */}
        {!isLoading && !error && categories.length > 0 && (
          <View style={styles.progressContainer}>
            {categories.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      index < currentStep
                        ? themeColors.success
                        : index === currentStep
                          ? themeColors.primary
                          : themeColors.border,
                  },
                ]}
              />
            ))}
            {/* Summary dot */}
            <View
              style={[
                styles.progressDot,
                {
                  backgroundColor: isSummaryStep
                    ? themeColors.primary
                    : themeColors.border,
                },
              ]}
            />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : isSummaryStep ? (
            renderSummary()
          ) : (
            renderStepContent()
          )}
        </View>

        {/* Running totals bar */}
        {!isLoading && !error && categories.length > 0 && (
          <View style={[styles.runningTotalsBar, { backgroundColor: themeColors.cardBackground, borderTopColor: themeColors.border }]}>
            <Text variant="bodySmall" weight="medium">
              Running Total:
            </Text>
            <View style={styles.runningTotalsValues}>
              <Text variant="bodySmall" weight="semibold" color="calories">
                {Math.round(runningTotals.calories)} cal
              </Text>
              <Text variant="caption" color="secondary"> | </Text>
              <Text variant="bodySmall" weight="semibold" color="protein">
                {Math.round(runningTotals.protein)}g P
              </Text>
              <Text variant="caption" color="secondary"> | </Text>
              <Text variant="bodySmall" weight="semibold" color="carbs">
                {Math.round(runningTotals.carbs)}g C
              </Text>
              <Text variant="caption" color="secondary"> | </Text>
              <Text variant="bodySmall" weight="semibold" color="fats">
                {Math.round(runningTotals.fat)}g F
              </Text>
            </View>
          </View>
        )}

        {/* Navigation buttons */}
        {!isLoading && !error && categories.length > 0 && (
          <View style={[styles.navigationBar, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.backButton,
                { borderColor: themeColors.border },
                currentStep === 0 && styles.navButtonDisabled,
              ]}
              onPress={handleBack}
              disabled={currentStep === 0}
              activeOpacity={0.7}
            >
              <Text
                variant="body"
                weight="medium"
                color={currentStep === 0 ? 'tertiary' : 'secondary'}
              >
                ← Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                { backgroundColor: isSummaryStep ? themeColors.success : themeColors.primary },
              ]}
              onPress={isSummaryStep ? handleLog : handleNext}
              activeOpacity={0.7}
            >
              <Text variant="body" weight="semibold" style={{ color: themeColors.textInverse }}>
                {isSummaryStep ? 'Log This Build' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    marginBottom: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  categoryHeader: {
    marginBottom: spacing.lg,
  },
  validationBanner: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  componentList: {
    gap: spacing.sm,
  },
  componentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxInner: {
    width: 18,
    height: 18,
    borderRadius: radius.xs - 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  componentInfo: {
    flex: 1,
  },
  componentMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  summaryTitle: {
    marginBottom: spacing.lg,
  },
  summaryCategory: {
    marginBottom: spacing.lg,
  },
  summaryCategoryLabel: {
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  finalTotalsCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  finalTotalsTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  finalTotalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  finalTotalItem: {
    alignItems: 'center',
  },
  runningTotalsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  runningTotalsValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 1,
  },
  nextButton: {
    // Primary/success background set dynamically
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
});
