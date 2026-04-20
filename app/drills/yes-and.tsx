import GlassButton from '@/components/GlassButton';
import GlassCard from '@/components/GlassCard';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const PROMPTS = [
  "Your startup just got acquired for $100M.",
  "You just got offered a speaking tour in Europe.",
  "A celebrity just asked for your advice.",
  "You just published a bestseller.",
  "You just landed a 7-figure deal.",
  "A major brand wants you as their brand ambassador.",
  "You were just named to a 'Under 30' list.",
];

export default function YesAndSimulatorDrill() {
  const { completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const systemColor = timePalette[timePalette.length - 1];

  const [promptIdx, setPromptIdx] = useState(0);
  const [stage, setStage] = useState<'ready' | 'prompt' | 'recording' | 'analysis' | 'complete'>('ready');
  const [hasRecorded, setHasRecorded] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const safePrompt = (PROMPTS[promptIdx] && PROMPTS[promptIdx].trim()) || 'Your startup just got acquired for $100M.';

  useEffect(() => {
    setPromptIdx(Math.floor(Math.random() * PROMPTS.length));
  }, []);

  useEffect(() => {
    if (stage !== 'recording') return;

    const timer = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 15) {
          setStage('analysis');
          return 15;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  const handleStartRecording = () => {
    setStage('recording');
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setHasRecorded(true);
    if (recordingTime < 3) {
      setStage('analysis');
    }
  };

  const generateAnalysis = () => {
    if (recordingTime < 3) {
      return {
        score: 'LOW',
        color: '#FF6B6B',
        feedback: "You stopped too fast. The whole point of 'Yes And' is to build on the idea and add dimension.",
        creativity: 4,
      };
    }
    if (recordingTime < 7) {
      return {
        score: 'MID',
        color: '#FFB84D',
        feedback: "You got going but didn't fully escalate. 'Yes And' means accept, amplify, and add specificity.",
        creativity: 6,
      };
    }
    return {
      score: 'FIRE',
      color: Colors.accentCyan,
      feedback: "Perfect. You took the premise, said yes, and built something absurd and specific. That's the move.",
      creativity: 9,
    };
  };

  const analysis = generateAnalysis();

  const handleComplete = async () => {
    try {
      const xp = recordingTime < 3 ? 10 : recordingTime < 7 ? 14 : 18;
      await completeDrill(xp);
      Alert.alert('IMPROV VERIFIED', `"Yes And" flow locked. +${xp} XP awarded.`, [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        { text: 'NEXT PROMPT', onPress: () => { setStage('ready'); setHasRecorded(false); setRecordingTime(0); setPromptIdx(Math.floor(Math.random() * PROMPTS.length)); } },
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
        <Text style={[styles.title, { color: systemColor }]}>YES AND</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {stage === 'ready' && (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoLabel}>THE PROBLEM:</Text>
              <Text style={styles.infoText}>
                You shut down ideas or offer no real build. You kill creativity. It&apos;s time to master the improv move that makes people genius: &quot;Yes And.&quot;
              </Text>
            </GlassCard>

            <GlassCard style={styles.rulesCard}>
              <Text style={styles.rulesLabel}>RULES:</Text>
              <Text style={styles.rulesText}>
                • I give you a premise.{'\n'}
                • You say &quot;Yeah, and...&quot; and continue the idea.{"\n"}
                • Add specificity, humor, absurdity.{'\n'}
                • Build momentum, not just agreement.{'\n'}
                • Record your voice clearly.
              </Text>
            </GlassCard>

            <GlassButton
              label="START DRILL"
              onPress={() => setStage('prompt')}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'prompt' && (
          <>
            <GlassCard style={[styles.promptCard, { borderColor: systemColor + '44' }]}>
              <Text style={styles.promptLabel}>THE PREMISE:</Text>
              <Text style={[styles.promptText, { color: '#FFFFFF' }]}>
                &quot;{safePrompt}&quot;
              </Text>
            </GlassCard>

            <GlassCard style={styles.instructionCard}>
              <Text style={styles.instructionText}>
                Record yourself saying &quot;Yeah, and...&quot; then build on this premise with specificity and absurdity.
              </Text>
            </GlassCard>

            <GlassButton
              label="START RECORDING"
              onPress={handleStartRecording}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'recording' && (
          <>
            <GlassCard style={styles.recordCard}>
              <Text style={[styles.recordIndicator, { color: '#FF4444' }]}>● RECORDING</Text>
              <Text style={styles.recordTime}>{recordingTime}s</Text>
              <Text style={styles.recordDesc}>Start with &quot;Yeah, and...&quot; - speak clearly.</Text>
            </GlassCard>

            <GlassButton
              label="STOP RECORDING"
              onPress={handleStopRecording}
              tint="red"
              size="lg"
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'analysis' && hasRecorded && (
          <>
            <GlassCard style={[styles.analyzeCard, { borderColor: analysis.color + '66' }]}>
              <Text style={[styles.analyzeScore, { color: analysis.color }]}>
                {analysis.score}
              </Text>
              <Text style={styles.analyzeText}>
                {analysis.feedback}
              </Text>
              <Text style={styles.analyzeMetric}>
                Creativity Score: {analysis.creativity}/10
              </Text>
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
  backText: { color: '#FFFFFF', fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1 },
  title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, letterSpacing: 3, textAlign: 'center' },

  scrollContent: { padding: Spacing.md, alignItems: 'center', gap: 12, paddingBottom: 10 },

  infoCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  infoLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6 },
  infoText: { fontFamily: Fonts.headingSemi, fontSize: 13, color: '#FFFFFF', lineHeight: 20 },

  rulesCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  rulesLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  rulesText: { fontFamily: Fonts.headingSemi, fontSize: 12, color: '#FFFFFF', lineHeight: 18 },

  promptCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  promptLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  promptText: { fontFamily: Fonts.headingSemi, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  instructionCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  instructionText: { fontFamily: Fonts.headingSemi, fontSize: 12, color: '#FFFFFF', textAlign: 'center' },

  recordCard: { width: '100%', padding: 20, alignItems: 'center', backgroundColor: 'rgba(255, 68, 68, 0.05)', borderColor: 'rgba(255, 68, 68, 0.2)', borderWidth: 1 },
  recordIndicator: { fontFamily: Fonts.heading, fontSize: 20, marginBottom: 8 },
  recordTime: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.textPrimary, marginBottom: 8 },
  recordDesc: { fontFamily: Fonts.headingSemi, fontSize: 12, color: '#FFFFFF' },

  analyzeCard: { width: '100%', padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  analyzeScore: { fontFamily: Fonts.heading, fontSize: 18, marginBottom: 10 },
  analyzeText: { fontFamily: Fonts.headingSemi, fontSize: 12, color: '#FFFFFF', lineHeight: 18, marginBottom: 10 },
  analyzeMetric: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
});
