/**
 * Reset Password Screen
 * Handles deep link redirects from Supabase password reset emails
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/src/lib/supabase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { haptics } from '@/src/utils/haptics';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    verifyResetToken();
  }, []);

  const verifyResetToken = async () => {
    try {
      const url = await Linking.getInitialURL();

      if (!url) {
        setStatus('error');
        setErrorMessage('Invalid password reset link');
        return;
      }

      // Parse tokens from URL
      let accessToken: string | undefined;
      let refreshToken: string | undefined;

      if (url.includes('#')) {
        const fragment = url.split('#')[1];
        if (fragment) {
          const fragmentParams = new URLSearchParams(fragment);
          accessToken = fragmentParams.get('access_token') || undefined;
          refreshToken = fragmentParams.get('refresh_token') || undefined;
        }
      }

      if (!accessToken || !refreshToken || !supabase) {
        setStatus('error');
        setErrorMessage('Invalid or expired reset link');
        return;
      }

      // Set the session
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setStatus('error');
        setErrorMessage('Reset link has expired');
        return;
      }

      setStatus('ready');
    } catch (error) {
      console.error('[ResetPassword] Error:', error);
      setStatus('error');
      setErrorMessage('Failed to verify reset link');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!supabase) {
      Alert.alert('Error', 'Authentication not configured');
      return;
    }

    setIsSubmitting(true);
    haptics.light();

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert('Error', error.message);
        haptics.error();
        return;
      }

      haptics.success();
      setStatus('success');

      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
      haptics.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text variant="body" style={styles.text}>
            Verifying reset link...
          </Text>
        </View>
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text variant="h2" weight="bold" style={[styles.text, { color: themeColors.error }]}>
            Reset Failed
          </Text>
          <Text variant="body" color="secondary" style={styles.text}>
            {errorMessage}
          </Text>
          <Text
            variant="body"
            style={[styles.link, { color: themeColors.primary }]}
            onPress={() => router.replace('/(auth)/login')}
          >
            Return to Login
          </Text>
        </View>
      </Screen>
    );
  }

  if (status === 'success') {
    return (
      <Screen>
        <View style={styles.centerContainer}>
          <Text variant="h2" weight="bold" style={styles.text}>
            Password Reset!
          </Text>
          <Text variant="body" color="secondary" style={styles.text}>
            Redirecting to login...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text variant="h2" weight="bold" style={styles.title}>
            Set New Password
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Enter your new password below
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text variant="caption" color="secondary" style={styles.inputLabel}>
                New Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor: themeColors.border,
                  },
                ]}
                placeholder="At least 8 characters"
                placeholderTextColor={themeColors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text variant="caption" color="secondary" style={styles.inputLabel}>
                Confirm Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor: themeColors.border,
                  },
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={themeColors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password-new"
                editable={!isSubmitting}
              />
            </View>

            <Button
              variant="primary"
              size="lg"
              onPress={handleResetPassword}
              disabled={isSubmitting || !newPassword.trim() || !confirmPassword.trim()}
              fullWidth
              style={styles.button}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : 'Reset Password'}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  inputLabel: {
    marginLeft: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  button: {
    marginTop: spacing.md,
  },
  text: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.xl,
  },
});
