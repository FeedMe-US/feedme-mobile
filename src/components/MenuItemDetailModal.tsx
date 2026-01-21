/**
 * MenuItemDetailModal - Full-screen modal for menu item details
 * Shows complete nutrition info and allergens
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { MenuItem, mealService, BYOComponent } from '@/src/services/mealService';
import { BYOCustomizerModal } from './BYOCustomizerModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface MenuItemDetailModalProps {
  visible: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onLog?: (item: MenuItem) => void;
}

export function MenuItemDetailModal({
  visible,
  item,
  onClose,
  onLog,
}: MenuItemDetailModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const [showBYOModal, setShowBYOModal] = useState(false);

  if (!item) return null;

  const isBYO = mealService.isBYOItem(item);

  const handleLog = () => {
    if (onLog && item) {
      onLog(item);
      onClose();
    }
  };

  const handleBYOLog = (customItem: MenuItem, _selectedComponents: BYOComponent[]) => {
    if (onLog) {
      onLog(customItem);
      onClose();
    }
  };

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

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Item Name */}
                <Text variant="h2" weight="bold" style={styles.itemName}>
                  {item.name}
                </Text>

                {/* Serving Size */}
                {item.serving_size && (
                  <Text variant="bodySmall" color="secondary" style={styles.servingSize}>
                    Serving: {item.serving_size}
                  </Text>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {item.tags.map((tag, index) => (
                      <View
                        key={index}
                        style={[
                          styles.tag,
                          { backgroundColor: themeColors.primaryLight + '30' },
                        ]}
                      >
                        <Text variant="caption" color="primary">
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Calories */}
                <Card variant="elevated" style={styles.caloriesCard}>
                  <Text variant="h1" weight="bold" color="calories">
                    {Math.round(item.calories)}
                  </Text>
                  <Text variant="body" color="secondary">
                    calories
                  </Text>
                </Card>

                {/* Macros */}
                <View style={styles.macrosGrid}>
                  <Card variant="elevated" style={styles.macroCard}>
                    <Text variant="h3" weight="bold" color="protein">
                      {Math.round(item.protein_g)}g
                    </Text>
                    <Text variant="bodySmall" color="secondary">
                      Protein
                    </Text>
                  </Card>

                  <Card variant="elevated" style={styles.macroCard}>
                    <Text variant="h3" weight="bold" color="carbs">
                      {Math.round(item.carbs_g)}g
                    </Text>
                    <Text variant="bodySmall" color="secondary">
                      Carbs
                    </Text>
                  </Card>

                  <Card variant="elevated" style={styles.macroCard}>
                    <Text variant="h3" weight="bold" color="fats">
                      {Math.round(item.fat_g)}g
                    </Text>
                    <Text variant="bodySmall" color="secondary">
                      Fat
                    </Text>
                  </Card>
                </View>

                {/* Allergens */}
                {item.allergens && item.allergens.length > 0 && (
                  <View style={styles.allergensSection}>
                    <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
                      Allergens
                    </Text>
                    <View style={styles.allergensContainer}>
                      {item.allergens.map((allergen, index) => (
                        <View
                          key={index}
                          style={[
                            styles.allergenTag,
                            { backgroundColor: themeColors.warningLight },
                          ]}
                        >
                          <Text variant="bodySmall" style={{ color: themeColors.warning }}>
                            {allergen}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Extended Nutrition */}
                {(item.fiber_g != null || item.sodium_mg != null || item.sugar_g != null || item.cholesterol_mg != null) && (
                  <View style={styles.nutritionSection}>
                    <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
                      More Nutrition
                    </Text>
                    <View style={styles.nutritionGrid}>
                      {item.fiber_g != null && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{Math.round(item.fiber_g)}g</Text>
                          <Text variant="caption" color="secondary">Fiber</Text>
                        </View>
                      )}
                      {item.sugar_g != null && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{Math.round(item.sugar_g)}g</Text>
                          <Text variant="caption" color="secondary">Sugar</Text>
                        </View>
                      )}
                      {item.sodium_mg != null && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{Math.round(item.sodium_mg)}mg</Text>
                          <Text variant="caption" color="secondary">Sodium</Text>
                        </View>
                      )}
                      {item.cholesterol_mg != null && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{Math.round(item.cholesterol_mg)}mg</Text>
                          <Text variant="caption" color="secondary">Cholesterol</Text>
                        </View>
                      )}
                      {item.saturated_fat_g != null && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{Math.round(item.saturated_fat_g)}g</Text>
                          <Text variant="caption" color="secondary">Sat. Fat</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Vitamins & Minerals */}
                {(item.calcium_mg != null || item.iron_mg != null || item.vitamin_c_mg != null || item.vitamin_d_mcg != null) && (
                  <View style={styles.nutritionSection}>
                    <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
                      Vitamins & Minerals
                    </Text>
                    <View style={styles.nutritionGrid}>
                      {item.calcium_mg != null && item.calcium_mg > 0 && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{Math.round(item.calcium_mg)}mg</Text>
                          <Text variant="caption" color="secondary">Calcium</Text>
                        </View>
                      )}
                      {item.iron_mg != null && item.iron_mg > 0 && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{item.iron_mg.toFixed(1)}mg</Text>
                          <Text variant="caption" color="secondary">Iron</Text>
                        </View>
                      )}
                      {item.potassium_mg != null && item.potassium_mg > 0 && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{Math.round(item.potassium_mg)}mg</Text>
                          <Text variant="caption" color="secondary">Potassium</Text>
                        </View>
                      )}
                      {item.vitamin_c_mg != null && item.vitamin_c_mg > 0 && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{Math.round(item.vitamin_c_mg)}mg</Text>
                          <Text variant="caption" color="secondary">Vitamin C</Text>
                        </View>
                      )}
                      {item.vitamin_d_mcg != null && item.vitamin_d_mcg > 0 && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{item.vitamin_d_mcg.toFixed(1)}mcg</Text>
                          <Text variant="caption" color="secondary">Vitamin D</Text>
                        </View>
                      )}
                      {item.vitamin_a_mcg != null && item.vitamin_a_mcg > 0 && (
                        <View style={styles.nutritionItem}>
                          <Text variant="body" weight="semibold">{Math.round(item.vitamin_a_mcg)}mcg</Text>
                          <Text variant="caption" color="secondary">Vitamin A</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Ingredients */}
                {item.ingredients && (
                  <View style={styles.ingredientsSection}>
                    <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
                      Ingredients
                    </Text>
                    <Text variant="bodySmall" color="secondary" style={styles.ingredientsText}>
                      {item.ingredients}
                    </Text>
                  </View>
                )}

                {/* BYO Customize Button */}
                {isBYO && onLog && (
                  <TouchableOpacity
                    style={[styles.customizeButton, { backgroundColor: themeColors.primary }]}
                    onPress={() => setShowBYOModal(true)}
                    activeOpacity={0.8}
                  >
                    <Text variant="body" weight="semibold" style={{ color: themeColors.textInverse }}>
                      Customize Your Build
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Log Button */}
                {onLog && (
                  <TouchableOpacity
                    style={[styles.logButton, { backgroundColor: themeColors.success }]}
                    onPress={handleLog}
                    activeOpacity={0.8}
                  >
                    <Text variant="body" weight="semibold" style={{ color: themeColors.textInverse }}>
                      {isBYO ? 'Log Default Build' : 'Log This Item'}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {/* BYO Customizer Modal */}
      <BYOCustomizerModal
        visible={showBYOModal}
        item={item}
        onClose={() => setShowBYOModal(false)}
        onLog={handleBYOLog}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    paddingBottom: spacing.md,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  itemName: {
    marginBottom: spacing.xs,
  },
  servingSize: {
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  caloriesCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  allergensSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  allergensContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  allergenTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  logButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  customizeButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  nutritionSection: {
    marginBottom: spacing.xl,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nutritionItem: {
    minWidth: 70,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  ingredientsSection: {
    marginBottom: spacing.xl,
  },
  ingredientsText: {
    lineHeight: 20,
  },
});
