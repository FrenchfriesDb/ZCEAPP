import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import { UserProvider, useUser } from '@/context/UserContext';
import { TextColorsProvider } from '@/context/TextColorsContext';
import { Colors } from '@/constants/theme';
import CustomSplashScreen from '@/components/SplashScreen';
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

const ROASTS = [
  "You didn't talk to anyone today? Bro, I'm a robot and even I'm disappointed.",
  "What is most 'Magnetic' way to introduce yourself to a group of strangers?",
];

const pick8 = (pool: any[]) => [...pool].sort(() => 0.5 - Math.random()).slice(0, 8);

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
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TextColorsProvider>
        <UserProvider>
          <RootLayoutNav />
          <StatusBar style="light" />
        </UserProvider>
      </TextColorsProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { user, isLoading, hasCompletedOnboarding } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    if (isLoading) return;

    const s0 = segments[0] as string | undefined;
    const s1 = segments[1] as string | undefined;

    const inAuthGroup = s0 === 'auth';
    const inTabsGroup = s0 === '(tabs)';
    const isOnboarding = inAuthGroup && s1 === 'onboarding';
    const isLoginOrSignup = inAuthGroup && (s1 === 'login' || s1 === 'signup');
    const isForgotPassword = inAuthGroup && s1 === 'forgot-password';

    // --- NAVIGATION LOGIC ---
    console.log('[NAV] User:', user, 'HasCompletedOnboarding:', hasCompletedOnboarding, 'IsOnboarding:', isOnboarding, 'IsLoginOrSignup:', isLoginOrSignup);

    if (!user) {
      // 1. If we are on Login/Signup/ForgotPassword, allow access
      if (isLoginOrSignup || isForgotPassword) {
        // Allow users to stay on auth pages if they came from onboarding flow
        // Don't redirect them back to onboarding
        return;
      }

      // 1.5 If unauthenticated user is in tabs (or any non-auth route), route to the correct auth entry.
      if (inTabsGroup || !inAuthGroup) {
        if (hasCompletedOnboarding) {
          router.replace('/auth/login');
        } else {
          router.replace('/auth/onboarding');
        }
        return;
      }

      // 2. If we haven't finished onboarding, force to onboarding
      if (!hasCompletedOnboarding && !isOnboarding) {
        console.log('[NAV] Redirecting to onboarding...');
        router.replace('/auth/onboarding');
        return;
      }
    } else {
      // We have a user - always go to tabs regardless of where they are
      if (inAuthGroup) {
        console.log('[NAV] Authenticated user in auth flow, redirecting to tabs...');
        router.replace('/(tabs)');
      }
    }
  }, [user, isLoading, segments, hasCompletedOnboarding, router]);

  if (showSplash) {
    return <CustomSplashScreen onFinish={handleSplashFinish} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="settings/edit-profile" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="settings/notification-settings" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingText: { 
    fontSize: 9, 
    fontWeight: '400', 
    color: 'rgba(255,255,255,0.6)', 
    letterSpacing: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050508',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 60,
    height: 60,
    marginBottom: 20,
    tintColor: '#FFFFFF',
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loadingTitle: { 
    fontSize: 20, 
    color: Colors.textTertiary,
  },
  mantra: { 
    fontSize: 12, 
    fontWeight: '500', 
    color: 'rgba(255,255,255,0.8)', 
    letterSpacing: 3, 
    marginBottom: 8,
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});

function LoadingScreen() {
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingLogo}>
        <Text style={styles.loadingTitle}>ZCE</Text>
      </View>
    </View>
  );
}
