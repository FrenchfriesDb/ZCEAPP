import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts, Radius, XPConfig } from '@/constants/theme';
import { useXPBarColors } from '@/hooks/useXPBarColors';

interface Props {
    xp: number;
}

/**
 * XP Progress Bar — correct gradient reveal
 *
 * Uses onLayout to get the real pixel width of the track.
 * The fill is an Animated.View that grows from 0px → barWidth px.
 * Inside it, the LinearGradient is always rendered at the FULL bar width
 * but gets clipped by the fill view's overflow:hidden — so:
 *   - 0 XP   → fill width = 0px  → nothing visible
 *   - 50% XP → fill width = half → you see the left half of the gradient
 *   - 100%   → fill width = full → entire gradient visible
 *
 * No color bleed, no overlay hacks.
 */
export default function XPBar({ xp }: Props) {
    const levelInfo = XPConfig.getLevel(xp);
    const xpInLevel = XPConfig.getXpInCurrentLevel(xp);
    const progress = XPConfig.getProgress(xp); // 0–1
    const palette = useXPBarColors();
    const themeColor = palette[palette.length - 1]; // Use the lightest color for text
    
    // Fix unreadable text during dark themes by using the lighter color
    const textColor = themeColor;

    const [barWidth, setBarWidth] = useState(0);
    const animatedProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animatedProgress, {
            toValue: isFinite(progress) ? progress : 0,
            useNativeDriver: false,
            tension: 20,
            friction: 7,
        }).start();
    }, [xp, progress]);

    // Fill width in real pixels — gradient inside is also barWidth wide, clipped by fill
    const fillWidth = animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, barWidth],
    });

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <View style={[styles.levelBadge, { borderColor: textColor + '66' }]}>
                    <Text style={[styles.levelText, { color: textColor }]}>LVL {levelInfo.level}</Text>
                </View>
                <Text style={[styles.rankTitle, { color: textColor }]} numberOfLines={1}>{levelInfo.title.toUpperCase()}</Text>
                <Text style={[styles.xpCounts, { color: textColor + '88' }]} numberOfLines={1}>
                    {xpInLevel.toLocaleString()} <Text style={[styles.xpDivider, { color: textColor + '44' }]}>/</Text> {levelInfo.xpToComplete.toLocaleString()}
                </Text>
            </View>

            {/* Track */}
            <View
                style={styles.barTrack}
                onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
            >
                {/* Animated fill — clips the gradient to earned portion only */}
                <Animated.View style={[styles.barFill, { width: fillWidth }]}>
                    {/* Gradient rendered at full bar width so colors are always proportional */}
                    {barWidth > 0 && (
                        <LinearGradient
                            colors={palette.length >= 2 ? [...palette].reverse() as any : ['#60EFFF', '#0061FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ width: barWidth, height: '100%' }}
                        />
                    )}
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
        overflow: 'hidden',  // clips gradient to earned portion
        borderRadius: 3,
    },
});
