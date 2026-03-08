import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Glass, Radius } from '@/constants/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    glowColor?: string;
    noPadding?: boolean;
    intensity?: number;
    danger?: boolean;  // Red glow variant (streaks)
    accent?: boolean;  // Blue glow variant (CTAs)
}

export default function GlassCard({
    children,
    style,
    glowColor,
    noPadding,
    intensity = 70,
    danger = false,
    accent = false,
}: GlassCardProps) {
    const resolvedGlow = glowColor
        ? glowColor
        : danger
            ? Colors.accentDanger
            : accent
                ? Colors.accentPrimary
                : '#000';

    const resolvedBorder = danger
        ? Colors.borderDanger
        : accent
            ? Colors.borderAccent
            : Colors.borderGlass;

    return (
        <View
            style={[
                styles.outer,
                {
                    shadowColor: resolvedGlow,
                    shadowOpacity: danger ? 0.3 : accent ? 0.25 : 0.12,
                    borderColor: resolvedBorder,
                },
                style,
            ]}
        >
            <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={Colors.gradientCard as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, noPadding && { padding: 0 }]}
            >
                {/* 4K Specular Shimmer Layer */}
                <View style={styles.shimmerLayer}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)', 'transparent']}
                        start={{ x: 0.3, y: 0 }}
                        end={{ x: 0.7, y: 0.4 }}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                {children}
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: {
        borderRadius: Radius.lg,
        overflow: 'hidden',
        backgroundColor: Colors.bgCard,
        borderWidth: 1,
        borderColor: Colors.borderGlass,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 24,
        shadowOpacity: 0.12,
        shadowColor: '#000',
        elevation: 10,
    },
    gradient: {
        padding: 16,
        flex: 1,
    },
    shimmerLayer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6,
        overflow: 'hidden',
    },
});
