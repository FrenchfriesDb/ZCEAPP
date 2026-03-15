import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
    const scrollY = useRef(new Animated.Value(0)).current;

    // Parallax Animations
    const tipTranslateY = scrollY.interpolate({
        inputRange: [0, height],
        outputRange: [0, -100],
        extrapolate: 'clamp',
    });

    const waterTranslateY = scrollY.interpolate({
        inputRange: [0, height],
        outputRange: [0, -50],
        extrapolate: 'clamp',
    });

    const textOpacity = scrollY.interpolate({
        inputRange: [0, height / 2],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const underWaterOpacity = scrollY.interpolate({
        inputRange: [height / 4, height / 1.5], // Reveal sooner
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            {/* Fixed Background - Dark CEO Vibes (No Blue Water) */}
            <LinearGradient
                colors={['#000000', '#0a0a0a', '#1a1a2e']}
                style={StyleSheet.absoluteFill}
            />

            <Animated.ScrollView
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 0 }}
            >
                {/* SECTION 1: THE TIP (ABOVE) */}
                <View style={styles.section}>
                    <Animated.View style={[styles.titleContainer, { opacity: textOpacity, transform: [{ translateY: tipTranslateY }] }]}>
                        <Text style={styles.mainTitle}>YOUR POTENTIAL</Text>
                        <Text style={styles.subTitle}>SUCCESS • FAME • STATUS</Text>
                    </Animated.View>

                    {/* Iceberg Tip Visual - Dark Glass / Diamond */}
                    <Animated.View style={[styles.icebergTip, { transform: [{ translateY: tipTranslateY }] }]}>
                        <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.1)']} style={styles.tipGradient} />
                    </Animated.View>
                </View>

                {/* SURFACE LINE (Concept Separator) */}
                <Animated.View style={[styles.waterLine, { transform: [{ translateY: waterTranslateY }] }]}>
                    <View style={styles.waterSurface} />
                </Animated.View>

                {/* SECTION 2: THE MASS (BELOW) */}
                <View style={styles.section}>
                    <Animated.View style={[styles.underwaterContent, { opacity: underWaterOpacity }]}>
                        <View style={styles.icebergMass}>
                            <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(0,0,0,0)']} style={styles.massGradient} />
                        </View>

                        <View style={styles.truthContainer}>
                            <Text style={styles.truthTitle}>THE REALITY</Text>
                            <View style={styles.truthGrid}>
                                <Text style={styles.truthText}>REJECTION</Text>
                                <Text style={styles.truthText}>DISCIPLINE</Text>
                                <Text style={styles.truthText}>CONSISTENCY</Text>
                                <Text style={styles.truthText}>HARD WORK</Text>
                                <Text style={styles.truthText}>LATE NIGHTS</Text>
                                <Text style={styles.truthText}>DOUBT</Text>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* SECTION 3: FEATURES / CTA */}
                <View style={styles.contentSection}>
                    <BlurView intensity={20} style={styles.featureCard}>
                        <Text style={styles.featureTitle}>ZCE: THE CHARISMA ENGINE</Text>
                        <Text style={styles.featureDesc}>
                            Stop wishing. Start forging. The only way out is through.
                        </Text>

                        <Pressable onPress={() => router.replace('/auth/onboarding')} style={styles.ctaButton}>
                            <Text style={styles.ctaText}>START FORGING</Text>
                        </Pressable>
                    </BlurView>

                    <View style={{ height: 100 }} />
                </View>

            </Animated.ScrollView>

            {/* Floating Back Button */}
            <Pressable onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
                <BlurView intensity={20} style={styles.backBlur}>
                    <Text style={styles.backText}>← DASHBOARD</Text>
                </BlurView>
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    section: { height: height, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    contentSection: { minHeight: height, backgroundColor: '#000', padding: 20, paddingTop: 60 },

    titleContainer: { alignItems: 'center', marginBottom: 40, zIndex: 10 },
    mainTitle: { fontFamily: Fonts.heading, fontSize: 42, color: '#fff', letterSpacing: 4 },
    subTitle: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.accentPrimary, letterSpacing: 2, marginTop: 10, fontWeight: '700' },

    icebergTip: {
        width: 200, height: 150,
        borderTopLeftRadius: 100, borderTopRightRadius: 80,
        overflow: 'hidden',
        shadowColor: '#fff', shadowOpacity: 0.2, shadowRadius: 30,
        zIndex: 5,
    },
    tipGradient: { flex: 1 },

    waterLine: {
        position: 'absolute', top: height * 0.55, left: 0, right: 0,
        height: 1, backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 6
    },
    waterSurface: { width: '100%', height: '100%', backgroundColor: '#fff', opacity: 0.1 },

    underwaterContent: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 100, width: '100%' },
    icebergMass: {
        width: 300, height: 400,
        borderBottomLeftRadius: 150, borderBottomRightRadius: 120,
        overflow: 'hidden',
        opacity: 0.5,
        marginBottom: 40,
    },
    massGradient: { flex: 1 },

    truthContainer: { alignItems: 'center', gap: 20 },
    truthTitle: { fontFamily: Fonts.heading, fontSize: 24, color: 'rgba(255,255,255,0.9)', letterSpacing: 4 },
    truthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 300 },
    truthText: {
        fontFamily: Fonts.mono, fontSize: 12, color: '#fff',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.05)'
    },

    featureCard: { padding: 30, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    featureTitle: { fontFamily: Fonts.heading, fontSize: 24, color: '#fff', marginBottom: 16 },
    featureDesc: { fontFamily: Fonts.body, fontSize: 16, color: '#ccc', lineHeight: 24, marginBottom: 24 },
    ctaButton: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
    ctaText: { fontFamily: Fonts.heading, fontSize: 14, color: '#000', letterSpacing: 2 },

    backBtn: { position: 'absolute', top: 60, left: 20, zIndex: 100, borderRadius: 20, overflow: 'hidden' },
    backBlur: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
    backText: { fontFamily: Fonts.mono, fontSize: 10, color: '#fff' },
});
