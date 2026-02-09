import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useEffect, useState, useRef } from 'react';

import { queryClient } from '@/src/lib/queryClient';
import { DailyTrackingProvider } from '@/src/store/DailyTrackingContext';
import { useAuthStore, useIsAuthenticated, useAuthLoading } from '@/src/store/authStore';
import { useResolvedTheme } from '@/src/store/themeStore';
import { getOnboardingComplete, setOnboardingComplete } from '@/src/lib/onboarding';
import { apiClient } from '@/src/services/api';
import { logEnvironment } from '@/src/config/environment';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthAndOnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const [isChecking, setIsChecking] = useState(true);
  const lastAuthState = useRef<boolean | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Reset check state when auth changes (e.g., login/logout)
    if (lastAuthState.current !== null && lastAuthState.current !== isAuthenticated) {
      setIsChecking(true);
    }
    lastAuthState.current = isAuthenticated;

    const checkAuthAndOnboarding = async () => {
      try {
        const currentRoute = segments[0] || '';

        // LOCAL DEV ONBOARDING MODE:
        // When running in a dev build (__DEV__), we ignore the backend onboarding flag
        // and rely ONLY on the local AsyncStorage flag. This guarantees that:
        // - Tapping "[DEV] Reset Onboarding" + reload always takes you back to onboarding
        // - You can redo onboarding even on a real, logged-in account
        // This does NOT affect production builds.
        if (__DEV__) {
          console.log('[AuthGate] DEV build');
          console.log('[AuthGate] DEV - isAuthenticated:', isAuthenticated);
          console.log('[AuthGate] DEV - Current route:', currentRoute);

          const isOnboardingRoute = currentRoute === '(onboarding)';
          const isTabsRoute = currentRoute === '(tabs)';
          const isAuthRoute = currentRoute === '(auth)';

          // RULE 1: Not authenticated -> always go to login first
          if (!isAuthenticated) {
            console.log('[AuthGate] DEV - NOT authenticated, redirecting to login');
            if (!isAuthRoute) {
              router.replace('/(auth)/login');
            }
            setIsChecking(false);
            return;
          }

          // RULE 2: Authenticated - check onboarding status
          const onboardingComplete = await getOnboardingComplete();
          console.log('[AuthGate] DEV - Onboarding complete:', onboardingComplete);

          if (!onboardingComplete) {
            // Authenticated but onboarding not complete -> onboarding
            console.log('[AuthGate] DEV - Authenticated but onboarding NOT complete, redirecting to onboarding');
            if (!isOnboardingRoute) {
              router.replace('/(onboarding)/goal');
            }
          } else {
            // Authenticated AND onboarding complete -> tabs
            if (!isTabsRoute) {
              console.log('[AuthGate] DEV - Authenticated AND onboarding complete, redirecting to tabs');
              router.replace('/(tabs)');
            }
          }

          setIsChecking(false);
          return;
        }

        // Dev bypass: skip onboarding if EXPO_PUBLIC_SKIP_ONBOARDING is set and we're in dev mode
        const skipOnboarding =
          __DEV__ &&
          process.env.EXPO_PUBLIC_SKIP_ONBOARDING === 'true';

        if (skipOnboarding) {
          setIsChecking(false);
          return;
        }

        // Dev mode: force show onboarding if EXPO_PUBLIC_FORCE_ONBOARDING is set
        const forceOnboarding =
          __DEV__ &&
          process.env.EXPO_PUBLIC_FORCE_ONBOARDING === 'true';

        if (forceOnboarding) {
          if (currentRoute !== '(onboarding)') {
            router.replace('/(onboarding)/goal');
          }
          setIsChecking(false);
          return;
        }

        // Determine current route type
        const isAuthRoute = currentRoute === '(auth)';
        const isOnboardingRoute = currentRoute === '(onboarding)';

        // RULE 1: Unauthenticated users -> always go to login first
        // Onboarding happens AFTER authentication, not before
        if (!isAuthenticated) {
          console.log('[AuthGate] Not authenticated, redirecting to login');
          if (!isAuthRoute) {
            router.replace('/(auth)/login');
          }
          setIsChecking(false);
          return;
        }

        // RULE 2: Authenticated users - check onboarding status
        // Ensure API client has loaded any stored token
        await apiClient.waitForInit();

        // Fetch profile from backend to check onboarding status
        console.log('[AuthGate] Fetching profile from backend...');
        const response = await apiClient.get<{ onboarding_complete: boolean }>('/user/profile');
        console.log('[AuthGate] Profile response status:', response.status);

        // Handle auth errors - redirect to login
        if (response.status === 401 || response.status === 403) {
          console.warn('[AuthGate] Auth token invalid/expired, redirecting to login');
          router.replace('/(auth)/login');
          setIsChecking(false);
          return;
        }

        // Handle user not found - new user needs onboarding
        if (response.status === 404) {
          console.log('[AuthGate] User profile not found (404), redirecting to onboarding');
          if (!isOnboardingRoute) {
            router.replace('/(onboarding)/goal');
          }
          setIsChecking(false);
          return;
        }

        // Determine onboarding status from backend (source of truth)
        let onboardingComplete = await getOnboardingComplete();
        console.log('[AuthGate] Local onboarding flag:', onboardingComplete);

        if (response.data && response.data.onboarding_complete !== undefined) {
          const backendComplete = response.data.onboarding_complete;
          console.log('[AuthGate] Backend onboarding_complete:', backendComplete);

          // Sync local flag with backend
          if (backendComplete !== onboardingComplete) {
            console.log('[AuthGate] Syncing local flag to match backend:', backendComplete);
            await setOnboardingComplete(backendComplete);
            onboardingComplete = backendComplete;
          }
        } else {
          console.log('[AuthGate] Backend response data:', JSON.stringify(response.data, null, 2));
        }

        // RULE 3: Authenticated but onboarding not complete -> onboarding
        if (!onboardingComplete && !isOnboardingRoute) {
          console.log('[AuthGate] Onboarding not complete, redirecting to onboarding');
          router.replace('/(onboarding)/goal');
          setIsChecking(false);
          return;
        }

        // RULE 4: Authenticated and onboarding complete -> dashboard
        if (onboardingComplete && currentRoute !== '(tabs)') {
          console.log('[AuthGate] Onboarding complete, redirecting to dashboard');
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error checking auth/onboarding status:', error);
        // On network error, fall back to local onboarding flag
        const isComplete = await getOnboardingComplete();
        const currentRoute = segments[0];
        if (isComplete && currentRoute !== '(tabs)') {
          router.replace('/(tabs)');
        } else if (!isComplete && currentRoute !== '(onboarding)') {
          router.replace('/(onboarding)/goal');
        }
      } finally {
        setIsChecking(false);
      }
    };

    // Small delay to ensure router is ready
    const timer = setTimeout(() => {
      checkAuthAndOnboarding();
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]); // Re-run when auth state changes

  // Show loading state while checking
  if (authLoading || isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const colorScheme = useResolvedTheme();

  return (
    <DailyTrackingProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthAndOnboardingGate>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="scan-results" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="manual-log" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="select-items" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="privacy-settings" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="edit-recommendation" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
        </AuthAndOnboardingGate>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </DailyTrackingProvider>
  );
}

export default function RootLayout() {
  // Initialize auth store and log environment on mount
  useEffect(() => {
    logEnvironment();
    useAuthStore.getState().initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <AppContent />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
