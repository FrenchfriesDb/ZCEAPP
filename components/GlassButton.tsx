import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Animated,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, FontSizes, Radius } from '@/constants/theme';

/**
 * Ultra-realistic "water-glass" button.
 *
 * Layers (bottom → top):
 *  1. Outer glow halo (animated pulse)
 *  2. Drop shadow
 *  3. Metallic specular rim (bright hair-line top, fades dark bottom)
 *  4. High-blur frosted glass body (intensity 60)
 *  5. Inner specular highlight (thin white gradient top 30%)
 *  6. Label
 */

interface GlassButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'pill' | 'circle';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    /** 'dark' blends w/ bg (default), 'blue'/'red'/'monochrome' for accents */
    tint?: 'dark' | 'blue' | 'red' | 'monochrome';
    /** Add an animated glow halo around the button */
    glow?: boolean;
    style?: ViewStyle;
    labelStyle?: TextStyle;
    disabled?: boolean;
}

const TINT = {
    dark: {
        rimColors: [
            'rgba(255,255,255,0.50)',  // top specular — bright white hairline
            'rgba(255,255,255,0.08)',  // mid
            'rgba(0,0,0,0.55)',        // bottom shadow
        ] as const,
        bodyColors: [
            'rgba(255,255,255,0.07)', // top glass shimmer
            'rgba(255,255,255,0.015)', // mid body
            'rgba(0,0,0,0.22)',        // bottom inner shadow (depth)
        ] as const,
        specularColors: [
            'rgba(255,255,255,0.18)', // specular hot-spot
            'rgba(255,255,255,0.04)', // fade
            'rgba(255,255,255,0.00)', // transparent
        ] as const,
        label: Colors.textPrimary,
        glowColor: 'rgba(255,255,255,0.10)',
    },
    blue: {
        rimColors: [
            'rgba(255,255,255,0.60)',
            'rgba(255,255,255,0.14)',
            'rgba(0,0,0,0.55)',
        ] as const,
        bodyColors: [
            'rgba(255,255,255,0.12)',
            'rgba(255,255,255,0.03)',
            'rgba(0,0,0,0.22)',
        ] as const,
        specularColors: [
            'rgba(255,255,255,0.28)',
            'rgba(255,255,255,0.08)',
            'rgba(255,255,255,0.00)',
        ] as const,
        label: '#FFFFFF',
        glowColor: 'rgba(255,255,255,0.20)',
    },
    red: {
        rimColors: [
            'rgba(255,200,200,0.55)',
            'rgba(255,68,68,0.10)',
            'rgba(20,0,0,0.55)',
        ] as const,
        bodyColors: [
            'rgba(255,68,68,0.09)',
            'rgba(255,68,68,0.02)',
            'rgba(0,0,0,0.22)',
        ] as const,
        specularColors: [
            'rgba(255,220,220,0.20)',
            'rgba(255,68,68,0.05)',
            'rgba(255,68,68,0.00)',
        ] as const,
        label: Colors.accentDanger,
        glowColor: 'rgba(255,68,68,0.16)',
    },
    monochrome: {
        rimColors: [
            'rgba(255,255,255,0.90)', // Ultra 4k bright top
            'rgba(255,255,255,0.20)',
            'rgba(255,255,255,0.05)',
        ] as const,
        bodyColors: [
            'rgba(255,255,255,0.15)', // Bubble shimmer
            'rgba(255,255,255,0.05)',
            'rgba(0,0,0,0.40)',       // Depth
        ] as const,
        specularColors: [
            'rgba(255,255,255,0.45)', // 4k specular hot-spot
            'rgba(255,255,255,0.15)',
            'rgba(255,255,255,0.00)',
        ] as const,
        label: '#FFFFFF',
        glowColor: 'rgba(255,255,255,0.25)',
    },
};

const SIZE = {
    sm: { ph: 14, pv: 9, fs: FontSizes.sm, circle: 42 },
    md: { ph: 22, pv: 13, fs: FontSizes.md, circle: 54 },
    lg: { ph: 30, pv: 17, fs: FontSizes.lg, circle: 66 },
};

export default function GlassButton({
    label,
    onPress,
    variant = 'pill',
    size = 'md',
    icon,
    tint = 'dark',
    glow = false,
    style,
    labelStyle,
    disabled = false,
}: GlassButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.4)).current;

    // glow halo pulse
    useEffect(() => {
        if (!glow) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 0.9, duration: 1800, useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0.3, duration: 1800, useNativeDriver: false }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [glow]);

    const pressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
    const pressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5 }).start();

    const { ph, pv, fs, circle } = SIZE[size];
    const t = TINT[tint as keyof typeof TINT] || TINT.dark;
    const isCircle = variant === 'circle';
    const br = variant === 'pill' ? Radius.pill : Radius.lg;

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <Pressable
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={disabled}
                style={{ opacity: disabled ? 0.3 : 1 }}
            >
                {/* 1 ── GLOW HALO (optional) */}
                {glow && (
                    <Animated.View style={[
                        styles.glowHalo,
                        {
                            borderRadius: br + 6,
                            shadowColor: t.glowColor,
                            shadowOpacity: glowAnim,
                            backgroundColor: t.glowColor,
                            ...(isCircle ? { width: circle + 12, height: circle + 12, left: -6, top: -6 } : {}),
                        },
                    ]} />
                )}

                {/* 2 ── DROP SHADOW */}
                <View style={[styles.shadow, { borderRadius: br }, isCircle && { width: circle, height: circle }]} />

                {/* 3 ── METALLIC SPECULAR RIM (1.2px) */}
                <LinearGradient
                    colors={[...t.rimColors]}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                    style={[{ padding: 0.8 }, isCircle ? { width: circle, height: circle, borderRadius: br } : { borderRadius: br }]}
                >
                    {/* 4 ── FROSTED GLASS BODY (high blur) */}
                    <BlurView
                        intensity={60}
                        tint="dark"
                        style={[
                            { overflow: 'hidden' },
                            isCircle
                                ? { width: circle - 2.4, height: circle - 2.4, borderRadius: br - 1.2 }
                                : { borderRadius: br - 1 },
                        ]}
                    >
                        {/* Glass body gradient — slight top shimmer, dark bottom */}
                        <LinearGradient
                            colors={[...t.bodyColors]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={[
                                isCircle
                                    ? { width: circle - 2.4, height: circle - 2.4, borderRadius: br - 1.2, justifyContent: 'center' as const, alignItems: 'center' as const }
                                    : { paddingHorizontal: ph, paddingVertical: pv, flexDirection: 'row' as const, gap: 8, alignItems: 'center' as const, justifyContent: 'center' as const },
                            ]}
                        >
                            {/* 5 ── INNER SPECULAR HIGHLIGHT — top 35% white arc */}
                            <View style={[
                                styles.specularOverlay,
                                isCircle
                                    ? { width: circle - 4, height: (circle - 4) * 0.45, borderRadius: br }
                                    : { height: '45%', borderRadius: br },
                            ]}>
                                <LinearGradient
                                    colors={[...t.specularColors]}
                                    start={{ x: 0.5, y: 0 }}
                                    end={{ x: 0.5, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </View>

                            {/* 6 ── LABEL */}
                            {icon ? <Text style={{ fontSize: fs, color: t.label }}>{icon}</Text> : null}
                            <Text style={[styles.label, { fontSize: fs, color: t.label }, labelStyle]}>
                                {label}
                            </Text>
                        </LinearGradient>
                    </BlurView>
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    glowHalo: {
        ...StyleSheet.absoluteFillObject,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 30,
        opacity: 0.3,
    },
    shadow: {
        ...StyleSheet.absoluteFillObject,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 20,
        shadowOpacity: 0.6,
        elevation: 12,
    },
    specularOverlay: {
        position: 'absolute',
        top: 0,
        left: 2,
        right: 2,
        overflow: 'hidden',
    },
    label: {
        fontFamily: Fonts.headingSemi,
        fontWeight: '700',
        letterSpacing: 0.6,
        textAlign: 'center',
    },
});
