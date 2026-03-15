import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Radius } from '@/constants/theme';
import { useTimeColors } from '@/hooks/useTimeColors';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    glowColor?: string;
    noPadding?: boolean;
    intensity?: number;
    danger?: boolean;
    accent?: boolean;
    themed?: boolean;
    darkGlass?: boolean;
    onPress?: () => void;
    categoryColor?: string; // For left accent border inner glow
}

export default function GlassCard({
    children,
    style,
    glowColor,
    noPadding,
    intensity = 20, // Reduced for subtle glass effect
    danger = false,
    accent = false,
    themed = false,
    darkGlass = false,
    onPress,
    categoryColor,
}: GlassCardProps) {
    const timePalette = useTimeColors();

    // Create highly translucent version of time palette for "Liquid Glass"
    const themedColors = themed
        ? timePalette.map(c => `${c}26`) // ~15% opacity for colors
        : Colors.gradientCard;

    const blurIntensity = darkGlass ? 20 : intensity;

    const resolvedGlow = glowColor
        ? glowColor
        : danger
            ? Colors.accentDanger
            : accent
                ? Colors.accentPrimary
                : themed
                    ? '#FFFFFF'
                    : 'rgba(255, 255, 255, 0.05)';

    const resolvedBorder = danger
        ? Colors.borderDanger
        : accent
            ? Colors.borderAccent
            : 'rgba(255, 255, 255, 0.1)'; // Thin frosted border

    return (
        <Pressable
            disabled={!onPress}
            onPress={onPress}
            style={({ pressed }) => [
                styles.outer,
                {
                    shadowColor: resolvedGlow,
                    shadowOpacity: danger ? 0.3 : accent ? 0.25 : themed ? 0.2 : 0.08,
                    shadowRadius: themed ? 15 : 8,
                    borderColor: resolvedBorder,
                },
                pressed && styles.pressed,
                style,
            ]}
        >
            <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[styles.content, noPadding && { padding: 0 }]}>
                {/* Shine gradient across top edge */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.shineGradient}
                />

                {/* Inner glow on left accent border */}
                {categoryColor && (
                    <View style={[styles.leftAccent, { shadowColor: categoryColor }]} />
                )}

                {children}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    outer: {
        borderRadius: 16, // Premium rounded feel
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Very subtle white transparency
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)', // Thin frosted border
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        shadowOpacity: 0.12,
        shadowColor: '#000',
        elevation: 10,
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.95,
    },
    content: {
        padding: 16,
        flex: 1,
        backgroundColor: 'transparent',
    },
    shineGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '35%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    leftAccent: {
        position: 'absolute',
        left: 0,
        top: '15%',
        bottom: '15%',
        width: 3,
        borderRadius: 1.5,
        backgroundColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
        shadowOpacity: 0.6,
    },
});
