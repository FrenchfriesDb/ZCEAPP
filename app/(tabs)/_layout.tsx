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

const getSolidAccent = (color: string) => {
  const rgbaMatch = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgbaMatch) {
    return `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
  }
  return color.replace(/88$/i, '').replace(/44$/i, '');
};

const tintWithAlpha = (color: string, alpha: number) => {
  const rgbMatch = color.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }
  return color;
};

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const routes = Array.isArray(state?.routes) ? state.routes : [];
  const { textPrimary, textSecondary } = useTextColors();
  if (routes.length === 0) return null;

  const currentRoute = routes[state.index]?.name;
  if (currentRoute === 'chat' || currentRoute === 'research') return null;

  return (
    <View style={styles.tabBarOuter}>
      <View style={styles.tabBarContainer}>
        <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.18)',
            'rgba(255,255,255,0.05)',
            'rgba(0,0,0,0.16)',
            'rgba(0,0,0,0.36)',
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
            const drillsAccent = getSolidAccent(textSecondary);
            const defaultAccent = getSolidAccent(textPrimary);
            const activeAccent = route.name === 'drills' ? drillsAccent : defaultAccent;

            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={[
                  styles.tabItem,
                  focused && styles.tabItemActive,
                  focused && {
                    borderColor: tintWithAlpha(activeAccent, route.name === 'drills' ? 0.42 : 0.18),
                    backgroundColor: tintWithAlpha(activeAccent, route.name === 'drills' ? 0.14 : 0.08),
                    shadowColor: activeAccent,
                    shadowOpacity: route.name === 'drills' ? 0.32 : 0.16,
                    shadowRadius: route.name === 'drills' ? 18 : 10,
                  },
                ]}
              >
                {focused && (
                  <View
                    style={[
                      styles.activeGlow,
                      {
                        backgroundColor: tintWithAlpha(activeAccent, route.name === 'drills' ? 0.18 : 0.08),
                      },
                    ]}
                  />
                )}
                <FluentEmoji
                  name={tab.icon}
                  size={focused ? 27 : 24}
                  opacity={focused ? 1 : 0.58}
                  style={[
                    styles.tabIconImage,
                    focused && styles.tabIconImageActive,
                  ]}
                />
                {focused && (
                  <View
                    style={[
                      styles.activeIndicator,
                      {
                        backgroundColor: activeAccent,
                        shadowColor: activeAccent,
                        opacity: route.name === 'drills' ? 0.95 : 0.55,
                      },
                    ]}
                  />
                )}
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'rgba(2, 2, 6, 0.72)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 24,
  },
  glassSheen: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: '46%',
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
    borderColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.58,
    shadowRadius: 22,
  },
  tabRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(2, 2, 6, 0.68)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.pill,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  tabItemActive: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  activeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.pill,
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
  activeIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 18,
    height: 3,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.55,
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
