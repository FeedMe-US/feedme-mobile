/**
 * SuccessModal - Custom modal for success confirmations
 * Replaces native Alert.alert with a styled modal
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { AppIcon } from '@/src/components/AppIcon';

export interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export function SuccessModal({
  visible,
  title,
  message,
  onClose,
  autoCloseMs,
}: SuccessModalProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];

  useEffect(() => {
    if (visible && autoCloseMs) {
      const timer = setTimeout(onClose, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [visible, autoCloseMs, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: themeColors.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: themeColors.cardBackground },
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: themeColors.success + '20' }]}>
                <AppIcon type="check" size={32} />
              </View>

              <Text variant="h3" weight="bold" style={styles.title}>
                {title}
              </Text>

              <Text variant="body" color="secondary" style={styles.message}>
                {message}
              </Text>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: themeColors.primary }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text variant="body" weight="semibold" style={{ color: themeColors.textInverse }}>
                  OK
                </Text>
              </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    minWidth: 120,
    alignItems: 'center',
  },
});
