import { View, Text, StyleSheet, Pressable, Animated, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import { OBJECTS } from '@/constants/zane';
import { AIService } from '@/services/ai';
import { useUser } from '@/context/UserContext';

export default function ComedianDrill() {
    const { user, completeDrill, addDrillLog } = useUser();
    const [object, setObject] = useState("This App");
    const [response, setResponse] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const generate = () => {
        setObject(OBJECTS[Math.floor(Math.random() * OBJECTS.length)]);
        setResponse("");
        setFeedback("");
    };

    const handleAnalyze = async () => {
        if (!response) return;
        setIsLoading(true);
        try {
            const promptText = `
                DRILL: Stand-Up Improv (Roast or Compliment)
                SUBJECT: ${object}
                USER'S LINE: ${response}

                1. Analyze the comedy logic. Why was it funny or why did it miss? Breakdown the status play and frame.
                2. Provide alternate versions in these 6 specific styles:
                   - Magnetic
                   - Witty/Funny
                   - Teasing/Warm
                   - Flirty
                   - GenZ/Class Clown
                   - Bold/Direct
                Do NOT include a Brutal Truth section, Challenge section, or Quote section.
            `;
            const result = await AIService.generateResponse([{ role: 'user', content: promptText }], 'groq', user?.name || 'AGENT', user?.level || 1, 'coach');
            setFeedback(result);
            await completeDrill(20);
            await addDrillLog('Stand-Up Drill', 100, result);
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
                <Text style={styles.title}>STAND-UP DRILL</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.instruction}>
                    Roast or compliment this subject like a pro.
                </Text>

                <GlassCard style={styles.card}>
                    <Text style={styles.label}>THE SUBJECT:</Text>
                    <Text style={styles.object}>{object}</Text>
                    <Pressable onPress={generate} style={styles.nextSubject}>
                        <Text style={styles.nextSubjectText}><Text style={{}}>🎲</Text> RANDOMIZE</Text>
                    </Pressable>
                </GlassCard>

                {!feedback ? (
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>YOUR PERFORMANCE:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Type your roast or compliment..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={response}
                            onChangeText={setResponse}
                            multiline
                        />
                        <Pressable onPress={handleAnalyze} style={styles.analyzeBtn} disabled={isLoading || !response}>
                            {isLoading ? <ActivityIndicator color={Colors.bgPrimary} /> : <Text style={styles.analyzeBtnText}>GET FEEDBACK</Text>}
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.feedbackSection}>
                        <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackScrollContent}>
                            <Text style={styles.feedbackText}>{feedback}</Text>
                        </ScrollView>
                        <Pressable onPress={generate} style={styles.btn}>
                            <Text style={styles.btnText}>NEXT OBJECT</Text>
                        </Pressable>
                    </View>
                )}

                <View style={{ height: 40 }} />
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
    backText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12 },
    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, letterSpacing: 3, textAlign: 'center' },

    scrollContent: { paddingHorizontal: Spacing.lg, gap: 16, paddingBottom: 40 },
    instruction: { fontFamily: Fonts.body, fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },

    card: { padding: 24, alignItems: 'center', width: '100%' },
    label: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.accentPrimary, marginBottom: 10 },
    object: { fontFamily: Fonts.heading, fontSize: 28, color: Colors.textPrimary, textAlign: 'center' },
    nextSubject: { marginTop: 12, padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
    nextSubjectText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },

    inputSection: { gap: 10 },
    inputLabel: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 2 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
        color: Colors.textPrimary, fontFamily: Fonts.body, fontSize: 16, minHeight: 80, textAlignVertical: 'top',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    analyzeBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
    analyzeBtnText: { fontFamily: Fonts.heading, fontSize: 14, color: Colors.bgPrimary, letterSpacing: 2 },

    feedbackSection: { gap: 16 },
    feedbackScroll: {
        maxHeight: 350,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    feedbackScrollContent: { padding: 18 },
    feedbackText: { color: Colors.textPrimary, fontFamily: Fonts.body, fontSize: 14, lineHeight: 22 },

    btn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    btnText: { fontFamily: Fonts.heading, fontSize: 14, color: '#fff', letterSpacing: 2 },
});
