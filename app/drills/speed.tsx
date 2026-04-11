import { View, Text, StyleSheet, Pressable, TextInput, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import DrillFeedbackPanel from '@/components/DrillFeedbackPanel';
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
    const safePrompt = (prompt && prompt.trim()) || 'Someone asks: "Why are you so quiet today?"';
    const timerRatio = Math.max(0, Math.min(1, timeLeft / TOTAL_SECONDS));
    const timerColor = timerRatio > 0.66 ? '#00FF64' : timerRatio > 0.33 ? '#F89B29' : '#FF3B30';

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
        const safePool = Array.isArray(SPEED_PROMPTS) && SPEED_PROMPTS.length > 0
            ? SPEED_PROMPTS
            : ['Someone asks: "Why are you so quiet today?"'];
        const random = safePool[Math.floor(Math.random() * safePool.length)] || safePool[0];
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

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    {!active && !feedback && (
                        <View style={styles.centerBox}>
                            <Text style={styles.intro}>
                                React in 11 seconds. Don&apos;t think. Flow.
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
                            <Text style={styles.promptText}>{safePrompt}</Text>
                            <View style={styles.timerBarBg}>
                                <Animated.View style={[styles.timerBarFill, {
                                    width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                    backgroundColor: timerColor
                                }]} />
                            </View>
                            <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft.toFixed(1)}s</Text>

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
                            <DrillFeedbackPanel feedback={feedback} maxHeight={420} />
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

                    {isLoading && (
                        <View style={styles.analyzingOverlay}>
                            <GlassCard darkGlass intensity={30} style={styles.analyzingCard}>
                                <Text style={styles.analyzingTitle}>ANALYZING RESPONSE...</Text>
                                <Text style={styles.analyzingBody}>
                                    Zane is processing your frame control, timing, and charisma signal.
                                </Text>
                            </GlassCard>
                        </View>
                    )}
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
    content: { flex: 1, padding: Spacing.lg, paddingTop: 12 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
    intro: { color: '#FFFFFF', fontFamily: Fonts.headingSemi, fontSize: 16, marginBottom: 20, textAlign: 'center' },

    // Buttons use <GlassButton/> now (global liquid glass look)

    activeContainer: { gap: 12, width: '100%' },
    timerBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%' },
    timerBarFill: { height: '100%' },
    timerText: { color: Colors.textPrimary, fontFamily: Fonts.heading, fontSize: 24, textAlign: 'center' },

    promptText: { color: '#FFFFFF', fontFamily: Fonts.heading, fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 2 },

    input: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
        color: Colors.textPrimary, fontFamily: Fonts.headingSemi, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    // Buttons use <GlassButton/> now (global liquid glass look)

    feedbackContainer: { flex: 1, gap: 16 },
    analyzingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    analyzingCard: {
        width: '100%',
        paddingVertical: 24,
        paddingHorizontal: 18,
        borderRadius: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    analyzingTitle: {
        color: '#FFFFFF',
        fontFamily: Fonts.headingSemi,
        fontSize: 16,
        letterSpacing: 1.4,
        textAlign: 'center',
        marginBottom: 8,
    },
    analyzingBody: {
        color: 'rgba(230,235,245,0.86)',
        fontFamily: Fonts.headingSemi,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
});
