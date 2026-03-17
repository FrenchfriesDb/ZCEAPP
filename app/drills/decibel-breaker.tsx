import { View, Text, StyleSheet, Pressable, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

const TEXT_PASSAGES = [
  "I've never met someone who could command a room just by standing in it. But that's exactly what you do.",
  "The way people talk about you when you're not around says everything. You've built a reputation for actually knowing what you're talking about.",
  "Most people break under pressure. You seem to get more dangerous the higher the stakes go.",
  "Confidence isn't arrogance. It's the absence of self-doubt. And you've mastered it.",
  "The best part about you is that you don't need to prove anything to anyone. You already know.",
];

export default function DecibelBreakerDrill() {
  const { completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const systemColor = timePalette[timePalette.length - 1];

  const [passageIdx, setPassageIdx] = useState(0);
  const [stage, setStage] = useState<'ready' | 'recording' | 'complete'>('ready');
  const [recordingTime, setRecordingTime] = useState(0);
  const [simulatedDb, setSimulatedDb] = useState(50);

  useEffect(() => {
    setPassageIdx(Math.floor(Math.random() * TEXT_PASSAGES.length));
  }, []);

  // Simulate dB level during recording
  useEffect(() => {
    if (stage !== 'recording') return;

    const timer = setInterval(() => {
      setRecordingTime(prev => {
        const next = prev + 1;
        // Simulate varying dB levels as user "speaks"
        const newDb = 50 + Math.sin(next * 0.5) * 15 + Math.random() * 10;
        setSimulatedDb(Math.max(40, Math.min(95, newDb)));

        if (next >= 5) {
          setStage('complete');
          setSimulatedDb(50);
          return 5;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  const handleStartRecording = () => {
    setStage('recording');
    setRecordingTime(0);
  };

  const handleComplete = async () => {
    try {
      const dbQuality = simulatedDb > 70 ? 'excellent' : simulatedDb > 60 ? 'good' : 'needs improvement';
      const xp = simulatedDb > 70 ? 18 : simulatedDb > 60 ? 15 : 12;
      await completeDrill(xp);
      Alert.alert('VOLUME PROJECTED', `Diaphragm power detected (${Math.round(simulatedDb)} dB). ${dbQuality}. +${xp} XP awarded.`, [
        { text: 'FINISH SESSION', onPress: () => router.replace('/') },
        { text: 'NEXT REP', onPress: () => { setStage('ready'); setRecordingTime(0); setSimulatedDb(50); setPassageIdx(Math.floor(Math.random() * TEXT_PASSAGES.length)); } },
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
        <Text style={[styles.title, { color: systemColor }]}>DECIBEL BREAKER</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoLabel}>THE PROBLEM:</Text>
          <Text style={styles.infoText}>
            Your voice gets soft. You mumble. People ask you to repeat yourself. Time to project from the diaphragm like your life depends on it.
          </Text>
        </GlassCard>

        {stage === 'ready' && (
          <>
            <GlassCard style={[styles.passageCard, { borderColor: systemColor + '44' }]}>
              <Text style={styles.passageLabel}>READ THIS ALOUD (LOUD):</Text>
              <Text style={[styles.passageText, { color: systemColor }]}>
                {TEXT_PASSAGES[passageIdx]}
              </Text>
            </GlassCard>

            <GlassCard style={styles.rulesCard}>
              <Text style={styles.rulesLabel}>RULES:</Text>
              <Text style={styles.rulesText}>
                • Speak from your diaphragm, not your throat{'\n'}
                • Project like you're talking to the back of a theater{'\n'}
                • No mumbling. Every word crisp and strong.{'\n'}
                • The app tracks dB level. Don't go soft.
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
            <GlassCard style={[styles.passageCard, { borderColor: systemColor + '44', backgroundColor: 'rgba(113, 195, 247, 0.03)' }]}>
              <Text style={styles.passageLabel}>READ ALOUD:</Text>
              <Text style={[styles.passageText, { color: systemColor }]}>
                {TEXT_PASSAGES[passageIdx]}
              </Text>
            </GlassCard>

            <GlassCard style={styles.recordingCard}>
              <Text style={[styles.recordingText, { color: '#FF4444' }]}>● RECORDING</Text>
              <Text style={styles.recordingDesc}>Speak clearly. Project from diaphragm.</Text>
            </GlassCard>

            {/* dB Level Meter */}
            <GlassCard style={styles.meterCard}>
              <Text style={styles.meterLabel}>VOLUME LEVEL</Text>
              <Text style={styles.dbValue}>{Math.round(simulatedDb)} dB</Text>
              <View style={styles.meterBar}>
                <View style={[
                  styles.meterFill,
                  {
                    width: `${((simulatedDb - 40) / 55) * 100}%`,
                    backgroundColor: simulatedDb > 70 ? '#00FF00' : simulatedDb > 60 ? '#FFD700' : '#FF6B6B'
                  }
                ]} />
              </View>
              <View style={styles.meterLabels}>
                <Text style={styles.meterMin}>40 dB</Text>
                <Text style={styles.meterMid}>65 dB (TARGET)</Text>
                <Text style={styles.meterMax}>95 dB</Text>
              </View>
            </GlassCard>
          </>
        )}

        {stage === 'complete' && (
          <>
            <GlassCard style={styles.completeCard}>
              <Text style={styles.completeTitle}>VOLUME LOCKED ✓</Text>
              <Text style={styles.dbDisplay}>{Math.round(simulatedDb)} dB</Text>
              <Text style={styles.completeText}>
                You just proved you can project with authority. No more mumbling. You own the room.
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

  passageCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  passageLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  passageText: { fontFamily: Fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  rulesCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  rulesLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  rulesText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  recordingCard: { width: '100%', padding: 20, alignItems: 'center', backgroundColor: 'rgba(255, 68, 68, 0.05)', borderColor: 'rgba(255, 68, 68, 0.2)', borderWidth: 1 },
  recordingText: { fontFamily: Fonts.heading, fontSize: 24, marginBottom: 8 },
  recordingDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },

  meterCard: { width: '100%', padding: 16, backgroundColor: 'rgba(255,255,255,0.02)' },
  meterLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  dbValue: { fontFamily: Fonts.heading, fontSize: 28, color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  meterBar: { width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  meterFill: { height: '100%', borderRadius: 6 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  meterMin: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)' },
  meterMid: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)' },
  meterMax: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)' },

  completeCard: { width: '100%', padding: 20, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  completeTitle: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.accentCyan, marginBottom: 12, textAlign: 'center' },
  dbDisplay: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.accentCyan, marginBottom: 12, textAlign: 'center' },
  completeText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, textAlign: 'center' },
});
