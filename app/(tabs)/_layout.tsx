import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { TextColorsProvider } from '@/context/TextColorsContext';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_CONFIG = [
  { name: 'index', label: 'Dojo', icon: 'home-outline' as const, activeIcon: 'home' as const },
  { name: 'quests', label: 'Quests', icon: 'compass-outline' as const, activeIcon: 'compass' as const },
  { name: 'drills', label: 'Drills', icon: 'flash-outline' as const, activeIcon: 'flash' as const },
  { name: 'leaderboard', label: 'Board', icon: 'trophy-outline' as const, activeIcon: 'trophy' as const },
  { name: 'profile', label: 'Profile', icon: 'person-outline' as const, activeIcon: 'person' as const },
];

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index].name;
  if (currentRoute === 'chat' || currentRoute === 'research') return null;

  return (
    <View style={styles.tabBarOuter}>
      <View style={styles.tabBarContainer}>
        {/* Glass tab bar background */}
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const tab = TAB_CONFIG.find(t => t.name === route.name);
            if (!tab) return null;

            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={[styles.tabItem, focused && styles.tabItemActive]}
              >
                <Ionicons
                  name={focused ? tab.activeIcon : tab.icon}
                  size={22}
                  color={focused ? Colors.accentPrimary : 'rgba(255,255,255,0.38)'}
                  style={[styles.tabIcon, focused && styles.tabIconActive]}
                />
                {focused && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View >
  );
}

export default function TabLayout() {
  return (
    <TextColorsProvider>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
      {TAB_CONFIG.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.label }}
        />
      ))}
      <Tabs.Screen name="chat" options={{ tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="research" options={{ tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </TextColorsProvider>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  tabBarContainer: {
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'transparent',
    // white glass glow
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  tabRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(5, 5, 10, 0.45)', // More transparent for better blur
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.pill,
    gap: 2,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.35,
  },
  tabIconActive: {
    opacity: 1,
    fontSize: 22,
    textShadowColor: Colors.accentPrimary,
    textShadowRadius: 15,
  },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.monoBold,
    letterSpacing: 1,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 22,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.accentPrimary,
    shadowColor: Colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.9,
  },
});
