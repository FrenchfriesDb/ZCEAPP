import { View, Text, StyleSheet, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, Animated, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

const TENSION_PROMPTS = [
  "Why are you always so quiet?",
  "You look angry right now.",
  "Did I say something wrong?",
  "Why are you staring at me?",
  "Are you okay?",
  "What's your problem?",
  "Why won't you talk to me?",
  "You're being weird right now.",
  "What are you thinking about?",
  "Why do you always do that?",
];

export default function TensionHoldDrill() {
  const { completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const systemColor = timePalette[timePalette.length - 1];

  const [promptIdx, setPromptIdx] = useState(0);
  const [stage, setStage] = useState<'prompt' | 'stare' | 'complete'>('prompt');
  const [timeLeft, setTimeLeft] = useState(15);
  const [response, setResponse] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPromptIdx(Math.floor(Math.random() * TENSION_PROMPTS.length));
  }, []);

  useEffect(() => {
    if (stage !== 'stare') return;
    if (timeLeft <= 0) {
      setStage('complete');
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, timeLeft]);

  const handleRespond = () => {
    if (!response.trim()) {
      Alert.alert('Empty Response', 'Give a Zane-style one-liner first.');
      return;
    }
    setStage('stare');
  };

  const handleComplete = async () => {
    try {
      await completeDrill(20);
      Alert.alert('REP VERIFIED', 'Tension held. +20 XP awarded.', [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        { text: 'NEXT REP', onPress: () => { setResponse(''); setStage('prompt'); setTimeLeft(15); } },
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
        <Text style={[styles.title, { color: systemColor }]}>TENSION HOLD</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {stage === 'prompt' && (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoText}>
                They just said something weird. You need a Zane-style comeback. One sentence. Deliver it with your full chest.
              </Text>
            </GlassCard>

            <GlassCard style={[styles.promptCard, { borderColor: systemColor + '44' }]}>
              <Text style={styles.promptLabel}>THE PROMPT:</Text>
              <Text style={[styles.promptText, { color: systemColor }]}>
                "{TENSION_PROMPTS[promptIdx]}"
              </Text>
            </GlassCard>

            <Text style={styles.inputLabel}>YOUR ONE-LINER:</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.responseInput}
                placeholder="Dead-eye comeback..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={response}
                onChangeText={setResponse}
                autoFocus
              />
              <GlassButton
                label="DELIVER"
                onPress={handleRespond}
                tint="blue"
                size="md"
                glow={response.length > 3}
                style={{ marginTop: 12 }}
              />
            </View>
          </>
        )}

        {stage === 'stare' && (
          <>
            <Text style={styles.stareLabel}>NOW HOLD THE TENSION:</Text>
            <Text style={[styles.timerText, { color: timeLeft <= 5 ? '#FF4444' : systemColor }]}>
              {timeLeft}
            </Text>
            <Text style={styles.timerLabel}>SECONDS OF DEAD-EYE CONTACT</Text>
            <GlassCard style={styles.stareCard}>
              <Text style={styles.stareDesc}>
                You just said it. Now don't break. No fidgeting. No smiling nervously. No looking down. Stare directly into the camera. Make them break the silence, not you.
              </Text>
            </GlassCard>
          </>
        )}

        {stage === 'complete' && (
          <>
            <GlassCard style={styles.completeCard}>
              <Text style={styles.completeTitle}>TENSION HELD ✓</Text>
              <Text style={styles.completeText}>
                That's it. You didn't blink. You didn't fidget. You didn't apologize with your eyes. You made them uncomfortable, and you held it. That's power.
              </Text>
            </GlassCard>
            <GlassButton
              label="SAVE REP (+20 XP)"
              onPress={handleComplete}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%', marginTop: 16 }}
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
  title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, letterSpacing: 3, textAlign: 'center' },

  scrollContent: { padding: Spacing.md, alignItems: 'center', gap: 12, paddingBottom: 10 },

  infoCard: { width: '100%', padding: 14, backgroundColor: 'rgba(255,255,255,0.03)' },
  infoText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  promptCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  promptLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  promptText: { fontFamily: Fonts.heading, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  inputLabel: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginTop: 10, alignSelf: 'flex-start' },
  inputWrapper: { width: '100%' },
  responseInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    padding: 12,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 14,
    minHeight: 50,
  },

  stareLabel: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginVertical: 20 },
  timerText: { fontFamily: Fonts.heading, fontSize: 72, fontWeight: '900', lineHeight: 80 },
  timerLabel: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 2 },

  stareCard: { width: '100%', padding: 14, backgroundColor: 'rgba(255,255,255,0.02)', marginTop: 20 },
  stareDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  completeCard: { width: '100%', padding: 20, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  completeTitle: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.accentCyan, marginBottom: 12 },
  completeText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
