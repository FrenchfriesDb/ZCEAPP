import FluentEmoji, { resolveFluentEmojiName } from '@/components/FluentEmoji';
import GlassButton from '@/components/GlassButton';
import ProofModal from '@/components/ProofModal';
import QuestCard from '@/components/QuestCard';
import { getQuestTierProfile, MICRO_OPS } from '@/constants/habitEngine';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useSubscription } from '@/context/SubscriptionContext';
import { useTextColors } from '@/context/TextColorsContext';
import { useUser } from '@/context/UserContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const CATEGORIES = [
    { id: 'all', label: 'ALL', color: '#FFFFFF' },
    { id: 'social', label: 'SOCIAL', color: '#00F5FF' },
    { id: 'presence', label: 'PRESENCE', color: '#BF5AF2' },
    { id: 'mental', label: 'MENTAL', color: '#FF2D55' },
    { id: 'charisma', label: 'CHARISMA', color: '#FFCC00' },
    { id: 'confidence', label: 'CONFIDENCE', color: '#32D74B' },
    { id: 'leadership', label: 'LEAD', color: '#FF9500' },
    { id: 'humor', label: 'HUMOR', color: '#FFCC00' },
    { id: 'psychology', label: 'PSYCH', color: '#AF52DE' },
];

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const QUESTS = [
    // === ORIGINAL QUESTS ===
    { id: 'qs_stranger', icon: '🗣️', title: 'Talk to a Stranger', description: "Initiate a conversation with someone you don't know. Any topic — weather, a compliment, or just \"hey.\"", xpReward: 10, category: 'social' },
{ id: 'qs_eyelock', icon: '👁️', title: 'Eye-Lock Challenge', description: 'Use camera, hold eye contact with person for 20 seconds (natural view). No looking away first.', xpReward: 10, category: 'confidence' },
    { id: 'qs_compliment', icon: '💎', title: 'Bold Compliment', description: "Give a genuine, unexpected compliment. Make it specific — not \"nice shirt\" but \"that color really works on you.\"", xpReward: 10, category: 'social' },
    { id: 'qs_laugh', icon: '😂', title: 'Make Someone Laugh', description: 'Tell a joke, say something witty, or make an observation that gets a genuine laugh.', xpReward: 10, category: 'humor' },
    { id: 'qs_voice', icon: '🎙️', title: 'Voice Power', description: 'Record yourself speaking for 60 seconds. Replay it. Notice your tone, pace, and energy. Speak like a CEO.', xpReward: 10, category: 'confidence' },
    { id: 'qs_lead', icon: '👑', title: 'Lead a Conversation', description: 'In your next group interaction, be the one who drives the topic. Pivot the convo at least once with intent.', xpReward: 10, category: 'leadership' },
    { id: 'qs_cold', icon: '🧊', title: 'Cold Approach', description: 'Walk up to someone sitting alone and start a conversation. This is the boss level. No excuses.', xpReward: 10, category: 'social' },
    { id: 'qs_mirror', icon: '🎭', title: 'Chameleon Mode', description: "Mirror the energy and body language of someone you're talking to. Observe the shift in connection.", xpReward: 10, category: 'psychology' },
    // === SOCIAL COMBAT QUESTS ===
    { id: 'qs_frame', icon: '🛡️', title: 'Hold The Frame', description: "Someone talks over you today. Don't shrink. Finish your sentence anyway. Silence after is not weakness — it's dominance.", xpReward: 20, category: 'social' },
    { id: 'qs_coldopen', icon: '⚡', title: 'Cold Open', description: 'Approach someone you\'ve never spoken to. No excuse accepted. Weather, compliment, observation — pick one and execute within 3 seconds of deciding.', xpReward: 20, category: 'social' },
    { id: 'qs_filler', icon: '🤐', title: 'Kill The Filler', description: 'Go one full conversation today without saying um, like, or you know. Every filler word is a confidence leak. Seal it.', xpReward: 15, category: 'social' },
    { id: 'qs_disagree', icon: '⚔️', title: 'Disagree Out Loud', description: 'Someone says something you disagree with today. Say so. Calmly. Without apologizing for having an opinion.', xpReward: 25, category: 'social' },
    { id: 'qs_namedrop', icon: '🏷️', title: 'Name Drop First', description: 'Use someone\'s name in conversation today within the first 30 seconds of talking to them. People who matter remember names.', xpReward: 10, category: 'social' },
    { id: 'qs_silence', icon: '🤫', title: 'Own The Silence', description: 'Let silence exist in a conversation today without filling it. Count to 3 in your head. Don\'t break first.', xpReward: 20, category: 'social' },
    { id: 'qs_script', icon: '📜', title: 'Interrupt The Script', description: 'When someone asks how are you — don\'t say fine. Say something real. One sentence. Make them actually hear you.', xpReward: 15, category: 'social' },
    { id: 'qs_space', icon: '👤', title: 'Take Up Space', description: 'Sit or stand somewhere today where you\'d normally avoid being visible. Center of the room. Front of the class. Main table. Occupy it.', xpReward: 20, category: 'social' },
    // === VOICE AND PRESENCE QUESTS ===
    { id: 'qs_project', icon: '📢', title: 'Project Or Stay Invisible', description: 'Speak loud enough today that you don\'t have to repeat yourself once. Not shouting. Projecting. There\'s a difference.', xpReward: 15, category: 'presence' },
    { id: 'qs_slow', icon: '🐌', title: 'Slow The Delivery', description: 'Deliberately speak slower than feels comfortable in one conversation today. Fast talking is nervous energy in audio form.', xpReward: 15, category: 'presence' },
    { id: 'qs_firstword', icon: '🎯', title: 'First Word Wins', description: 'Be the first person to speak in a group setting today. One sentence. Anything. First mover takes the frame.', xpReward: 25, category: 'presence' },
    { id: 'qs_apology', icon: '🚫', title: 'Kill The Apology', description: 'Go the entire day without saying sorry unless you actually did something wrong. Every unnecessary sorry is a submission signal.', xpReward: 20, category: 'presence' },
    { id: 'qs_observe', icon: '👀', title: 'Voice The Observation', description: 'Notice something specific about your environment and say it out loud to someone nearby. Observational people are magnetic people.', xpReward: 15, category: 'presence' },
    // === MENTAL TOUGHNESS QUESTS ===
    { id: 'qs_mirrorcheck', icon: '🪞', title: 'No Mirror Check', description: 'Go 4 hours without checking your appearance in any mirror or camera. Confidence lives inside the body not on the surface.', xpReward: 15, category: 'mental' },
    { id: 'qs_freeze', icon: '📝', title: 'Document The Freeze', description: 'Next time you feel the freeze coming — write down exactly what triggered it. Three sentences. You cannot fix what you refuse to name.', xpReward: 20, category: 'mental' },
    { id: 'qs_rejection', icon: '❌', title: 'Rejection Harvest', description: 'Ask for something you expect to be told no to today. Small ask. Real rejection. Collect it like currency because that\'s exactly what it is.', xpReward: 30, category: 'mental' },
    { id: 'qs_escape', icon: '📵', title: 'Cut The Escape Route', description: 'Put your phone away for one full hour in a social setting today. No exit strategy. Full presence only.', xpReward: 20, category: 'mental' },
    { id: 'qs_eyefirst', icon: '🔒', title: 'Eye Contact First', description: 'Make eye contact with every person who speaks to you today before you respond. Not after. Before. It changes everything.', xpReward: 15, category: 'mental' },
    // === CHARISMA QUESTS ===
    { id: 'qs_specific', icon: '💎', title: 'Specific Compliment Only', description: 'Give one compliment today that couldn\'t apply to anyone else in the room. Not nice shoes. Not cool shirt. Specific. Surgical. Memorable.', xpReward: 15, category: 'charisma' },
    { id: 'qs_make_laugh', icon: '🎭', title: 'Make Them Laugh Once', description: 'Get a genuine laugh from someone today. Not a pity laugh. Not a smile. A real laugh. You have 24 hours.', xpReward: 25, category: 'charisma' },
];

const FREE_DAILY_QUEST_LIMIT = 3;
const getTodayDateKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export default function QuestsScreen() {
    const { user, completeQuest, resetQuests } = useUser();
    const { isPremium } = useSubscription();
    const { textSecondary, textTertiary } = useTextColors();
    const completedTodayIds = useMemo(() => {
        const completedIds = user?.completedQuests || [];
        const today = getTodayDateKey();
        return user?.lastActivityDate === today ? completedIds : [];
    }, [user?.completedQuests, user?.lastActivityDate]);
    const freeQuestsRemaining = Math.max(0, FREE_DAILY_QUEST_LIMIT - completedTodayIds.length);

    const [selectedQuest, setSelectedQuest] = useState<typeof QUESTS[0] | null>(null);
    const [isProofVisible, setIsProofVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [questBatch, setQuestBatch] = useState(0);
    const [shuffledQuests, setShuffledQuests] = useState(() => shuffleArray(QUESTS));
    const tierProfile = getQuestTierProfile(user);
    const featuredMicroOps = useMemo(
        () => shuffleArray(MICRO_OPS).slice(0, Math.max(3, tierProfile.microCount + 1)),
        [tierProfile.microCount]
    );

    const withAlpha = (color: string, alpha: number) => {
        if (color.startsWith('rgba(')) {
            return color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${alpha})`);
        }
        if (color.startsWith('rgb(')) {
            return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
        }
        const hex = color.replace('#', '');
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgba(255,255,255,${alpha})`;
    };
    const glowColor = withAlpha(textSecondary, 0.95);

    // Reshuffle when batch changes
    useMemo(() => {
        if (questBatch > 0) {
            setShuffledQuests(shuffleArray(QUESTS));
        }
    }, [questBatch]);

    // Filter and rotate quests
    const filteredQuests = useMemo(() => {
        let quests = selectedCategory === 'all'
            ? shuffledQuests
            : shuffledQuests.filter(q => q.category === selectedCategory);
        return quests;
    }, [selectedCategory, shuffledQuests]);

    // Show 8 quests at a time, rotating through the pool
    const visibleQuests = useMemo(() => {
        if (!isPremium) {
            return filteredQuests.slice(0, FREE_DAILY_QUEST_LIMIT);
        }
        if (selectedCategory !== 'all') return filteredQuests;

        // For 'all' category, show 8 quests at a time with rotation
        const batchSize = 8;
        const startIndex = (questBatch * batchSize) % filteredQuests.length;
        let batch: typeof QUESTS = [];

        for (let i = 0; i < batchSize; i++) {
            const index = (startIndex + i) % filteredQuests.length;
            batch.push(filteredQuests[index]);
        }

        return batch;
    }, [filteredQuests, isPremium, questBatch, selectedCategory]);

    const completedCount = visibleQuests.filter(q => completedTodayIds.includes(q.id)).length;
    const totalXP = visibleQuests.reduce((sum, q) => completedTodayIds.includes(q.id) ? sum + q.xpReward : sum, 0);
    const allDone = visibleQuests.length > 0 && completedCount === visibleQuests.length;

    const handleRotate = () => {
        if (!isPremium) {
            router.push('/settings/subscription');
            return;
        }
        setQuestBatch(prev => prev + 1);
    };

    const handleToggle = (quest: typeof QUESTS[0]) => {
        if (completedTodayIds.includes(quest.id)) return;
        if (!isPremium && completedTodayIds.length >= FREE_DAILY_QUEST_LIMIT) {
            Alert.alert(
                'Free Quest Limit Reached',
                'You completed 3 quests today. Upgrade to ZCE Pro for unlimited quest access.',
                [
                    { text: 'Not now', style: 'cancel' },
                    { text: 'View Pro', onPress: () => router.push('/settings/subscription') },
                ]
            );
            return;
        }
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

        await completeQuest(selectedQuest.id, selectedQuest.xpReward, log, { photoUri: proofData.photoUri, voiceUri: proofData.voiceUri });
        setIsProofVisible(false);
        setSelectedQuest(null);
    };

    const handleReboot = async () => {
        const oldIds = QUESTS.map(q => q.id);
        await resetQuests(oldIds);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#000000']}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.34)' }]} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.heroProgressWrapper}>
                        <Text style={[
                            styles.heroNumber,
                            { 
                                textShadowColor: glowColor,
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 40,
                                color: '#FFFFFF'
                            }
                        ]}>{completedCount}</Text>
                        <Text style={[styles.heroUnit, { color: textSecondary }]}>OF {visibleQuests.length} QUESTS</Text>
                    </View>
                    <Text style={[styles.welcomeText, { color: textTertiary }]}>
                        Harvesting status. Stay in frame.
                    </Text>

                    <View style={styles.heroXPContainer}>
                        <View style={[styles.xpEarned, { borderColor: withAlpha(textSecondary, 0.35) }]}>
                            <Text style={[styles.xpEarnedText, { color: textSecondary }]}>+{totalXP} XP EXTRACTED TODAY</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.microOpsShell}>
                    <BlurView intensity={110} tint="dark" style={styles.microOpsBlur} pointerEvents="none" />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.97)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.microOpsRim}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.17)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.00)']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.microOpsSheen}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.00)', 'rgba(0,0,0,0.92)']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.microOpsContour}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.24)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.00)']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.microOpsTopEdge}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)']}
                        start={{ x: 0.05, y: 0 }}
                        end={{ x: 0.95, y: 1 }}
                        style={styles.microOpsSpecularArc}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.00)', 'rgba(255,255,255,0.08)']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.microOpsSideRefraction}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.00)', 'rgba(255,255,255,0.04)']}
                        start={{ x: 0, y: 0.15 }}
                        end={{ x: 1, y: 0.85 }}
                        style={styles.microOpsLiquidRefraction}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)', 'rgba(255,255,255,0.03)']}
                        start={{ x: 0.12, y: 0.05 }}
                        end={{ x: 0.88, y: 0.95 }}
                        style={styles.microOpsLiquidFlow}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.00)', 'rgba(255,255,255,0.06)']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.microOpsCurvatureBand}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0.00)', 'rgba(0,0,0,0.42)']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.microOpsSideVignette}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.00)', 'rgba(0,0,0,0.86)']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.microOpsBottomDepth}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.24)', 'rgba(255,255,255,0.00)']}
                        start={{ x: 0.12, y: 0 }}
                        end={{ x: 0.62, y: 0.95 }}
                        style={styles.microOpsDropletHighlightPrimary}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.00)']}
                        start={{ x: 0.3, y: 0 }}
                        end={{ x: 0.8, y: 1 }}
                        style={styles.microOpsDropletHighlightSecondary}
                        pointerEvents="none"
                    />
                    <View style={styles.microOpsInnerFrame} pointerEvents="none" />

                    <View style={styles.microOpsCard}>
                        <Text style={styles.microOpsLabel}>MICRO OPS</Text>
                        <Text style={styles.microOpsBody}>
                            These are your low-friction streak savers. They do not replace Standing Orders or Field Quests. They make sure you always have a first rep.
                        </Text>
                        <View style={styles.microOpsList}>
                            {featuredMicroOps.map((op) => {
                                const completed = completedTodayIds.includes(op.id);
                                const fluentName = resolveFluentEmojiName(op.icon);
                                return (
                                    <Pressable
                                        key={op.id}
                                        onPress={() => !completed && handleToggle({
                                            id: op.id,
                                            icon: op.icon,
                                            title: op.title,
                                            description: op.desc,
                                            xpReward: op.xp,
                                            category: op.category || 'social',
                                        })}
                                        style={[styles.microOpRow, completed && styles.microOpRowDone]}
                                    >
                                        {completed ? (
                                            <Text style={styles.microOpIcon}>✓</Text>
                                        ) : fluentName ? (
                                            <FluentEmoji name={fluentName} size={22} style={styles.microOpIconImage} />
                                        ) : (
                                            <Text style={styles.microOpIcon}>{op.icon}</Text>
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.microOpTitle}>{op.title}</Text>
                                            <Text style={styles.microOpDesc}>{op.desc}</Text>
                                        </View>
                                        <Text style={styles.microOpXp}>{completed ? 'DONE' : `+${op.xp}`}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {!isPremium && (
                    <View style={styles.freeLimitCard}>
                        <Text style={styles.freeLimitTitle}>FREE PLAN</Text>
                        <Text style={styles.freeLimitBody}>
                            {freeQuestsRemaining > 0
                                ? `${freeQuestsRemaining} of ${FREE_DAILY_QUEST_LIMIT} free quests remaining today.`
                                : `You hit ${FREE_DAILY_QUEST_LIMIT}/${FREE_DAILY_QUEST_LIMIT} free quests today.`}
                        </Text>
                        <GlassButton
                            label="UNLOCK UNLIMITED QUESTS"
                            onPress={() => router.push('/settings/subscription')}
                            size="sm"
                            tint="blue"
                            glow
                        />
                    </View>
                )}

                {isPremium && allDone && selectedCategory === 'all' && (
                    <View style={styles.rotateContainer}>
                        <Text style={styles.rotateText}>BATCH COMPLETE. ROTATE FOR NEW QUESTS.</Text>
                        <GlassButton
                            label="ROTATE QUEST POOL"
                            onPress={handleRotate}
                            size="md"
                            tint="blue"
                            glow
                            style={{ marginBottom: 20 }}
                        />
                    </View>
                )}

                {/* Category Filter Tabs */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContainer}
                    style={styles.categoryScroll}
                >
                    {CATEGORIES.map((cat) => (
                        <Pressable
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            style={[
                                styles.categoryTab,
                                selectedCategory === cat.id && {
                                    borderColor: cat.color,
                                    backgroundColor: cat.color + '15',
                                }
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat.id && { color: cat.color }
                            ]}>
                                {cat.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {isPremium && selectedCategory === 'all' && allDone && (
                    <GlassButton
                        label="REBOOT NEURAL BUFFER"
                        onPress={handleReboot}
                        size="md"
                        tint="blue"
                        glow
                        style={{ marginBottom: 20 }}
                    />
                )}

                        {visibleQuests.map((quest) => (
                    <QuestCard
                        key={quest.id}
                        icon={quest.icon}
                        title={quest.title}
                        description={quest.description}
                        xpReward={quest.xpReward}
                        completed={completedTodayIds.includes(quest.id)}
                        onToggle={() => handleToggle(quest)}
                        category={quest.category}
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
        letterSpacing: 4,
        marginTop: -10,
        fontWeight: '800',
    },
    welcomeText: {
        fontFamily: Fonts.body,
        fontSize: 16,
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
        color: Colors.textSecondary,
        letterSpacing: 2
    },
    icon: {
        fontSize: 24,
    },
    emojiFix: {
        fontFamily: Platform.select({
            ios: 'Apple Color Emoji',
            web: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
            default: undefined,
        }),
        fontWeight: 'normal',
        letterSpacing: 0,
    },
    rotateContainer: {
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    rotateText: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 2,
    },
    freeLimitCard: {
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 14,
        gap: 10,
        marginBottom: 8,
    },
    freeLimitTitle: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    freeLimitBody: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: 'rgba(255,255,255,0.88)',
        lineHeight: 18,
    },
    microOpsShell: {
        width: '100%',
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(3,4,7,0.72)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.82,
        shadowRadius: 54,
        elevation: 14,
        marginBottom: 6,
    },
    microOpsBlur: {
        ...StyleSheet.absoluteFillObject,
    },
    microOpsRim: {
        ...StyleSheet.absoluteFillObject,
    },
    microOpsSheen: {
        position: 'absolute',
        top: 0,
        left: 10,
        right: 10,
        height: 30,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    microOpsContour: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    microOpsTopEdge: {
        position: 'absolute',
        top: 0,
        left: 10,
        right: 10,
        height: 3,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    microOpsSpecularArc: {
        position: 'absolute',
        top: 4,
        left: '6%',
        right: '6%',
        height: 26,
        borderRadius: 999,
        opacity: 0.28,
    },
    microOpsSideRefraction: {
        position: 'absolute',
        top: 2,
        left: 0,
        right: 0,
        bottom: 2,
    },
    microOpsLiquidRefraction: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.46,
    },
    microOpsLiquidFlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.62,
    },
    microOpsCurvatureBand: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.58,
    },
    microOpsSideVignette: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    microOpsBottomDepth: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 108,
    },
    microOpsDropletHighlightPrimary: {
        position: 'absolute',
        top: 8,
        left: 18,
        width: '62%',
        height: 38,
        borderRadius: 999,
        opacity: 0.46,
    },
    microOpsDropletHighlightSecondary: {
        position: 'absolute',
        top: 18,
        right: 24,
        width: '34%',
        height: 24,
        borderRadius: 999,
        opacity: 0.32,
    },
    microOpsInnerFrame: {
        position: 'absolute',
        top: 2,
        left: 2,
        right: 2,
        bottom: 2,
        borderRadius: 38,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    microOpsCard: {
        width: '100%',
        padding: 18,
        backgroundColor: 'transparent',
    },
    microOpsLabel: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: 'rgba(244,247,255,0.78)',
        letterSpacing: 2.5,
        marginBottom: 8,
    },
    microOpsBody: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: 'rgba(224,230,245,0.76)',
        lineHeight: 19,
    },
    microOpsList: {
        gap: 10,
        marginTop: 14,
    },
    microOpRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 12,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    microOpRowDone: {
        opacity: 0.5,
    },
    microOpIcon: {
        fontSize: 18,
        width: 24,
        textAlign: 'center',
        color: '#B6B6B6',
        fontFamily: Platform.select({
            ios: 'Apple Color Emoji',
            web: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
            default: undefined,
        }),
        fontWeight: 'normal',
        letterSpacing: 0,
    },
    microOpIconImage: {
        width: 24,
        height: 24,
        alignSelf: 'center',
    },
    microOpTitle: {
        fontFamily: Fonts.heading,
        fontSize: 12,
        color: 'rgba(242,246,255,0.90)',
        marginBottom: 4,
        letterSpacing: 0.4,
    },
    microOpDesc: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: 'rgba(210,218,236,0.70)',
        lineHeight: 17,
    },
    microOpXp: {
        fontFamily: Fonts.monoBold,
        fontSize: 9,
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginTop: 2,
    },
    categoryContainer: {
        paddingHorizontal: Spacing.lg,
        gap: 10,
        paddingBottom: 10,
    },
    categoryScroll: {
        marginBottom: 20,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    categoryText: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
    },
});
