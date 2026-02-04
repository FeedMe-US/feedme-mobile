/**
 * Auth Callback Screen
 * Handles deep link redirects from Supabase email verification
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/src/lib/supabase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

export default function AuthCallbackScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the full URL that opened this screen
      const url = await Linking.getInitialURL();

      if (!url) {
        // Try to use search params directly (Expo Router may have parsed them)
        if (params.access_token || params.refresh_token) {
          await handleTokens(
            params.access_token as string,
            params.refresh_token as string
          );
          return;
        }

        setStatus('error');
        setErrorMessage('No authentication data received');
        return;
      }

      // Parse the URL to extract tokens
      // Supabase sends tokens in the URL fragment (hash) or query params
      const parsedUrl = Linking.parse(url);

      // Check for tokens in query params
      let accessToken = parsedUrl.queryParams?.access_token as string | undefined;
      let refreshToken = parsedUrl.queryParams?.refresh_token as string | undefined;

      // If not in query params, check the fragment (hash)
      // Format: #access_token=xxx&refresh_token=yyy&...
      if (!accessToken && url.includes('#')) {
        const fragment = url.split('#')[1];
        if (fragment) {
          const fragmentParams = new URLSearchParams(fragment);
          accessToken = fragmentParams.get('access_token') || undefined;
          refreshToken = fragmentParams.get('refresh_token') || undefined;
        }
      }

      if (accessToken && refreshToken) {
        await handleTokens(accessToken, refreshToken);
      } else if (parsedUrl.queryParams?.error) {
        // Handle error from Supabase
        setStatus('error');
        setErrorMessage(
          (parsedUrl.queryParams.error_description as string) ||
          'Authentication failed'
        );
      } else {
        setStatus('error');
        setErrorMessage('Invalid authentication link');
      }
    } catch (error) {
      console.error('[AuthCallback] Error:', error);
      setStatus('error');
      setErrorMessage('Failed to complete authentication');
    }
  };

  const handleTokens = async (accessToken: string, refreshToken: string) => {
    if (!supabase) {
      setStatus('error');
      setErrorMessage('Supabase not configured');
      return;
    }

    // Set the session with Supabase
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error('[AuthCallback] Session error:', error);
      setStatus('error');
      setErrorMessage(error.message);
      return;
    }

    setStatus('success');

    // Navigate to login - the auth state listener will handle the rest
    setTimeout(() => {
      router.replace('/(auth)/login');
    }, 1500);
  };

  return (
    <Screen>
      <View style={styles.container}>
        {status === 'processing' && (
          <>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text variant="body" style={styles.text}>
              Verifying your email...
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <Text variant="h2" weight="bold" style={styles.text}>
              Email Verified!
            </Text>
            <Text variant="body" color="secondary" style={styles.text}>
              Redirecting to login...
            </Text>
          </>
        )}

        {status === 'error' && (
          <>
            <Text variant="h2" weight="bold" style={[styles.text, { color: themeColors.error }]}>
              Verification Failed
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
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  text: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.xl,
  },
});
