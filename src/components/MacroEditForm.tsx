/**
 * MacroEditForm - Modal form for manually editing food macros
 * Includes validation and warnings for inconsistent values
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius, typography } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { haptics } from '@/src/utils/haptics';
import { MaterialIcons } from '@expo/vector-icons';

export interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroEditFormProps {
  visible: boolean;
  itemName: string;
  macros: MacroValues;
  originalMacros?: MacroValues;
  onSave: (macros: MacroValues) => void;
  onClose: () => void;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

function validateMacros(macros: MacroValues): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for negative values
  if (macros.calories < 0) errors.push('Calories cannot be negative');
  if (macros.protein < 0) errors.push('Protein cannot be negative');
  if (macros.carbs < 0) errors.push('Carbs cannot be negative');
  if (macros.fat < 0) errors.push('Fat cannot be negative');

  // Sanity checks (warnings, not errors)
  if (macros.calories > 2000) {
    warnings.push('Calories seem high for a single item');
  }
  if (macros.protein > 100) {
    warnings.push('Protein seems high for a single item');
  }
  if (macros.carbs > 200) {
    warnings.push('Carbs seem high for a single item');
  }
  if (macros.fat > 100) {
    warnings.push('Fat seems high for a single item');
  }

  // Macro consistency check
  // Calories = (protein * 4) + (carbs * 4) + (fat * 9)
  const calculatedCal = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
  const difference = Math.abs(calculatedCal - macros.calories);
  if (difference > 50 && macros.calories > 0) {
    warnings.push(
      `Calorie count may not match macros (expected ~${Math.round(calculatedCal)} cal)`
    );
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

export function MacroEditForm({
  visible,
  itemName,
  macros,
  originalMacros,
  onSave,
  onClose,
}: MacroEditFormProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  const [editedMacros, setEditedMacros] = useState<MacroValues>(macros);
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    warnings: [],
    errors: [],
  });

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setEditedMacros(macros);
      setValidation(validateMacros(macros));
    }
  }, [visible, macros]);

  const handleChange = (field: keyof MacroValues, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    const newMacros = { ...editedMacros, [field]: numValue };
    setEditedMacros(newMacros);
    setValidation(validateMacros(newMacros));
  };

  const handleSave = () => {
    if (!validation.isValid) {
      haptics.error();
      return;
    }
    haptics.success();
    onSave(editedMacros);
    onClose();
  };

  const handleReset = () => {
    if (originalMacros) {
      haptics.light();
      setEditedMacros(originalMacros);
      setValidation(validateMacros(originalMacros));
    }
  };

  const hasChanges =
    originalMacros &&
    (editedMacros.calories !== originalMacros.calories ||
      editedMacros.protein !== originalMacros.protein ||
      editedMacros.carbs !== originalMacros.carbs ||
      editedMacros.fat !== originalMacros.fat);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.container,
            { backgroundColor: themeColors.background },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Text variant="h3" weight="bold">
                Edit Macros
              </Text>
              <Text variant="bodySmall" color="secondary" numberOfLines={1}>
                {itemName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* Macro inputs */}
            <View style={styles.inputGroup}>
              <MacroInput
                label="Calories"
                value={editedMacros.calories}
                onChange={(v) => handleChange('calories', v)}
                unit="cal"
                color={themeColors.calories}
                themeColors={themeColors}
              />
              <MacroInput
                label="Protein"
                value={editedMacros.protein}
                onChange={(v) => handleChange('protein', v)}
                unit="g"
                color={themeColors.protein}
                themeColors={themeColors}
              />
              <MacroInput
                label="Carbs"
                value={editedMacros.carbs}
                onChange={(v) => handleChange('carbs', v)}
                unit="g"
                color={themeColors.carbs}
                themeColors={themeColors}
              />
              <MacroInput
                label="Fat"
                value={editedMacros.fat}
                onChange={(v) => handleChange('fat', v)}
                unit="g"
                color={themeColors.fats}
                themeColors={themeColors}
              />
            </View>

            {/* Validation messages */}
            {validation.errors.length > 0 && (
              <View
                style={[
                  styles.messageBox,
                  { backgroundColor: themeColors.errorLight },
                ]}>
                <MaterialIcons
                  name="error"
                  size={18}
                  color={themeColors.error}
                />
                <View style={styles.messageContent}>
                  {validation.errors.map((error, index) => (
                    <Text
                      key={index}
                      variant="bodySmall"
                      style={{ color: themeColors.error }}>
                      {error}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {validation.warnings.length > 0 && (
              <View
                style={[
                  styles.messageBox,
                  { backgroundColor: themeColors.warningLight },
                ]}>
                <MaterialIcons
                  name="warning"
                  size={18}
                  color={themeColors.warning}
                />
                <View style={styles.messageContent}>
                  {validation.warnings.map((warning, index) => (
                    <Text
                      key={index}
                      variant="bodySmall"
                      style={{ color: themeColors.warning }}>
                      {warning}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Reset button */}
            {hasChanges && originalMacros && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}>
                <MaterialIcons
                  name="restore"
                  size={18}
                  color={themeColors.primary}
                />
                <Text
                  variant="bodySmall"
                  style={{ color: themeColors.primary }}>
                  Reset to original values
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              variant="outline"
              size="lg"
              onPress={onClose}
              style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              onPress={handleSave}
              disabled={!validation.isValid}
              style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface MacroInputProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  unit: string;
  color: string;
  themeColors: (typeof colors)['dark'] | (typeof colors)['light'];
}

function MacroInput({
  label,
  value,
  onChange,
  unit,
  color,
  themeColors,
}: MacroInputProps) {
  return (
    <View style={styles.inputRow}>
      <View style={styles.inputLabel}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text variant="body" weight="medium">
          {label}
        </Text>
      </View>
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: themeColors.backgroundSecondary },
        ]}>
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          value={value === 0 ? '' : String(value)}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={themeColors.textTertiary}
          selectTextOnFocus
        />
        <Text variant="bodySmall" color="secondary">
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    flex: 1,
    marginRight: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  inputGroup: {
    gap: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 120,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    textAlign: 'right',
    minWidth: 60,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  messageContent: {
    flex: 1,
    gap: spacing.xs,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});
