import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Radius, XPConfig } from '@/constants/theme';
import { useTimeColors } from '@/hooks/useTimeColors';
import GlassCard from '@/components/GlassCard';

interface XPBarProps {
    currentXP: number;
}

export default function XPBar({ currentXP }: XPBarProps) {
    const levelInfo = XPConfig.getLevel(currentXP);
    const xpInLevel = XPConfig.getXpInCurrentLevel(currentXP);
    const progress = XPConfig.getProgress(currentXP);
    const palette = useTimeColors();

    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animatedWidth, {
            toValue: isFinite(progress) ? progress : 0,
            useNativeDriver: false,
            tension: 20,
            friction: 7,
        }).start();
    }, [currentXP, progress]);

    const widthInterpolation = animatedWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>LVL {levelInfo.level}</Text>
                </View>
                <Text style={styles.rankTitle} numberOfLines={1}>{levelInfo.title.toUpperCase()}</Text>
                <Text style={styles.xpCounts} numberOfLines={1}>
                    {xpInLevel.toLocaleString()} <Text style={styles.xpDivider}>/</Text> {levelInfo.xpToComplete.toLocaleString()}
                </Text>
            </View>

            <View style={styles.barTrack}>
                <Animated.View
                    style={[
                        styles.barFill,
                        {
                            width: widthInterpolation,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={palette as any}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.barGradient}
                    />
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 10,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        justifyContent: 'space-between',
    },
    levelBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: Radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginRight: 8,
        flexShrink: 0,
    },
    levelText: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    rankTitle: {
        fontFamily: Fonts.heading,
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '800',
        letterSpacing: 1.5,
        flex: 1,
        marginRight: 8,
    },
    xpCounts: {
        fontFamily: Fonts.mono,
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
        flexShrink: 0,
    },
    xpDivider: {
        color: 'rgba(255, 255, 255, 0.2)',
    },
    barTrack: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    barGradient: {
        flex: 1,
    },
});
