import FluentEmoji, { type FluentEmojiName } from '@/components/FluentEmoji';
import { Radius } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { TextColorsProvider, useTextColors } from '../../context/TextColorsContext';

const TAB_ICON_SIZE = 24;
const TAB_ICON_FRAME = 30;

const TAB_CONFIG = [
  { name: 'index', label: 'Dojo', icon: 'crossedSwords' as FluentEmojiName },
  { name: 'quests', label: 'Quests', icon: 'bullseye' as FluentEmojiName },
  { name: 'drills', label: 'Drills', icon: 'highVoltage' as FluentEmojiName },
  { name: 'leaderboard', label: 'Board', icon: 'crown' as FluentEmojiName },
  { name: 'profile', label: 'Profile', icon: 'dna' as FluentEmojiName },
];

const TAB_ICON_Y_OFFSET: Partial<Record<FluentEmojiName, number>> = {
  crown: -3,
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const routes = Array.isArray(state?.routes) ? state.routes : [];
  const { textSecondary } = useTextColors();
  if (routes.length === 0) return null;

  const currentRoute = routes[state.index]?.name;
  if (currentRoute === 'chat' || currentRoute === 'research') return null;

  return (
    <View style={styles.tabBarOuter} pointerEvents="box-none">
      <View style={styles.tabBarContainer}>
        <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
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
          pointerEvents="none"
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
            const tab = TAB_CONFIG.find((t) => t.name === route.name);
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
                  size={TAB_ICON_SIZE}
                  opacity={focused ? 1 : 0.56}
                  style={[
                    styles.tabIconImage,
                    { transform: [{ translateY: TAB_ICON_Y_OFFSET[tab.icon] ?? 0 }] },
                    focused && styles.tabIconImageActive,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useUser();

  if (isLoading) return null;

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

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
  tabIconImage: {
    width: TAB_ICON_FRAME,
    height: TAB_ICON_FRAME,
    alignSelf: 'center',
  },
  tabIconImageActive: {
    opacity: 1,
  },
});
