import { Fonts } from '@/constants/theme';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
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
  'OPTIONAL MAGNETIC RESPONSE',
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
  return sections.filter((section) => section.title === 'SCORE' || section.body.trim().length > 0);
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
    backgroundColor: 'rgba(6,8,12,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    position: 'relative',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(230,235,245,0.72)',
    marginBottom: 9,
  },
  sectionBody: {
    fontFamily: Fonts.headingMedium,
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(235,240,250,0.95)',
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
