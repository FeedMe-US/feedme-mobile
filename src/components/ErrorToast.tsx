/**
 * ErrorToast - Displays error messages as toast notifications
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { useError, AppError } from '@/src/store/ErrorContext';
import { haptics } from '@/src/utils/haptics';

const { width } = Dimensions.get('window');

interface ToastItemProps {
  error: AppError;
  onDismiss: () => void;
}

function ToastItem({ error, onDismiss }: ToastItemProps) {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getBgColor = () => {
    switch (error.severity) {
      case 'error':
        return themeColors.error + 'EE';
      case 'warning':
        return '#F59E0BEE';
      case 'info':
        return themeColors.primary + 'EE';
      default:
        return themeColors.error + 'EE';
    }
  };

  const getIcon = () => {
    switch (error.severity) {
      case 'error':
        return '!';
      case 'warning':
        return '!';
      case 'info':
        return 'i';
      default:
        return '!';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: getBgColor(),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <View style={styles.toastContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getIcon()}</Text>
        </View>
        <View style={styles.textContainer}>
          {error.title && (
            <Text variant="bodySmall" weight="bold" style={styles.title}>
              {error.title}
            </Text>
          )}
          <Text variant="bodySmall" style={styles.message}>
            {error.message}
          </Text>
        </View>
        {error.dismissible !== false && (
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              handleDismiss();
            }}
            style={styles.dismissButton}>
            <Text style={styles.dismissText}>x</Text>
          </TouchableOpacity>
        )}
      </View>
      {error.action && (
        <TouchableOpacity
          onPress={() => {
            haptics.medium();
            error.action?.onPress();
            handleDismiss();
          }}
          style={styles.actionButton}>
          <Text variant="bodySmall" weight="semibold" style={styles.actionText}>
            {error.action.label}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export function ErrorToast() {
  const { errors, removeError } = useError();

  if (errors.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {errors.slice(0, 3).map((error) => (
        <ToastItem
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    gap: spacing.sm,
  },
  toast: {
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dismissButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  actionText: {
    color: '#FFFFFF',
  },
});
