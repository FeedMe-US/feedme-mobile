/**
 * BYOCustomizerModal - Component selector for Build-Your-Own menu items
 * Allows users to customize their BYO builds (burritos, salads, bowls, etc.)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import {
  MenuItem,
  BYOComponent,
  BYOCategory,
  BYOComponentsResponse,
  mealService,
} from '@/src/services/mealService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BYOCustomizerModalProps {
  visible: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onLog?: (item: MenuItem, selectedComponents: BYOComponent[]) => void;
}

export function BYOCustomizerModal({
  visible,
  item,
  onClose,
  onLog,
}: BYOCustomizerModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  const [loading, setLoading] = useState(true);
  const [byoData, setBYOData] = useState<BYOComponentsResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totals, setTotals] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [error, setError] = useState<string | null>(null);

  // Fetch BYO components when modal opens
  useEffect(() => {
    if (visible && item) {
      setLoading(true);
      setError(null);
      setBYOData(null);

      // Validate recipe_id exists
      if (!item.recipe_id || item.recipe_id.trim() === '') {
        setError('no_recipe_id');
        setLoading(false);
        // Use item's current nutrition as default
        setTotals({
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        });
        return;
      }

      mealService.getBYOComponents(item.recipe_id)
        .then(data => {
          if (data && data.categories && data.categories.length > 0) {
            setBYOData(data);
            if (data.default_build) {
              setSelectedIds(new Set(data.default_build.component_ids));
              setTotals(data.default_build.totals);
            } else {
              // No default build, use item's nutrition
              setTotals({
                calories: item.calories,
                protein_g: item.protein_g,
                carbs_g: item.carbs_g,
                fat_g: item.fat_g,
              });
            }
          } else {
            // API returned empty data
            setError('no_components');
            setTotals({
              calories: item.calories,
              protein_g: item.protein_g,
              carbs_g: item.carbs_g,
              fat_g: item.fat_g,
            });
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('[BYOCustomizerModal] Error fetching components:', err);
          setError('fetch_failed');
          // Use item's current nutrition as fallback
          setTotals({
            calories: item.calories,
            protein_g: item.protein_g,
            carbs_g: item.carbs_g,
            fat_g: item.fat_g,
          });
          setLoading(false);
        });
    }
  }, [visible, item?.recipe_id]);

  // Recalculate totals when selection changes
  const recalculateTotals = useCallback((ids: Set<string>) => {
    if (!byoData) return;

    let calories = 0, protein = 0, carbs = 0, fat = 0;

    for (const category of byoData.categories) {
      for (const comp of category.components) {
        if (ids.has(comp.recipe_id)) {
          calories += comp.calories;
          protein += comp.protein_g;
          carbs += comp.carbs_g;
          fat += comp.fat_g;
        }
      }
    }

    setTotals({ calories, protein_g: protein, carbs_g: carbs, fat_g: fat });
  }, [byoData]);

  // Toggle component selection
  const toggleComponent = (component: BYOComponent, category: BYOCategory) => {
    const newIds = new Set(selectedIds);

    if (newIds.has(component.recipe_id)) {
      // Deselect (if allowed)
      if (category.min_selections === 0 || getCategorySelectedCount(category) > category.min_selections) {
        newIds.delete(component.recipe_id);
      }
    } else {
      // Select (if under max)
      if (!category.max_selections || getCategorySelectedCount(category) < category.max_selections) {
        newIds.add(component.recipe_id);
      }
    }

    setSelectedIds(newIds);
    recalculateTotals(newIds);
  };

  // Get count of selected items in a category
  const getCategorySelectedCount = (category: BYOCategory): number => {
    return category.components.filter(c => selectedIds.has(c.recipe_id)).length;
  };

  // Handle log action (works in both normal and fallback modes)
  const handleLog = () => {
    if (!item || !onLog) return;

    // Get selected components if BYO data is available
    const selectedComponents = byoData
      ? byoData.categories.flatMap(cat =>
          cat.components.filter(c => selectedIds.has(c.recipe_id))
        )
      : [];

    // Create a modified item with the custom/fallback build nutrition
    const customItem: MenuItem = {
      ...item,
      calories: totals.calories,
      protein_g: totals.protein_g,
      carbs_g: totals.carbs_g,
      fat_g: totals.fat_g,
      name: byoData ? `${item.name} (Custom)` : item.name,
    };

    onLog(customItem, selectedComponents);
    onClose();
  };

  // Handle retry when fetch failed
  const handleRetry = () => {
    if (item) {
      setLoading(true);
      setError(null);
      mealService.getBYOComponents(item.recipe_id)
        .then(data => {
          if (data && data.categories && data.categories.length > 0) {
            setBYOData(data);
            if (data.default_build) {
              setSelectedIds(new Set(data.default_build.component_ids));
              setTotals(data.default_build.totals);
            }
          } else {
            setError('no_components');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('fetch_failed');
          setLoading(false);
        });
    }
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: themeColors.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: themeColors.background },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text variant="body" color="secondary">
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <View style={styles.titleContainer}>
                <Text variant="h2" weight="bold">
                  Customize Your Build
                </Text>
                <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
                  {item.name}
                </Text>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={themeColors.primary} />
                  <Text variant="body" color="secondary" style={styles.loadingText}>
                    Loading components...
                  </Text>
                </View>
              ) : byoData ? (
                <>
                  {/* Nutrition Summary - Fixed at top */}
                  <Card variant="elevated" style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text variant="h3" weight="bold" color="calories">
                          {Math.round(totals.calories)}
                        </Text>
                        <Text variant="caption" color="secondary">cal</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text variant="h4" weight="bold" color="protein">
                          {Math.round(totals.protein_g)}g
                        </Text>
                        <Text variant="caption" color="secondary">protein</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text variant="h4" weight="bold" color="carbs">
                          {Math.round(totals.carbs_g)}g
                        </Text>
                        <Text variant="caption" color="secondary">carbs</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text variant="h4" weight="bold" color="fats">
                          {Math.round(totals.fat_g)}g
                        </Text>
                        <Text variant="caption" color="secondary">fat</Text>
                      </View>
                    </View>
                  </Card>

                  {/* Scrollable Component Categories */}
                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {byoData.categories.map((category, catIndex) => (
                      <View key={catIndex} style={styles.categorySection}>
                        <View style={styles.categoryHeader}>
                          <Text variant="h4" weight="semibold">
                            {category.display_name || category.category}
                          </Text>
                          <Text variant="caption" color="secondary">
                            {getCategorySelectedCount(category)} selected
                            {category.max_selections && ` (max ${category.max_selections})`}
                          </Text>
                        </View>

                        <View style={styles.componentGrid}>
                          {category.components.map((component) => {
                            const isSelected = selectedIds.has(component.recipe_id);
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
                                onPress={() => toggleComponent(component, category)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.componentInfo}>
                                  <Text
                                    variant="body"
                                    weight={isSelected ? 'semibold' : 'normal'}
                                    numberOfLines={2}
                                  >
                                    {component.name}
                                  </Text>
                                  <View style={styles.componentMacros}>
                                    <Text variant="caption" color="secondary">
                                      {Math.round(component.calories)} cal
                                    </Text>
                                    <Text variant="caption" color="protein">
                                      {Math.round(component.protein_g)}g P
                                    </Text>
                                  </View>
                                </View>
                                {isSelected && (
                                  <View style={[styles.checkmark, { backgroundColor: themeColors.primary }]}>
                                    <Text variant="caption" style={{ color: '#fff' }}>✓</Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Log Button */}
                  {onLog && (
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.logButton, { backgroundColor: themeColors.success }]}
                        onPress={handleLog}
                        activeOpacity={0.8}
                      >
                        <Text variant="body" weight="semibold" style={{ color: themeColors.textInverse }}>
                          Log This Build ({Math.round(totals.calories)} cal)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : error ? (
                <View style={styles.errorContainer}>
                  {/* Error message based on type */}
                  <Text variant="h4" weight="semibold" style={styles.errorTitle}>
                    {error === 'no_recipe_id'
                      ? 'Customization Unavailable'
                      : error === 'no_components'
                      ? 'No Components Found'
                      : 'Unable to Load Components'}
                  </Text>
                  <Text variant="body" color="secondary" style={styles.errorMessage}>
                    {error === 'no_recipe_id'
                      ? 'This item cannot be customized, but you can still log it with its default nutrition.'
                      : error === 'no_components'
                      ? 'This BYO item does not have customizable components yet.'
                      : 'There was a problem loading the customization options.'}
                  </Text>

                  {/* Nutrition fallback display */}
                  <Card variant="elevated" style={styles.fallbackCard}>
                    <Text variant="bodySmall" weight="semibold" style={styles.fallbackTitle}>
                      Default Nutrition
                    </Text>
                    <View style={styles.fallbackMacros}>
                      <Text variant="caption" color="calories">
                        {Math.round(totals.calories)} cal
                      </Text>
                      <Text variant="caption" color="protein">
                        {Math.round(totals.protein_g)}g P
                      </Text>
                      <Text variant="caption" color="carbs">
                        {Math.round(totals.carbs_g)}g C
                      </Text>
                      <Text variant="caption" color="fats">
                        {Math.round(totals.fat_g)}g F
                      </Text>
                    </View>
                  </Card>

                  {/* Action buttons */}
                  <View style={styles.errorActions}>
                    {error === 'fetch_failed' && (
                      <TouchableOpacity
                        style={[styles.retryButton, { borderColor: themeColors.primary }]}
                        onPress={handleRetry}
                        activeOpacity={0.7}
                      >
                        <Text variant="body" weight="semibold" style={{ color: themeColors.primary }}>
                          Try Again
                        </Text>
                      </TouchableOpacity>
                    )}
                    {onLog && (
                      <TouchableOpacity
                        style={[styles.logButton, { backgroundColor: themeColors.success }]}
                        onPress={handleLog}
                        activeOpacity={0.8}
                      >
                        <Text variant="body" weight="semibold" style={{ color: themeColors.textInverse }}>
                          Log with Default ({Math.round(totals.calories)} cal)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.errorContainer}>
                  <Text variant="body" color="secondary">
                    Something went wrong. Please try again.
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#808080',
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    padding: spacing.sm,
  },
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  fallbackCard: {
    width: '100%',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  fallbackTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  fallbackMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  errorActions: {
    width: '100%',
    gap: spacing.sm,
  },
  retryButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 2,
  },
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  componentGrid: {
    gap: spacing.sm,
  },
  componentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  componentInfo: {
    flex: 1,
  },
  componentMacros: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
});
