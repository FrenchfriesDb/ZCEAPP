import DrillFeedbackPanel from '@/components/DrillFeedbackPanel';
import GlassButton from '@/components/GlassButton';
import GlassCard from '@/components/GlassCard';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { AIService } from '@/services/ai';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const COMPLAINTS = [
  "Coach is making us run 800s today, I'm going to die.",
  "I failed the bio test.",
  "The lunch line is so long today.",
  "My parents are being so annoying about my grades.",
  "I have too much homework.",
  "My phone battery died.",
  "Geometry makes no sense.",
  "Nobody texted me back all day.",
  "It's so cold outside.",
  "I have to wake up at 6 AM tomorrow.",
];

const VIBE_PIVOT_SECONDS = 8;

export default function VibePivotDrill() {
  const { user, completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const systemColor = timePalette[timePalette.length - 1];

  const [complaintIdx, setComplaintIdx] = useState(0);
  const [response, setResponse] = useState('');
  const [showGrade, setShowGrade] = useState(false);
  const [grade, setGrade] = useState('');
  const [timeLeft, setTimeLeft] = useState(VIBE_PIVOT_SECONDS);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const timerRatio = Math.max(0, Math.min(1, timeLeft / VIBE_PIVOT_SECONDS));
  const timerColor = timerRatio > 0.66 ? '#00FF64' : timerRatio > 0.33 ? '#F89B29' : '#FF3B30';

  useEffect(() => {
    const safePool = Array.isArray(COMPLAINTS) && COMPLAINTS.length > 0 ? COMPLAINTS : ['My phone battery died.'];
    setComplaintIdx(Math.floor(Math.random() * safePool.length));
  }, []);

  useEffect(() => {
    if (!isTimerActive || showGrade) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimerActive(false);

          if (response.trim()) {
            void analyzePivot(response);
          } else {
            Alert.alert('TIME EXPIRED', 'No pivot landed. Reset and go again.');
            setTimeLeft(VIBE_PIVOT_SECONDS);
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, showGrade, response]);

  const generateFallbackGrade = (input: string) => {
    const hasAbs = /absurd|ridiculous|conspiracy|secret|fake|made.*up|definitely|absolutely/.test(input.toLowerCase());
    const hasFlip = /flex|respect|actually|low key|big brain|goat|sigma/.test(input.toLowerCase());
    const hasDarkHumor = /dead|dying|never.*again|somehow|obviously/.test(input.toLowerCase());

    let score = input.length >= 20 ? 30 : 20;
    if (hasAbs) score += 30;
    if (hasFlip) score += 20;
    if (hasDarkHumor) score += 20;

    return `PERFORMANCE REVIEW: You understood the core mission: move the energy out of whining and into entertainment fast.

WHAT YOU DID WELL:
- You actually pivoted instead of agreeing with the complaint.
- Your line had some absurdity, which is what gives this drill life.

WHAT MISSED:
- The punch could still be sharper or more unexpected.
- The frame needs a little more certainty to feel magnetic instead of just random.

WHY IT WORKS / WHY IT FAILS:
The whole drill is about killing boring reality and replacing it with a more fun frame. When you commit to absurdity with confidence, people follow you. When the pivot is soft, it feels like a joke attempt instead of a vibe shift.

MAGNETIC VERSION: Say it smoother, like the situation was obviously beneath you the whole time.
CEO VERSION: Frame the complaint like operational weakness and redirect with calm certainty.
CLASS CLOWN VERSION: Lean harder into the chaos and make the absurdity feel reckless on purpose.
FUNNY VERSION: Add one cleaner punchline instead of stacking too many ideas.
WITTY VERSION: Keep it dry, tight, and a little smug.

SCORE: ${Math.min(10, Math.max(3, Math.round(score / 10)))}/10`;
  };

  const analyzePivot = async (input: string) => {
    setIsAnalyzing(true);
    try {
      const aiFeedback = await AIService.generateResponse([
        {
          role: 'user',
          content: `DRILL: Vibe Pivot
COMPLAINT: ${COMPLAINTS[complaintIdx]}
USER PIVOT: ${input}

Review this rep like a drill analyst. Focus on whether they successfully turned a boring complaint into entertainment, deadpan authority, absurdity, or a social frame shift. Give concrete notes and alternate versions. End with SCORE: X/10.`,
        },
  ], 'groq', user?.name || 'AGENT', user?.level || 1, 'drill', { drillPlan: ((user as any)?.subscriptionTier === 'director' ? 'pro' : 'basic') });

      setGrade(aiFeedback);
    } catch (error) {
      console.error('Vibe Pivot analysis error:', error);
      setGrade(generateFallbackGrade(input));
    } finally {
      setShowGrade(true);
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!response.trim()) {
      Alert.alert('Empty Response', 'You need to pivot this complaint!');
      return;
    }

    setIsTimerActive(false);
    void analyzePivot(response);
  };

  const handleComplete = async () => {
    try {
      await completeDrill(15);
      Alert.alert('REP VERIFIED', 'Vibe pivoted. +15 XP awarded.', [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        {
          text: 'NEXT REP',
          onPress: () => {
            setResponse('');
            setShowGrade(false);
            setGrade('');
            setTimeLeft(VIBE_PIVOT_SECONDS);
            setIsTimerActive(false);
            setComplaintIdx(Math.floor(Math.random() * COMPLAINTS.length));
          },
        },
      ]);
    } catch (err) {
      console.error('Drill completion error:', err);
    }
  };

  const handleResponseChange = (value: string) => {
    if (!isTimerActive && !showGrade && value.trim().length > 0) {
      setIsTimerActive(true);
    }
    setResponse(value);
  };

  const handleNextRep = () => {
    setResponse('');
    setShowGrade(false);
    setGrade('');
    setTimeLeft(VIBE_PIVOT_SECONDS);
    setIsTimerActive(false);
    setComplaintIdx(Math.floor(Math.random() * COMPLAINTS.length));
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
        <Text style={[styles.title, { color: systemColor }]}>VIBE PIVOT</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!showGrade ? (
          <>
            <GlassCard style={[styles.complaintCard, { borderColor: systemColor + '44' }]}>
              <Text style={styles.complaintLabel}>THE COMPLAINT:</Text>
              <Text style={[styles.complaintText, { color: '#FFFFFF' }]}>
                &quot;{COMPLAINTS[complaintIdx]}&quot;
              </Text>
            </GlassCard>

            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoLabel}>HOW IT WORKS:</Text>
              <Text style={styles.infoText}>
                Someone drops a boring complaint. You have 8 seconds to pivot it into a deadpan flex or absurd conspiracy. Move the topic from &quot;reality&quot; to &quot;entertainment.&quot;
              </Text>
            </GlassCard>

            <GlassCard style={[styles.timerCard, { borderColor: timerColor + '55' }]}>
              <Text style={[styles.timerText, { color: timerColor }]}>
                {timeLeft}s
              </Text>
              <Text style={styles.timerLabel}>
                {isTimerActive ? 'TIME TO PIVOT' : 'TIMER STARTS ON FIRST WORD'}
              </Text>
              <View style={styles.timerBarBg}>
                <View
                  style={[
                    styles.timerBarFill,
                    {
                      width: `${(timeLeft / VIBE_PIVOT_SECONDS) * 100}%`,
                      backgroundColor: timerColor,
                    },
                  ]}
                />
              </View>
            </GlassCard>

            <Text style={styles.inputLabel}>YOUR PIVOT:</Text>
            <TextInput
              style={styles.responseInput}
              placeholder="Flip it into gold..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={response}
              onChangeText={handleResponseChange}
              autoFocus
              multiline
            />

            <GlassButton
              label={isAnalyzing ? 'ANALYZING...' : 'SUBMIT PIVOT'}
              onPress={handleSubmit}
              tint="blue"
              size="lg"
              glow={response.length > 10}
              disabled={isAnalyzing}
              style={{ width: '100%', marginTop: 12 }}
            />
          </>
        ) : (
          <>
            <GlassCard style={styles.responseCard}>
              <Text style={styles.responseLabel}>YOUR RESPONSE:</Text>
              <Text style={styles.responseText}>&quot;{response}&quot;</Text>
            </GlassCard>

            <GlassCard style={styles.gradeCard}>
              <DrillFeedbackPanel feedback={grade} maxHeight={460} />
            </GlassCard>

            <GlassButton
              label="SAVE REP (+15 XP)"
              onPress={handleComplete}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />

            <GlassButton
              label="NEXT REP"
              onPress={handleNextRep}
              tint="dark"
              size="md"
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

  complaintCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  complaintLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  complaintText: { fontFamily: Fonts.heading, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  timerCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1 },
  timerText: { fontFamily: Fonts.heading, fontSize: 40, lineHeight: 44, textAlign: 'center' },
  timerLabel: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.38)', letterSpacing: 1.6, marginTop: 4, marginBottom: 10 },
  timerBarBg: { width: '100%', height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' },
  timerBarFill: { height: '100%', borderRadius: 999 },

  inputLabel: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, alignSelf: 'flex-start', marginTop: 10 },
  responseInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    padding: 12,
    color: Colors.textPrimary,
    fontFamily: Fonts.headingSemi,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  responseCard: { width: '100%', padding: 12, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  responseLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(0, 245, 255, 0.5)', letterSpacing: 1, marginBottom: 8 },
  responseText: { fontFamily: Fonts.headingSemi, fontSize: 13, color: Colors.textPrimary },

  gradeCard: { width: '100%', padding: 14, backgroundColor: 'rgba(255,255,255,0.03)' },
});
