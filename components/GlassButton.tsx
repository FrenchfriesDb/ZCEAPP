import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Animated,
    ViewStyle,
    TextStyle,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, FontSizes, Radius } from '@/constants/theme';
import { useTimeColors } from '@/hooks/useTimeColors';
import { useTextColors } from '@/context/TextColorsContext';

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
        label: '#E8E8E8',
        glowColor: 'rgba(255,255,255,0.10)',
    },
    blue: {
        rimColors: [
            'rgba(255,255,255,0.15)',
            'rgba(255,255,255,0.08)',
            'rgba(0,0,0,0.70)',
        ] as const,
        bodyColors: [
            'rgba(0,0,0,0.03)',
            'rgba(0,0,0,0.01)',
            'rgba(0,0,0,0.08)',
        ] as const,
        specularColors: [
            'rgba(255,255,255,0.25)',
            'rgba(255,255,255,0.12)',
            'rgba(255,255,255,0.03)',
        ] as const,
        label: '#FFFFFF',
        glowColor: 'rgba(255,255,255,0.08)',
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
    dynamic: {
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
    monochrome: {
        rimColors: [
            'rgba(255,255,255,0.80)',
            'rgba(180,180,180,0.20)',
            'rgba(0,0,0,0.80)',
        ] as const,
        bodyColors: [
            '#2a2a2a',
            '#121212',
            '#000000',
        ] as const,
        specularColors: [
            'rgba(255,255,255,0.35)',
            'rgba(255,255,255,0.10)',
            'rgba(255,255,255,0.00)',
        ] as const,
        label: '#FFFFFF',
        glowColor: 'rgba(255,255,255,0.15)',
    },
};

const SIZE = {
    xs: { ph: 24, pv: 20, fs: FontSizes.xs, circle: 48 },
    sm: { ph: 28, pv: 24, fs: FontSizes.sm, circle: 56 },
    md: { ph: 48, pv: 40, fs: FontSizes.md, circle: 72 },
    lg: { ph: 56, pv: 48, fs: FontSizes.lg, circle: 88 },
    xl: { ph: 64, pv: 56, fs: FontSizes.xl, circle: 104 },
} as const;

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
    const timePalette = useTimeColors();
    const systemColor = timePalette[0];

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
    
    // Use theme color for blue tint
    const { textPrimary } = useTextColors();
    const useThemeColor = tint === 'blue';
    const finalTint = useThemeColor ? { ...t, label: textPrimary, glowColor: textPrimary } : t;

    // Special font color for sunset theme (6-7 PM)
    const isSunsetTheme = timePalette[0] === '#FF0F7B' && timePalette[1] === '#F89B29';
    const labelColor = '#FFFFFF'; // Always white for better visibility

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
                            shadowColor: useThemeColor ? textPrimary : finalTint.glowColor,
                            shadowOpacity: glowAnim,
                            backgroundColor: useThemeColor ? textPrimary : finalTint.glowColor,
                            ...(isCircle ? { width: circle + 12, height: circle + 12, left: -6, top: -6 } : {}),
                        },
                    ]} />
                )}

                {/* 2 ── DROP SHADOW */}
                <View style={[styles.shadow, { borderRadius: br }, isCircle && { width: circle, height: circle }]} />

                {/* 3 ── METALLIC SPECULAR RIM (1.2px) */}
                <LinearGradient
                    colors={useThemeColor ? [textPrimary + '60', textPrimary + '20', 'rgba(0,0,0,0.55)'] : finalTint.rimColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[styles.rim, { borderRadius: br }, isCircle && { width: circle, height: circle }]}
                >
                    {/* 4 ── FROSTED GLASS BODY (high blur) */}
                    <BlurView
                        intensity={100}
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
                            colors={useThemeColor ? [textPrimary + '12', textPrimary + '03', 'rgba(0,0,0,0.22)'] : finalTint.bodyColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.glassBody}
                        >
                            <LinearGradient
                                colors={finalTint.specularColors}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />        
                            <View
                                style={[
                                    styles.specularOverlay,
                                    isCircle
                                        ? { width: circle - 2.4, height: (circle - 2.4) * 0.45, borderRadius: br - 1.2, justifyContent: 'center' as const, alignItems: 'center' as const }
                                        : { height: '45%', borderRadius: br },
                                ]}
                            />

                                {/* 6 ── LABEL */}
                                {icon ? (
                                    <Text style={{
                                        fontSize: fs,
                                        color: '#FFFFFF',
                                        textShadowColor: 'rgba(0,0,0,0.5)',
                                        textShadowRadius: 2,
                                        textShadowOffset: { width: 0, height: 1 },
                                        fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
                                        fontWeight: '600',
                                        letterSpacing: 0.5,
                                    }}>
                                        {icon}
                                    </Text>
                                ) : null}
                                <Text style={[styles.label, { fontSize: fs, color: labelColor }, labelStyle]}>
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
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 3,
        textShadowOffset: { width: 0, height: 2 },
    },
});
