import { Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export type ViralShareMode = 'harvest' | 'challenge' | 'invite';

type ViralShareCardProps = {
  mode: ViralShareMode;
  agentName: string;
  archetype: string;
  streak: number;
  todayXp: number;
  tone: string;
  rankLabel: string;
  rankProgress: number;
  nextRankLabel: string;
  auraCells: number[];
  todayCellIndex?: number;
  shareDateLabel: string;
  shareUrl: string;
  shareUrlLabel: string;
  challengeTitle?: string;
  challengeDesc?: string;
  challengeXp?: number;
};

export default function ViralShareCard({
  mode,
  agentName,
  archetype,
  streak,
  todayXp,
  tone,
  rankLabel,
  rankProgress,
  nextRankLabel,
  auraCells,
  todayCellIndex,
  shareDateLabel,
  shareUrl,
  shareUrlLabel,
  challengeTitle,
  challengeDesc,
  challengeXp,
}: ViralShareCardProps) {
  const clampedProgress = Math.max(0, Math.min(1, rankProgress));
  const isChallenge = mode === 'challenge';
  const isInvite = mode === 'invite';

  return (
    <View collapsable={false} style={styles.shell}>
      <LinearGradient
        colors={['rgba(0, 212, 255, 0.24)', 'rgba(88, 255, 214, 0.08)', 'rgba(0, 0, 0, 0)']}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.glow}
      />
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>ZCE</Text>
          <Text style={styles.date}>{shareDateLabel}</Text>
        </View>

        <Text style={styles.title}>{isChallenge ? 'MISSION BRIEF' : isInvite ? 'ZCE INITIATE' : 'AGENT HARVEST'}</Text>
        <Text style={styles.agent}>{agentName.toUpperCase()} • {archetype.toUpperCase()}</Text>

        {!isChallenge && (
          <View style={styles.heroBlock}>
            <Text style={styles.heroValue}>{Math.max(0, streak)}</Text>
            <Text style={styles.heroLabel}>DAY STREAK</Text>
          </View>
        )}

        <View style={styles.statusBlock}>
          <View style={styles.rankRow}>
            <Text style={styles.rankLabel}>{rankLabel.toUpperCase()}</Text>
            <Text style={styles.rankNext}>{nextRankLabel.toUpperCase()}</Text>
          </View>
          <View style={styles.rankBar}>
            <LinearGradient
              colors={['#00D4FF', '#7EF6FF']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.rankFill, { width: `${clampedProgress * 100}%` }]}
            />
          </View>
          <Text style={styles.rankSub}>XP TODAY: {todayXp} • AURA: {tone.toUpperCase()}</Text>
        </View>

        {isChallenge ? (
          <View style={styles.challengeBox}>
            <Text style={styles.challengeTitle}>{(challengeTitle || 'TODAY CHALLENGE').toUpperCase()}</Text>
            <Text style={styles.challengeText}>{challengeDesc || 'Complete the rep and send proof.'}</Text>
            <Text style={styles.challengeMeta}>REWARD: +{challengeXp || 10} XP</Text>
            <View style={styles.challengeCta}>
              <Text style={styles.challengeCtaText}>ACCEPT CHALLENGE</Text>
            </View>
          </View>
        ) : (
          <View style={styles.harvestGridWrap}>
            <Text style={styles.gridLabel}>AURA HEATMAP</Text>
            <View style={styles.grid}>
              {auraCells.map((level, index) => (
                <View
                  key={`${level}-${index}`}
                  style={[
                    styles.gridCell,
                    level === 0 && styles.gridCell0,
                    level === 1 && styles.gridCell1,
                    level === 2 && styles.gridCell2,
                    level === 3 && styles.gridCell3,
                    todayCellIndex === index && styles.gridCellToday,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.footerRow}>
          <View style={styles.watermarkBlock}>
            <Text style={styles.watermark}>Z.A.N.E. PROTOCOL</Text>
            <Text style={styles.shareUrl} numberOfLines={1} ellipsizeMode="middle">{shareUrlLabel}</Text>
          </View>
          <View style={styles.qrBlock}>
            <QRCode
              value={shareUrl || shareUrlLabel}
              size={44}
              color="#FFFFFF"
              backgroundColor="transparent"
              quietZone={2}
            />
            <Text style={styles.qrLabel}>SCAN</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    aspectRatio: 0.62,
    borderRadius: 28,
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
    borderRadius: 28,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    color: '#B8F4FF',
    fontFamily: Fonts.heading,
    fontSize: 22,
    letterSpacing: 1.4,
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
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 0.8,
  },
  agent: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: Fonts.headingSemi,
    fontSize: 11,
    letterSpacing: 1.3,
  },
  heroBlock: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  heroValue: {
    color: '#FFFFFF',
    fontFamily: Fonts.heading,
    fontSize: 40,
    letterSpacing: 1,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    letterSpacing: 2.2,
  },
  statusBlock: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLabel: {
    color: '#FFFFFF',
    fontFamily: Fonts.headingSemi,
    fontSize: 12,
    letterSpacing: 1.1,
  },
  rankNext: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  rankBar: {
    marginTop: 6,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  rankFill: {
    height: '100%',
    borderRadius: 999,
  },
  rankSub: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
  },
  harvestGridWrap: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gridLabel: {
    color: '#B8F4FF',
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  gridCell: {
    width: 10,
    height: 10,
    borderRadius: 4,
  },
  gridCell0: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridCell1: {
    backgroundColor: 'rgba(0, 212, 255, 0.25)',
  },
  gridCell2: {
    backgroundColor: 'rgba(0, 212, 255, 0.55)',
  },
  gridCell3: {
    backgroundColor: '#7EF6FF',
  },
  gridCellToday: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  challengeBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  challengeTitle: {
    color: '#B8F4FF',
    fontFamily: Fonts.headingSemi,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  challengeText: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  challengeMeta: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  challengeCta: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.5)',
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
  },
  challengeCtaText: {
    color: '#FFFFFF',
    fontFamily: Fonts.headingSemi,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  footerRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
  },
  watermarkBlock: {
    flex: 1,
  },
  watermark: {
    color: 'rgba(255,255,255,0.38)',
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  shareUrl: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 0.4,
  },
  qrBlock: {
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  qrLabel: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: Fonts.mono,
    fontSize: 6,
    letterSpacing: 1,
  },
});
