import { View, Text, StyleSheet, Pressable, TextInput, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { SPEED_PROMPTS } from '@/constants/zane';
import { useUser } from '@/context/UserContext';
import { AIService } from '@/services/ai';

export default function SpeedDrill() {
    const { user, completeDrill, addDrillLog } = useUser();
    const [active, setActive] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [timeLeft, setTimeLeft] = useState(11.0);
    const [response, setResponse] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const TOTAL_SECONDS = 11.0;

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
        if (isLoading) return; // Prevent race condition
        const random = SPEED_PROMPTS[Math.floor(Math.random() * SPEED_PROMPTS.length)];
        setPrompt(random);
        setResponse("");
        setFeedback("");
        setTimeLeft(TOTAL_SECONDS);
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

                    Give drill feedback only.
                    Explain what was strong or weak about the frame control, status, and speed.
                    Then rewrite the response in these exact styles:
                    - Magnetic
                    - CEO
                    - Class Clown
                    - Funny
                    - Witty
                    End with SCORE: X/10
                `;
                const aiFeedback = await AIService.generateResponse([
                    { role: 'user', content: analysisRequest }
                ], 'groq', user?.name || 'AGENT', user?.level || 1, 'drill');

                setFeedback(aiFeedback);
                await completeDrill(20);
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
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
            style={styles.container}
        >
            <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
                    <Text style={styles.backText}>← EXIT</Text>
                </Pressable>
                <Text style={styles.title}>SPEED RESPONSE</Text>
                <View style={styles.headerSpacer} />
            </View>

            {active && (
                <View style={{ paddingHorizontal: Spacing.lg, paddingTop: 6 }}>
                    <GlassCard style={styles.promptCard}>
                        <Text style={styles.promptText}>{prompt}</Text>
                    </GlassCard>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    {!active && !feedback && (
                        <View style={styles.centerBox}>
                            <Text style={styles.intro}>
                                React in 11 seconds. Don't think. Flow.
                            </Text>
                            <GlassButton
                                label="GENERATE PROMPT"
                                onPress={generatePrompt}
                                size="md"
                                tint="dark"
                                glow
                                style={{ width: '100%' }}
                            />
                        </View>
                    )}

                    {active && (
                        <View style={styles.activeContainer}>
                            <View style={styles.timerBarBg}>
                                <Animated.View style={[styles.timerBarFill, {
                                    width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                    backgroundColor:
                                        (timeLeft / TOTAL_SECONDS) > 0.66
                                            ? '#00FF64'
                                            : (timeLeft / TOTAL_SECONDS) > 0.33
                                                ? '#F89B29'
                                                : '#FF3B30'
                                }]} />
                            </View>
                            <Text style={styles.timerText}>{timeLeft.toFixed(1)}s</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Type your response..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={response}
                                onChangeText={setResponse}
                                onSubmitEditing={() => finishDrill(true)}
                                autoFocus
                            />

                            <GlassButton
                                label={isLoading ? 'ANALYZING...' : 'SUBMIT RESPONSE'}
                                onPress={() => finishDrill(true)}
                                size="md"
                                tint="blue"
                                glow={!isLoading}
                                disabled={isLoading}
                                style={{ width: '100%' }}
                            />
                        </View>
                    )}

                    {feedback ? (
                        <View style={styles.feedbackContainer}>
                            <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackScrollContent}>
                                <Text style={styles.feedbackText}>{feedback}</Text>
                            </ScrollView>
                            <GlassButton
                                label={isLoading ? 'ANALYZING...' : 'NEXT ROUND'}
                                onPress={generatePrompt}
                                size="md"
                                tint="dark"
                                glow={!isLoading}
                                disabled={isLoading}
                                style={{ width: '100%' }}
                            />
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
    backText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12 },
    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, letterSpacing: 3, textAlign: 'center' },

    scrollContent: { flexGrow: 1 },
    content: { flex: 1, padding: Spacing.lg, paddingTop: 12 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
    intro: { color: Colors.textSecondary, fontFamily: Fonts.body, fontSize: 16, marginBottom: 20, textAlign: 'center' },

    // Buttons use <GlassButton/> now (global liquid glass look)

    activeContainer: { gap: 12, width: '100%' },
    timerBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%' },
    timerBarFill: { height: '100%' },
    timerText: { color: Colors.textPrimary, fontFamily: Fonts.heading, fontSize: 24, textAlign: 'center' },

    promptCard: { padding: 14, alignItems: 'center' },
    promptText: { color: Colors.textPrimary, fontFamily: Fonts.heading, fontSize: 16, textAlign: 'center', lineHeight: 24 },

    input: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
        color: Colors.textPrimary, fontFamily: Fonts.body, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    // Buttons use <GlassButton/> now (global liquid glass look)

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
    feedbackText: { color: Colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, lineHeight: 22 },
});
