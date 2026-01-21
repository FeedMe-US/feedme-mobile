/**
 * Privacy Settings Screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Card } from '@/src/ui/Card';
import { Toggle } from '@/src/ui/Toggle';
import { haptics } from '@/src/utils/haptics';
import { AppIcon } from '@/src/components/AppIcon';

export default function PrivacySettingsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [healthDataEnabled, setHealthDataEnabled] = useState(false);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        haptics.light();
      } else {
        Alert.alert('Error', 'Unable to open this link');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Unable to open this link');
    }
  };

  const handleExportData = () => {
    haptics.medium();
    Alert.alert(
      'Export Data',
      'Your data export will be sent to your registered email address. This process may take a few minutes.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteData = () => {
    haptics.medium();
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your account data, including meal logs, preferences, and progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirm', 'Are you absolutely sure?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete All Data',
                style: 'destructive',
                onPress: () => {
                  haptics.error();
                  // In a real implementation, this would trigger the deletion process
                },
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1" weight="bold" style={styles.title}>
            Privacy Settings
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <AppIcon type="close" size={24} />
          </TouchableOpacity>
        </View>

        {/* Data Collection */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Data Collection
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="body" weight="medium" style={styles.settingLabel}>
                Usage Analytics
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.settingDescription}>
                Help us improve the app by sharing anonymous usage data
              </Text>
            </View>
            <Toggle value={analyticsEnabled} onValueChange={setAnalyticsEnabled} />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingInfo}>
              <Text variant="body" weight="medium" style={styles.settingLabel}>
                Personalized Recommendations
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.settingDescription}>
                Use your data to provide personalized meal recommendations
              </Text>
            </View>
            <Toggle value={personalizationEnabled} onValueChange={setPersonalizationEnabled} />
          </View>
        </Card>

        {/* Location & Services */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Location & Services
          </Text>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingInfo}>
              <Text variant="body" weight="medium" style={styles.settingLabel}>
                Location Services
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.settingDescription}>
                Enable location-based dining hall recommendations
              </Text>
            </View>
            <Toggle value={locationEnabled} onValueChange={setLocationEnabled} />
          </View>
        </Card>

        {/* Health Data */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Health Integration
          </Text>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingInfo}>
              <Text variant="body" weight="medium" style={styles.settingLabel}>
                Health App Integration
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.settingDescription}>
                Sync nutrition data with Apple Health or Google Fit
              </Text>
            </View>
            <Toggle value={healthDataEnabled} onValueChange={setHealthDataEnabled} />
          </View>
        </Card>

        {/* Account Data */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Account Data
          </Text>

          <TouchableOpacity
            style={styles.dataActionRow}
            onPress={handleExportData}>
            <View style={styles.settingInfo}>
              <Text variant="body" weight="medium" style={styles.settingLabel}>
                Export My Data
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.settingDescription}>
                Download a copy of all your data
              </Text>
            </View>
            <Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

          <TouchableOpacity
            style={styles.dataActionRow}
            onPress={handleDeleteData}>
            <View style={styles.settingInfo}>
              <Text variant="body" weight="medium" style={[styles.settingLabel, { color: themeColors.error }]}>
                Delete All Data
              </Text>
              <Text variant="bodySmall" color="secondary" style={styles.settingDescription}>
                Permanently delete your account and all data
              </Text>
            </View>
            <Text style={{ color: themeColors.error, fontSize: 14 }}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* Legal */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Legal
          </Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink('https://example.com/privacy-policy')}>
            <Text variant="body" weight="medium" style={styles.linkText}>
              Privacy Policy
            </Text>
            <Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>→</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenLink('https://example.com/terms-of-service')}>
            <Text variant="body" weight="medium" style={styles.linkText}>
              Terms of Service
            </Text>
            <Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* Information */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text variant="bodySmall" color="secondary" style={styles.infoText}>
            Your data is encrypted and stored securely. We never sell your personal information to third parties.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  dataActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    flex: 1,
  },
  infoText: {
    lineHeight: 20,
    textAlign: 'center',
  },
});
