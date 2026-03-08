import { View, Text, StyleSheet, Pressable, TextInput, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import GlassCard from '@/components/GlassCard';
import { SPEED_PROMPTS } from '@/constants/zane';
import { useUser } from '@/context/UserContext';
import { AIService } from '@/services/ai';

export default function SpeedDrill() {
    const { completeDrill, addDrillLog } = useUser();
    const [active, setActive] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [timeLeft, setTimeLeft] = useState(11.0);
    const [response, setResponse] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const timerAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let interval: any = null;
        if (active && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => Math.max(0, prev - 0.1));
            }, 100);

            Animated.timing(timerAnim, {
                toValue: 0,
                duration: timeLeft * 1000,
                useNativeDriver: false
            }).start();

        } else if (active && timeLeft <= 0) { // Timeout
            finishDrill(false);
        }
        return () => {
            if (interval) clearInterval(interval);
            timerAnim.stopAnimation();
        };
    }, [active, timeLeft]);

    const generatePrompt = () => {
        const random = SPEED_PROMPTS[Math.floor(Math.random() * SPEED_PROMPTS.length)];
        setPrompt(random);
        setResponse("");
        setFeedback("");
        setTimeLeft(11.0);
        setActive(true);
        timerAnim.setValue(1);
    };

    const finishDrill = async (success: boolean) => {
        setActive(false);
        if (success && response) {
            setIsLoading(true);
            try {
                const analysisRequest = `
                    DRILL: Speed Response
                    PROMPT: ${prompt}
                    USER RESPONSE: ${response}

                    1. Provide a psychological logic breakdown of why the user's response was strong or weak (frame control, status).
                    2. Provide alternate versions in these 6 specific styles:
                       - Magnetic (High status, effortless)
                       - Witty/Funny (Sharp, clever)
                       - Teasing/Warm (Playful but safe)
                       - Flirty (Charismatic tension)
                       - GenZ/Class Clown (Chronically online, chaotic, funny)
                       - Bold/Direct (Pure honesty, no filter)
                    Do NOT include a Brutal Truth section, Challenge section, or Quote section.
                `;
                const aiFeedback = await AIService.generateResponse([
                    { role: 'user', content: analysisRequest }
                ], 'groq');

                setFeedback(aiFeedback);
                await completeDrill(8);
                await addDrillLog('Speed Response', 100, aiFeedback);
            } catch (e) {
                setFeedback("Connection severed. You took too long to think anyway.");
            } finally {
                setIsLoading(false);
            }
        } else {
            const msg = "FAILED. Frame collapse due to hesitation. Go again.";
            setFeedback(msg);
            await addDrillLog('Speed Response', 0, msg);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
            style={styles.container}
        >
            <LinearGradient colors={['#000000', '#1a0b2e']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
                    <Text style={styles.backText}>← EXIT</Text>
                </Pressable>
                <Text style={styles.title}>SPEED RESPONSE</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    {!active && !feedback && (
                        <View style={styles.centerBox}>
                            <Text style={styles.intro}>
                                React in 11 seconds. Don't think. Flow.
                            </Text>
                            <Pressable onPress={generatePrompt} style={styles.startBtn}>
                                <Text style={styles.btnText}>GENERATE PROMPT</Text>
                            </Pressable>
                        </View>
                    )}

                    {active && (
                        <View style={styles.activeContainer}>
                            <View style={styles.timerBarBg}>
                                <Animated.View style={[styles.timerBarFill, {
                                    width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                    backgroundColor: timeLeft < 2 ? '#FF4444' : '#44FF88'
                                }]} />
                            </View>
                            <Text style={styles.timerText}>{timeLeft.toFixed(1)}s</Text>

                            <GlassCard style={styles.promptCard}>
                                <Text style={styles.promptText}>{prompt}</Text>
                            </GlassCard>

                            <TextInput
                                style={styles.input}
                                placeholder="Type your response..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={response}
                                onChangeText={setResponse}
                                onSubmitEditing={() => finishDrill(true)}
                                autoFocus
                            />

                            <Pressable
                                onPress={() => finishDrill(true)}
                                style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
                                disabled={isLoading}
                            >
                                <Text style={styles.btnText}>{isLoading ? 'ANALYZING...' : 'SUBMIT RESPONSE'}</Text>
                            </Pressable>
                        </View>
                    )}

                    {feedback ? (
                        <View style={styles.feedbackContainer}>
                            <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackScrollContent}>
                                <Text style={styles.feedbackText}>{feedback}</Text>
                            </ScrollView>
                            <Pressable onPress={generatePrompt} style={[styles.startBtn, isLoading && { opacity: 0.4 }]} disabled={isLoading}>
                                <Text style={styles.btnText}>NEXT ROUND</Text>
                            </Pressable>
                        </View>
                    ) : null}
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
    content: { flex: 1, padding: Spacing.lg, paddingTop: 12 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
    intro: { color: '#ccc', fontFamily: Fonts.body, fontSize: 16, marginBottom: 20, textAlign: 'center' },

    startBtn: { backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
    btnText: { fontFamily: Fonts.heading, fontSize: 14, letterSpacing: 2 },

    activeContainer: { gap: 12, width: '100%' },
    timerBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%' },
    timerBarFill: { height: '100%' },
    timerText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 24, textAlign: 'center' },

    promptCard: { padding: 14, alignItems: 'center' },
    promptText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 16, textAlign: 'center', lineHeight: 24 },

    input: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
        color: '#fff', fontFamily: Fonts.body, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    submitBtn: { backgroundColor: Colors.accentPrimary, paddingVertical: 14, borderRadius: 30, alignItems: 'center' },

    feedbackContainer: { flex: 1, gap: 16 },
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
