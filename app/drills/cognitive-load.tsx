import { View, Text, StyleSheet, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

const TRIVIA_QUESTIONS = [
  { q: 'What is the capital of Japan?', a: 'Tokyo' },
  { q: 'Who wrote Romeo and Juliet?', a: 'Shakespeare' },
  { q: 'What is 15 + 27?', a: '42' },
  { q: 'What is the largest planet?', a: 'Jupiter' },
  { q: 'In what year did the Titanic sink?', a: '1912' },
  { q: 'Who painted the Mona Lisa?', a: 'Da Vinci' },
];

export default function CognitiveLoadDrill() {
  const { completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const systemColor = timePalette[timePalette.length - 1];

  const [stage, setStage] = useState<'ready' | 'instructions' | 'challenge' | 'posture' | 'complete'>('ready');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [postureFalls, setPostureFalls] = useState(0);

  useEffect(() => {
    setQuestionIdx(Math.floor(Math.random() * TRIVIA_QUESTIONS.length));
  }, []);

  const handleStartInstructions = () => {
    setStage('instructions');
  };

  const handleStartChallenge = () => {
    setStage('challenge');
    setCorrectAnswers(0);
    setPostureFalls(0);
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) return;

    const correct = TRIVIA_QUESTIONS[questionIdx].a.toLowerCase() === userAnswer.toLowerCase().trim();
    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
    }

    setUserAnswer('');
    setQuestionIdx(Math.floor(Math.random() * TRIVIA_QUESTIONS.length));
  };

  const handlePostureFall = () => {
    const newFalls = postureFalls + 1;
    setPostureFalls(newFalls);

    if (newFalls >= 3) {
      setStage('complete');
    } else {
      Alert.alert('POSTURE BROKEN', `Fall #${newFalls}. Keep your chest up and shoulders back!`);
    }
  };

  const handleComplete = async () => {
    try {
      const xp = Math.max(10, 20 - postureFalls * 3);
      await completeDrill(xp);
      Alert.alert('COGNITIVE STRENGTH', `${correctAnswers} answers correct. ${postureFalls} posture breaks. +${xp} XP awarded.`, [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        { text: 'TRY AGAIN', onPress: () => { setStage('ready'); setCorrectAnswers(0); setPostureFalls(0); setUserAnswer(''); } },
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
        <Text style={[styles.title, { color: systemColor }]}>COGNITIVE LOAD</Text>
        <View style={{ width: 60 }} />
      </View>

      {stage === 'challenge' && (
        <View style={{ paddingHorizontal: Spacing.md, paddingTop: 6 }}>
          <GlassCard style={[styles.questionCard, { borderColor: systemColor + '44' }]}>
            <Text style={styles.questionLabel}>QUESTION:</Text>
            <Text style={[styles.questionText, { color: systemColor }]}>
              {TRIVIA_QUESTIONS[questionIdx].q}
            </Text>
          </GlassCard>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {stage === 'ready' && (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoLabel}>THE PROBLEM:</Text>
              <Text style={styles.infoText}>
                Under pressure, you crumble. Your posture falls. Your mind goes blank. You need to train your nervous system to stay calm and sharp.
              </Text>
            </GlassCard>

            <GlassButton
              label="LEARN THE CHALLENGE"
              onPress={handleStartInstructions}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'instructions' && (
          <>
            <GlassCard style={styles.rulesCard}>
              <Text style={styles.rulesLabel}>THE CHALLENGE:</Text>
              <Text style={styles.rulesText}>
                • Stand tall: chest out, shoulders back, shoulders down.{'\n'}
                • I'll ask you rapid-fire trivia questions.{'\n'}
                • Answer each one while maintaining perfect posture.{'\n'}
                • Every time your posture breaks, I call it.{'\n'}
                • 3 posture breaks and you're done.{'\n'}
                • Goal: Answer correctly AND stay anchored.
              </Text>
            </GlassCard>

            <GlassButton
              label="START CHALLENGE"
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
            <TextInput
              style={styles.input}
              placeholder="Your answer..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={userAnswer}
              onChangeText={setUserAnswer}
              maxLength={100}
            />

            <GlassButton
              label="SUBMIT"
              onPress={handleSubmitAnswer}
              tint="blue"
              size="lg"
              glow
              disabled={!userAnswer.trim()}
              style={{ width: '100%' }}
            />

            <GlassCard style={styles.statsCard}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Correct:</Text>
                <Text style={[styles.statValue, { color: Colors.accentCyan }]}>{correctAnswers}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Posture Breaks:</Text>
                <Text style={[styles.statValue, { color: postureFalls > 0 ? '#FF8844' : Colors.textSecondary }]}>{postureFalls}/3</Text>
              </View>
            </GlassCard>

            <GlassButton
              label="I JUST BROKE POSTURE"
              onPress={handlePostureFall}
              tint="red"
              size="lg"
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'complete' && (
          <>
            <GlassCard style={styles.completeCard}>
              <Text style={styles.completeTitle}>PRESSURE TESTED ✓</Text>
              <Text style={styles.completeText}>
                You just proved you can stay calm and sharp under cognitive load. Your nervous system is now stronger. You're unshakeable.
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
  backText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1 },
  title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, letterSpacing: 3, textAlign: 'center' },

  scrollContent: { padding: Spacing.md, alignItems: 'center', gap: 12, paddingBottom: 10 },

  infoCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  infoLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6 },
  infoText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  rulesCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  rulesLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  rulesText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  questionCard: { width: '100%', padding: 14, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  questionLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  questionText: { fontFamily: Fonts.body, fontSize: 13, textAlign: 'center' },

  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(113, 195, 247, 0.3)',
    borderRadius: Radius.md,
    color: Colors.textPrimary,
    padding: 12,
    fontFamily: Fonts.body,
    fontSize: 13,
  },

  statsCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statLabel: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  statValue: { fontFamily: Fonts.heading, fontSize: 16 },

  completeCard: { width: '100%', padding: 20, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  completeTitle: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.accentCyan, marginBottom: 12 },
  completeText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
