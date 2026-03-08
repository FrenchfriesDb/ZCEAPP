import { View, Text, StyleSheet, Pressable, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';

const ZANE_LINES = [
    "I swear, you're 10% sass and 90% chaos.",
    "You've got main character energy — I like it.",
    "That was a joke, huh? Bold move. I respect it.",
    "Are you always this trouble, or is today a special occasion?",
    "I'd agree with you, but then we'd both be wrong.",
    "You talk like someone who knows exactly what they want. It’s a rare look.",
    "I’m not ignoring you, I’m just prioritizing my peace. Big difference.",
    "You have a very intense way of being absolutely silent. I'm impressed.",
    "Is that your 'winning' smile, or are you just happy to be here?",
    "You don't just walk into a room; you announce it without saying a word."
];

const FLAVORS = [
    { label: "😏 SMIRK", desc: "One corner of mouth up. Eyes locked." },
    { label: "🧊 DEADPAN", desc: "Zero emotion. Flat voice. Intense stare." },
    { label: "🐢 SLOW MOTION", desc: "Double your pause time. Make them wait." },
    { label: "🤨 SKEPTICAL", desc: "One eyebrow raised. Lean back." },
];

export default function MirrorDrill() {
    const [lineIdx, setLineIdx] = useState(0);
    const [flavorIdx, setFlavorIdx] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const nextDrill = () => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setLineIdx(prev => (prev + 1) % ZANE_LINES.length);
            setFlavorIdx(prev => (prev + 1) % FLAVORS.length);
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a0b2e', '#000000']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
                    <Text style={styles.backText}>← EXIT</Text>
                </Pressable>
                <Text style={styles.title}>MIRROR DRILL</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.cameraPlaceholder}>
                    <Text style={styles.cameraText}>[ SELFIE CAMERA FEED ]</Text>
                    <Text style={styles.cameraSub}>(Practice in front of a mirror if camera is off)</Text>
                </View>

                <GlassCard style={styles.promptCard}>
                    <Text style={styles.label}>SAY THIS LINE:</Text>
                    <Animated.Text style={[styles.lineText, { opacity: fadeAnim }]}>
                        "{ZANE_LINES[lineIdx]}"
                    </Animated.Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>THE VIBE:</Text>
                    <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                        <Text style={styles.flavorTitle}>{FLAVORS[flavorIdx].label}</Text>
                        <Text style={styles.flavorDesc}>{FLAVORS[flavorIdx].desc}</Text>
                    </Animated.View>
                </GlassCard>

                <Pressable onPress={nextDrill} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
                    <Text style={styles.btnText}>NEXT REP →</Text>
                </Pressable>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginBottom: 20
    },
    backBtn: { padding: 8, minWidth: 60 },
    backText: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.mono, fontSize: 12 },
    title: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff', letterSpacing: 2, textAlign: 'center', flex: 1 },

    scrollContent: { padding: Spacing.lg, alignItems: 'center', gap: 24, paddingBottom: 40 },

    cameraPlaceholder: {
        width: 180, height: 180, borderRadius: 90,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 10,
    },
    cameraText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
    cameraSub: { fontFamily: Fonts.body, fontSize: 10, color: 'rgba(255,255,255,0.3)' },

    promptCard: { width: '100%', padding: 24, alignItems: 'center', minHeight: 250 },
    label: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 2, marginBottom: 12 },
    lineText: { fontFamily: Fonts.heading, fontSize: 24, color: '#fff', textAlign: 'center', lineHeight: 32 },
    divider: { width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
    flavorTitle: { fontFamily: Fonts.heading, fontSize: 28, color: '#FF6B6B', marginBottom: 8 },
    flavorDesc: { fontFamily: Fonts.body, fontSize: 14, color: '#ccc', textAlign: 'center' },

    btn: {
        width: '100%', height: 60, borderRadius: 30,
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        marginTop: 20
    },
    btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    btnText: { fontFamily: Fonts.heading, fontSize: 16, color: '#000', letterSpacing: 2 },
});
