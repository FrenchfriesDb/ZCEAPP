import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import GlassCard from '@/components/GlassCard';
import { AIService } from '@/services/ai';

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
                { role: 'user', content: `Analyze this journal entry about a social interaction. Rewrite it how a high-status elite would handle it and give me a mission to improve: ${entry}` }
            ], 'groq', user?.name || 'AGENT', user?.level || 1, 'coach');

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
                    <Pressable onPress={handleSave} style={[styles.btn, isLoading && { opacity: 0.7 }]} disabled={isLoading}>
                        <Text style={styles.btnText}>{isLoading ? 'ANALYZING...' : 'SAVE LOG'}</Text>
                    </Pressable>
                ) : (
                    <GlassCard style={styles.analysisCard} glowColor={Colors.accentPrimary}>
                        <Text style={styles.analysisText}>{analysis}</Text>
                        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.doneBtn}>
                            <Text style={styles.doneBtnText}>ACKNOWLEDGED</Text>
                        </Pressable>
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
    backText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12 },
    title: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.textPrimary, letterSpacing: 4 },

    content: { padding: 24, paddingBottom: 100 },
    prompt: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textSecondary, marginBottom: 20, lineHeight: 22 },

    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16, padding: 20, fontSize: 16, fontFamily: Fonts.body, color: Colors.textPrimary,
        minHeight: 200, textAlignVertical: 'top', lineHeight: 24,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },

    btn: {
        marginTop: 20, height: 56, borderRadius: 28,
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center'
    },
    btnText: { fontFamily: Fonts.heading, fontSize: 14, color: Colors.bgPrimary, letterSpacing: 2 },

    analysisCard: { padding: 24, marginTop: 20 },
    analysisText: { color: Colors.textPrimary, fontFamily: Fonts.body, fontSize: 16, lineHeight: 24, marginBottom: 20 },
    doneBtn: { backgroundColor: Colors.accentPrimary, paddingVertical: 14, borderRadius: 28, alignItems: 'center' },
    doneBtnText: { color: Colors.bgPrimary, fontFamily: Fonts.heading, fontSize: 13, letterSpacing: 2 },
});
