import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';

const CHAPTERS = [
    {
        number: 1,
        title: 'The Architecture of First Impressions',
        summary: 'How the first 7 seconds define your social trajectory. The neuroscience behind snap judgments and how to engineer them in your favor.',
        keyInsights: ['The 7-Second Window', 'Halo Effect Engineering', 'Power of Vocal Tonality'],
        readTime: '12 min',
    },
    {
        number: 2,
        title: 'Conversational Velocity',
        summary: 'Speed of connection is a skill, not a gift. Learn the framework for rapid rapport — the link method, pivot patterns, and callback humor.',
        keyInsights: ['The Link Method', 'Pivot Patterns', 'Callback Humor Loops'],
        readTime: '15 min',
    },
    {
        number: 3,
        title: 'The Eye Contact Protocol',
        summary: 'Eye contact is not staring. It\'s a power move encoded in milliseconds. The science of gaze patterns and how leaders use them.',
        keyInsights: ['Triangle Gaze Pattern', 'The 3-Second Rule', 'Authority vs. Warmth'],
        readTime: '10 min',
    },
    {
        number: 4,
        title: 'Status Dynamics in Groups',
        summary: 'Every social group has an invisible hierarchy. Learn to read it, navigate it, and eventually reshape it without a single word.',
        keyInsights: ['Reading Room Energy', 'The Alpha Fallacy', 'Social Calibration'],
        readTime: '18 min',
    },
    {
        number: 5,
        title: 'Humor as a Weapon',
        summary: 'Wit is the highest form of intelligence in social contexts. The flip formula, timing mechanics, and why self-deprecation is a trap.',
        keyInsights: ['The Flip Formula', 'Timing > Content', 'Observational Humor Framework'],
        readTime: '14 min',
    },
    {
        number: 6,
        title: 'Digital Charisma',
        summary: 'Charisma doesn\'t stop at text. How to carry magnetic energy through DMs, video calls, and social media presence.',
        keyInsights: ['Text Game Principles', 'Video Presence', 'Online Identity Architecture'],
        readTime: '11 min',
    },
    {
        number: 7,
        title: 'The Confidence Feedback Loop',
        summary: 'Confidence isn\'t built in your head — it\'s built through reps. The neuroscience of confidence spirals and how to trigger them on command.',
        keyInsights: ['Dopamine Habit Stacking', 'Exposure Therapy Lite', 'The 1% Protocol'],
        readTime: '16 min',
    },
];

export default function ResearchScreen() {
    const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>CHARISMA RESEARCH JOURNAL</Text>
                </View>

                {/* Hero Card */}
                <GlassCard glowColor={Colors.accentPrimary}>
                    <View style={styles.heroContent}>
                        <View style={[styles.bookIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                            <Text style={styles.bookEmoji}>📖</Text>
                        </View>
                        <Text style={styles.heroTitle}>Charisma Patterns in Teen Communication</Text>
                        <Text style={styles.heroAuthor}>BY ZANE — CHARISMA ARCHITECT</Text>
                        <Text style={styles.heroDesc}>
                            A research-backed exploration of what makes certain people magnetic — and how to reverse-engineer that energy through deliberate practice.
                        </Text>
                        <View style={styles.heroStats}>
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>7</Text>
                                <Text style={styles.heroStatLabel}>CHAPTERS</Text>
                            </View>
                            <View style={styles.heroDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>96</Text>
                                <Text style={styles.heroStatLabel}>MINUTES</Text>
                            </View>
                            <View style={styles.heroDivider} />
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>21</Text>
                                <Text style={styles.heroStatLabel}>INSIGHTS</Text>
                            </View>
                        </View>
                    </View>
                </GlassCard>

                {/* Chapters */}
                <Text style={styles.sectionTitle}>CHAPTERS</Text>
                {CHAPTERS.map((ch, i) => (
                    <Pressable key={i} onPress={() => setExpandedChapter(expandedChapter === i ? null : i)}>
                        <GlassCard glowColor={expandedChapter === i ? Colors.accentPrimary : undefined}>
                            <View style={styles.chapterRow}>
                                <View style={styles.chapterNumber}>
                                    <Text style={styles.chapterNumText}>{String(ch.number).padStart(2, '0')}</Text>
                                </View>
                                <View style={styles.chapterContent}>
                                    <Text style={styles.chapterTitle}>{ch.title}</Text>
                                    <Text style={styles.chapterReadTime}>⏱ {ch.readTime}</Text>
                                </View>
                            </View>
                            {expandedChapter === i && (
                                <View style={styles.chapterExpanded}>
                                    <Text style={styles.chapterSummary}>{ch.summary}</Text>
                                    <View style={styles.insightsBox}>
                                        <Text style={styles.insightsLabel}>KEY INSIGHTS</Text>
                                        {ch.keyInsights.map((insight, j) => (
                                            <View key={j} style={styles.insightRow}>
                                                <View style={styles.insightDot} />
                                                <Text style={styles.insightText}>{insight}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <Pressable style={styles.readBtn}>
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.readGradient}
                                        >
                                            <Text style={styles.readBtnText}>READ CHAPTER</Text>
                                        </LinearGradient>
                                    </Pressable>
                                </View>
                            )}
                        </GlassCard>
                    </Pressable>
                ))}

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgPrimary },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingTop: 60, gap: 12 },
    cornerGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
    header: { marginBottom: 8 },
    headerSub: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.accentSecondary, letterSpacing: 3 },
    headerTitle: { fontFamily: Fonts.heading, fontSize: FontSizes.h1, color: Colors.textPrimary, letterSpacing: 4 },
    sectionTitle: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textTertiary, letterSpacing: 3, marginTop: 8 },

    heroContent: { alignItems: 'center', gap: 10, paddingVertical: 8 },
    bookIcon: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    bookEmoji: {
        fontSize: 28,
    },
    heroTitle: { fontFamily: Fonts.heading, fontSize: FontSizes.xl, color: Colors.textPrimary, textAlign: 'center', letterSpacing: 1 },
    heroAuthor: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.accentPrimary, letterSpacing: 3 },
    heroDesc: { fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 4 },
    heroStats: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 8 },
    heroStat: { alignItems: 'center' },
    heroStatValue: { fontFamily: Fonts.monoBold, fontSize: FontSizes.xxl, color: Colors.accentPrimary },
    heroStatLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textTertiary, letterSpacing: 2 },
    heroDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)' },

    chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    chapterNumber: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center', alignItems: 'center'
    },
    chapterNumText: { fontFamily: Fonts.monoBold, fontSize: FontSizes.md, color: Colors.accentPrimary },
    chapterContent: { flex: 1, gap: 2 },
    chapterTitle: { fontFamily: Fonts.headingSemi, fontSize: FontSizes.md, color: Colors.textPrimary },
    chapterReadTime: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.textTertiary },

    chapterExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.06)', gap: 12 },
    chapterSummary: { fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20 },
    insightsBox: { gap: 6 },
    insightsLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.accentPrimary, letterSpacing: 2, marginBottom: 2 },
    insightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    insightDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accentPrimary },
    insightText: { fontFamily: Fonts.bodyMedium, fontSize: FontSizes.sm, color: Colors.textPrimary },
    readBtn: { borderRadius: Radius.sm, overflow: 'hidden' },
    readGradient: { padding: 12, alignItems: 'center', borderRadius: Radius.sm },
    readBtnText: { fontFamily: Fonts.monoBold, fontSize: FontSizes.sm, color: '#fff', letterSpacing: 2 },
});
