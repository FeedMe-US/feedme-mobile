/**
 * School Selection Screen
 * First screen users see - choose their university
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';

interface School {
  id: string;
  name: string;
  slug: string;
  emailDomain: string;
  primaryColor: string;
  available: boolean;
}

const SCHOOLS: School[] = [
  {
    id: 'ucla',
    name: 'UCLA',
    slug: 'ucla',
    emailDomain: '@g.ucla.edu',
    primaryColor: '#2774AE', // UCLA Blue
    available: true,
  },
  {
    id: 'stanford',
    name: 'Stanford',
    slug: 'stanford',
    emailDomain: '@stanford.edu',
    primaryColor: '#8C1515', // Stanford Cardinal
    available: false,
  },
];

export default function SelectSchoolScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();

  const handleDevBypass = () => {
    haptics.light();
    useAuthStore.setState({
      status: 'authenticated',
      user: {
        user_id: 'dev-bypass-user',
        email: 'dev@test.ucla.edu',
        university_id: 1,
        university_slug: 'ucla',
        university_name: 'UCLA',
      },
      university: {
        id: 1,
        slug: 'ucla',
        name: 'UCLA',
        primary_color: '#2774AE',
      },
      _initialized: true,
    });
  };

  const handleSelectSchool = (school: School) => {
    if (!school.available) {
      haptics.warning();
      return;
    }

    haptics.light();
    // Navigate to login with selected school
    router.push({
      pathname: '/(auth)/login',
      params: { schoolId: school.id, emailDomain: school.emailDomain },
    });
  };

  return (
    <Screen>
      <LinearGradient
        colors={[themeColors.primary + '20', 'transparent']}
        style={styles.gradientBg}
      />

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

        {/* School Selection */}
        <View style={styles.schoolsContainer}>
          <Text variant="h3" weight="semibold" style={styles.sectionTitle}>
            Select your school
          </Text>

          <View style={styles.schoolsList}>
            {SCHOOLS.map((school) => (
              <TouchableOpacity
                key={school.id}
                style={[
                  styles.schoolCard,
                  {
                    backgroundColor: themeColors.cardBackground,
                    borderColor: school.available ? school.primaryColor : themeColors.border,
                    opacity: school.available ? 1 : 0.6,
                  },
                ]}
                onPress={() => handleSelectSchool(school)}
                activeOpacity={school.available ? 0.7 : 1}>
                <View style={styles.schoolInfo}>
                  <View
                    style={[
                      styles.schoolIcon,
                      { backgroundColor: school.primaryColor + '20' },
                    ]}>
                    <Ionicons
                      name="school"
                      size={28}
                      color={school.primaryColor}
                    />
                  </View>
                  <View style={styles.schoolText}>
                    <Text variant="h3" weight="semibold">
                      {school.name}
                    </Text>
                    <Text variant="bodySmall" color="secondary">
                      {school.emailDomain}
                    </Text>
                  </View>
                </View>

                {school.available ? (
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={themeColors.textSecondary}
                  />
                ) : (
                  <View style={[styles.comingSoonBadge, { backgroundColor: themeColors.border }]}>
                    <Text variant="caption" color="secondary">
                      Coming Soon
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" color="secondary" style={styles.footerText}>
            More universities coming soon!
          </Text>

          {__DEV__ && (
            <TouchableOpacity
              style={styles.devBypassButton}
              onPress={handleDevBypass}
              activeOpacity={0.7}>
              <Ionicons name="bug" size={16} color="#FF6B00" />
              <Text variant="bodySmall" style={styles.devBypassText}>
                Dev Bypass (Local Testing)
              </Text>
            </TouchableOpacity>
          )}
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
  schoolsContainer: {
    gap: spacing.lg,
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  schoolsList: {
    gap: spacing.md,
  },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  schoolIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolText: {
    gap: spacing.xxs,
  },
  comingSoonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  footerText: {
    textAlign: 'center',
  },
  devBypassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderStyle: 'dashed',
  },
  devBypassText: {
    color: '#FF6B00',
  },
});
