import GlassButton from '@/components/GlassButton';
import GlassCard from '@/components/GlassCard';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTextColors } from '@/context/TextColorsContext';
import { useUser } from '@/context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const WEAPONS = [
  { name: 'FLIP', desc: 'Turn it around. Reverse the energy.' },
  { name: 'EXAGGERATION', desc: 'Take it to 11. Amplify.' },
  { name: 'ABSURDITY', desc: 'Go totally ridiculous. Unhinged.' },
  { name: 'SILENCE', desc: 'Pause. Let them sit.' },
  { name: 'QUESTIONS', desc: 'Ask them. Make them think.' },
  { name: 'AGREEMENT', desc: 'Say yes, then add.' },
  { name: 'REDIRECT', desc: 'Change the subject entirely.' },
  { name: 'CONTRAST', desc: 'Go completely opposite.' },
];

export default function WeaponPickerDrill() {
  const { completeDrill } = useUser();
  const { textPrimary } = useTextColors();
  const systemColor = textPrimary;

  const [stage, setStage] = useState<'ready' | 'prompt' | 'weapon' | 'response' | 'grade' | 'complete'>('ready');
  const [randomWeapon, setRandomWeapon] = useState<typeof WEAPONS[0] | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [weaponScore, setWeaponScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [roundTimer, setRoundTimer] = useState(30);
  const roundTimerRatio = Math.max(0, Math.min(1, roundTimer / 30));
  const roundTimerColor = roundTimerRatio > 0.66 ? '#00FF64' : roundTimerRatio > 0.33 ? '#F89B29' : '#FF3B30';

  const PROMPTS = [
    'Your idea just got rejected.',
    'Someone called you boring.',
    'You made a mistake in front of everyone.',
    'Someone tried to one-up you.',
    'Your plan fell apart.',
  ];

  const [currentPrompt, setCurrentPrompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)] || 'Your idea just got rejected.');
  const safePrompt = (currentPrompt && currentPrompt.trim()) || 'Your idea just got rejected.';

  useEffect(() => {
    setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  useEffect(() => {
    if (stage !== 'response') return;
    const interval = setInterval(() => {
      setRoundTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setWeaponScore(0);
          setStage('grade');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const handleStartRound = () => {
    const weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
    setRandomWeapon(weapon);
    setStage('weapon');
  };

  const handleRevealWeapon = () => {
    setRoundTimer(30);
    setStage('response');
  };

  const handleSubmitResponse = () => {
    if (!userResponse.trim()) return;
    setStage('grade');
    gradeResponse();
  };

  const gradeResponse = () => {
    const response = userResponse.toLowerCase();
    let score = 0;

    switch (randomWeapon?.name) {
      case 'FLIP':
        score = /flip|turn|around|opposite|reverse/i.test(response) ? 18 : 8;
        break;
      case 'EXAGGERATION':
        score = /exagger|amplify|extreme|max|11/i.test(response) ? 18 : 8;
        break;
      case 'ABSURDITY':
        score = /absurd|ridiculous|insane|unhinged|void/i.test(response) ? 18 : 8;
        break;
      case 'SILENCE':
        score = /silent|pause|wait|stop|nothing/i.test(response) ? 18 : 8;
        break;
      case 'QUESTIONS':
        score = /ask|what|why|how|question/i.test(response) && response.includes('?') ? 18 : 8;
        break;
      case 'AGREEMENT':
        score = /yes|agree|and|exactly|right/i.test(response) ? 18 : 8;
        break;
      case 'REDIRECT':
        score = /change|different|other|topic|subject/i.test(response) ? 18 : 8;
        break;
      case 'CONTRAST':
        score = /opposite|different|unlike|counter/i.test(response) ? 18 : 8;
        break;
      default:
        score = 10;
    }

    setWeaponScore(score);
    setTotalScore((prev) => prev + score);
  };

  const handleNextRound = () => {
    const newRounds = roundsCompleted + 1;
    setRoundsCompleted(newRounds);

    if (newRounds >= 3) {
      setStage('complete');
    } else {
      const weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
      setRandomWeapon(weapon);
      setUserResponse('');
      setWeaponScore(0);
      setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
      setStage('weapon');
    }
  };

  const handleComplete = async () => {
    try {
      const xp = Math.floor(totalScore / 3);
      await completeDrill(xp);
      Alert.alert('ARSENAL UNLOCKED', `Mastered 3 weapons. Total Score: ${totalScore}. +${xp} XP awarded.`, [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        { text: 'ANOTHER SESSION', onPress: () => { setStage('ready'); setRoundsCompleted(0); setTotalScore(0); setWeaponScore(0); setUserResponse(''); } },
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
        <Text style={[styles.title, { color: systemColor }]}>WEAPON PICKER</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {stage === 'ready' && (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoLabel}>THE PROBLEM:</Text>
              <Text style={styles.infoText}>
                You react the same way to every attack. You have no variance. Time to build an arsenal of weapons for any scenario.
              </Text>
            </GlassCard>

            <GlassCard style={styles.rulesCard}>
              <Text style={styles.rulesLabel}>RULES:</Text>
              <Text style={styles.rulesText}>
                • I give you a tough scenario.{'\n'}
                • I randomly assign you a weapon.{'\n'}
                • You respond using ONLY that weapon.{'\n'}
                • 3 rounds = full arsenal.{'\n'}
                • Goal: Master each weapon type.
              </Text>
            </GlassCard>

            <GlassButton
              label="START ARSENAL TRAINING"
              onPress={handleStartRound}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'weapon' && randomWeapon && (
          <>
            <GlassCard style={styles.promptCard}>
              <Text style={styles.promptLabel}>SCENARIO:</Text>
              <Text style={[styles.promptText, { color: '#FFFFFF' }]}>
                &quot;{safePrompt}&quot;
              </Text>
            </GlassCard>

            <GlassCard style={[styles.weaponCard, { borderColor: systemColor + '66' }]}>
              <Text style={styles.weaponLabel}>YOUR WEAPON:</Text>
              <Text style={[styles.weaponName, { color: systemColor }]}>
                {randomWeapon.name}
              </Text>
              <Text style={styles.weaponDesc}>
                {randomWeapon.desc}
              </Text>
            </GlassCard>

            <GlassButton
              label="READY - SHOW ME HOW"
              onPress={handleRevealWeapon}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'response' && randomWeapon && (
          <>
            <GlassCard style={[styles.instructionCard, { borderColor: systemColor + '44', borderWidth: 1 }]}>
              <Text style={styles.instructionLabel}>SCENARIO (WEAPON: {randomWeapon.name}):</Text>
              <Text style={styles.instructionText}>
                &quot;{safePrompt}&quot;
              </Text>
              <Text style={[styles.liveMetaText, { color: roundTimerColor }]}>TIMER: {roundTimer}s • RULE: Use only {randomWeapon.name}</Text>
            </GlassCard>

            <TextInput
              style={styles.input}
              placeholder="Your response..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={userResponse}
              onChangeText={setUserResponse}
              multiline
              maxLength={300}
            />

            <GlassButton
              label="SUBMIT"
              onPress={handleSubmitResponse}
              tint="blue"
              size="lg"
              glow
              disabled={!userResponse.trim()}
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'grade' && randomWeapon && (
          <>
            <GlassCard style={[styles.gradeCard, { borderColor: weaponScore >= 15 ? Colors.accentCyan : '#FF8844', backgroundColor: weaponScore >= 15 ? 'rgba(0, 245, 255, 0.05)' : 'rgba(255, 136, 68, 0.05)' }]}>
              <Text style={[styles.gradeScore, { color: weaponScore >= 15 ? Colors.accentCyan : '#FF8844' }]}>
                {weaponScore >= 15 ? 'WEAPON MASTERED' : 'WEAPON UNLOCKED'}
              </Text>
              <Text style={styles.gradeText}>
                {weaponScore >= 15
                  ? `You wielded ${randomWeapon.name} perfectly. That's lethal.`
                  : `You used ${randomWeapon.name}, but next time lean harder into: ${randomWeapon.desc}`}
              </Text>
              <Text style={styles.gradeScore}>{weaponScore} pts</Text>
            </GlassCard>

            <GlassButton
              label="NEXT WEAPON"
              onPress={handleNextRound}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'complete' && (
          <>
            <GlassCard style={styles.completeCard}>
              <Text style={styles.completeTitle}>ARSENAL LOADED ✓</Text>
              <Text style={styles.completeText}>
                You just mastered 3 advanced weapons. You now have variance. You can respond to any scenario with the right tool.
              </Text>
              <Text style={styles.totalScore}>
                Total Score: {totalScore}
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
  infoText: { fontFamily: Fonts.headingSemi, fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 20 },

  rulesCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  rulesLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  rulesText: { fontFamily: Fonts.headingSemi, fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 18 },

  promptCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  promptLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  promptText: { fontFamily: Fonts.headingSemi, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  weaponCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1 },
  weaponLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  weaponName: { fontFamily: Fonts.heading, fontSize: 18, marginBottom: 8 },
  weaponDesc: { fontFamily: Fonts.headingSemi, fontSize: 12, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },

  instructionCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  instructionLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  instructionText: { fontFamily: Fonts.headingSemi, fontSize: 13, color: '#FFFFFF', fontStyle: 'italic', lineHeight: 20 },
  liveMetaText: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2, marginTop: 8 },

  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(113, 195, 247, 0.3)',
    borderRadius: Radius.md,
    color: Colors.textPrimary,
    padding: 12,
    fontFamily: Fonts.headingSemi,
    fontSize: 13,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
  },

  gradeCard: { width: '100%', padding: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  gradeScore: { fontFamily: Fonts.heading, fontSize: 16, marginBottom: 8 },
  gradeText: { fontFamily: Fonts.headingSemi, fontSize: 12, color: 'rgba(255,255,255,0.82)', textAlign: 'center', marginBottom: 10, lineHeight: 18 },

  completeCard: { width: '100%', padding: 20, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  completeTitle: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.accentCyan, marginBottom: 12 },
  completeText: { fontFamily: Fonts.headingSemi, fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 20, marginBottom: 12 },
  totalScore: { fontFamily: Fonts.heading, fontSize: 14, color: Colors.accentCyan, textAlign: 'center' },
});
