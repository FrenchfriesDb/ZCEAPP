import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme';

const MENTOR_QUOTES = [
    { text: "You didn't talk to anyone today? Bro, I'm not even human and I'm disappointed.", mood: 'roast' },
    { text: "Eye contact isn't staring. It's a power move. Learn the difference.", mood: 'advice' },
    { text: "Your comfort zone is a prison you built yourself. Walk out.", mood: 'motivate' },
    { text: "You scrolled for 3 hours but can't hold a 3-minute conversation? Fix that.", mood: 'roast' },
    { text: "Charisma isn't born. It's engineered. That's why you're here.", mood: 'motivate' },
    { text: "Every person you didn't talk to was a missed level-up. Think about that.", mood: 'advice' },
    { text: "I've analyzed your data. Your biggest weakness? You care what they think.", mood: 'roast' },
    { text: "Make someone laugh today. Not at you — WITH you. There's a difference.", mood: 'advice' },
    { text: "Dark CEO energy isn't about being cold. It's about being so warm they can't look away.", mood: 'motivate' },
    { text: "You're one bold compliment away from changing someone's entire day. Do it.", mood: 'advice' },
];

export default function MentorEntity() {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        // Breathing pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ])
        ).start();

        // Glow animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 0.7, duration: 1800, useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0.2, duration: 1800, useNativeDriver: false }),
            ])
        ).start();

        // Rotate quotes
        const interval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % MENTOR_QUOTES.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const quote = MENTOR_QUOTES[quoteIndex];

    return (
        <View style={styles.container}>
            {/* AI Entity — Abstract Robotic Eye */}
            <Animated.View style={[styles.entityContainer, { transform: [{ scale: pulseAnim }] }]}>
                <Animated.View style={[styles.outerRing, { shadowOpacity: glowAnim }]}>
                    <View style={styles.middleRing}>
                        <View style={styles.innerCore}>
                            <View style={styles.pupil} />
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>

            <Text style={styles.entityLabel}>Z.A.N.E. AI</Text>
            <Text style={styles.entitySubLabel}>CHARISMA ANALYSIS ENGINE</Text>

            {/* Quote */}
            <View style={styles.quoteBox}>
                <Text style={styles.quoteText}>"{quote.text}"</Text>
                <View style={[styles.moodTag, quote.mood === 'roast' && styles.moodRoast, quote.mood === 'motivate' && styles.moodMotivate]}>
                    <Text style={styles.moodText}>{quote.mood.toUpperCase()}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 12,
        paddingVertical: Spacing.lg,
    },
    entityContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: 'rgba(74, 158, 255, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4A9EFF',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 30,
        shadowOpacity: 0.5,
    },
    middleRing: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 1,
        borderColor: 'rgba(123, 97, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 158, 255, 0.05)',
    },
    innerCore: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(74, 158, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: 'rgba(74, 158, 255, 0.3)',
    },
    pupil: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4A9EFF',
        shadowColor: '#4A9EFF',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 10,
        shadowOpacity: 0.8,
    },
    entityLabel: {
        fontFamily: Fonts.heading,
        fontSize: FontSizes.xl,
        color: Colors.textPrimary,
        letterSpacing: 4,
    },
    entitySubLabel: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        color: Colors.textTertiary,
        letterSpacing: 2,
    },
    quoteBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
        gap: 10,
        width: '100%',
    },
    quoteText: {
        fontFamily: Fonts.bodySemi,
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
        textAlign: 'center',
        lineHeight: 22,
    },
    moodTag: {
        backgroundColor: 'rgba(74, 158, 255, 0.15)',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    moodRoast: {
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
    },
    moodMotivate: {
        backgroundColor: 'rgba(6, 214, 160, 0.15)',
    },
    moodText: {
        fontFamily: Fonts.mono,
        fontSize: 9,
        color: Colors.textSecondary,
        letterSpacing: 2,
    },
});
