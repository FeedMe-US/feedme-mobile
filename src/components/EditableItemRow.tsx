/**
 * EditableItemRow - Individual food item row with editing capabilities
 * Supports quantity adjustment, swapping, macro editing, and removal
 */

import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';
import { QuantityStepper } from './QuantityStepper';
import { AppIcon } from './AppIcon';
import { MaterialIcons } from '@expo/vector-icons';

export interface EditableItem {
  id: string;
  recipe_id?: string;
  name: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isCustomized?: boolean;
  originalMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface EditableItemRowProps {
  item: EditableItem;
  onQuantityChange: (servings: number) => void;
  onSwap: () => void;
  onEditMacros: () => void;
  onRemove: () => void;
}

export function EditableItemRow({
  item,
  onQuantityChange,
  onSwap,
  onEditMacros,
  onRemove,
}: EditableItemRowProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  // Animated value for swipe-to-delete
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteThreshold = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping left (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < deleteThreshold) {
          // Swipe far enough - trigger delete
          haptics.warning();
          Animated.timing(translateX, {
            toValue: -400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onRemove();
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Calculate totals based on servings
  const totalCalories = Math.round(item.calories * item.servings);
  const totalProtein = Math.round(item.protein * item.servings);
  const totalCarbs = Math.round(item.carbs * item.servings);
  const totalFat = Math.round(item.fat * item.servings);

  return (
    <View style={styles.wrapper}>
      {/* Delete background */}
      <View
        style={[
          styles.deleteBackground,
          { backgroundColor: themeColors.error },
        ]}>
        <MaterialIcons name="delete" size={24} color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF' }} weight="medium">
          Remove
        </Text>
      </View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: themeColors.cardBackground },
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}>
        {/* Top row: Name and actions */}
        <View style={styles.topRow}>
          <View style={styles.nameSection}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {item.name}
            </Text>
            {item.isCustomized && (
              <View
                style={[
                  styles.customizedBadge,
                  { backgroundColor: themeColors.warning + '30' },
                ]}>
                <Text
                  variant="caption"
                  style={{ color: themeColors.warning }}>
                  Edited
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: themeColors.backgroundTertiary },
              ]}
              onPress={() => {
                haptics.light();
                onSwap();
              }}
              activeOpacity={0.7}>
              <MaterialIcons
                name="swap-horiz"
                size={18}
                color={themeColors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: themeColors.backgroundTertiary },
              ]}
              onPress={() => {
                haptics.light();
                onEditMacros();
              }}
              activeOpacity={0.7}>
              <MaterialIcons
                name="edit"
                size={18}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Middle row: Macros summary */}
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text
              variant="body"
              weight="semibold"
              style={{ color: themeColors.calories }}>
              {totalCalories}
            </Text>
            <Text variant="caption" color="secondary">
              cal
            </Text>
          </View>

          <View style={styles.macroDivider} />

          <View style={styles.macroItem}>
            <Text
              variant="bodySmall"
              weight="medium"
              style={{ color: themeColors.protein }}>
              {totalProtein}g
            </Text>
            <Text variant="caption" color="secondary">
              protein
            </Text>
          </View>

          <View style={styles.macroDivider} />

          <View style={styles.macroItem}>
            <Text
              variant="bodySmall"
              weight="medium"
              style={{ color: themeColors.carbs }}>
              {totalCarbs}g
            </Text>
            <Text variant="caption" color="secondary">
              carbs
            </Text>
          </View>

          <View style={styles.macroDivider} />

          <View style={styles.macroItem}>
            <Text
              variant="bodySmall"
              weight="medium"
              style={{ color: themeColors.fats }}>
              {totalFat}g
            </Text>
            <Text variant="caption" color="secondary">
              fat
            </Text>
          </View>
        </View>

        {/* Bottom row: Quantity stepper */}
        <View style={styles.bottomRow}>
          <Text variant="caption" color="secondary">
            Servings
          </Text>
          <QuantityStepper
            value={item.servings}
            onChange={onQuantityChange}
            size="sm"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 100,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  container: {
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  customizedBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});
