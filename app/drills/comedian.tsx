import { View, Text, StyleSheet, Pressable, Animated, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTimeColors } from '@/hooks/useTimeColors';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import DrillFeedbackPanel from '@/components/DrillFeedbackPanel';
import FluentEmoji from '@/components/FluentEmoji';
import { OBJECTS } from '@/constants/zane';
import { AIService } from '@/services/ai';
import { useUser } from '@/context/UserContext';

export default function ComedianDrill() {
    const { user, completeDrill, addDrillLog } = useUser();
    const { textColors } = useTimeColors();
    const [object, setObject] = useState("This App");
    const [response, setResponse] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const generate = () => {
        const safePool = Array.isArray(OBJECTS) && OBJECTS.length > 0 ? OBJECTS : ['This App'];
        const nonRepeatingPool = safePool.filter((item) => item && item !== object);
        const source = nonRepeatingPool.length > 0 ? nonRepeatingPool : safePool;
        setObject(source[Math.floor(Math.random() * source.length)] || 'This App');
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

                Give drill feedback only.
                Analyze the comedy logic, what landed, what missed, and why.
                Then provide stronger alternate versions in these exact styles:
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
                <Text style={[styles.title, { color: textColors.secondary }]}>TALK LIKE A COMEDIAN</Text>
                <View style={styles.headerSpacer} />
            </View>

            {!feedback && (
                <View style={{ paddingTop: 6 }}>
                    <Text style={styles.subjectInlineLabel}>SUBJECT</Text>
                    <Text style={styles.subjectInlineText}>{object || 'This App'}</Text>
                    <View style={{ width: '100%', marginTop: 10 }}>
                        <Pressable style={styles.randomizeBtn} onPress={generate}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
                                style={styles.randomizeBtnGradient}
                            >
                                <FluentEmoji name="gameDie" size={20} />
                                <Text style={styles.randomizeBtnText}>RANDOMIZE</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.instruction}>
                    Roast or compliment this subject like a pro.
                </Text>

                {feedback ? (
                    <GlassCard style={styles.card}>
                        <Text style={styles.label}>THE SUBJECT:</Text>
                        <Text style={styles.object}>{object || 'This App'}</Text>
                    </GlassCard>
                ) : null}

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
                        <GlassButton
                            label={isLoading ? 'ANALYZING...' : 'GET FEEDBACK'}
                            onPress={handleAnalyze}
                            size="md"
                            tint="dark"
                            glow={!isLoading && !!response}
                            disabled={isLoading || !response}
                            style={{ width: '100%' }}
                        />
                    </View>
                ) : (
                    <View style={styles.feedbackSection}>
                        <DrillFeedbackPanel feedback={feedback} maxHeight={420} />
                        <GlassButton
                            label="NEXT OBJECT"
                            onPress={generate}
                            size="md"
                            tint="dark"
                            glow
                            style={{ width: '100%' }}
                        />
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
    backText: { color: '#FFFFFF', fontFamily: Fonts.mono, fontSize: 12 },
    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, letterSpacing: 3, textAlign: 'center' },

    scrollContent: { paddingHorizontal: Spacing.lg, gap: 16, paddingBottom: 40 },
    instruction: { fontFamily: Fonts.headingSemi, fontSize: 16, color: '#FFFFFF', textAlign: 'center' },
    subjectInlineLabel: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, textAlign: 'center', marginBottom: 4 },
    subjectInlineText: { fontFamily: Fonts.headingSemi, fontSize: 26, color: '#FFFFFF', textAlign: 'center' },

    card: { padding: 24, alignItems: 'center', width: '100%' },
    label: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.accentPrimary, marginBottom: 10 },
    object: { fontFamily: Fonts.heading, fontSize: 28, color: Colors.textPrimary, textAlign: 'center' },
    randomizeBtn: {
        width: '100%',
        borderRadius: Radius.pill,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    randomizeBtnGradient: {
        width: '100%',
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    randomizeBtnText: {
        fontFamily: Fonts.monoBold,
        color: '#FFFFFF',
        fontSize: 13,
        letterSpacing: 2,
    },
    // Buttons use <GlassButton/> now (global liquid glass look)

    inputSection: { gap: 10 },
    inputLabel: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 2 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
        color: Colors.textPrimary, fontFamily: Fonts.headingSemi, fontSize: 16, minHeight: 80, textAlignVertical: 'top',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    // Buttons use <GlassButton/> now (global liquid glass look)

    feedbackSection: { gap: 16 },
    // Buttons use <GlassButton/> now (global liquid glass look)
});
