import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '@/constants/theme';
import GlassButton from '@/components/GlassButton';
import { router } from 'expo-router';
import { useTimeColors } from '@/hooks/useTimeColors';

const DRILL_MODULES = [
    {
        id: 'mirror',
        label: 'MR',
        title: 'Mirror Drill',
        desc: 'Master face control & tone.',
        route: '/drills/mirror',
        accent: '#96BAFF', // Cyan-Blue
    },
    {
        id: 'speed',
        label: 'RS',
        title: 'Response Speed',
        desc: 'React in under 5 seconds.',
        route: '/drills/speed',
        accent: '#FFD700', // Gold
    },
    {
        id: 'link',
        label: 'LG',
        title: 'The Link Game',
        desc: 'Find clever connections.',
        route: '/drills/link',
        accent: '#7E30E1', // Purple
    },
    {
        id: 'flip',
        label: 'FF',
        title: 'Flip Formula',
        desc: 'Turn any line into gold.',
        route: '/drills/flip',
        accent: '#00F5FF', // Cyan
    },
    {
        id: 'journal',
        label: 'ZJ',
        title: 'Zane Journal',
        desc: 'Log your daily operations.',
        route: '/drills/journal',
        accent: '#FF007A', // Pink
    },
    {
        id: 'wit',
        label: 'WM',
        title: 'Wit Mining',
        desc: 'Analyze & rewrite comedy.',
        route: '/drills/wit',
        accent: '#A0A0A0', // Silver stays
    },
    {
        id: 'comedian',
        label: 'TC',
        title: 'Talk Like a Comedian',
        desc: 'Roast random objects.',
        route: '/drills/comedian',
        accent: '#FF4E50', // Red-Orange
    },
    {
        id: 'story',
        label: 'ST',
        title: 'Storytelling',
        desc: '30s improv challenge.',
        route: '/drills/story',
        accent: '#F9D423', // Yellow
    },
];

export default function DrillsScreen() {
    const timePalette = useTimeColors();
    const systemColor = timePalette[0];
    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
            <View style={[styles.ambientGlow, { top: -50, right: -50, backgroundColor: systemColor + '0A' }]} />
            <View style={[styles.ambientGlow, { bottom: 100, left: -40, backgroundColor: systemColor + '05' }]} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerEyebrow, { color: systemColor }]}>Z.A.N.E. PROTOCOL</Text>
                    <Text style={styles.headerTitle}>Training Modules</Text>
                    <Text style={styles.headerSub}>Select a protocol to begin your session.</Text>
                </View>

                {/* Drill Cards */}
                <View style={styles.grid}>
                    {DRILL_MODULES.map((drill, i) => (
                        <Pressable
                            key={drill.id}
                            onPress={() => router.push(drill.route as any)}
                            style={({ pressed }) => [styles.cardWrapper, pressed && { opacity: 0.85 }]}
                        >
                            <View style={[styles.card, { shadowColor: drill.accent }]}>
                                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
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
                                    tint="dark"
                                    size="sm"
                                />
                            </View>
                        </Pressable>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    scrollContent: { padding: Spacing.lg, paddingTop: 64 },

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
    ambientGlow: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
    },
});
