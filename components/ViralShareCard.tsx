import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/constants/theme';

export type ViralShareMode = 'harvest' | 'challenge';

type ViralShareCardProps = {
  mode: ViralShareMode;
  agentName: string;
  archetype: string;
  streak: number;
  todayXp: number;
  tone: string;
  challengeTitle?: string;
  challengeDesc?: string;
  challengeXp?: number;
  shareDateLabel: string;
};

export default function ViralShareCard({
  mode,
  agentName,
  archetype,
  streak,
  todayXp,
  tone,
  challengeTitle,
  challengeDesc,
  challengeXp,
  shareDateLabel,
}: ViralShareCardProps) {
  return (
    <View collapsable={false} style={styles.shell}>
      <LinearGradient
        colors={['rgba(0, 212, 255, 0.22)', 'rgba(0, 212, 255, 0.08)', 'rgba(0, 0, 0, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glow}
      />
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>ZCE</Text>
          <Text style={styles.date}>{shareDateLabel}</Text>
        </View>

        <Text style={styles.title}>{mode === 'harvest' ? 'AGENT DEBRIEF' : 'FRIEND CHALLENGE'}</Text>
        <Text style={styles.agent}>{agentName.toUpperCase()} • {archetype.toUpperCase()}</Text>

        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>STREAK</Text>
            <Text style={styles.statValue}>{streak}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>XP TODAY</Text>
            <Text style={styles.statValue}>{todayXp}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>AURA</Text>
            <Text style={styles.statValue}>{tone.toUpperCase()}</Text>
          </View>
        </View>

        {mode === 'challenge' ? (
          <View style={styles.contentBox}>
            <Text style={styles.contentTitle}>{(challengeTitle || 'TODAY CHALLENGE').toUpperCase()}</Text>
            <Text style={styles.contentText}>{challengeDesc || 'Complete this rep and send proof.'}</Text>
            <Text style={styles.reward}>REWARD: +{challengeXp || 10} XP</Text>
          </View>
        ) : (
          <View style={styles.contentBox}>
            <Text style={styles.contentTitle}>NIGHTLY HARVEST</Text>
            <Text style={styles.contentText}>
              Streak pressure is live. Discipline compounds daily. Build momentum before midnight.
            </Text>
            <Text style={styles.reward}>BUILT IN ZCE</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    aspectRatio: 0.68,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 26,
    padding: 22,
    backgroundColor: 'rgba(0,0,0,0.86)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brand: {
    color: '#B8F4FF',
    fontFamily: Fonts.heading,
    fontSize: 24,
    letterSpacing: 1.2,
  },
  date: {
    color: 'rgba(255,255,255,0.66)',
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: Fonts.heading,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 0.6,
  },
  agent: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Fonts.headingSemi,
    fontSize: 12,
    letterSpacing: 1.1,
  },
  statRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(184, 244, 255, 0.45)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 212, 255, 0.09)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.74)',
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontFamily: Fonts.headingSemi,
    fontSize: 13,
    marginTop: 5,
    letterSpacing: 0.4,
  },
  contentBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  contentTitle: {
    color: '#B8F4FF',
    fontFamily: Fonts.headingSemi,
    fontSize: 12,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  contentText: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  reward: {
    marginTop: 10,
    color: '#FFFFFF',
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.2,
    opacity: 0.88,
  },
});
