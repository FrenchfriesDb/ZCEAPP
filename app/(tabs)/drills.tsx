import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '@/constants/theme';
import GlassButton from '@/components/GlassButton';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTextColors } from '@/context/TextColorsContext';

const DRILL_CATEGORIES = [
    {
        category: 'MIRROR PROTOCOL',
        desc: 'Face control & presence mastery',
        drills: [
            { id: 'mirror', label: 'MR', title: 'Mirror Drill', desc: 'Master face control & tone.', route: '/drills/mirror', accent: '#96BAFF' },
            { id: 'eye-combat', label: 'EC', title: 'Eye Combat', desc: '60s unbroken stare.', route: '/drills/eye-combat', accent: '#FF007A' },
            { id: 'tension-hold', label: 'TH', title: 'Tension Hold', desc: '15s stare challenge.', route: '/drills/tension-hold', accent: '#FF6B6B' },
        ],
    },
    {
        category: 'VERBAL ARSENAL',
        desc: 'Wit, comedyflow, & clever comebacks',
        drills: [
            { id: 'speed', label: 'RS', title: 'Response Speed', desc: 'React in under 5 seconds.', route: '/drills/speed', accent: '#FFD700' },
            { id: 'link', label: 'LG', title: 'The Link Game', desc: 'Find clever connections.', route: '/drills/link', accent: '#7E30E1' },
            { id: 'flip', label: 'FF', title: 'Flip Formula', desc: 'Turn any line into gold.', route: '/drills/flip', accent: '#00F5FF' },
            { id: 'wit', label: 'WM', title: 'Wit Mining', desc: 'Analyze & rewrite comedy.', route: '/drills/wit', accent: '#A0A0A0' },
            { id: 'comedian', label: 'TC', title: 'Talk Like a Comedian', desc: 'Roast random objects.', route: '/drills/comedian', accent: '#FF4E50' },
            { id: 'story', label: 'ST', title: 'Storytelling', desc: '30s improv challenge.', route: '/drills/story', accent: '#F9D423' },
            { id: 'banter', label: 'BB', title: 'Banter Builder', desc: 'Build on statements in 5s.', route: '/drills/banter', accent: '#71C3F7' },
            { id: 'vibe-pivot', label: 'VP', title: 'Vibe Pivot', desc: 'Convert complaints to flexes.', route: '/drills/vibe-pivot', accent: '#FFB84D' },
            { id: 'absurdity-escalator', label: 'AE', title: 'Absurdity Escalator', desc: '5 volleys of escalation.', route: '/drills/absurdity-escalator', accent: '#7E30E1' },
            { id: 'weapon-picker', label: 'WP', title: 'Weapon Picker', desc: 'Master 8 attack strategies.', route: '/drills/weapon-picker', accent: '#A0A0A0' },
            { id: 'yes-and', label: 'YA', title: 'Yes And Simulator', desc: 'Master improv fundamentals.', route: '/drills/yes-and', accent: '#F9D423' },
        ],
    },
    {
        category: 'POWER SYSTEMS',
        desc: 'Voice projection & cognitive strength',
        drills: [
            { id: 'decibel-breaker', label: 'DB', title: 'Decibel Breaker', desc: 'Project from diaphragm.', route: '/drills/decibel-breaker', accent: '#FFD700' },
            { id: 'cognitive-load', label: 'CL', title: 'Cognitive Load', desc: 'Trivia while maintaining posture.', route: '/drills/cognitive-load', accent: '#00F5FF' },
        ],
    },
    {
        category: 'OPERATIONS',
        desc: 'Track your daily dominance',
        drills: [
            { id: 'journal', label: 'ZJ', title: 'Zane Journal', desc: 'Log your daily operations.', route: '/drills/journal', accent: '#FF007A' },
        ],
    },
];

export default function DrillsScreen() {
    const { textPrimary } = useTextColors();
    const [selectedFilter, setSelectedFilter] = useState<string>('all');

    const FILTER_TABS = [
        { id: 'all', label: 'All' },
        { id: 'mirror', label: 'Mirror' },
        { id: 'verbal', label: 'Verbal' },
        { id: 'power', label: 'Power' },
        { id: 'operations', label: 'Ops' },
    ];

    const filteredCategories = selectedFilter === 'all' 
        ? DRILL_CATEGORIES 
        : DRILL_CATEGORIES.filter(cat => {
            if (selectedFilter === 'mirror') return cat.category === 'MIRROR PROTOCOL';
            if (selectedFilter === 'verbal') return cat.category === 'VERBAL ARSENAL';
            if (selectedFilter === 'power') return cat.category === 'POWER SYSTEMS';
            if (selectedFilter === 'operations') return cat.category === 'OPERATIONS';
            return true;
        });

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
            <LinearGradient
                colors={['rgba(255,255,255,0.035)', 'rgba(255,255,255,0.012)', 'rgba(0,0,0,0)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.pageSheen}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerEyebrow, { color: textPrimary }]}>Z.A.N.E. PROTOCOL</Text>
                    <Text style={styles.headerTitle}>Training Modules</Text>
                    <Text style={styles.headerSub}>Select a protocol to begin your session.</Text>
                </View>

                {/* Filter Tabs */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterTabs}
                >
                    {FILTER_TABS.map(tab => (
                        <Pressable
                            key={tab.id}
                            onPress={() => setSelectedFilter(tab.id)}
                            style={[
                                styles.filterTab,
                                selectedFilter === tab.id && [
                                    styles.filterTabActive,
                                    {
                                        borderColor: 'rgba(255,255,255,0.16)',
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                    }
                                ]
                            ]}
                        >
                            {selectedFilter === tab.id && (
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
                                    start={{ x: 0.5, y: 0 }}
                                    end={{ x: 0.5, y: 1 }}
                                    style={styles.filterTabSheen}
                                />
                            )}
                            <Text style={[
                                styles.filterTabText,
                                selectedFilter === tab.id && { color: textPrimary, fontWeight: '700' }
                            ]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Drill Cards Grouped by Category */}
                {filteredCategories.map((category, catIdx) => (
                    <View key={catIdx} style={styles.categorySection}>
                        <View style={styles.categoryHeader}>
                            <Text style={[styles.categoryTitle, { color: textPrimary }]}>{category.category}</Text>
                            <Text style={styles.categoryDesc}>{category.desc}</Text>
                        </View>
                        <View style={styles.grid}>
                            {category.drills.map((drill, i) => (
                                <Pressable
                                    key={drill.id}
                                    onPress={() => router.push(drill.route as any)}
                                    style={({ pressed }) => [styles.cardWrapper, pressed && { opacity: 0.85 }]}
                                >
                                    <View style={[styles.card, { shadowColor: 'rgba(255,255,255,0.08)' }]}>
                                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0)']}
                                            start={{ x: 0.5, y: 0 }}
                                            end={{ x: 0.5, y: 1 }}
                                            style={styles.cardSheen}
                                        />
                                        {/* Left accent bar */}
                                        <View style={[styles.accentBar, { backgroundColor: drill.accent }]} />

                                        {/* Monogram badge */}
                                        <View style={[styles.monogram, {
                                            backgroundColor: `${drill.accent}18`,
                                            borderColor: `${drill.accent}35`,
                                        }]}>
                                            <Text style={[styles.monogramText, { color: drill.accent }]}>
                                                {drill.label}
                                            </Text>
                                        </View>

                                        {/* Info */}
                                        <View style={styles.cardInfo}>
                                            <Text style={styles.cardTitle}>{drill.title}</Text>
                                            <Text style={styles.cardDesc}>{drill.desc}</Text>
                                        </View>

                                        {/* Arrow */}
                                        <GlassButton
                                            label="START"
                                            onPress={() => router.push(drill.route as any)}
                                            look="glass"
                                            tint="dark"
                                            size="sm"
                                            compact
                                        />
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ))}

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    scrollContent: { padding: Spacing.lg, paddingTop: 64 },
    pageSheen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 220,
    },

    header: { marginBottom: 28 },
    headerEyebrow: {
        fontFamily: Fonts.monoBold,
        fontSize: 9,
        color: Colors.accentPrimary,
        letterSpacing: 3,
        marginBottom: 8,
        opacity: 0.7,
    },
    headerTitle: {
        fontFamily: Fonts.heading,
        fontSize: FontSizes.h2,
        color: Colors.textPrimary,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    headerSub: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.textSecondary,
        lineHeight: 18,
    },

    grid: { gap: 10 },
    cardWrapper: { width: '100%' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.borderGlass,
        overflow: 'hidden',
        paddingVertical: 16,
        paddingRight: 18,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 18,
        shadowOpacity: 0.15,
        elevation: 8,
        position: 'relative',
    },
    cardSheen: {
        ...StyleSheet.absoluteFillObject,
    },
    accentBar: {
        width: 3,
        height: '100%',
        borderRadius: 2,
        opacity: 0.8,
    },
    monogram: {
        width: 46,
        height: 46,
        borderRadius: Radius.md,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monogramText: {
        fontFamily: Fonts.monoBold,
        fontSize: FontSizes.sm,
        fontWeight: '800',
        letterSpacing: 1,
    },
    cardInfo: { flex: 1, gap: 4 },
    cardTitle: {
        fontFamily: Fonts.headingSemi,
        fontSize: FontSizes.lg,
        color: Colors.textPrimary,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    cardDesc: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: Colors.textSecondary,
        letterSpacing: 0.3,
        lineHeight: 14,
    },
    cardArrow: {
        fontSize: FontSizes.lg,
        color: Colors.textTertiary,
        fontFamily: Fonts.heading,
    },
    categorySection: {
        marginBottom: 32,
    },
    categoryHeader: {
        marginBottom: 14,
        paddingHorizontal: Spacing.sm,
    },
    filterTabs: {
        paddingHorizontal: Spacing.md,
        gap: 8,
        marginBottom: 16,
    },
    filterTab: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    filterTabActive: {
        borderWidth: 1,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowColor: 'rgba(255,255,255,0.22)',
    },
    filterTabSheen: {
        ...StyleSheet.absoluteFillObject,
    },
    filterTabText: {
        fontFamily: Fonts.monoBold,
        fontSize: 11,
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    categoryTitle: {
        fontFamily: Fonts.monoBold,
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 4,
    },
    categoryDesc: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 16,
    },
});
