import { View, Text, StyleSheet, Pressable, Animated, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import GlassCard from '@/components/GlassCard';
import { AIService } from '@/services/ai';
import { useUser } from '@/context/UserContext';

const PROMPTS = [
    "Tell a story that starts with you losing a valuable possession.",
    "Tell a story about the last time you felt truly embarrassed, but end it with a laugh.",
    "Tell a story where you won because of something you were told was a weakness.",
    "Tell a story about the first time you stayed up past 4 AM for something that wasn't school.",
    "Tell a story about a character who thinks they're the Main Character and what happens to them.",
    "Describe a time you took charge of a situation (even just choosing where to eat). How did it feel to have the 'control' of the conversation in your hands?"
];

export default function StoryDrill() {
    const { completeDrill, addDrillLog } = useUser();
    const [active, setActive] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [timeLeft, setTimeLeft] = useState(35);
    const [response, setResponse] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const timerAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let interval: any;
        if (active && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            Animated.timing(timerAnim, { toValue: 0, duration: timeLeft * 1000, useNativeDriver: false }).start();
        } else if (active && timeLeft === 0) {
            finish();
        }
        return () => {
            clearInterval(interval);
            timerAnim.stopAnimation();
        };
    }, [active, timeLeft]);

    const start = () => {
        setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
        setTimeLeft(35);
        setResponse("");
        setFeedback("");
        setIsFinished(false);
        setActive(true);
        timerAnim.setValue(1);
    };

    const finish = () => {
        setActive(false);
        setIsFinished(true);
        timerAnim.stopAnimation();
    };

    const handleAnalyze = async () => {
        if (!response) return;
        setIsLoading(true);
        try {
            const promptText = `
                DRILL: Storytelling Improv
                PROMPT: ${prompt}
                USER'S STORY SUMMARY: ${response}

                1. Provide a psychological logic breakdown of the story's hook and tension.
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
            await completeDrill(8);
            await addDrillLog('Storytelling', 100, result);
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
            <LinearGradient colors={['#00E5FF', '#000']} style={StyleSheet.absoluteFill} />
            <View style={styles.overlay} />

            <View style={styles.header}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
                    <Text style={styles.backText}>← EXIT</Text>
                </Pressable>
                <Text style={styles.title}>STORYTELLING</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {!active && !isFinished && !feedback ? (
                    <View style={styles.centerBox}>
                        <Text style={styles.intro}>35 seconds to weave a web. Go.</Text>
                        <Pressable onPress={start} style={styles.btn}>
                            <Text style={styles.btnText}>START IMPROV</Text>
                        </Pressable>
                    </View>
                ) : active ? (
                    <View style={styles.activeContainer}>
                        <Text style={styles.timer}>{timeLeft}s</Text>
                        <Text style={styles.prompt}>{prompt}</Text>
                        <View style={styles.barBg}>
                            <Animated.View style={[styles.barFill, { width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                        </View>
                        <Pressable onPress={finish} style={[styles.btn, { marginTop: 40, backgroundColor: Colors.accentPrimary }]}>
                            <Text style={[styles.btnText, { color: '#000' }]}>DONE</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.feedbackSection}>
                        <GlassCard style={styles.promptCardSmall}>
                            <Text style={styles.promptSmall}>PROMPT: {prompt}</Text>
                        </GlassCard>

                        {!feedback ? (
                            <View style={styles.logSection}>
                                <Text style={styles.label}>WHAT DID YOU DESCRIBE?</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Summarize your story..."
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={response}
                                    onChangeText={setResponse}
                                    multiline
                                />
                                <Pressable onPress={handleAnalyze} style={styles.submitBtn} disabled={isLoading || !response}>
                                    {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnTextSmall}>ANALYZE STORY</Text>}
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.resultContainer}>
                                <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackScrollContent}>
                                    <Text style={styles.feedbackText}>{feedback}</Text>
                                </ScrollView>
                                <Pressable onPress={start} style={styles.btn}>
                                    <Text style={styles.btnText}>NEXT REP</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: Spacing.lg, paddingTop: 60 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },

    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    backBtn: { width: 60 },
    headerSpacer: { width: 60 },
    backText: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.mono, fontSize: 12 },
    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 18, color: '#fff', letterSpacing: 3, textAlign: 'center' },

    scrollContent: { flexGrow: 1, padding: Spacing.lg, paddingBottom: 40 },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    intro: { color: '#ccc', fontFamily: Fonts.body, fontSize: 16, marginBottom: 16, textAlign: 'center' },

    btn: { backgroundColor: '#fff', paddingHorizontal: 36, paddingVertical: 16, borderRadius: 30 },
    btnText: { fontFamily: Fonts.heading, fontSize: 14, color: '#000', letterSpacing: 2 },

    activeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, width: '100%' },
    timer: { fontFamily: Fonts.heading, fontSize: 48, color: '#fff' },
    prompt: { fontFamily: Fonts.heading, fontSize: 20, color: '#fff', textAlign: 'center', lineHeight: 28 },
    barBg: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
    barFill: { height: '100%', backgroundColor: '#00E5FF', borderRadius: 4 },

    feedbackSection: { flex: 1, gap: 14 },
    promptCardSmall: { padding: 12 },
    promptSmall: { color: 'rgba(255,255,255,0.6)', fontFamily: Fonts.body, fontSize: 14, fontStyle: 'italic' },

    logSection: { gap: 10 },
    label: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 2 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
        color: '#fff', fontFamily: Fonts.body, fontSize: 16, minHeight: 80, textAlignVertical: 'top',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    submitBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
    btnTextSmall: { fontFamily: Fonts.heading, fontSize: 13, color: '#000', letterSpacing: 2 },

    resultContainer: { gap: 16 },
    feedbackScroll: {
        maxHeight: 350,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    feedbackScrollContent: { padding: 18 },
    feedbackText: { color: '#fff', fontFamily: Fonts.body, fontSize: 14, lineHeight: 22 },
});
