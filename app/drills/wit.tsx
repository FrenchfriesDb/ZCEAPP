import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { AIService } from '@/services/ai';
import { useUser } from '@/context/UserContext';

export default function WitDrill() {
    const { user, completeDrill, addDrillLog } = useUser();
    const [line1, setLine1] = useState('');
    const [rewrite1, setRewrite1] = useState('');
    const [line2, setLine2] = useState('');
    const [rewrite2, setRewrite2] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleAnalyze = async () => {
        if (!rewrite1 || !rewrite2) return;
        setIsLoading(true);
        try {
            const promptText = `
                DRILL: Wit Mining (Comedy Rewrites)
                ORIGINAL 1: ${line1}
                REWRITE 1: ${rewrite1}
                ORIGINAL 2: ${line2}
                REWRITE 2: ${rewrite2}

                1. Analyze these rewrites. Did the user improve the wit? Explain the psychological logic of why it works or fails.
                2. Provide alternate versions for these lines in the 6 styles:
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
            setSubmitted(true);
            await completeDrill(20);
            await addDrillLog('Wit Mining', 100, result);
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
                <Text style={styles.title}>WIT MINING</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.instruction}>
                    Watch comedy/banter. Write 2 lines. Rewrite them in your style.
                </Text>

                <GlassCard style={styles.card}>
                    <Text style={styles.label}>LINE 1 (ORIGINAL)</Text>
                    <TextInput style={styles.input} placeholder="..." placeholderTextColor="rgba(255,255,255,0.3)" value={line1} onChangeText={setLine1} />

                    <View style={{ height: 10 }} />

                    <Text style={styles.label}>YOUR REWRITE</Text>
                    <TextInput style={styles.input} placeholder="..." placeholderTextColor="#999" value={rewrite1} onChangeText={setRewrite1} />
                </GlassCard>

                <GlassCard style={styles.card}>
                    <Text style={styles.label}>LINE 2 (ORIGINAL)</Text>
                    <TextInput style={styles.input} placeholder="..." placeholderTextColor="#999" value={line2} onChangeText={setLine2} />

                    <View style={{ height: 10 }} />

                    <Text style={styles.label}>YOUR REWRITE</Text>
                    <TextInput style={styles.input} placeholder="..." placeholderTextColor="#999" value={rewrite2} onChangeText={setRewrite2} />
                </GlassCard>

	                {!submitted ? (
	                    <GlassButton
	                        label={isLoading ? 'Analyzing...' : 'Complete Mining'}
	                        onPress={handleAnalyze}
	                        tint="blue"
	                        size="lg"
	                        glow
	                        disabled={isLoading || !rewrite1 || !rewrite2}
	                        style={{ width: '100%', marginTop: 6 }}
	                    />
	                ) : (
	                    <View style={styles.resultContainer}>
	                        <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackScrollContent}>
	                            <Text style={styles.feedbackText}>{feedback}</Text>
	                        </ScrollView>
	                        <GlassButton
	                            label="Acknowledged"
	                            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
	                            tint="blue"
	                            size="lg"
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
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },

    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { width: 60 },
    headerSpacer: { width: 60 },
    backText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12 },
	    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: '#FFFFFF', letterSpacing: 3, textAlign: 'center' },

    content: { paddingBottom: 40, gap: 14 },
	    instruction: { color: '#FFFFFF', fontFamily: Fonts.body, fontSize: 14, textAlign: 'center', marginBottom: 6 },

    card: { padding: 16 },
    label: { color: Colors.accentPrimary, fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1, marginBottom: 6 },
	    input: {
	        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12,
	        color: '#FFFFFF', fontFamily: Fonts.body, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
	    },

    btn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 30, alignItems: 'center', marginTop: 6 },
    btnText: { fontFamily: Fonts.heading, fontSize: 14, letterSpacing: 2, color: Colors.bgPrimary },

    resultContainer: { gap: 16 },
    feedbackScroll: {
        maxHeight: 350,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    feedbackScrollContent: { padding: 18 },
	    feedbackText: { color: '#FFFFFF', fontFamily: Fonts.body, fontSize: 14, lineHeight: 22 },
});
