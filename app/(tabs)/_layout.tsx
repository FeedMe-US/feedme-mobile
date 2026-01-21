import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { AppIcon } from '@/src/components/AppIcon';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light']; // Default to light for Neumorphism
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: themeColors.tabBarBackground,
          borderTopWidth: 0, // Remove hard border line
          borderTopColor: 'transparent', // Ensure no border color
          elevation: 0, // Remove Android shadow/elevation
          shadowOpacity: 0, // Remove iOS shadow
          shadowColor: 'transparent', // Ensure no shadow color
          shadowOffset: { width: 0, height: 0 }, // No shadow offset
          shadowRadius: 0, // No shadow blur
          paddingTop: 10, // Add top padding to make tab bar extend upward
          paddingBottom: Math.max(insets.bottom, 8), // Use safe area insets with minimum padding
          height: 60 + Math.max(insets.bottom, 8), // Make tab bar taller, accounting for safe area
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <MaterialIcons name="restaurant-menu" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: ({ color }) => <AppIcon type="diary" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <AppIcon type="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <AppIcon type="progress" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <AppIcon type="profile" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
