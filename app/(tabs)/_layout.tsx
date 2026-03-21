import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { TextColorsProvider } from '@/context/TextColorsContext';
import { useTextColors } from '@/context/TextColorsContext';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import FluentEmoji, { type FluentEmojiName } from '@/components/FluentEmoji';

const TAB_CONFIG = [
  { name: 'index', label: 'Dojo', icon: 'crossedSwords' as FluentEmojiName },
  { name: 'quests', label: 'Quests', icon: 'bullseye' as FluentEmojiName },
  { name: 'drills', label: 'Drills', icon: 'highVoltage' as FluentEmojiName },
  { name: 'leaderboard', label: 'Board', icon: 'crown' as FluentEmojiName },
  { name: 'profile', label: 'Profile', icon: 'dna' as FluentEmojiName },
];

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const routes = Array.isArray(state?.routes) ? state.routes : [];
  const { textSecondary } = useTextColors();
  if (routes.length === 0) return null;

  const currentRoute = routes[state.index]?.name;
  if (currentRoute === 'chat' || currentRoute === 'research') return null;

  return (
    <View style={styles.tabBarOuter}>
      <View style={styles.tabBarContainer}>
        <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.12)',
            'rgba(255,255,255,0.03)',
            'rgba(0,0,0,0.22)',
            'rgba(0,0,0,0.46)',
          ]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glassSheen} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255,255,255,0.38)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.00)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.glassSheenGradient}
          />
        </View>
        <View style={styles.innerShadow} pointerEvents="none" />
        <View style={styles.tabRow}>
          {routes.map((route, index) => {
            const focused = state.index === index;
            const tab = TAB_CONFIG.find(t => t.name === route.name);
            if (!tab) return null;

            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={[
                  styles.tabItem,
                  focused && styles.tabItemActive,
                  focused && {
                    shadowColor: textSecondary,
                  },
                ]}
              >
                {focused && (
                  <View style={styles.tabItemSheen} pointerEvents="none">
                    <LinearGradient
                      colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)']}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.tabItemSheenGradient}
                    />
                  </View>
                )}
                <FluentEmoji
                  name={tab.icon}
                  size={focused ? 27 : 24}
                  opacity={focused ? 1 : 0.56}
                  style={[
                    styles.tabIconImage,
                    focused && styles.tabIconImageActive,
                  ]}
                />
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'rgba(2, 2, 7, 0.54)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 24,
  },
  glassSheen: {
    position: 'absolute',
    top: 2,
    left: 7,
    right: 7,
    height: '50%',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  glassSheenGradient: {
    flex: 1,
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.62,
    shadowRadius: 26,
  },
  tabRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(2, 2, 7, 0.5)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.pill,
    marginHorizontal: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
  tabItemSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.pill,
  },
  tabItemSheenGradient: {
    flex: 1,
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.9,
  },
  tabIconActive: {
    opacity: 1,
    fontSize: 24,
    textShadowRadius: 15,
  },
  tabIconImage: {
    marginVertical: 1,
  },
  tabIconImageActive: {
    transform: [{ scale: 1.04 }],
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
});
