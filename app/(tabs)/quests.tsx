import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '@/constants/theme';
import QuestCard from '@/components/QuestCard';
import { useUser } from '@/context/UserContext';

const QUESTS = [
    { id: 'qs_stranger', icon: '🗣️', title: 'Talk to a Stranger', description: "Initiate a conversation with someone you don't know. Any topic — weather, a compliment, or just \"hey.\"", xpReward: 10, category: 'social' },
    { id: 'qs_eyelock', icon: '👁️', title: 'Eye-Lock Challenge', description: 'Hold eye contact for 3 seconds with 5 different people today. No looking away first.', xpReward: 10, category: 'confidence' },
    { id: 'qs_compliment', icon: '💎', title: 'Bold Compliment', description: "Give a genuine, unexpected compliment. Make it specific — not \"nice shirt\" but \"that color really works on you.\"", xpReward: 10, category: 'social' },
    { id: 'qs_laugh', icon: '😂', title: 'Make Someone Laugh', description: 'Tell a joke, say something witty, or make an observation that gets a genuine laugh.', xpReward: 10, category: 'humor' },
    { id: 'qs_voice', icon: '🎙️', title: 'Voice Power', description: 'Record yourself speaking for 60 seconds. Replay it. Notice your tone, pace, and energy. Speak like a CEO.', xpReward: 10, category: 'confidence' },
    { id: 'qs_lead', icon: '👑', title: 'Lead a Conversation', description: 'In your next group interaction, be the one who drives the topic. Pivot the convo at least once with intent.', xpReward: 10, category: 'leadership' },
    { id: 'qs_cold', icon: '🧊', title: 'Cold Approach', description: 'Walk up to someone sitting alone and start a conversation. This is the boss level. No excuses.', xpReward: 10, category: 'social' },
    { id: 'qs_mirror', icon: '🎭', title: 'Chameleon Mode', description: "Mirror the energy and body language of someone you're talking to. Observe the shift in connection.", xpReward: 10, category: 'psychology' },
];


export default function QuestsScreen() {
    const { user, completeQuest, resetQuests } = useUser();
    const completedIds = user?.completedQuests || [];

    const completedCount = QUESTS.filter(q => completedIds.includes(q.id)).length;
    const totalXP = QUESTS.reduce((sum, q) => completedIds.includes(q.id) ? sum + q.xpReward : sum, 0);
    const allDone = completedCount === QUESTS.length;

    const handleToggle = async (quest: typeof QUESTS[0]) => {
        if (completedIds.includes(quest.id)) return; // can't un-complete
        await completeQuest(quest.id, quest.xpReward);
    };

    const handleReboot = async () => {
        const oldIds = QUESTS.map(q => q.id);
        await resetQuests(oldIds);
    };

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSub}>DAILY CHALLENGES</Text>
                        <Text style={styles.headerTitle}>QUESTS</Text>
                    </View>
                    <View style={styles.progressBadge}>
                        <Text style={styles.progressText}>{completedCount}/{QUESTS.length}</Text>
                    </View>
                </View>

                {totalXP > 0 && (
                    <View style={styles.xpEarned}>
                        <Text style={styles.xpEarnedText}>+{totalXP} XP EARNED TODAY</Text>
                    </View>
                )}

                {allDone && (
                    <Pressable onPress={handleReboot} style={styles.rebootBtn}>
                        <Text style={styles.rebootText}>⚡ ALL DONE — REBOOT QUESTS</Text>
                    </Pressable>
                )}

                {QUESTS.map((quest) => (
                    <QuestCard
                        key={quest.id}
                        icon={quest.icon}
                        title={quest.title}
                        description={quest.description}
                        xpReward={quest.xpReward}
                        completed={completedIds.includes(quest.id)}
                        onToggle={() => handleToggle(quest)}
                    />
                ))}

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgPrimary },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingTop: 60, gap: 12 },
    cornerGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
    cornerTopRight: { top: -100, right: -100, backgroundColor: 'rgba(123, 97, 255, 0.05)' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    headerSub: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, color: Colors.accentSecondary, letterSpacing: 3 },
    headerTitle: { fontFamily: Fonts.heading, fontSize: FontSizes.h1, color: Colors.textPrimary, letterSpacing: 4 },
    progressBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: Radius.pill,
        paddingHorizontal: 14, paddingVertical: 6,
        borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    progressText: { fontFamily: Fonts.monoBold, fontSize: FontSizes.lg, color: Colors.accentPrimary },
    xpEarned: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: Radius.sm,
        padding: 10, alignItems: 'center',
        borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    xpEarnedText: { fontFamily: Fonts.mono, fontSize: FontSizes.sm, color: Colors.accentSecondary, letterSpacing: 2 },
    rebootBtn: {
        padding: 14, borderRadius: Radius.lg, alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    rebootText: { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.accentPrimary, letterSpacing: 2 },
});
