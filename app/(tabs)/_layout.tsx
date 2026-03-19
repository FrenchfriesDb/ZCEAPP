import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { TextColorsProvider } from '@/context/TextColorsContext';
import { useTextColors } from '@/context/TextColorsContext';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_CONFIG = [
  { name: 'index', label: 'Dojo', icon: '⚔️' },
  { name: 'quests', label: 'Quests', icon: '🎯' },
  { name: 'drills', label: 'Drills', icon: '⚡' },
  { name: 'leaderboard', label: 'Board', icon: '👑' },
  { name: 'profile', label: 'Profile', icon: '🧬' },
];

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

            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={[
                  styles.tabItem,
                  focused && styles.tabItemActive,
                  focused && {
                    borderColor: `${textSecondary}`,
                    shadowColor: textPrimary,
                  },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.tabIcon,
                    { color: 'rgba(255,255,255,0.46)' },
                    focused && styles.tabIconActive,
                    focused && { color: textPrimary, textShadowColor: textPrimary },
                  ]}
                >
                  {tab.icon}
                </Text>
                {focused && <View style={[styles.activeIndicator, { backgroundColor: textPrimary, shadowColor: textPrimary }]} />}
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
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'rgba(4, 4, 8, 0.56)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 24,
  },
  glassSheen: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: '54%',
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
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.46,
    shadowRadius: 22,
  },
  tabRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(4, 4, 8, 0.50)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
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
    bottom: -4,
    width: 20,
    height: 4,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.75,
  },
});
