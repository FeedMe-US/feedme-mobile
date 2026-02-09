/**
 * Login Screen
 * Simplified Google-only sign in for university students
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { useAuthStore } from '@/src/store/authStore';
import { haptics } from '@/src/utils/haptics';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const params = useLocalSearchParams<{ schoolId?: string; emailDomain?: string }>();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Default to UCLA if no params (direct navigation)
  const emailDomain = params.emailDomain || '@g.ucla.edu';

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

  const handleBack = () => {
    router.back();
  };

  return (
    <Screen>
      <LinearGradient
        colors={[themeColors.primary + '20', 'transparent']}
        style={styles.gradientBg}
      />

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1" weight="bold" style={styles.title}>
            Welcome!
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Sign in to get started
          </Text>
        </View>

        {/* Sign In Section */}
        <View style={styles.signInContainer}>
          {/* Email Domain Hint */}
          <View style={[styles.emailHint, { backgroundColor: themeColors.primary + '15' }]}>
            <Ionicons name="mail-outline" size={20} color={themeColors.primary} />
            <Text variant="body" style={{ color: themeColors.primary }}>
              Use your {emailDomain} email
            </Text>
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              {
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.border,
              },
            ]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}>
            {isGoogleLoading ? (
              <ActivityIndicator color={themeColors.text} />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color={themeColors.text} />
                <Text variant="body" weight="semibold" style={styles.googleButtonText}>
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sign Up Button (same action, different label) */}
          <TouchableOpacity
            style={[
              styles.signUpButton,
              {
                backgroundColor: themeColors.primary,
              },
            ]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}>
            {isGoogleLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="#fff" />
                <Text variant="body" weight="semibold" style={[styles.googleButtonText, { color: '#fff' }]}>
                  Sign up with Google
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" color="secondary" style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
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
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  signInContainer: {
    gap: spacing.lg,
  },
  emailHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderWidth: 1,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  googleButtonText: {
    marginLeft: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  footerText: {
    textAlign: 'center',
  },
});
