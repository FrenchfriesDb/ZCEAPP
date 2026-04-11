import DrillFeedbackPanel from '@/components/DrillFeedbackPanel';
import GlassButton from '@/components/GlassButton';
import GlassCard from '@/components/GlassCard';
import { Colors, Fonts } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { AIService } from '@/services/ai';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function JournalDrill() {
    const { user, completeDrill, addJournalEntry } = useUser();
    const [entry, setEntry] = useState('');
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState('');

    const handleSave = async () => {
        if (!entry || isLoading) return;

        setIsLoading(true);
        try {
            const aiFeedback = await AIService.generateResponse([
                { role: 'user', content: `Analyze this journal entry about a social interaction. Give drill feedback only: what they did well, what they did wrong, why it worked or failed socially, then rewrite it in these exact styles: Magnetic, CEO, Class Clown, Funny, Witty. End with SCORE: X/10. Entry: ${entry}` }
            ], 'groq', user?.name || 'AGENT', user?.level || 1, 'drill', { drillPlan: ((user as any)?.subscriptionTier === 'director' ? 'pro' : 'basic') });

            await addJournalEntry(entry, aiFeedback);
            await completeDrill(20);
            setAnalysis(aiFeedback);
            setSaved(true);
        } catch (e) {
            setAnalysis("Neural link severed. Log it anyway and move.");
            await addJournalEntry(entry, "Error: Analysis failed.");
            await completeDrill(7);
            setSaved(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextRep = () => {
        setEntry('');
        setAnalysis('');
        setSaved(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />
            <View style={styles.overlay} />

            <View style={styles.header}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
                    <Text style={styles.backText}>← EXIT</Text>
                </Pressable>
                <Text style={styles.title}>ZANE JOURNAL</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.prompt}>
                    Log 3 interactions today. Rewrite how Zane would have handled them.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="1. Interaction: Cameo at coffee shop..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={entry}
                    onChangeText={setEntry}
                    multiline
                    autoFocus
                />

                {!saved ? (
                    <GlassButton
                        label={isLoading ? 'ANALYZING...' : 'SAVE LOG'}
                        onPress={handleSave}
                        size="md"
                        tint="dark"
                        glow={!isLoading && !!entry}
                        disabled={isLoading || !entry}
                        style={{ width: '100%', marginTop: 20 }}
                    />
                ) : (
                    <GlassCard style={styles.analysisCard} darkGlass intensity={26}>
                        <DrillFeedbackPanel feedback={analysis} maxHeight={460} />
                        <GlassButton
                            label="NEXT REP"
                            onPress={handleNextRep}
                            size="md"
                            tint="dark"
                            glow
                            style={{ width: '100%' }}
                        />
                        <GlassButton
                            label="ACKNOWLEDGED"
                            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                            size="md"
                            tint="dark"
                            glow
                            style={{ width: '100%' }}
                        />
                    </GlassCard>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingBottom: 20, position: 'relative' },
    backBtn: { position: 'absolute', left: 20, top: 60 },
    backText: { color: '#FFFFFF', fontFamily: Fonts.mono, fontSize: 12 },
    title: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.textPrimary, letterSpacing: 4 },

    content: { padding: 24, paddingBottom: 100 },
    prompt: { fontFamily: Fonts.headingSemi, fontSize: 15, color: '#FFFFFF', marginBottom: 20, lineHeight: 22 },

    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16, padding: 20, fontSize: 16, fontFamily: Fonts.headingSemi, color: Colors.textPrimary,
        minHeight: 200, textAlignVertical: 'top', lineHeight: 24,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },

    // Buttons use <GlassButton/> now (global liquid glass look)

    analysisCard: {
        padding: 24,
        marginTop: 20,
        backgroundColor: 'rgba(0,0,0,0.72)',
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
    },
    // Buttons use <GlassButton/> now (global liquid glass look)
});
