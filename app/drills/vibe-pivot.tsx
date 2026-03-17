import { View, Text, StyleSheet, Pressable, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

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

export default function VibePivotDrill() {
  const { completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const systemColor = timePalette[timePalette.length - 1];

  const [complaintIdx, setComplaintIdx] = useState(0);
  const [response, setResponse] = useState('');
  const [showGrade, setShowGrade] = useState(false);
  const [grade, setGrade] = useState('');

  useEffect(() => {
    setComplaintIdx(Math.floor(Math.random() * COMPLAINTS.length));
  }, []);

  const generateGrade = (input: string) => {
    // Very simple grading logic
    const hasAbs = /absurd|ridiculous|conspiracy|secret|fake|made.*up|definitely|absolutely/.test(input.toLowerCase());
    const hasFlip = /flex|respect|actually|low key|big brain|goat|sigma/.test(input.toLowerCase());
    const hasDarkHumor = /dead|dying|never.*again|somehow|obviously/.test(input.toLowerCase());

    let score = input.length >= 20 ? 30 : 20;
    if (hasAbs) score += 30;
    if (hasFlip) score += 20;
    if (hasDarkHumor) score += 20;

    const grades = [
      `MINDSET ANALYSIS: The Pivot Master 🩸\n\nYou took boring and turned it into absurdity. That's the skill. Most people stay stuck in complaining mode—you reprogrammed the entire conversation.\n\nGoggins says: "You pivoted from victim to victor in one line. That's what happens when you stop accepting the narrative they hand you."\n\nScore: ${score}/100`,
      `MINDSET ANALYSIS: The Vibe Shifter\n\nYou didn't just deflect—you reframed the entire situation. Boring complaint turned into deadpan authority. That's the move.\n\nZane says: "The best comedy is when you say something ridiculous with complete certainty. You did that."\n\nScore: ${score}/100`,
    ];

    return grades[Math.floor(Math.random() * grades.length)];
  };

  const handleSubmit = () => {
    if (!response.trim()) {
      Alert.alert('Empty Response', 'You need to pivot this complaint!');
      return;
    }

    const generated = generateGrade(response);
    setGrade(generated);
    setShowGrade(true);
  };

  const handleComplete = async () => {
    try {
      await completeDrill(15);
      Alert.alert('REP VERIFIED', 'Vibe pivoted. +15 XP awarded.', [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        { text: 'NEXT REP', onPress: () => { setResponse(''); setShowGrade(false); setComplaintIdx(Math.floor(Math.random() * COMPLAINTS.length)); } },
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
        <Text style={[styles.title, { color: systemColor }]}>VIBE PIVOT</Text>
        <View style={{ width: 60 }} />
      </View>

      {!showGrade && (
        <View style={{ paddingHorizontal: Spacing.md, paddingTop: 6 }}>
          <GlassCard style={[styles.complaintCard, { borderColor: systemColor + '44' }]}>
            <Text style={styles.complaintLabel}>THE COMPLAINT:</Text>
            <Text style={[styles.complaintText, { color: systemColor }]}>
              "{COMPLAINTS[complaintIdx]}"
            </Text>
          </GlassCard>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!showGrade ? (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoLabel}>HOW IT WORKS:</Text>
              <Text style={styles.infoText}>
                Someone drops a boring complaint. You have 8 seconds to pivot it into a deadpan flex or absurd conspiracy. Move the topic from "reality" to "entertainment."
              </Text>
            </GlassCard>

            <Text style={styles.inputLabel}>YOUR PIVOT:</Text>
            <TextInput
              style={styles.responseInput}
              placeholder="Flip it into gold..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={response}
              onChangeText={setResponse}
              autoFocus
              multiline
            />

            <GlassButton
              label="SUBMIT PIVOT"
              onPress={handleSubmit}
              tint="blue"
              size="lg"
              glow={response.length > 10}
              style={{ width: '100%', marginTop: 12 }}
            />
          </>
        ) : (
          <>
            <GlassCard style={styles.responseCard}>
              <Text style={styles.responseLabel}>YOUR RESPONSE:</Text>
              <Text style={styles.responseText}>"{response}"</Text>
            </GlassCard>

            <GlassCard style={styles.gradeCard}>
              <Text style={styles.gradeText}>{grade}</Text>
            </GlassCard>

            <GlassButton
              label="SAVE REP (+15 XP)"
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

  complaintCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  complaintLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  complaintText: { fontFamily: Fonts.heading, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  inputLabel: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, alignSelf: 'flex-start', marginTop: 10 },
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
    minHeight: 60,
    textAlignVertical: 'top',
  },

  responseCard: { width: '100%', padding: 12, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  responseLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(0, 245, 255, 0.5)', letterSpacing: 1, marginBottom: 8 },
  responseText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textPrimary },

  gradeCard: { width: '100%', padding: 14, backgroundColor: 'rgba(255,255,255,0.03)' },
  gradeText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, lineHeight: 20 },
});
