import { View, Text, StyleSheet, Pressable, Animated, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import DrillFeedbackPanel from '@/components/DrillFeedbackPanel';
import { LINK_WORDS } from '@/constants/zane';
import { useUser } from '@/context/UserContext';
import { AIService } from '@/services/ai';

export default function LinkDrill() {
    const { user, completeDrill, addDrillLog } = useUser();
    const [word1, setWord1] = useState("Link");
    const [word2, setWord2] = useState("Game");
    const [active, setActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10.0);
    const [response, setResponse] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const timerRatio = Math.max(0, Math.min(1, timeLeft / 10));
    const timerColor = timerRatio > 0.66 ? '#00FF64' : timerRatio > 0.33 ? '#F89B29' : '#FF3B30';

    const timerAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let interval: any;
        if (active && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => Math.max(0, prev - 0.1));
            }, 100);
            Animated.timing(timerAnim, { toValue: 0, duration: timeLeft * 1000, useNativeDriver: false }).start();
        } else if (active && timeLeft <= 0) {
            finish();
        }
        return () => {
            clearInterval(interval);
            timerAnim.stopAnimation();
        };
    }, [active, timeLeft]);

    const finish = () => {
        setActive(false);
        setIsFinished(true);
        timerAnim.stopAnimation();
    };

    const shuffle = async () => {
        if (isLoading) return; // Prevent race condition
        setActive(true);
        setIsFinished(false);
        setFeedback("");
        setResponse("");
        setTimeLeft(10.0);
        timerAnim.setValue(1);

        const safePool = Array.isArray(LINK_WORDS) && LINK_WORDS.length > 0 ? LINK_WORDS : ['Link', 'Game'];
        const first = safePool[Math.floor(Math.random() * safePool.length)] || 'Link';
        const secondPool = safePool.filter((w) => w !== first);
        const secondSource = secondPool.length > 0 ? secondPool : safePool;
        const second = secondSource[Math.floor(Math.random() * secondSource.length)] || 'Game';
        setWord1(first);
        setWord2(second);
    };

    const handleAnalyze = async () => {
        if (!response) return;
        setIsLoading(true);
        try {
            const promptText = `
                DRILL: The Link Game
                WORDS: ${word1} + ${word2}
                USER'S LINK: ${response}

                Give drill feedback only.
                Analyze how creative, sharp, and socially interesting this link was.
                Then provide stronger alternate versions in these exact styles:
                - Magnetic
                - CEO
                - Class Clown
                - Funny
                - Witty
                End with SCORE: X/10
            `;
            const result = await AIService.generateResponse([{ role: 'user', content: promptText }], 'groq', user?.name || 'AGENT', user?.level || 1, 'drill', { drillPlan: ((user as any)?.subscriptionTier === 'director' ? 'pro' : 'basic') });
            setFeedback(result);
            await completeDrill(20);
            await addDrillLog('Link Game', 100, result);
        } catch (e) {
            setFeedback("Connection severed. Log it anyway.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
            style={styles.container}
        >
            <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
                    <Text style={styles.backText}>← EXIT</Text>
                </Pressable>
                <Text style={styles.title}>THE LINK GAME</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    {!active && !isFinished && !feedback ? (
                        <View style={styles.centerBox}>
                            <Text style={styles.intro}>Find the connection in 10s. Don't let the frame slip.</Text>
                            <GlassButton
                                label="RANDOMIZE + START"
                                onPress={shuffle}
                                size="md"
                                look="plain"
                                glow
                                style={{ width: '100%' }}
                            />
                        </View>
                    ) : active ? (
                        <>
                            <View style={styles.timerBarBg}>
                                <Animated.View style={[styles.timerBarFill, {
                                    width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                    backgroundColor: timerColor
                                }]} />
                            </View>
                            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft.toFixed(1)}s</Text>

                            <View style={styles.wordsContainer}>
                                <GlassCard style={styles.wordCard}>
                                    <Text style={styles.word}>{word1}</Text>
                                </GlassCard>
                                <Text style={styles.plus}>+</Text>
                                <GlassCard style={styles.wordCard}>
                                    <Text style={styles.word}>{word2}</Text>
                                </GlassCard>
                            </View>
                            <GlassButton
                                label="DONE"
                                onPress={finish}
                                size="md"
                                look="plain"
                                glow
                                style={{ width: '100%', marginTop: 20 }}
                            />
                        </>
                    ) : (
                        <View style={styles.feedbackSection}>
                            {!feedback ? (
                                <View style={styles.logSection}>
                                    <Text style={styles.label}>WHAT'S THE LINK?</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Explain the connection..."
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={response}
                                        onChangeText={setResponse}
                                        multiline
                                    />
                                    <GlassButton
                                        label={isLoading ? 'ANALYZING...' : 'ANALYZE LINK'}
                                        onPress={handleAnalyze}
                                        size="md"
                                        look="plain"
                                        glow={!isLoading && !!response}
                                        disabled={isLoading || !response}
                                        style={{ width: '100%' }}
                                    />
                                </View>
                            ) : (
                                <View style={styles.resultContainer}>
                                    <DrillFeedbackPanel feedback={feedback} maxHeight={420} />
                                    <GlassButton
                                        label={isLoading ? 'ANALYZING...' : 'NEXT ROUND'}
                                        onPress={shuffle}
                                        size="md"
                                        look="plain"
                                        glow={!isLoading}
                                        disabled={isLoading}
                                        style={{ width: '100%' }}
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
    backBtn: { width: 60 },
    headerSpacer: { width: 60 },
    backText: { color: '#FFFFFF', fontFamily: Fonts.mono, fontSize: 12 },
    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, letterSpacing: 3, textAlign: 'center' },

    scrollContent: { flexGrow: 1 },
    content: { flex: 1, paddingHorizontal: Spacing.lg, gap: 16, paddingTop: 12 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 },
    intro: { color: '#FFFFFF', fontFamily: Fonts.headingSemi, fontSize: 16, textAlign: 'center' },

    timerBarBg: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
    timerBarFill: { height: '100%' },
    timerText: { color: Colors.textPrimary, fontFamily: Fonts.heading, fontSize: 24, textAlign: 'center' },

    wordsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' },
    wordCard: { width: '38%', aspectRatio: 1.2, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
    word: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.textPrimary, textAlign: 'center' },
    plus: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.accentPrimary },

    // Buttons use <GlassButton/> now (global liquid glass look)

    feedbackSection: { width: '100%', gap: 16, flex: 1 },

    logSection: { gap: 10 },
    label: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 2 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
        color: Colors.textPrimary, fontFamily: Fonts.headingSemi, fontSize: 16, minHeight: 80, textAlignVertical: 'top',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    // Buttons use <GlassButton/> now (global liquid glass look)

    resultContainer: { gap: 16, flex: 1 },
});
