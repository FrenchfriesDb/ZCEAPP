import DrillFeedbackPanel from '@/components/DrillFeedbackPanel';
import GlassButton from '@/components/GlassButton';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { AIService } from '@/services/ai';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const PROMPTS = [
    // Boring / everyday (forces detail + specificity)
    "Tell a story about waiting in a long checkout line, but make it gripping.",
    "Tell a story about doing laundry that somehow reveals your personality.",
    "Tell a story about forgetting your charger and turning it into drama.",
    "Tell a story about a normal grocery run that got weird for one tiny reason.",
    "Tell a story about a boring school/work meeting, but make the tension feel real.",
    "Tell a story about missing a bus by ten seconds and what happened next.",
    "Tell a story about standing in an elevator with strangers and one awkward moment.",
    "Tell a story about losing your keys in your own house and escalating the panic.",

    // Creative / social / specific
    "Tell a story that starts with you losing a valuable possession.",
    "Tell a story about the last time you felt truly embarrassed, but end it with a laugh.",
    "Tell a story where you won because of something you were told was a weakness.",
    "Tell a story about the first time you stayed up past 4 AM for something that wasn't school.",
    "Tell a story about a character who thinks they're the Main Character and what happens to them.",
    "Describe a time you took charge of a situation (even just choosing where to eat). How did it feel to have the 'control' of the conversation in your hands?",
    "Tell a story where one tiny lie forced you to improvise five times in a row.",
    "Tell a story about reading a room wrong, then recovering your status in one sentence.",
    "Tell a story where your first impression failed, but your second line saved everything.",

    // Insane / absurd escalation
    "Tell a story where your alarm clock starts giving life advice at 4:59 AM.",
    "Tell a story about finding a hidden rulebook for your city under your bed.",
    "Tell a story where pigeons begin tracking your daily routine like spies.",
    "Tell a story where your mirror predicts social disasters 10 minutes early.",
    "Tell a story where your phone autocorrect starts exposing your inner villain arc.",
    "Tell a story where your class/work group chat becomes a secret kingdom overnight.",
    "Tell a story where a vending machine starts negotiating with you like a CEO.",
    "Tell a story where you accidentally become the leader of a very unqualified cult.",
    "Tell a story where every lie you hear appears as subtitles above people's heads.",
    "Tell a story where a turtle gives you one challenge that changes your confidence."
];

export default function StoryDrill() {
    const { user, completeDrill, addDrillLog } = useUser();
    const [active, setActive] = useState(false);
    const pickPrompt = (current?: string) => {
        const safePool = Array.isArray(PROMPTS) && PROMPTS.length > 0
            ? PROMPTS
            : ["Tell a story about missing a bus by ten seconds and what happened next."];
        const pool = current ? safePool.filter((p) => p !== current) : safePool;
        const source = pool.length > 0 ? pool : safePool;
        return source[Math.floor(Math.random() * source.length)] || safePool[0];
    };
    const [prompt, setPrompt] = useState(() => pickPrompt());
    const [timeLeft, setTimeLeft] = useState(35);
    const [response, setResponse] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const safePrompt = (prompt && prompt.trim()) || "Tell a story about missing a bus by ten seconds and what happened next.";
    const timerRatio = Math.max(0, Math.min(1, timeLeft / 35));
    const timerColor = timerRatio > 0.66 ? '#00FF64' : timerRatio > 0.33 ? '#F89B29' : '#FF3B30';

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
        setPrompt((prev) => pickPrompt(prev));
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
                PROMPT: ${safePrompt}
                USER'S STORY SUMMARY: ${response}

                Give drill feedback only.
                Tell them what they did well, what missed, why the hook/tension worked or failed,
                then provide better alternate versions in these exact styles:
                - Magnetic
                - CEO
                - Class Clown
                - Funny
                - Witty
                End with SCORE: X/10
            `;
            const result = await AIService.generateResponse([{ role: 'user', content: promptText }], 'groq', user?.name || 'AGENT', user?.level || 1, 'drill');
            setFeedback(result);
            await completeDrill(20);
            await addDrillLog('Storytelling', 100, result);
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
                        <Text style={styles.intro}>35 seconds to weave a web. Press start when ready.</Text>
                        <GlassButton
                            label="START IMPROV"
                            onPress={start}
                            size="md"
                            tint="dark"
                            glow
                            style={{ width: '100%' }}
                        />
                    </View>
                ) : active ? (
                    <View style={styles.activeContainer}>
                        <Text style={[styles.timer, { color: timerColor }]}>{timeLeft}s</Text>
                        <Text style={styles.prompt}>{safePrompt}</Text>
                        <View style={styles.barBg}>
                            <Animated.View style={[styles.barFill, { backgroundColor: timerColor, width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                        </View>
                        <GlassButton
                            label="DONE"
                            onPress={finish}
                            size="md"
                            tint="blue"
                            glow
                            style={{ width: '100%', marginTop: 24 }}
                        />
                    </View>
                ) : (
                    <View style={styles.feedbackSection}>
                        {!feedback ? (
                            <View style={styles.logSection}>
                                <Text style={styles.label}>PROMPT</Text>
                                <Text style={styles.logPrompt}>{safePrompt}</Text>
                                <Text style={styles.label}>WHAT DID YOU DESCRIBE?</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Summarize your story..."
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={response}
                                    onChangeText={setResponse}
                                    multiline
                                />
                                <GlassButton
                                    label={isLoading ? 'ANALYZING...' : 'ANALYZE STORY'}
                                    onPress={handleAnalyze}
                                    size="md"
                                    tint="dark"
                                    glow={!isLoading && !!response}
                                    disabled={isLoading || !response}
                                    style={{ width: '100%' }}
                                />
                            </View>
                        ) : (
                            <View style={styles.resultContainer}>
                                <DrillFeedbackPanel feedback={feedback} maxHeight={420} />
                                <GlassButton
                                    label="NEXT REP"
                                    onPress={start}
                                    size="md"
                                    tint="dark"
                                    glow
                                    style={{ width: '100%' }}
                                />
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
    backText: { color: '#FFFFFF', fontFamily: Fonts.mono, fontSize: 12 },
    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, letterSpacing: 3, textAlign: 'center' },

    scrollContent: { flexGrow: 1, padding: Spacing.lg, paddingBottom: 40 },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, width: '100%', paddingHorizontal: 10 },
    prePrompt: { color: '#FFFFFF', fontFamily: Fonts.headingSemi, fontSize: 19, lineHeight: 28, textAlign: 'center', marginBottom: 4 },
    intro: { color: '#FFFFFF', fontFamily: Fonts.headingMedium, fontSize: 16, marginBottom: 14, textAlign: 'center' },

    // Buttons use <GlassButton/> now (global liquid glass look)

    activeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, width: '100%' },
    timer: { fontFamily: Fonts.heading, fontSize: 48, color: Colors.textPrimary },
    prompt: { fontFamily: Fonts.heading, fontSize: 20, color: '#FFFFFF', textAlign: 'center', lineHeight: 28 },
    barBg: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
    barFill: { height: '100%', backgroundColor: Colors.accentPrimary, borderRadius: 4 },

    feedbackSection: { flex: 1, gap: 14 },

    logSection: { gap: 10 },
    logPrompt: {
        color: '#FFFFFF',
        fontFamily: Fonts.headingSemi,
        fontSize: 16,
        lineHeight: 23,
    },
    label: { fontFamily: Fonts.headingMedium, fontSize: 12, color: Colors.accentPrimary, letterSpacing: 1.2 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
        color: Colors.textPrimary, fontFamily: Fonts.headingMedium, fontSize: 16, minHeight: 80, textAlignVertical: 'top',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    // Buttons use <GlassButton/> now (global liquid glass look)

    resultContainer: { gap: 16 },
});
