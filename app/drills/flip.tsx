import DrillFeedbackPanel from '@/components/DrillFeedbackPanel';
import FluentEmoji from '@/components/FluentEmoji';
import GlassButton from '@/components/GlassButton';
import GlassCard from '@/components/GlassCard';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { FLIP_PROMPTS } from '@/constants/zane';
import { useUser } from '@/context/UserContext';
import { AIService } from '@/services/ai';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function FlipDrill() {
    const { user, completeDrill, addDrillLog } = useUser();
    const [situation, setSituation] = useState('');
    const [response, setResponse] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleNextRep = () => {
        setResponse('');
        setAnalysis('');
        const random = FLIP_PROMPTS[Math.floor(Math.random() * FLIP_PROMPTS.length)];
        setSituation(random);
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
                            <FluentEmoji name="gameDie" size={24} />
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
                    <GlassCard style={styles.resultCard} darkGlass intensity={26}>
                        <Text style={styles.resultTitle}>Z.A.N.E. ANALYSIS</Text>
                        <DrillFeedbackPanel feedback={analysis} maxHeight={440} />
                        <GlassButton
                            label="NEXT REP"
                            onPress={handleNextRep}
                            size="md"
                            tint="dark"
                            glow
                            style={{ width: '100%', marginTop: 12 }}
                        />
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
    backText: { color: '#FFFFFF', fontFamily: Fonts.mono, fontSize: 12 },
    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, letterSpacing: 3, textAlign: 'center' },

    scrollContent: { padding: Spacing.lg, paddingBottom: 60, gap: 20 },
    instruction: { fontFamily: Fonts.nunito, fontSize: 14, color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
    inputGroup: { gap: 10 },
    label: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 1 },
    row: { flexDirection: 'row', gap: 10 },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14,
        color: Colors.textPrimary, fontFamily: Fonts.nunito, fontSize: 16, textAlignVertical: 'top',
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

    resultCard: {
        padding: 20,
        marginTop: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
    },
    resultTitle: { fontFamily: Fonts.heading, fontSize: 16, color: 'rgba(236,242,255,0.9)', marginBottom: 12 },
});
