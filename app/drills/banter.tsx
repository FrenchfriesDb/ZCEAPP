import { View, Text, StyleSheet, Pressable, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

const STATEMENTS = [
  "I basically ran that whole meeting.",
  "That teacher has definitely seen things.",
  "The lunch today was a choice.",
  "I may have accidentally started something.",
  "He really thought he did something there.",
  "That was the most mid thing I've ever witnessed.",
  "She's out here acting like she invented the concept.",
  "Bro really said that out loud.",
  "I've never seen someone miss the point that hard.",
  "That's one way to announce you don't understand.",
  "He walked in like he owned the place and left like he forgot why.",
  "She just confidently stated the opposite of reality.",
  "That took a turn I wasn't prepared for.",
  "And that's why nobody talks to him at lunch.",
  "Why would you say that bro",
  "Shut up no one likes you",
  "You really thought you were tuff huh?"
];

export default function BanterBuilderDrill() {
  const { completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const themeColor = timePalette[0]; // Use first color (now pastel yellow in Golden Hour)

  const [statementIdx, setStatementIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safeStatements = Array.isArray(STATEMENTS) && STATEMENTS.length > 0 ? STATEMENTS : ['Bro really said that out loud.'];
  const safeStatement = safeStatements[statementIdx] || safeStatements[0];
  const timerRatio = Math.max(0, Math.min(1, timeLeft / 5));
  const timerColor = timerRatio > 0.66 ? '#00FF64' : timerRatio > 0.33 ? '#F89B29' : '#FF3B30';

  useEffect(() => {
    // Pick random statement on load
    setStatementIdx(Math.floor(Math.random() * safeStatements.length));
  }, []);

  useEffect(() => {
    if (!isTimerActive || timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeLeft === 0 && isTimerActive) {
        setIsTimerActive(false);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next === 0) {
          setIsTimerActive(false);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, timeLeft]);

  const startRound = () => {
    setTimeLeft(5);
    setUserResponse('');
    setShowAnalysis(false);
    setIsTimerActive(true);
  };

  const nextStatement = () => {
    setStatementIdx((Math.random() * safeStatements.length) | 0);
    setTimeLeft(5);
    setUserResponse('');
    setShowAnalysis(false);
    setIsTimerActive(false);
  };

  const generateAnalysis = (response: string) => {
    // Custom "Accidental Savage" AI voice analysis
    const isGood = response.length > 3; // Very basic check
    
    if (isGood) {
      const analyses = [
        `MINDSET ANALYSIS: The Accidental Savage 🩸

You just threw that out there like you knew exactly what you were doing—and honestly, that's half the battle. While most people freeze and overthink, you had the conviction to deliver something. That commitment alone made it land better than it should have.

The best part? You didn't wait for applause. You didn't explain it. You didn't soften it with "I mean..." or "Like...". You just said it and moved on. That's swagger. That's confidence wearing confidence.

Why did they laugh? Because you violated the unspoken rule that comedy needs to be polished. You went raw. You went unfiltered. You went "I'm saying this even if it's not perfect."

Goggins says: "You didn't hesitate. You swung. That's what separates people who are funny from people who want to be funny."

The Brutal Truth: You're getting there. But next time, lean into it harder. When you feel a joke land, own it. Smirk. Don't retreat. Don't apologize with your eyes. You earned that laugh.`,
        
        `MINDSET ANALYSIS: The Accidental Savage 🩸

Hold on—you actually committed to that response. That's rare. Most people would've held back or softened it. Not you.

Here's what just happened: You put an idea into the world without asking for permission first. You didn't run it through a committee in your head. You didn't wait for the green light from the crowd. You just... sent it.

That's the difference between being funny and being forgettable. Funny people move fast. Forgettable people spend too much time calibrating.

Why it mattered: The speed. The conviction. The fact that you didn't apologize before, during, or after. You treated your statement like it was worth hearing, and that confidence is contagious.

Zane says: "Comedy isn't about having the perfect joke. It's about owning the moment you're in."

The Brutal Truth: You're learning. Keep doing this. Learn to feel the room's energy, add your layer to the conversation, and move on. Repeat that 1,000 times and you'll be the person people want at the table.`,
      ];
      return analyses[Math.floor(Math.random() * analyses.length)];
    } else {
      return `MINDSET ANALYSIS: The Accidental Savage 🩸

Okay, so you froze. That's real. That's honest. But here's the thing—freezing is just stage fright wearing a different costume.

The 5-second timer revealed your biggest enemy: yourself. You had a moment to add one layer, and instead of trusting your instinct, you probably heard a thousand voices in your head asking "Is this funny?" "Will they judge me?" "What if I mess up?"

News flash: You wouldn't have messed up worse than saying nothing.

Why silence fails: When the room gives you an opening, filling it with anything—literally anything with conviction—beats leaving it empty. An empty response says "I don't have ideas." A bad response says "I have ideas and I'm willing to risk them."

Goggins says: "You're afraid of being wrong, but that fear is what's making you weak."

The Brutal Truth: Next round, don't think. Respond. Your first instinct is usually funnier than your third. Stop editing yourself in real time. Say the weird thing. Say the absurd thing. Say it and own it.`;
    }
  };

  const handleSubmit = async () => {
    if (!userResponse.trim()) {
      Alert.alert('Empty Response', 'You need to add something to the statement!');
      return;
    }

    setIsTimerActive(false);
    const generatedAnalysis = generateAnalysis(userResponse);
    setAnalysis(generatedAnalysis);
    setShowAnalysis(true);
  };

  const handleComplete = async () => {
    try {
      await completeDrill(15);
      Alert.alert('REP VERIFIED', 'Banter round logged. +15 XP awarded.', [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        { text: 'NEXT REP', onPress: nextStatement },
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
        <Text style={[styles.title, { color: themeColor }]}>BANTER BUILDER</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {!showAnalysis ? (
          <>
            {/* Instructions */}
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoLabel}>HOW IT WORKS:</Text>
              <Text style={styles.infoText}>
                Someone says something. You have 5 seconds to build on it. No new topics. No explanations. Just add one layer.
              </Text>
            </GlassCard>

            {/* Statement Display */}
            <View style={styles.statementInline}>
              <Text style={styles.statementLabel}>STATEMENT:</Text>
              <Text style={styles.statementText}>
                "{safeStatement}"
              </Text>
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Text style={[styles.timerText, { color: timerColor }]}>
                {isTimerActive ? timeLeft : '5'}
              </Text>
              <Text style={styles.timerLabel}>{isTimerActive ? 'SECONDS LEFT' : 'TAP TO START'}</Text>
            </View>

            {/* Response Input */}
            {isTimerActive && (
              <TextInput
                style={styles.responseInput}
                placeholder="Build on it. One line. No explaining."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={userResponse}
                onChangeText={setUserResponse}
                editable={isTimerActive}
                autoFocus
              />
            )}

            {!isTimerActive && userResponse && (
              <GlassCard style={styles.responseCard}>
                <Text style={styles.responseLabel}>YOUR LINE:</Text>
                <Text style={styles.responseText}>{userResponse}</Text>
              </GlassCard>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              {!isTimerActive && (
                <>
                  {!userResponse ? (
                    <GlassButton
                      label="START (5 SEC)"
                      onPress={startRound}
                      tint="blue"
                      size="lg"
                      glow
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <>
                      <GlassButton
                        label="SUBMIT"
                        onPress={handleSubmit}
                        tint="blue"
                        size="lg"
                        glow
                        style={{ flex: 1 }}
                      />
                      <GlassButton
                        label="TRY AGAIN"
                        onPress={startRound}
                        tint="dark"
                        size="lg"
                        style={{ flex: 1 }}
                      />
                    </>
                  )}
                </>
              )}
            </View>
          </>
        ) : (
          <>
            {/* Analysis Display */}
            <GlassCard style={styles.analysisCard}>
              <Text style={styles.analysisText}>{analysis}</Text>
            </GlassCard>

            <View style={styles.buttonGroup}>
              <GlassButton
                label="SAVE REP (+15 XP)"
                onPress={handleComplete}
                tint="blue"
                size="lg"
                glow
                style={{ width: '100%' }}
              />
              <GlassButton
                label="ANOTHER ROUND"
                onPress={nextStatement}
                tint="dark"
                size="lg"
                style={{ width: '100%', marginTop: 12 }}
              />
            </View>
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
  title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, letterSpacing: 3, textAlign: 'center' },

  scrollContent: { padding: Spacing.md, alignItems: 'center', gap: 12, paddingBottom: 10 },

  infoCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  infoLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6 },
  infoText: { fontFamily: Fonts.headingMedium, fontSize: 13, color: '#FFFFFF', lineHeight: 22, opacity: 0.9 },

  statementInline: { width: '100%', paddingHorizontal: 10, paddingTop: 4, paddingBottom: 2, alignItems: 'center' },
  statementLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  statementText: { fontFamily: Fonts.heading, fontSize: 17, color: '#FFFFFF', textAlign: 'center', lineHeight: 25 },

  timerContainer: { alignItems: 'center', marginVertical: 20, gap: 4, paddingVertical: 6, width: '100%' },
  timerText: { fontFamily: Fonts.heading, fontSize: 64, fontWeight: '900', lineHeight: 78, textAlign: 'center', width: '100%' },
  timerLabel: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },

  responseInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.md,
    padding: 14,
    color: Colors.textPrimary,
    fontFamily: Fonts.nunito,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  responseCard: { width: '100%', padding: 14, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  responseLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(0, 245, 255, 0.5)', letterSpacing: 1, marginBottom: 8 },
  responseText: { fontFamily: Fonts.nunito, fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },

  analysisCard: { width: '100%', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Radius.lg },
  analysisText: { fontFamily: Fonts.nunito, fontSize: 12, color: '#FFFFFF', lineHeight: 20 },

  buttonGroup: { width: '100%', gap: 10, marginTop: 16 },
});
