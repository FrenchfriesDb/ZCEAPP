import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '@/constants/theme';
import QuestCard from '../../components/QuestCard';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import ProofModal from '../../components/ProofModal';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';

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

    const [selectedQuest, setSelectedQuest] = useState<typeof QUESTS[0] | null>(null);
    const [isProofVisible, setIsProofVisible] = useState(false);

    const timePalette = useTimeColors();
    const systemColor = timePalette[0];

    const completedCount = QUESTS.filter(q => completedIds.includes(q.id)).length;
    const totalXP = QUESTS.reduce((sum, q) => completedIds.includes(q.id) ? sum + q.xpReward : sum, 0);
    const allDone = completedCount === QUESTS.length;

    const handleToggle = (quest: typeof QUESTS[0]) => {
        if (completedIds.includes(quest.id)) return;
        setSelectedQuest(quest);
        setIsProofVisible(true);
    };

    const handleProofComplete = async (proofData: any) => {
        if (!selectedQuest) return;

        // Construct log with proof summary
        let log = `Verified: ${selectedQuest.title}.`;
        if (proofData.text) log += ` Description: ${proofData.text}`;
        if (proofData.photoUri) log += ` [Photo Proof Attached]`;
        if (proofData.voiceUri) log += ` [Voice Proof Attached]`;

        await completeQuest(selectedQuest.id, selectedQuest.xpReward, log);
        setIsProofVisible(false);
        setSelectedQuest(null);
    };

    const handleReboot = async () => {
        const oldIds = QUESTS.map(q => q.id);
        await resetQuests(oldIds);
    };

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.heroProgressWrapper}>
                        <Text style={[styles.heroNumber, { textShadowColor: systemColor + '66' }]}>{completedCount}</Text>
                        <Text style={[styles.heroUnit, { color: systemColor }]}>OF {QUESTS.length} QUESTS</Text>
                    </View>
                    <Text style={styles.welcomeText}>
                        Harvesting status. Stay in frame.
                    </Text>

                    <View style={styles.heroXPContainer}>
                        <View style={[styles.xpEarned, { borderColor: systemColor + '33' }]}>
                            <Text style={[styles.xpEarnedText, { color: systemColor }]}>+{totalXP} XP EXTRACTED TODAY</Text>
                        </View>
                    </View>
                </View>

                {allDone && (
                    <GlassButton
                        label="REBOOT NEURAL BUFFER"
                        onPress={handleReboot}
                        size="md"
                        tint="blue"
                        glow
                        style={{ marginBottom: 20 }}
                    />
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

            <ProofModal
                visible={isProofVisible}
                onClose={() => setIsProofVisible(false)}
                onComplete={handleProofComplete}
                questTitle={selectedQuest?.title || ''}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingTop: 40, gap: 14 },

    heroSection: {
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 30,
    },
    heroProgressWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 180,
    },
    heroNumber: {
        fontFamily: Fonts.heading,
        fontSize: 140,
        fontWeight: '900',
        color: '#E8E8E8',
        lineHeight: 160,
        letterSpacing: -6,
        textShadowColor: 'rgba(0, 245, 255, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 30,
    },
    heroUnit: {
        fontFamily: Fonts.monoBold,
        fontSize: 11,
        color: Colors.accentCyan,
        letterSpacing: 4,
        marginTop: -10,
        fontWeight: '800',
        opacity: 0.8,
    },
    welcomeText: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
        fontStyle: 'italic',
    },
    heroXPContainer: {
        width: '100%',
        paddingHorizontal: 10,
    },
    xpEarned: {
        borderRadius: Radius.md,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 245, 255, 0.2)',
    },
    xpEarnedText: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: Colors.accentCyan,
        letterSpacing: 2
    },
    icon: {
        fontSize: 24,
    },
    emojiFix: {
        fontFamily: Platform.OS === 'ios' ? 'Apple Color Emoji' : undefined,
        fontWeight: 'normal',
        letterSpacing: 0,
    },
});
