import { View, Text, StyleSheet, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { AIService } from '@/services/ai';

const INITIAL_PROMPTS = [
  "Your coffee is cold.",
  "Your flight was delayed.",
  "Your gym was crowded.",
  "Your wifi is slow.",
  "Your phone died.",
];

export default function AbsurdityEscalatorDrill() {
  const { user, completeDrill } = useUser();
  const { textColors } = useTimeColors();
  const systemColor = textColors.primary;

  const [stage, setStage] = useState<'ready' | 'volley' | 'complete'>('ready');
  const [initialPrompt, setInitialPrompt] = useState(() => {
    const idx = Math.floor(Math.random() * INITIAL_PROMPTS.length);
    return INITIAL_PROMPTS[idx] || 'Your coffee is cold.';
  });
  const [voltCount, setVoltCount] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [exchanges, setExchanges] = useState<Array<{ user: string; ai: string }>>([]);
  const safePrompt = (initialPrompt && initialPrompt.trim()) || 'Your coffee is cold.';
  const stageLabel = stage === 'ready' ? 'READY' : stage === 'volley' ? 'LIVE VOLLEY' : 'COMPLETE';
  const stageProgress = stage === 'ready' ? 0 : stage === 'complete' ? 100 : Math.min(100, Math.round((voltCount / 5) * 100));

  const generateFallbackResponse = (volleyNum: number) => {
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

  const generateAiResponse = async (userInput: string, volleyNum: number) => {
    const promptText = `
You are the opponent in a fast improv drill called Absurdity Escalator.

Current prompt: "${initialPrompt}"
Volley number: ${volleyNum + 1} of 5
User line: "${userInput}"

Reply with ONE short comeback line that escalates the absurdity slightly.
Constraints:
- 4 to 12 words max
- playful, punchy, socially sharp
- no emojis
- no quotes
- no labels or explanations
`;

    try {
      const result = await AIService.generateResponse(
        [{ role: 'user', content: promptText }],
        'groq',
        user?.name || 'AGENT',
        user?.level || 1,
        'drill'
      );

      const cleaned = result
        .split('\n')[0]
        .replace(/^[-•\d.)\s]+/, '')
        .trim();

      if (!cleaned) return generateFallbackResponse(volleyNum);
      return cleaned.length > 90 ? `${cleaned.slice(0, 87).trimEnd()}...` : cleaned;
    } catch {
      return generateFallbackResponse(volleyNum);
    }
  };

  const handleStartVolley = () => {
    setStage('volley');
    setVoltCount(0);
    setExchanges([]);
  };

  const handleSendResponse = async () => {
    if (!userResponse.trim() || isGeneratingAi) return;

    const message = userResponse.trim();
    setIsGeneratingAi(true);
    const ai = await generateAiResponse(message, voltCount);
    setExchanges((prev) => [...prev, { user: message, ai }]);
    setAiResponse(ai);
    setUserResponse('');
    setIsGeneratingAi(false);

    setVoltCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setTimeout(() => {
          setStage('complete');
        }, 600);
      }
      return next;
    });
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <GlassCard style={styles.hudCard}>
          <View style={styles.hudHeaderRow}>
            <Text style={styles.hudLabel}>ABSURDITY ENGINE</Text>
            <Text style={[styles.hudStage, { color: systemColor }]}>{stageLabel}</Text>
          </View>
          <View style={styles.hudMeterTrack}>
            <View style={[styles.hudMeterFill, { width: `${stageProgress}%`, backgroundColor: systemColor }]} />
          </View>
          <View style={styles.hudStatsRow}>
            <View style={styles.hudStatPill}>
              <Text style={styles.hudStatKey}>VOLLEY</Text>
              <Text style={styles.hudStatVal}>{Math.min(voltCount, 5)}/5</Text>
            </View>
            <View style={styles.hudStatPill}>
              <Text style={styles.hudStatKey}>PREMISE</Text>
              <Text style={styles.hudStatVal} numberOfLines={1}>{initialPrompt}</Text>
            </View>
          </View>
        </GlassCard>

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
              <Text style={[styles.promptText, { color: '#FFFFFF' }]}>
                "{safePrompt}"
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
              label="INITIATE VOLLEY"
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
            <GlassCard style={styles.volleyContextCard}>
              <Text style={styles.rulesLabel}>CURRENT PROMPT:</Text>
              <Text style={[styles.volleyPromptText, { color: '#FFFFFF' }]}>"{safePrompt}"</Text>
              <Text style={[styles.rulesLabel, { marginTop: 10 }]}>RULES:</Text>
              <Text style={styles.rulesText}>
                • Escalate each reply more than the last.{"\n"}
                • Keep it playful, absurd, and committed.{"\n"}
                • 5 volleys total.
              </Text>
            </GlassCard>

            <View style={styles.volleys}>
              {exchanges.slice(-2).map((ex, idx) => (
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
                  label={isGeneratingAi ? 'THINKING...' : 'SEND'}
                  onPress={handleSendResponse}
                  tint="dark"
                  size="lg"
                  glow
                  disabled={!userResponse.trim() || isGeneratingAi}
                  style={{ width: '100%' }}
                />
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
  backText: { color: '#FFFFFF', fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1 },
  title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, letterSpacing: 3, textAlign: 'center' },

  scrollContent: { padding: Spacing.md, alignItems: 'center', gap: 12, paddingBottom: 14 },

  hudCard: {
    width: '100%',
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  hudHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hudLabel: { fontFamily: Fonts.monoBold, fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.55)' },
  hudStage: { fontFamily: Fonts.monoBold, fontSize: 10, letterSpacing: 2 },
  hudMeterTrack: {
    width: '100%',
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  hudMeterFill: { height: '100%', borderRadius: 999 },
  hudStatsRow: { flexDirection: 'row', gap: 10 },
  hudStatPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  hudStatKey: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1.5, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  hudStatVal: { fontFamily: Fonts.headingSemi, fontSize: 12, color: '#FFFFFF' },

  infoCard: {
    width: '100%',
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
  },
  infoLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6 },
  infoText: { fontFamily: Fonts.headingSemi, fontSize: 14, color: 'rgba(255,255,255,0.76)', lineHeight: 22 },

  promptCard: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  promptLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  promptText: { fontFamily: Fonts.headingSemi, fontSize: 16, textAlign: 'center', lineHeight: 24 },

  rulesCard: {
    width: '100%',
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
  },
  rulesLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  rulesText: { fontFamily: Fonts.headingSemi, fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 20 },

  volleyContextCard: {
    width: '100%',
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  volleyPromptText: { fontFamily: Fonts.headingSemi, fontSize: 16, lineHeight: 22 },

  volleys: { width: '100%', gap: 8 },
  volleyPair: { gap: 8 },
  exchangeCard: { padding: 10, borderRadius: Radius.md },
  exchangeLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 4 },
  exchangeText: { fontFamily: Fonts.headingSemi, fontSize: 12, color: '#FFFFFF' },

  input: {
    width: '100%',
    backgroundColor: 'rgba(12, 16, 32, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: Radius.md,
    color: Colors.textPrimary,
    padding: 12,
    fontFamily: Fonts.headingSemi,
    fontSize: 14,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },

  completeCard: { width: '100%', padding: 20, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  completeTitle: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.accentCyan, marginBottom: 12 },
  completeText: { fontFamily: Fonts.headingSemi, fontSize: 13, color: '#FFFFFF', lineHeight: 20 },
});
