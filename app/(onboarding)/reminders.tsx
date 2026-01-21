import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { MaterialIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
const phoneWidth = Math.min(280, screenWidth * 0.7);
const phoneAspectRatio = 844 / 390; // iPhone 14 Pro aspect ratio
const phoneHeight = phoneWidth * phoneAspectRatio;

export default function RemindersScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleAddWidget = () => {
    router.push('/(onboarding)/complete');
  };

  const handleMaybeLater = () => {
    router.push('/(onboarding)/complete');
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>

          {/* Header - Removed icon */}
          <View style={styles.header}>
            <Text variant="h1" weight="bold" style={styles.title}>
              Get reminders on your lock screen
            </Text>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Never miss a meal with personalized nutrition reminders
            </Text>
          </View>

          {/* Phone Mockup */}
          <View style={styles.phoneContainer}>
            <View style={[styles.phoneFrame, { backgroundColor: '#000000' }]}>
              <View style={[styles.phoneScreen, { backgroundColor: '#1A237E' }]}>
                {/* Lock Screen Content */}
                <View style={styles.lockScreenContent}>
                  <Text style={[styles.lockTime, { color: '#FFFFFF' }]}>11:41</Text>
                  <Text style={[styles.lockDate, { color: '#FFFFFF' }]}>Tuesday, December 30</Text>
                  
                  {/* Notification Widget */}
                  <View style={[styles.notificationWidget, { backgroundColor: '#283593' }]}>
                    <View style={styles.widgetHeader}>
                      <View style={[styles.appIcon, { backgroundColor: themeColors.primary }]}>
                        <Text style={[styles.appIconText, { color: '#FFFFFF' }]}>BN</Text>
                      </View>
                      <View style={styles.widgetHeaderText}>
                        <Text style={[styles.widgetAppName, { color: '#FFFFFF' }]}>BruinNutrition</Text>
                        <Text style={[styles.widgetTime, { color: '#FFFFFF' }]}>12:30 PM</Text>
                      </View>
                    </View>
                    <Text style={[styles.widgetTitle, { color: '#FFFFFF' }]}>Time for lunch! 🍽️</Text>
                    <Text style={[styles.widgetMeal, { color: '#FFFFFF' }]}>Grilled chicken bowl at De Neve</Text>
                    <Text style={[styles.widgetNutrition, { color: '#FFFFFF' }]}>520 cal • 42g protein</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleAddWidget}>
          Add Widget
        </Button>
        <TouchableOpacity onPress={handleMaybeLater} style={styles.maybeLaterButton}>
          <Text variant="body" color="secondary">
            Maybe later
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  phoneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    minHeight: phoneHeight + 40,
  },
  phoneFrame: {
    width: phoneWidth,
    height: phoneHeight,
    borderRadius: 40,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 32,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  lockScreenContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.xl,
  },
  lockTime: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    lineHeight: 56,
  },
  lockDate: {
    fontSize: 16,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  notificationWidget: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  widgetHeaderText: {
    flex: 1,
  },
  widgetAppName: {
    fontSize: 12,
    fontWeight: '600',
  },
  widgetTime: {
    fontSize: 10,
    opacity: 0.8,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  widgetMeal: {
    fontSize: 14,
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  widgetNutrition: {
    fontSize: 12,
    opacity: 0.8,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  maybeLaterButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
});
