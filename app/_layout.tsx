import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { UserProvider, useUser } from '@/context/UserContext';
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
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0.5));
  const [textAnim] = useState(new Animated.Value(0));
  const [glassShimmer] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.timing(textAnim, { toValue: 1, duration: 2000, delay: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glassShimmer, { toValue: 1, duration: 3000, useNativeDriver: false }),
        Animated.timing(glassShimmer, { toValue: 0, duration: 3000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <View style={loadStyles.container}>
      <LinearGradient 
        colors={['#000000', '#1a1a1a', '#000000']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill} 
      />
      
      {/* Glass morphism background elements */}
      <Animated.View 
        style={[
          loadStyles.glassBubble, 
          { 
            top: 100, 
            left: 50,
            opacity: pulseAnim,
            transform: [{ scale: pulseAnim }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          loadStyles.glassBubble, 
          { 
            bottom: 120, 
            right: 80,
            opacity: pulseAnim,
            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0.3, 1], outputRange: [0.8, 1.2] }) }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          loadStyles.glassBubble, 
          { 
            top: '60%', 
            left: '20%',
            opacity: glassShimmer,
            transform: [{ scale: glassShimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) }]
          }
        ]} 
      />

      <Animated.View style={[loadStyles.content, { opacity: fadeAnim }]}>
        {/* Glass morphism logo container */}
        <Animated.View style={[
          loadStyles.glassLogoContainer,
          {
            backgroundColor: glassShimmer.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
            }),
            borderColor: glassShimmer.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']
            }),
          }
        ]}>
          <View style={loadStyles.logoReflection} />
          <Image 
            source={require('../assets/images/zcelogoloading.png')}
            style={loadStyles.logoImage}
            resizeMode="contain"
          />
          <View style={loadStyles.glassHighlight} />
        </Animated.View>

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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  content: { alignItems: 'center', gap: 16 },
  
  // Glass morphism elements
  glassBubble: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  
  glassLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 15,
    backdropFilter: 'blur(20px)',
  },
  
  logoImage: {
    width: 80,
    height: 80,
  },
  
  logoReflection: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
    transform: [{ skewY: '-10deg' }],
    opacity: 0.3,
  },
  
  glassHighlight: {
    position: 'absolute',
    top: 5,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.6,
  },
  
  title: { 
    fontSize: 64, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    letterSpacing: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#FF6B6B', 
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 107, 107, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  mantra: { 
    fontSize: 12, 
    fontWeight: '500', 
    color: 'rgba(255,255,255,0.8)', 
    letterSpacing: 3, 
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  loadingText: { 
    fontSize: 9, 
    fontWeight: '400', 
    color: 'rgba(255,255,255,0.6)', 
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});

import { NotificationService } from '@/services/notifications';

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
    const isOnboarding = inAuthGroup && s1 === 'onboarding';
    const isLoginOrSignup = inAuthGroup && (s1 === 'login' || s1 === 'signup');

    // --- NAVIGATION LOGIC ---
    console.log('[NAV] User:', user, 'HasCompletedOnboarding:', hasCompletedOnboarding, 'IsOnboarding:', isOnboarding, 'IsLoginOrSignup:', isLoginOrSignup);
    
    if (!user) {
      // 1. If we are on Login/Signup, check if they came from onboarding
      if (isLoginOrSignup) {
        // Allow users to stay on auth pages if they came from onboarding flow
        // Don't redirect them back to onboarding
        return;
      }

      // 2. If we haven't finished onboarding, force to onboarding
      if (!hasCompletedOnboarding && !isOnboarding) {
        console.log('[NAV] Redirecting to onboarding...');
        router.replace('/auth/onboarding');
      }
      // 3. If we have finished onboarding but are not authenticated, go to login
      else if (hasCompletedOnboarding && !isOnboarding) {
        console.log('[NAV] Redirecting to login...');
        router.replace('/auth/login');
      }
    }
    else {
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
    return <CustomSplashScreen onFinish={() => {}} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <RootLayoutNav />
        <StatusBar style="light" />
      </UserProvider>
    </GestureHandlerRootView>
  );
}
