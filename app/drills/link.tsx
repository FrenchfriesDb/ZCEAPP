import { View, Text, StyleSheet, Pressable, Animated, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import { LINK_WORDS } from '@/constants/zane';
import { useUser } from '@/context/UserContext';
import { AIService } from '@/services/ai';

export default function LinkDrill() {
    const { completeDrill, addDrillLog } = useUser();
    const [word1, setWord1] = useState("Link");
    const [word2, setWord2] = useState("Game");
    const [active, setActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10.0);
    const [response, setResponse] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

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
        setActive(true);
        setIsFinished(false);
        setFeedback("");
        setResponse("");
        setTimeLeft(10.0);
        timerAnim.setValue(1);

        setWord1(LINK_WORDS[Math.floor(Math.random() * LINK_WORDS.length)]);
        setWord2(LINK_WORDS[Math.floor(Math.random() * LINK_WORDS.length)]);
    };

    const handleAnalyze = async () => {
        if (!response) return;
        setIsLoading(true);
        try {
            const promptText = `
                DRILL: The Link Game
                WORDS: ${word1} + ${word2}
                USER'S LINK: ${response}

                1. Provide a psychological logic breakdown of how creative and logical this link was.
                2. Provide alternate versions in these 6 specific styles:
                   - Magnetic
                   - Witty/Funny
                   - Teasing/Warm
                   - Flirty
                   - GenZ/Class Clown
                   - Bold/Direct
                Do NOT include a Brutal Truth section, Challenge section, or Quote section.
            `;
            const result = await AIService.generateResponse([{ role: 'user', content: promptText }], 'groq');
            setFeedback(result);
            await completeDrill(5);
            await addDrillLog('Link Game', 100, result);
        } catch (e) {
            setFeedback("Connection severed. Log it anyway.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
            style={styles.container}
        >
            <LinearGradient colors={['#000', '#111']} style={StyleSheet.absoluteFill} />

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
                            <Pressable onPress={shuffle} style={styles.btn}>
                                <Text style={styles.btnText}>START ROUND</Text>
                            </Pressable>
                        </View>
                    ) : active ? (
                        <>
                            <View style={styles.timerBarBg}>
                                <Animated.View style={[styles.timerBarFill, {
                                    width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                    backgroundColor: timeLeft < 3 ? '#FF4444' : '#FFD93D'
                                }]} />
                            </View>
                            <Text style={styles.timerText}>{timeLeft.toFixed(1)}s</Text>

                            <View style={styles.wordsContainer}>
                                <GlassCard style={styles.wordCard}>
                                    <Text style={styles.word}>{word1}</Text>
                                </GlassCard>
                                <Text style={styles.plus}>+</Text>
                                <GlassCard style={styles.wordCard}>
                                    <Text style={styles.word}>{word2}</Text>
                                </GlassCard>
                            </View>
                            <Pressable onPress={finish} style={[styles.btn, { marginTop: 20, backgroundColor: Colors.accentPrimary }]}>
                                <Text style={styles.btnText}>DONE</Text>
                            </Pressable>
                        </>
                    ) : (
                        <View style={styles.feedbackSection}>
                            <View style={styles.wordsHeader}>
                                <Text style={styles.wordSmall}>{word1}</Text>
                                <Text style={styles.plusSmall}>+</Text>
                                <Text style={styles.wordSmall}>{word2}</Text>
                            </View>

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
                                    <Pressable onPress={handleAnalyze} style={styles.submitBtn} disabled={isLoading || !response}>
                                        {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnTextDark}>ANALYZE LINK</Text>}
                                    </Pressable>
                                </View>
                            ) : (
                                <View style={styles.resultContainer}>
                                    <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackScrollContent}>
                                        <Text style={styles.feedbackText}>{feedback}</Text>
                                    </ScrollView>
                                    <Pressable onPress={shuffle} style={styles.btn}>
                                        <Text style={styles.btnText}>NEXT ROUND</Text>
                                    </Pressable>
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
    backText: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.mono, fontSize: 12 },
    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: '#fff', letterSpacing: 3, textAlign: 'center' },

    scrollContent: { flexGrow: 1 },
    content: { flex: 1, paddingHorizontal: Spacing.lg, gap: 16, paddingTop: 12 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 },
    intro: { color: '#ccc', fontFamily: Fonts.body, fontSize: 16, textAlign: 'center' },

    timerBarBg: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
    timerBarFill: { height: '100%' },
    timerText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 24, textAlign: 'center' },

    wordsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%' },
    wordCard: { width: '38%', aspectRatio: 1.2, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
    word: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff', textAlign: 'center' },
    plus: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.accentPrimary },

    btn: { backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30, width: '100%', alignItems: 'center' },
    btnText: { fontFamily: Fonts.heading, fontSize: 14, color: '#000', letterSpacing: 2 },

    feedbackSection: { width: '100%', gap: 16, flex: 1 },
    wordsHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    wordSmall: { fontFamily: Fonts.heading, fontSize: 16, color: 'rgba(255,255,255,0.6)' },
    plusSmall: { fontFamily: Fonts.heading, fontSize: 16, color: Colors.accentPrimary },

    logSection: { gap: 10 },
    label: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 2 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
        color: '#fff', fontFamily: Fonts.body, fontSize: 16, minHeight: 80, textAlignVertical: 'top',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    submitBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
    btnTextDark: { fontFamily: Fonts.heading, fontSize: 14, color: '#000', letterSpacing: 2 },

    resultContainer: { gap: 16, flex: 1 },
    feedbackScroll: {
        flex: 1,
        maxHeight: 350,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    feedbackScrollContent: { padding: 18 },
    feedbackText: { color: '#fff', fontFamily: Fonts.body, fontSize: 14, lineHeight: 22 },
});
