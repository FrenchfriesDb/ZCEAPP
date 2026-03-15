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
    danger?: boolean;  // Red glow variant (streaks)
    accent?: boolean;  // Blue glow variant (CTAs)
    themed?: boolean;  // True = uses current time-of-day gradient for fill
    darkGlass?: boolean;  // Darker liquid glass, more morphism (e.g. standing order cards)
    onPress?: () => void;
}

export default function GlassCard({
    children,
    style,
    glowColor,
    noPadding,
    intensity = 70,
    danger = false,
    accent = false,
    themed = false,
    darkGlass = false,
    onPress,
}: GlassCardProps) {
    const timePalette = useTimeColors();

    // Create highly translucent version of time palette for "Liquid Glass"
    const themedColors = themed
        ? timePalette.map(c => `${c}26`) // ~15% opacity for colors
        : Colors.gradientCard;

    const blurIntensity = darkGlass ? 90 : intensity;
    const gradientColors = darkGlass
        ? (['rgba(0, 0, 0, 0.82)', 'rgba(0, 0, 0, 0.45)'] as const)
        : (['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.1)'] as const);

    const resolvedGlow = glowColor
        ? glowColor
        : danger
            ? Colors.accentDanger
            : accent
                ? Colors.accentPrimary
                : themed
                    ? '#FFFFFF'
                    : 'rgba(255, 255, 255, 0.03)';

    const resolvedBorder = danger
        ? Colors.borderDanger
        : accent
            ? Colors.borderAccent
            : 'rgba(255, 255, 255, 0.12)'; // Faint white

    return (
        <Pressable
            disabled={!onPress}
            onPress={onPress}
            style={[
                styles.outer,
                {
                    shadowColor: resolvedGlow,
                    shadowOpacity: danger ? 0.3 : accent ? 0.25 : themed ? 0.2 : 0.05,
                    shadowRadius: themed ? 15 : 6,
                    borderColor: resolvedBorder,
                },
                style,
            ]}
        >
            <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, noPadding && { padding: 0 }]}
            >
                {/* 4K Specular Shimmer & Bubble Highlight Layer */}
                <View style={[styles.shimmerLayer, { borderRadius: (style as any)?.borderRadius || Radius.lg }]}>
                    {/* General glass shimmer */}
                    <LinearGradient
                        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'transparent']}
                        start={{ x: 0.2, y: 0 }}
                        end={{ x: 0.8, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* The "Bubble" specular arc highlight at the top */}
                    <View style={styles.specularArc}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)', 'transparent']}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                </View>

                {children}
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    outer: {
        borderRadius: Radius.lg,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.01)', // Ultra-transparent base
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 30,
        shadowOpacity: 0.1,
        shadowColor: '#000',
        elevation: 15,
    },
    gradient: {
        padding: 16,
        flex: 1,
    },
    shimmerLayer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.8,
        overflow: 'hidden',
    },
    specularArc: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        opacity: 0.6,
    },
});
