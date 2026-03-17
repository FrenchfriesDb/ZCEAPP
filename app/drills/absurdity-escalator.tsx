import { View, Text, StyleSheet, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

const INITIAL_PROMPTS = [
  "Your coffee is cold.",
  "Your flight was delayed.",
  "Your gym was crowded.",
  "Your wifi is slow.",
  "Your phone died.",
];

export default function AbsurdityEscalatorDrill() {
  const { completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const systemColor = timePalette[timePalette.length - 1];

  const [stage, setStage] = useState<'ready' | 'prompt' | 'volley' | 'complete'>('ready');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [voltCount, setVoltCount] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [exchanges, setExchanges] = useState<Array<{ user: string; ai: string }>>([]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * INITIAL_PROMPTS.length);
    setInitialPrompt(INITIAL_PROMPTS[idx]);
  }, []);

  const generateAiResponse = (userInput: string, volleyNum: number) => {
    const absurdityLevels = [
      ['You kidding?', 'That sucks.', 'Rough.'],
      ['So like what, you gonna call tech support?', 'Did you try turning it off and on?', 'Have you considered just living without it?'],
      ['I heard people in 1987 dealt with this by just accepting chaos.', 'You\'ve basically lost all privileges as a human.', 'This is how it begins. The downward spiral.'],
      ['You\'re one cold coffee away from joining the void.', 'The universe is clearly testing your resolve.', 'This is your origin story villain moment.'],
      ['You are now one with the chaos.', 'You\'ve transcended mortal annoyance.', 'The void has spoken.'],
    ];

    const responses = absurdityLevels[Math.min(volleyNum, absurdityLevels.length - 1)];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleStartVolley = () => {
    setStage('volley');
    setVoltCount(0);
    setExchanges([]);
  };

  const handleSendResponse = () => {
    if (!userResponse.trim()) return;

    const ai = generateAiResponse(userResponse, voltCount);
    setExchanges([...exchanges, { user: userResponse, ai }]);
    setAiResponse(ai);
    setUserResponse('');
    setVoltCount((prev) => prev + 1);

    if (voltCount >= 4) {
      setTimeout(() => {
        setStage('complete');
      }, 800);
    }
  };

  const handleSkipExchange = () => {
    setVoltCount((prev) => prev + 1);
    if (voltCount >= 4) {
      setStage('complete');
    } else {
      setUserResponse('');
      setAiResponse('');
    }
  };

  const calculateAbsurdityScore = () => {
    const avgLength = exchanges.reduce((sum, ex) => sum + ex.user.length, 0) / exchanges.length;
    const hasKeywords = exchanges.filter((ex) => /absurd|ridiculous|insane|void|chaos/i.test(ex.user)).length;
    return Math.min(100, Math.floor((avgLength / 20 + hasKeywords * 15)));
  };

  const handleComplete = async () => {
    try {
      const score = calculateAbsurdityScore();
      const xp = Math.floor(10 + (score / 20));
      await completeDrill(xp);
      Alert.alert('ABSURDITY UNLOCKED', `Escalation flow mastered. Score: ${score}/100. +${xp} XP awarded.`, [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        { text: 'ANOTHER VOLLEY', onPress: () => { setStage('ready'); setExchanges([]); setVoltCount(0); setUserResponse(''); setAiResponse(''); } },
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
        <Text style={[styles.title, { color: systemColor }]}>ABSURDITY ESCALATOR</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {stage === 'ready' && (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoLabel}>THE PROBLEM:</Text>
              <Text style={styles.infoText}>
                You stay surface-level. Your humor doesn't escalate. You're afraid to go absurd. Time to lean into insanity.
              </Text>
            </GlassCard>

            <GlassCard style={styles.promptCard}>
              <Text style={styles.promptLabel}>STARTING PREMISE:</Text>
              <Text style={[styles.promptText, { color: systemColor }]}>
                "{initialPrompt}"
              </Text>
            </GlassCard>

            <GlassCard style={styles.rulesCard}>
              <Text style={styles.rulesLabel}>RULES:</Text>
              <Text style={styles.rulesText}>
                • I send a premise.{'\n'}
                • You respond with escalation.{'\n'}
                • I escalate further.{'\n'}
                • 5 exchanges total.{'\n'}
                • Goal: reach maximum absurdity.
              </Text>
            </GlassCard>

            <GlassButton
              label="START VOLLEY"
              onPress={handleStartVolley}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'volley' && (
          <>
            <View style={styles.volleys}>
              {exchanges.map((ex, idx) => (
                <View key={idx} style={styles.volleyPair}>
                  <GlassCard style={[styles.exchangeCard, { backgroundColor: 'rgba(113, 195, 247, 0.08)' }]}>
                    <Text style={styles.exchangeLabel}>YOU:</Text>
                    <Text style={[styles.exchangeText, { color: systemColor }]}>{ex.user}</Text>
                  </GlassCard>
                  <GlassCard style={[styles.exchangeCard, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
                    <Text style={styles.exchangeLabel}>ME:</Text>
                    <Text style={styles.exchangeText}>{ex.ai}</Text>
                  </GlassCard>
                </View>
              ))}
            </View>

            {voltCount < 5 && (
              <>
                <GlassCard style={[styles.promptCard, { borderColor: systemColor + '44' }]}>
                  <Text style={styles.promptLabel}>VOLLEY {voltCount + 1}/5:</Text>
                  <Text style={[styles.promptText, { color: systemColor }]}>
                    {voltCount === 0 ? `"${initialPrompt}"` : aiResponse || 'Waiting for your absurdity...'}
                  </Text>
                </GlassCard>

                <TextInput
                  style={styles.input}
                  placeholder="Escalate the absurdity..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={userResponse}
                  onChangeText={setUserResponse}
                  multiline
                  maxLength={200}
                />

                <GlassButton
                  label="SEND"
                  onPress={handleSendResponse}
                  tint="blue"
                  size="lg"
                  glow
                  disabled={!userResponse.trim()}
                  style={{ width: '100%' }}
                />

                {voltCount > 0 && (
                  <Pressable onPress={handleSkipExchange} style={styles.skipLink}>
                    <Text style={styles.skipText}>Skip this volley</Text>
                  </Pressable>
                )}
              </>
            )}
          </>
        )}

        {stage === 'complete' && (
          <>
            <GlassCard style={styles.completeCard}>
              <Text style={styles.completeTitle}>ABSURDITY MASTERED ✓</Text>
              <Text style={styles.completeText}>
                5 volleys of pure escalation. You just proved you can take a boring premise and launch it into the stratosphere. That's comedic control.
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

  promptCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  promptLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  promptText: { fontFamily: Fonts.body, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  rulesCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  rulesLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  rulesText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  volleys: { width: '100%', gap: 8 },
  volleyPair: { gap: 8 },
  exchangeCard: { padding: 10, borderRadius: Radius.md },
  exchangeLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 4 },
  exchangeText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary },

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
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },

  skipLink: { paddingVertical: 8 },
  skipText: { fontFamily: Fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline' },

  completeCard: { width: '100%', padding: 20, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  completeTitle: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.accentCyan, marginBottom: 12 },
  completeText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
