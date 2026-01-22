import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Screen } from '@/src/ui/Screen';
import { setOnboardingComplete } from '@/src/lib/onboarding';
import { getOnboardingData, onboardingDataToProfile, clearOnboardingData } from '@/src/lib/onboardingData';
import { apiClient } from '@/src/services/api';
import { useIsAuthenticated } from '@/src/store/authStore';

export default function CompleteScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const isMounted = useRef(true);
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    console.log('[Onboarding] ========== COMPLETE SCREEN MOUNTED ==========');
    console.log('[Onboarding] isAuthenticated:', isAuthenticated);
    isMounted.current = true;

    // Mark onboarding as complete and sync data
    const completeOnboarding = async () => {
      console.log('[Onboarding] completeOnboarding() function started');
      try {
        // Get all onboarding data
        const onboardingData = await getOnboardingData();
        console.log('[Onboarding] Raw onboarding data:', JSON.stringify(onboardingData, null, 2));

        // Convert to profile format
        const profileData = onboardingDataToProfile(onboardingData);
        console.log('[Onboarding] Converted profile data:', JSON.stringify(profileData, null, 2));

        // Sync with backend (user should be authenticated)
        console.log('[Onboarding] Attempting to sync profile to backend...');
        const response = await apiClient.put('/user/profile', profileData);

        if (response.error) {
          console.error('[Onboarding] Backend sync FAILED:', response.error);
          console.error('[Onboarding] Response status:', response.status);
          // Keep onboarding data locally for retry on next login
          console.log('[Onboarding] Keeping local data for retry');
        } else {
          console.log('[Onboarding] Profile synced to backend successfully');
          console.log('[Onboarding] Response data:', JSON.stringify(response.data, null, 2));
          // Clear onboarding data after successful sync
          await clearOnboardingData();
          console.log('[Onboarding] Local onboarding data cleared');
        }

        // Mark onboarding as complete locally
        await setOnboardingComplete(true);
        console.log('[Onboarding] Local onboarding flag set to TRUE');
      } catch (error) {
        console.error('[Onboarding] Exception during completion:', error);
        // Still mark as complete even if sync fails
        await setOnboardingComplete(true);
        console.log('[Onboarding] Local onboarding flag set to TRUE (after error)');
      }

      // Auto-navigate after 2 seconds (only if still mounted)
      console.log('[Onboarding] Setting up navigation timer (2 seconds)...');
      setTimeout(() => {
        console.log('[Onboarding] Timer fired, isMounted:', isMounted.current);
        if (isMounted.current) {
          // Navigate to swipe-seed step (final frontend-only onboarding step).
          // Auth gate will handle any edge cases afterwards.
          console.log('[Onboarding] Navigating to swipe-seed step...');
          router.replace('/(onboarding)/swipe-seed');
        } else {
          console.log('[Onboarding] Component unmounted, skipping navigation');
        }
      }, 2000);
    };

    completeOnboarding();

    // Cleanup: mark as unmounted to prevent navigation after unmount
    return () => {
      isMounted.current = false;
    };
  }, [router, isAuthenticated]);

  return (
    <Screen>
      <View style={styles.container}>
        {/* Success Icon */}
        <View style={[styles.iconCircle, { backgroundColor: themeColors.success }]}>
          <MaterialIcons name="check" size={48} color="#FFFFFF" />
        </View>

        {/* Success Message */}
        <Text variant="h1" weight="bold" style={styles.title}>
          You&apos;re all set!
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Your personalized nutrition plan is ready
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
