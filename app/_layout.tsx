import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { UserProvider, useUser } from '@/context/UserContext';
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0.5));
  const [textAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.timing(textAnim, { toValue: 1, duration: 2000, delay: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={loadStyles.container}>
      <LinearGradient colors={['#050508', '#080816', '#000000']} style={StyleSheet.absoluteFill} />
      <View style={[loadStyles.glow, { top: -150, left: -100, backgroundColor: 'rgba(74, 158, 255, 0.05)' }]} />
      <View style={[loadStyles.glow, { bottom: -150, right: -100, backgroundColor: 'rgba(123, 97, 255, 0.04)' }]} />

      <Animated.View style={[loadStyles.content, { opacity: fadeAnim }]}>
        <View style={loadStyles.icebergVisual}>
          <View style={loadStyles.icebergTip} />
          <View style={loadStyles.waterlineContainer}>
            <View style={loadStyles.waterlineL} />
            <Animated.View style={[loadStyles.waterDot, { opacity: pulseAnim }]} />
            <View style={loadStyles.waterlineR} />
          </View>
          <Animated.View style={[loadStyles.icebergMass, { opacity: pulseAnim }]}>
            <View style={loadStyles.massL1} />
            <View style={loadStyles.massL2} />
            <View style={loadStyles.massL3} />
          </Animated.View>
        </View>

        <Text style={loadStyles.title}>ZCE</Text>
        <Text style={loadStyles.subtitle}>NO ONE IS COMING.</Text>
        <Animated.View style={{ opacity: textAnim, alignItems: 'center', marginTop: 30 }}>
          <Text style={loadStyles.mantra}>THE RESCUE TEAM IS YOU.</Text>
          <Text style={loadStyles.loadingText}>INITIALIZING PROTOCOL...</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050508' },
  glow: { position: 'absolute', width: 400, height: 400, borderRadius: 200 },
  content: { alignItems: 'center', gap: 10 },
  icebergVisual: { alignItems: 'center', marginBottom: 40 },
  icebergTip: {
    width: 0, height: 0,
    borderLeftWidth: 30, borderRightWidth: 30, borderBottomWidth: 50,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#fff', shadowRadius: 20, shadowOpacity: 0.2,
  },
  waterlineContainer: { flexDirection: 'row', alignItems: 'center', gap: 0, marginVertical: 6 },
  waterlineL: { width: 80, height: 1, backgroundColor: 'rgba(74, 158, 255, 0.4)' },
  waterlineR: { width: 80, height: 1, backgroundColor: 'rgba(74, 158, 255, 0.4)' },
  waterDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4A9EFF', marginHorizontal: 6, shadowColor: '#4A9EFF', shadowRadius: 10, shadowOpacity: 1 },
  icebergMass: { alignItems: 'center', gap: 4 },
  massL1: { width: 90, height: 10, borderRadius: 2, backgroundColor: 'rgba(74, 158, 255, 0.08)' },
  massL2: { width: 130, height: 10, borderRadius: 2, backgroundColor: 'rgba(74, 158, 255, 0.05)' },
  massL3: { width: 170, height: 10, borderRadius: 2, backgroundColor: 'rgba(74, 158, 255, 0.02)' },
  title: { fontSize: 64, fontWeight: '900', color: '#FFFFFF', letterSpacing: 8 },
  subtitle: { fontSize: 14, fontWeight: '700', color: '#FF6B6B', letterSpacing: 4 },
  mantra: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)', letterSpacing: 3, marginBottom: 8 },
  loadingText: { fontSize: 9, fontWeight: '400', color: 'rgba(74, 158, 255, 0.4)', letterSpacing: 2 },
});

import { NotificationService } from '@/services/notifications';

function RootLayoutNav() {
  const { user, isLoading, hasCompletedOnboarding } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const s0 = segments[0] as string | undefined;
    const s1 = segments[1] as string | undefined;

    const inAuthGroup = s0 === 'auth';
    const isOnboarding = inAuthGroup && s1 === 'onboarding';
    const isLoginOrSignup = inAuthGroup && (s1 === 'login' || s1 === 'signup');
    const isTabsGroup = s0 === '(tabs)';
    const isLandingOrRoot = !s0 || s0 === 'landing' || s0 === 'index';

    // --- NAVIGATION LOGIC ---
    if (!user) {
      // 1. If we are on Login/Signup, STAY THERE (don't wipe errors)
      if (isLoginOrSignup) return;

      // 2. If we haven't finished onboarding, force to onboarding
      if (!hasCompletedOnboarding && !isOnboarding) {
        router.replace('/auth/onboarding');
      }
      // 3. If we are anywhere else (Tabs, Settings, etc) and not on Landing, force to Login
      else if (hasCompletedOnboarding && isTabsGroup) {
        router.replace('/auth/login');
      }
    }
    else {
      // We have a user. If they are in the auth flow or on landing, send to tabs.
      if (inAuthGroup || (isLandingOrRoot && s0 !== '(tabs)')) {
        router.replace('/(tabs)');
      }

      // Initialize all 7 notification types for this user (NATIVE ONLY)
      if (Platform.OS !== 'web') {
        const firstName = user.name?.split(' ')[0] ?? 'Agent';
        const streak = user.streak ?? 0;
        NotificationService.initForUser(firstName, streak);
        NotificationService.touchReengagement(firstName);
      }
    }
  }, [user, isLoading, segments, hasCompletedOnboarding]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#050508' } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="settings/edit-profile" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="settings/notification-settings" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Poppins_500Medium,
          Poppins_600SemiBold,
          Poppins_700Bold,
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          JetBrainsMono_500Medium,
          JetBrainsMono_700Bold,
        });
      } catch (e) {
        console.warn('Font loading error:', e);
      } finally {
        setFontsLoaded(true);
        SplashScreen.hideAsync();
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <UserProvider>
      <RootLayoutNav />
      <StatusBar style="light" />
    </UserProvider>
  );
}
