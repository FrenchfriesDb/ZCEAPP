import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { AIService } from '@/services/ai';
import { useUser } from '@/context/UserContext';
import { FLIP_PROMPTS } from '@/constants/zane';

export default function FlipDrill() {
    const { user, completeDrill, addDrillLog } = useUser();
    const [situation, setSituation] = useState('');
    const [response, setResponse] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResponseFocused, setIsResponseFocused] = useState(false);

    const generateSituation = () => {
        const random = FLIP_PROMPTS[Math.floor(Math.random() * FLIP_PROMPTS.length)];
        setSituation(random);
        setAnalysis("");
    };

    const handleAnalyze = async () => {
        if (!situation || !response) return;
        setLoading(true);
        setAnalysis('');

        const promptText = `
    I am ${user?.name || 'Agent'}.
    SITUATION: ${situation}
    MY RESPONSE: ${response}
    
    Give drill feedback only.
    Analyze my response using the FLIP FORMULA and explain what worked, what missed, and why.
    Then provide stronger alternate versions in these exact styles:
    - Magnetic
    - CEO
    - Class Clown
    - Funny
    - Witty
    End with SCORE: X/10
    `;

        try {
            const result = await AIService.generateResponse([
                { role: 'user', content: promptText }
            ], 'deepseek', user?.name || 'AGENT', user?.level || 1, 'drill');
            setAnalysis(result);
            await completeDrill(20);
            await addDrillLog('Flip Formula', 100, result);
        } catch (e) {
            setAnalysis("Connection severed. Rate your own wit today.");
        } finally {
            setLoading(false);
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
                <Text style={styles.title}>FLIP FORMULA</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Keep the prompt visible while typing your flip (ScrollView can jump to focused input). */}
            {(isResponseFocused || !!response) && (
                <View style={{ paddingHorizontal: Spacing.lg, paddingTop: 6 }}>
                    <GlassCard style={styles.pinnedPromptCard}>
                        <Text style={styles.pinnedPromptLabel}>SITUATION:</Text>
                        <Text style={styles.pinnedPromptText} numberOfLines={3}>
                            {situation || 'Tap 🎲 to generate a situation, or type your own.'}
                        </Text>
                    </GlassCard>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                <Text style={styles.instruction}>
                    Turn any social pressure into power.
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>1. THE SITUATION / INSULT</Text>
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, { flex: 1, minHeight: 80 }]}
                            placeholder="e.g., Why are you so quiet?"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={situation}
                            onChangeText={setSituation}
                            multiline
                        />
                        <Pressable onPress={generateSituation} style={styles.genBtn}>
                            <Text style={styles.genBtnText}>🎲</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>2. YOUR FLIP (RESPONSE)</Text>
                    <TextInput
                        style={[styles.input, { minHeight: 80 }]}
                        placeholder="How do you handle it?"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={response}
                        onChangeText={setResponse}
                        multiline
                        onFocus={() => setIsResponseFocused(true)}
                        onBlur={() => setIsResponseFocused(false)}
                    />
                </View>

                <GlassButton
                    label={loading ? 'ANALYZING...' : 'ANALYZE WITH AI'}
                    onPress={handleAnalyze}
                    size="md"
                    tint="dark"
                    glow={!loading && !!situation && !!response}
                    disabled={loading || !situation || !response}
                    style={{ width: '100%', marginTop: 10 }}
                />

                {analysis ? (
                    <GlassCard style={styles.resultCard} glowColor={Colors.accentPrimary}>
                        <Text style={styles.resultTitle}>Z.A.N.E. ANALYSIS</Text>
                        <Text style={styles.analysisText}>{analysis}</Text>
                    </GlassCard>
                ) : null}

                <View style={{ height: 40 }} />

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

    scrollContent: { padding: Spacing.lg, paddingBottom: 60, gap: 20 },
    instruction: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 10 },
    pinnedPromptCard: { paddingVertical: 10, paddingHorizontal: 12 },
    pinnedPromptLabel: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, marginBottom: 6 },
    pinnedPromptText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },

    inputGroup: { gap: 10 },
    label: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 1 },
    row: { flexDirection: 'row', gap: 10 },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14,
        color: Colors.textPrimary, fontFamily: Fonts.body, fontSize: 16, textAlignVertical: 'top',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    genBtn: { width: 50, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    genBtnText: {
        fontSize: 24,
        fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
        fontWeight: 'normal',
        letterSpacing: 0,
    },
    // Buttons use <GlassButton/> now (global liquid glass look)

    resultCard: { padding: 20, marginTop: 10 },
    resultTitle: { fontFamily: Fonts.heading, fontSize: 16, color: Colors.accentPrimary, marginBottom: 12 },
    analysisText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
});
