import { Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassCard from './GlassCard';

type FeedbackSection = {
  title: string;
  body: string;
};

const SECTION_TITLES = [
  'PERFORMANCE REVIEW',
  'WHAT YOU DID WELL',
  'WHAT MISSED',
  'WHY IT WORKS / WHY IT FAILS',
  'WHY IT WORKS',
  'WHY IT FAILS',
  'THE LOGIC',
  'MAGNETIC TIPS',
  'BETTER RESPONSES',
  'MAGNETIC VERSION',
  'CEO VERSION',
  'CLASS CLOWN VERSION',
  'FUNNY VERSION',
  'WITTY VERSION',
  'SCORE',
] as const;

const titleSet = new Set(SECTION_TITLES);

function parseFeedback(text: string): FeedbackSection[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: FeedbackSection[] = [];
  let current: FeedbackSection | null = null;

  for (const line of lines) {
    const match = line.match(/^([A-Z0-9 /&-]+):\s*(.*)$/);
    if (match && titleSet.has(match[1] as (typeof SECTION_TITLES)[number])) {
      if (current) sections.push(current);
      current = {
        title: match[1],
        body: match[2] || '',
      };
    } else if (current) {
      current.body = current.body ? `${current.body}\n${line}` : line;
    } else {
      current = {
        title: 'FEEDBACK',
        body: line,
      };
    }
  }

  if (current) sections.push(current);
  return sections;
}

interface DrillFeedbackPanelProps {
  feedback: string;
  maxHeight?: number;
}

export default function DrillFeedbackPanel({ feedback, maxHeight = 430 }: DrillFeedbackPanelProps) {
  const sections = useMemo(() => parseFeedback(feedback), [feedback]);

  return (
    <ScrollView
      style={[styles.scroll, { maxHeight }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {sections.map((section, index) => {
        const isScore = section.title === 'SCORE';
        return (
          <GlassCard
            key={`${section.title}-${index}`}
            darkGlass
            intensity={26}
            style={[
              styles.sectionCard,
              isScore && styles.scoreCard,
            ]}
          >
            <View style={styles.cardChrome} pointerEvents="none">
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)', 'rgba(255,255,255,0.00)']}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={styles.cardRim}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.cardSheen}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.00)', 'rgba(0,0,0,0.48)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.cardDepth}
              />
            </View>
            <Text style={[styles.sectionTitle, isScore && styles.scoreTitle]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionBody, isScore && styles.scoreBody]}>
              {section.body}
            </Text>
          </GlassCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  sectionCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardChrome: {
    ...StyleSheet.absoluteFillObject,
  },
  cardRim: {
    ...StyleSheet.absoluteFillObject,
  },
  cardSheen: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardDepth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
  },
  sectionTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.56)',
    marginBottom: 9,
  },
  sectionBody: {
    fontFamily: Fonts.headingMedium,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(230,235,245,0.84)',
  },
  scoreCard: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
  },
  scoreTitle: {
    color: 'rgba(166, 208, 235, 0.9)',
    marginBottom: 6,
  },
  scoreBody: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    lineHeight: 30,
    color: 'rgba(226,236,248,0.9)',
    textAlign: 'center',
  },
});
