import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import GlassCard from './GlassCard';
import { Colors, Fonts, Radius } from '@/constants/theme';

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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 8,
  },
  sectionBody: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textPrimary,
  },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  scoreTitle: {
    color: Colors.accentCyan,
    marginBottom: 6,
  },
  scoreBody: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.accentPrimary,
    textAlign: 'center',
  },
});
