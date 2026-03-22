import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import GlassCard from './GlassCard';
import { useTimeColors } from '@/hooks/useTimeColors';
import FluentEmoji, { resolveFluentEmojiName } from './FluentEmoji';

interface QuestCardProps {
    icon: string;
    title: string;
    description: string;
    xpReward: number;
    completed: boolean;
    onToggle: () => void;
    category?: string; // For left accent border color
}

export default function QuestCard({ icon, title, description, xpReward, completed, onToggle, category }: QuestCardProps) {
    const { palette: timePalette } = useTimeColors();
    const systemColor = timePalette[0];

    // Map category to color
    const getCategoryColor = (cat?: string) => {
        switch (cat) {
            case 'social': return '#00F5FF'; // Cyan
            case 'confidence': return '#FF2D55'; // Pink/Red
            case 'humor': return '#FFCC00'; // Yellow
            case 'leadership': return '#BF5AF2'; // Purple
            case 'psychology': return '#32D74B'; // Green
            default: return systemColor;
        }
    };

    const categoryColor = getCategoryColor(category);
    const fluentIcon = resolveFluentEmojiName(icon);
    const titleGlowColor = `${systemColor}CC`;
    const bodyGlowColor = `${systemColor}88`;

    return (
        <GlassCard
            style={completed ? styles.completedCard : styles.card}
            glowColor={completed ? systemColor + '22' : 'transparent'}
            intensity={20}
            categoryColor={categoryColor}
        >
            <View style={styles.row}>
                <View
                    style={[styles.iconBox, completed && { borderColor: systemColor + '33' }]}
                >
                    {fluentIcon ? (
                        <FluentEmoji name={fluentIcon} size={24} opacity={completed ? 0.8 : 1} />
                    ) : (
                        <Text style={[styles.icon, completed && { opacity: 0.8 }]}>{icon || '•'}</Text>
                    )}
                </View>

                <View style={styles.content}>
                    <Text style={[styles.title, completed && styles.completedText, { color: '#FFFFFF', textShadowColor: titleGlowColor }]}>{title}</Text>
                    <Text style={[styles.description, { color: '#FFFFFF', textShadowColor: bodyGlowColor }]}>{description}</Text>
                </View>

                <View style={styles.right}>
                    <View style={[styles.xpBadge, { borderColor: systemColor + '44' }, completed && { opacity: 0.5 }]}>
                        <Text style={[styles.xpText, { color: '#FFFFFF', textShadowColor: bodyGlowColor }]}>+{xpReward} XP</Text>
                    </View>

                    <Pressable onPress={onToggle} style={({ pressed }) => [
                        styles.checkbox,
                        completed && { backgroundColor: systemColor, borderColor: systemColor },
                        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
                    ]}>
                        {completed ? <Text style={styles.checkmark}>✓</Text> : <View style={styles.checkboxInner} />}
                    </Pressable>
                </View>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 4,
    },
    completedCard: {
        opacity: 0.6,
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
    },
    content: {
        flex: 1,
        gap: 4,
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 16,
        letterSpacing: 0.5,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: 'rgba(255, 255, 255, 0.3)',
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        lineHeight: 18,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    right: {
        alignItems: 'flex-end',
        gap: 10,
    },
    xpBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(0, 245, 255, 0.2)',
    },
    xpText: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        letterSpacing: 1,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    checkboxInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'transparent',
    },
    checkboxDone: {
        backgroundColor: Colors.accentCyan,
        borderColor: Colors.accentCyan,
    },
    checkmark: {
        color: '#000',
        fontSize: 14,
        fontWeight: '900',
    },
});
