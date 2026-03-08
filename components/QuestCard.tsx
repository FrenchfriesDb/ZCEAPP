import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '@/constants/theme';
import GlassCard from './GlassCard';

interface QuestCardProps {
    icon: string;
    title: string;
    description: string;
    xpReward: number;
    completed: boolean;
    onToggle: () => void;
}

export default function QuestCard({ icon, title, description, xpReward, completed, onToggle }: QuestCardProps) {
    return (
        <GlassCard style={completed ? styles.completedCard : undefined} glowColor={completed ? Colors.accentCyan : undefined}>
            <View style={styles.row}>
                <View style={styles.iconBox}>
                    <Text style={styles.icon}>{icon}</Text>
                </View>
                <View style={styles.content}>
                    <Text style={[styles.title, completed && styles.completedText]}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>
                <View style={styles.right}>
                    <View style={styles.xpBadge}>
                        <Text style={styles.xpText}>+{xpReward} XP</Text>
                    </View>
                    <Pressable onPress={onToggle} style={[styles.checkbox, completed && styles.checkboxDone]}>
                        {completed && <Text style={styles.checkmark}>✓</Text>}
                    </Pressable>
                </View>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    completedCard: {
        opacity: 0.7,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        backgroundColor: 'rgba(74, 158, 255, 0.1)',
        borderWidth: 0.5,
        borderColor: 'rgba(74, 158, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 22,
    },
    content: {
        flex: 1,
        gap: 3,
    },
    title: {
        fontFamily: Fonts.headingSemi,
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: Colors.textTertiary,
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: FontSizes.sm,
        color: Colors.textTertiary,
        lineHeight: 16,
    },
    right: {
        alignItems: 'center',
        gap: 8,
    },
    xpBadge: {
        backgroundColor: 'rgba(123, 97, 255, 0.15)',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 0.5,
        borderColor: 'rgba(123, 97, 255, 0.3)',
    },
    xpText: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: '#7B61FF',
        letterSpacing: 0.5,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxDone: {
        backgroundColor: Colors.accentCyan,
        borderColor: Colors.accentCyan,
    },
    checkmark: {
        color: '#000',
        fontSize: 14,
        fontWeight: '700',
    },
});
