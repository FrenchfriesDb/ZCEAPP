import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Radius } from '@/constants/theme';
import GlassCard from './GlassCard';

interface StatCardProps {
    icon: string;
    label: string;
    value: number;
    color?: string;
}

export default function StatCard({ icon, label, value, color = Colors.accentPrimary }: StatCardProps) {
    return (
        <GlassCard style={styles.card} glowColor={color}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.value, { color }]}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: '45%',
    },
    icon: {
        fontSize: 24,
        marginBottom: 6,
    },
    value: {
        fontFamily: Fonts.monoBold,
        fontSize: FontSizes.h2,
        color: Colors.accentPrimary,
        letterSpacing: 1,
    },
    label: {
        fontFamily: Fonts.mono,
        fontSize: FontSizes.xs,
        color: Colors.textTertiary,
        letterSpacing: 1,
        marginTop: 2,
        textTransform: 'uppercase',
    },
});
