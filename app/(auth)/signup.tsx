/**
 * Signup Screen
 * New user registration with university email validation
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
import { University } from '@/src/services/authService';

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const checkEmail = useAuthStore((s) => s.checkEmail);

  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [university, setUniversity] = useState<University | null>(null);

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    haptics.light();

    try {
      const result = await checkEmail(email.trim().toLowerCase());

      if (result.isSupported && result.university) {
        setUniversity(result.university);
        setStep('password');
        haptics.success();
      } else if (result.university === null && result.message.includes('waitlist')) {
        // .edu email but university not supported yet
        Alert.alert(
          'Join Waitlist',
          'Your university isn\'t supported yet. Would you like to join the waitlist?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Join', onPress: () => Alert.alert('Thanks!', 'We\'ll notify you when your university is added.') },
          ]
        );
      } else {
        Alert.alert('Not Supported', result.message);
        haptics.warning();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    haptics.light();

    try {
      const result = await signUp(email.trim().toLowerCase(), password);

      if (result.success) {
        haptics.success();
        Alert.alert(
          'Check Your Email',
          'We sent a verification link to your email. Please verify to continue.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        Alert.alert('Signup Failed', result.error || 'Failed to create account');
        haptics.error();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
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
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text variant="h2" weight="bold" style={styles.title}>
                Create Account
              </Text>
              <Text variant="body" color="secondary" style={styles.subtitle}>
                {step === 'email'
                  ? 'Enter your university email to get started'
                  : `Signing up with ${university?.name || 'your university'}`}
              </Text>
            </View>

            {/* University Badge */}
            {university && (
              <View style={[styles.universityBadge, { backgroundColor: themeColors.primary + '20' }]}>
                <Text variant="body" weight="semibold" style={{ color: themeColors.primary }}>
                  {university.name}
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              {step === 'email' ? (
                <>
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
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!isLoading}
                    />
                  </View>

                  <Button
                    variant="primary"
                    size="lg"
                    onPress={handleCheckEmail}
                    disabled={isLoading || !email.trim()}
                    fullWidth
                    style={styles.button}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : 'Continue'}
                  </Button>
                </>
              ) : (
                <>
                  {/* Password Inputs */}
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
                      placeholder="At least 8 characters"
                      placeholderTextColor={themeColors.textSecondary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete="password-new"
                      editable={!isLoading}
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
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.buttonRow}>
                    <Button
                      variant="outline"
                      size="lg"
                      onPress={() => setStep('email')}
                      disabled={isLoading}
                      style={styles.backButton}>
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onPress={handleSignup}
                      disabled={isLoading || !password.trim() || !confirmPassword.trim()}
                      style={styles.signupButton}>
                      {isLoading ? <ActivityIndicator color="#fff" /> : 'Create Account'}
                    </Button>
                  </View>
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text variant="bodySmall" color="secondary">
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text variant="bodySmall" style={{ color: themeColors.primary }}>
                  Sign in
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <Text variant="caption" color="secondary" style={styles.terms}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
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
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  universityBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
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
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  signupButton: {
    flex: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  terms: {
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
