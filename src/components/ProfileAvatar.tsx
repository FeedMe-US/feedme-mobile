/**
 * ProfileAvatar - Reusable profile avatar button
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, spacing, radius } from '@/src/theme';
import { Text } from '@/src/ui/Text';
import { haptics } from '@/src/utils/haptics';
import { AppIcon } from './AppIcon';

export function ProfileAvatar() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'dark'];
  const router = useRouter();

  const handlePress = () => {
    haptics.medium();
    router.push('/(tabs)/profile');
  };

  return (
    <TouchableOpacity
      style={[
        styles.avatar,
        {
          backgroundColor: themeColors.primary,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}>
      <AppIcon type="profile" size={20} color={themeColors.textInverse} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
});

