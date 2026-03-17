import { View, Text, StyleSheet, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

export default function EyeCombatDrill() {
  const CHALLENGE_SECONDS = 20;
  const { completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const systemColor = timePalette[timePalette.length - 1];

  const [stage, setStage] = useState<'ready' | 'challenge' | 'complete'>('ready');
  const [timeRemaining, setTimeRemaining] = useState(CHALLENGE_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [breaks, setBreaks] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          setStage('complete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeRemaining]);

  const ensureCameraPermission = async () => {
    // Expo Camera permissions vary per platform; gate on native where it matters.
    if (Platform.OS === 'web') return true;
    if (permission?.granted) return true;
    const res = await requestPermission();
    return !!res?.granted;
  };

  const handleStartChallenge = async () => {
    const ok = await ensureCameraPermission();
    if (!ok) {
      Alert.alert('Camera Permission Needed', 'Enable camera access to run Eye Combat.');
      return;
    }
    setStage('challenge');
    setIsActive(true);
    setTimeRemaining(CHALLENGE_SECONDS);
    setBreaks(0);
  };

  const handleEyeBreak = () => {
    const newBreaks = breaks + 1;
    setBreaks(newBreaks);
    Alert.alert('EYE BREAK DETECTED', `You've broken eye contact ${newBreaks} times. Reset timer and lock in.`, [
      { text: 'RESET', onPress: () => setTimeRemaining(CHALLENGE_SECONDS) },
    ]);
  };

  const handleComplete = async () => {
    try {
      const xp = Math.max(12, 20 - breaks * 2);
      await completeDrill(xp);
      Alert.alert('STARE DOMINANCE', `You held for ${CHALLENGE_SECONDS} seconds. ${breaks} breaks detected. +${xp} XP awarded.`, [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        { text: 'ANOTHER ROUND', onPress: () => { setStage('ready'); setTimeRemaining(CHALLENGE_SECONDS); setBreaks(0); } },
      ]);
    } catch (err) {
      console.error('Drill completion error:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>← EXIT</Text>
        </Pressable>
        <Text style={styles.title}>EYE COMBAT</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {stage === 'ready' && (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoLabel}>THE PROBLEM:</Text>
              <Text style={styles.infoText}>
                Your eyes dart. You look away first. You're uncomfortable holding power contact. Time to train your stare.
              </Text>
            </GlassCard>

            <GlassCard style={styles.rulesCard}>
              <Text style={styles.rulesLabel}>RULES:</Text>
              <Text style={styles.rulesText}>
                • Stare directly at the screen (front camera).{'\n'}
                • Hold eye contact for 20 seconds.{'\n'}
                • Don't blink excessively.{'\n'}
                • Each eye break resets your timer.{'\n'}
                • Goal: 20 seconds with zero breaks.
              </Text>
            </GlassCard>

            <GlassButton
              label="START STARE"
              onPress={handleStartChallenge}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'challenge' && (
          <>
            <View style={styles.cameraSection}>
              <View style={[styles.cameraContainer, { borderColor: systemColor + '66', shadowColor: systemColor }]}>
                <CameraView style={styles.camera} facing="front" zoom={0} />
                <View pointerEvents="none" style={styles.targetOverlay}>
                  <View style={[styles.targetRing, { borderColor: 'rgba(255,255,255,0.65)' }]} />
                  <View style={[styles.targetDot, { backgroundColor: systemColor }]} />
                  <Text style={styles.targetText}>LOCK IN</Text>
                </View>
              </View>
            </View>

            <GlassCard style={[styles.timerCard, { borderColor: systemColor + '66' }]}>
              <Text style={styles.timerText}>
                {timeRemaining}s
              </Text>
            </GlassCard>

            <GlassCard style={styles.instructionCard}>
              <Text style={styles.instructionText}>
                HOLD THE STARE. Look directly into the front camera. Don't blink. Don't look away.
              </Text>
            </GlassCard>

            <GlassCard style={styles.breakCard}>
              <Text style={styles.breakLabel}>BREAKS DETECTED:</Text>
              <Text style={[styles.breakCount, { color: breaks > 0 ? '#FF8844' : Colors.textSecondary }]}>
                {breaks}
              </Text>
            </GlassCard>

            <GlassButton
              label="I LOOKED AWAY"
              onPress={handleEyeBreak}
              tint="red"
              size="lg"
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'complete' && (
          <>
            <GlassCard style={styles.completeCard}>
              <Text style={styles.completeTitle}>STARE MASTERED ✓</Text>
              <Text style={styles.completeText}>
                20 seconds of unbroken eye contact. You just proved you have the presence to dominate any room. Your stare alone commands respect.
              </Text>
              {breaks > 0 && (
                <Text style={styles.breaksSummary}>
                  {breaks} {breaks === 1 ? 'break' : 'breaks'} during the challenge. Next time, lock in harder.
                </Text>
              )}
            </GlassCard>

            <GlassButton
              label="SAVE REP"
              onPress={handleComplete}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 44,
    marginBottom: 4,
  },
  backBtn: { padding: 8, minWidth: 60 },
  backText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1 },
  title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, letterSpacing: 3, textAlign: 'center', color: '#FFFFFF' },

  scrollContent: { padding: Spacing.md, alignItems: 'center', gap: 12, paddingBottom: 10 },

  infoCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  infoLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6 },
  infoText: { fontFamily: Fonts.body, fontSize: 13, color: '#FFFFFF', lineHeight: 20 },

  rulesCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  rulesLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  rulesText: { fontFamily: Fonts.body, fontSize: 12, color: '#FFFFFF', lineHeight: 18 },

  cameraSection: { width: '100%', alignItems: 'center' },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.02)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  camera: { flex: 1 },
  targetOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 1 },
  targetDot: { width: 10, height: 10, borderRadius: 5, marginTop: -53 },
  targetText: {
    marginTop: 18,
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 3,
  },

  timerCard: { width: '100%', paddingVertical: 24, alignItems: 'center', backgroundColor: 'rgba(113, 195, 247, 0.05)', borderWidth: 1 },
  timerText: { fontFamily: Fonts.heading, fontSize: 56, fontWeight: '700', color: '#FFFFFF' },

  instructionCard: { width: '100%', padding: 14, backgroundColor: 'rgba(255,255,255,0.02)' },
  instructionText: { fontFamily: Fonts.body, fontSize: 12, color: '#FFFFFF', textAlign: 'center' },

  breakCard: { width: '100%', paddingVertical: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)' },
  breakLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  breakCount: { fontFamily: Fonts.heading, fontSize: 28 },

  completeCard: { width: '100%', padding: 20, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  completeTitle: { fontFamily: Fonts.heading, fontSize: 18, color: '#FFFFFF', marginBottom: 12 },
  completeText: { fontFamily: Fonts.body, fontSize: 13, color: '#FFFFFF', lineHeight: 20, marginBottom: 12 },
  breaksSummary: { fontFamily: Fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 8 },
});
