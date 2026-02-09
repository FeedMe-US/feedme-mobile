/**
 * Login Screen
 * Email/password login with university email validation
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { useAuthStore } from '@/src/store/authStore';
import { haptics } from '@/src/utils/haptics';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const checkEmail = useAuthStore((s) => s.checkEmail);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [universityName, setUniversityName] = useState<string | null>(null);

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    haptics.light();

    try {
      const result = await checkEmail(email.trim().toLowerCase());

      if (result.isSupported) {
        setEmailChecked(true);
        setUniversityName(result.university?.name || null);
        haptics.success();
      } else {
        Alert.alert('Not Supported', result.message);
        haptics.warning();
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    haptics.light();

    try {
      const result = await signIn(email.trim().toLowerCase(), password);

      if (result.success) {
        haptics.success();
        // Don't navigate explicitly - the auth gate will detect the auth state change
        // and route to tabs (if onboarding complete) or onboarding (if not)
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
        haptics.error();
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Navigate to forgot password screen
    Alert.alert('Coming Soon', 'Password reset will be available soon.');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    haptics.light();

    try {
      const result = await signInWithGoogle();

      if (result.success) {
        haptics.success();
        // The auth callback will handle session and redirect to onboarding
      } else if (result.error && result.error !== 'Sign in was cancelled') {
        Alert.alert('Sign In Failed', result.error);
        haptics.error();
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <LinearGradient
          colors={[themeColors.primary + '20', 'transparent']}
          style={styles.gradientBg}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h1" weight="bold" style={styles.title}>
              FeedMe
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Smart dining for campus life
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {universityName && (
              <View style={[styles.universityBadge, { backgroundColor: themeColors.primary + '20' }]}>
                <Text variant="bodySmall" style={{ color: themeColors.primary }}>
                  {universityName}
                </Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text variant="caption" color="secondary" style={styles.inputLabel}>
                University Email
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
                placeholder="you@university.edu"
                placeholderTextColor={themeColors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailChecked(false);
                  setUniversityName(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            {/* Password Input (shown after email check) */}
            {emailChecked && (
              <View style={styles.inputContainer}>
                <Text variant="caption" color="secondary" style={styles.inputLabel}>
                  Password
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
                  placeholder="Enter your password"
                  placeholderTextColor={themeColors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  editable={!isLoading}
                />
              </View>
            )}

            {/* Action Button */}
            {!emailChecked ? (
              <Button
                variant="primary"
                size="lg"
                onPress={handleCheckEmail}
                disabled={isLoading || !email.trim()}
                fullWidth
                style={styles.button}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  'Continue'
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onPress={handleLogin}
                disabled={isLoading || !password.trim()}
                fullWidth
                style={styles.button}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  'Sign In'
                )}
              </Button>
            )}

            {/* Secondary Actions */}
            {emailChecked && (
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
                <Text variant="bodySmall" color="secondary">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
              <Text variant="caption" color="secondary" style={styles.dividerText}>
                or
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                {
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}>
              {isGoogleLoading ? (
                <ActivityIndicator color={themeColors.text} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={themeColors.text} />
                  <Text variant="body" style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodySmall" color="secondary">
              Don&apos;t have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text variant="bodySmall" style={{ color: themeColors.primary }}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: 42,
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  universityBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
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
  forgotButton: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  googleButtonText: {
    marginLeft: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
});
