import { View, Text, StyleSheet, Pressable, Animated, ScrollView, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { requireOptionalNativeModule } from 'expo-modules-core';
// Web platform check
const isWeb = Platform.OS === 'web';

// Lazy-load expo-av at runtime. Some builds (custom dev clients) may not include it.
let _cachedAudio: any | null | undefined;
const loadAudio = async () => {
    if (isWeb) return null;
    if (_cachedAudio !== undefined) return _cachedAudio;
    // Some custom dev clients expose an empty stub object for ExponentAV. Importing `expo-av`
    // in that case still throws `Cannot find native module 'ExponentAV'` (and can redbox).
    const exponentAV = requireOptionalNativeModule<any>('ExponentAV');
    if (!exponentAV || typeof exponentAV.setAudioMode !== 'function') {
        _cachedAudio = null;
        return null;
    }
    try {
        const mod = await import('expo-av');
        _cachedAudio = mod.Audio;
        return _cachedAudio;
    } catch (e) {
        _cachedAudio = null;
        return null;
    }
};
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { useTimeColors } from '@/hooks/useTimeColors';

const ZANE_LINES = [
    "I swear, you're 10% sass and 90% chaos.",
    "You've got main character energy — I like it.",
    "That was a joke, huh? Bold move. I respect it.",
    "Are you always this trouble, or is today a special occasion?",
    "I'd agree with you, but then we'd both be wrong.",
    "You talk like someone who knows exactly what they want. It's a rare look.",
    "I'm not ignoring you, I'm just prioritizing my peace. Big difference.",
    "You have a very intense way of being absolutely silent. I'm impressed.",
    "Is that your 'winning' smile, or are you just happy to be here?",
    "You don't just walk into a room; you announce it without saying a word.",
];

const FLAVORS = [
    { label: "😏 SMIRK", desc: "One corner of mouth up. Eyes locked." },
    { label: "🧊 DEADPAN", desc: "Zero emotion. Flat voice. Intense stare." },
    { label: "🐢 SLOW MOTION", desc: "Double your pause time. Make them wait." },
    { label: "🤨 SKEPTICAL", desc: "One eyebrow raised. Lean back." },
];

export default function MirrorDrill() {
    const { completeDrill } = useUser();
    const timePalette = useTimeColors();
    const systemColor = Colors.accentPrimary;
    const [lineIdx, setLineIdx] = useState(0);
    const [flavorIdx, setFlavorIdx] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [voiceUri, setVoiceUri] = useState<string | null>(null);
    const recordingRef = useRef<any>(null);

    // Playback state
    const [sound, setSound] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Text proof
    const [textResponse, setTextResponse] = useState('');

    // Permission
    const [permission, requestPermission] = useCameraPermissions();

    // Green glow pulse animation when recording
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
                    Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
                ])
            ).start();
        } else {
            glowAnim.stopAnimation();
            glowAnim.setValue(0);
        }
    }, [isRecording]);

    // Clean up sound on unmount
    useEffect(() => {
        return () => {
            sound?.unloadAsync();
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => { });
            }
        };
    }, []);

    // ── TAP TO TOGGLE RECORD / STOP ──
    const handleRecordToggle = async () => {
        const Audio = await loadAudio();
        if (!Audio) {
            Alert.alert(
                'Audio Not Available',
                'This build does not include the audio module. If you are using a custom dev client, rebuild it with expo-av enabled.'
            );
            return;
        }

        if (isRecording) {
            // STOP recording
            setIsRecording(false);
            try {
                if (recordingRef.current) {
                    await recordingRef.current.stopAndUnloadAsync();
                    const uri = recordingRef.current.getURI();
                    setVoiceUri(uri || null);
                    recordingRef.current = null;
                }
                // Switch audio mode back to playback
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                });
            } catch (err) {
                console.error('[Mirror] Stop error:', err);
            }
        } else {
            // START recording — always clean up stale instance first
            setVoiceUri(null);
            setIsPlaying(false);
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }
            try {
                if (recordingRef.current) {
                    try { await recordingRef.current.stopAndUnloadAsync(); } catch { }
                    recordingRef.current = null;
                }

                // request permissions if available
                if (typeof Audio.requestPermissionsAsync === 'function') {
                    const { status } = await Audio.requestPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Mic Permission Needed', 'Allow microphone access in Settings.');
                        return;
                    }
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                const { recording: rec } = await Audio.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                recordingRef.current = rec;
                setIsRecording(true);
            } catch (err: any) {
                console.error('[Mirror] Start error:', err);
                Alert.alert('Mic Error', err?.message ?? 'Could not start recording. Check permissions.');
            }
        }
    };

    // ── PLAY BACK the recording ──
    const handlePlayback = async () => {
        if (!voiceUri) return;

        const Audio = await loadAudio();
        if (!Audio) {
            Alert.alert('Audio Not Available', 'Playback is not available in this build.');
            return;
        }

        if (isPlaying && sound) {
            await sound.pauseAsync();
            setIsPlaying(false);
            return;
        }

        try {
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: voiceUri },
                { shouldPlay: true }
            );
            setSound(newSound);
            setIsPlaying(true);
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (err) {
            console.error('[Mirror] Playback error:', err);
            Alert.alert('Playback Error', 'Could not play recording.');
        }
    };

    const handleSubmit = async () => {
        if (!textResponse.trim() || !voiceUri) {
            Alert.alert('INTEGRITY CHECK', 'You must provide both a text response and a voice recording to verify this rep.');
            return;
        }
        if (sound) await sound.unloadAsync();
        await completeDrill(20);
        Alert.alert('REP VERIFIED', 'Operation logged. +20 XP awarded.', [
            { text: 'FINISH SESSION', onPress: () => router.replace('/') },
            { text: 'NEXT REP', onPress: nextDrill },
        ]);
    };

    const nextDrill = () => {
        setTextResponse('');
        setVoiceUri(null);
        setIsPlaying(false);
        sound?.unloadAsync();
        setSound(null);
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setLineIdx(prev => (prev + 1) % ZANE_LINES.length);
            setFlavorIdx(prev => (prev + 1) % FLAVORS.length);
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
    };

    if (!permission) return <View style={styles.container}><Text style={styles.cameraText}>Loading...</Text></View>;
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.cameraText}>We need your permission to show the camera feed</Text>
                <GlassButton
                    label="Grant Permission"
                    onPress={requestPermission}
                    size="md"
                    tint="dark"
                    glow
                    style={{ width: '100%', marginTop: 14, alignSelf: 'center' }}
                />
            </View>
        );
    }

    // Interpolate glow border color
    const glowBorderColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0, 201, 83, 0.3)', 'rgba(0, 255, 100, 1)'],
    });
    const glowShadowRadius = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [6, 22],
    });

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
                    <Text style={styles.backText}>← EXIT</Text>
                </Pressable>
                <Text style={styles.title}>MIRROR DRILL</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
            >

                {/* Camera ring — glows green when recording */}
                <Animated.View style={[
                    styles.cameraContainer,
                    {
                        borderColor: isRecording ? glowBorderColor : systemColor + '44',
                        shadowColor: isRecording ? '#00FF64' : systemColor,
                        shadowRadius: isRecording ? glowShadowRadius : 10,
                        shadowOpacity: isRecording ? 0.9 : 0.2,
                        borderWidth: isRecording ? 3 : 2,
                    }
                ]}>
                    <CameraView style={styles.camera} facing="front" />

                    {/* Recording indicator dot */}
                    {isRecording && (
                        <Animated.View style={[styles.recDot, { opacity: glowAnim }]} />
                    )}
                </Animated.View>

                {/* Recording status label */}
                {isRecording && (
                    <Text style={styles.recordingLabel}>● REC</Text>
                )}

                <GlassCard style={styles.promptCard}>
                    <Text style={styles.label}>SAY THIS LINE:</Text>
                    <Animated.Text style={[styles.lineText, { opacity: fadeAnim }]}>
                        "{ZANE_LINES[lineIdx]}"
                    </Animated.Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>THE VIBE:</Text>
                    <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                        <Text style={[styles.flavorTitle, { color: systemColor }]}>
                            <Text style={styles.emojiText}>{FLAVORS[flavorIdx].label.split(' ')[0]}</Text> {FLAVORS[flavorIdx].label.split(' ')[1]}
                        </Text>
                        <Text style={styles.flavorDesc}>{FLAVORS[flavorIdx].desc}</Text>
                    </Animated.View>
                </GlassCard>

                {/* Proof Section */}
                <View style={styles.proofSection}>
                    <Text style={styles.proofLabel}>VERIFICATION PROTOCOL</Text>

                    <TextInput
                        style={styles.textInput}
                        placeholder="Type your response or internal analysis..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={textResponse}
                        onChangeText={setTextResponse}
                        multiline
                    />

                    {/* Tap-to-toggle record button */}
                    <Pressable
                        onPress={handleRecordToggle}
                        style={({ pressed }) => [
                            styles.voiceBtn,
                            isRecording && styles.voiceBtnRecording,
                            pressed && { opacity: 0.75 },
                        ]}
                    >
                        <Text style={[styles.voiceBtnText, isRecording && { color: '#00FF64' }]}>
                            <Text style={styles.emojiText}>
                                {isRecording ? '⏹️' : (voiceUri ? '🔴' : '🎙️')}
                            </Text>{' '}
                            {isRecording ? 'TAP TO STOP' : (voiceUri ? 'RE-RECORD' : 'TAP TO RECORD')}
                        </Text>
                    </Pressable>

                    {/* Playback button — shown after recording is stopped */}
                    {voiceUri && !isRecording && (
                        <Pressable
                            onPress={handlePlayback}
                            style={[styles.voiceBtn, styles.playbackBtn]}
                        >
                            <Text style={[styles.voiceBtnText, { color: Colors.accentCyan }]}>
                                <Text style={styles.emojiText}>{isPlaying ? '⏸️' : '▶️'}</Text>{' '}
                                {isPlaying ? 'PAUSE PLAYBACK' : 'HEAR YOURSELF BACK'}
                            </Text>
                        </Pressable>
                    )}
                </View>

                <GlassButton
                    label="SUBMIT REP (+20 XP)"
                    onPress={handleSubmit}
                    tint={(textResponse.trim() && voiceUri) ? "blue" : "dark"}
                    size="lg"
                    style={{ width: '100%', marginTop: 10 }}
                    glow={!!(textResponse.trim() && voiceUri)}
                />

                <View style={{ height: 60 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: 44,
        marginBottom: 4,
    },
    backBtn: { padding: 8, minWidth: 60 },
    backText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1 },
    title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, letterSpacing: 3, textAlign: 'center' },

    scrollContent: { padding: Spacing.md, alignItems: 'center', gap: 6, paddingBottom: 10 },

    cameraContainer: {
        width: 200, height: 200, borderRadius: 100,
        overflow: 'hidden',
        backgroundColor: '#111',
        marginBottom: 2,
        shadowOffset: { width: 0, height: 0 },
    } as any,
    camera: { flex: 1 },

    // Red recording dot overlaid on top-right of camera circle
    recDot: {
        position: 'absolute',
        top: 14,
        right: 16,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF3B30',
        shadowColor: '#FF3B30',
        shadowRadius: 6,
        shadowOpacity: 1,
        shadowOffset: { width: 0, height: 0 },
    },

    recordingLabel: {
        fontFamily: Fonts.monoBold,
        fontSize: 11,
        color: '#00FF64',
        letterSpacing: 3,
        marginBottom: 4,
    },

    promptCard: { width: '100%', padding: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
    label: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6 },
    lineText: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.textPrimary, textAlign: 'center', lineHeight: 24 },
    divider: { width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
    flavorTitle: { fontFamily: Fonts.heading, fontSize: 18, marginBottom: 0 },
    emojiText: {
        fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
        fontWeight: 'normal',
        letterSpacing: 0,
    },
    flavorDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

    proofSection: { width: '100%', gap: 6, marginTop: 2 },
    proofLabel: { fontFamily: Fonts.monoBold, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 4 },
    textInput: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: Radius.md,
        padding: 10,
        color: Colors.textPrimary,
        fontFamily: Fonts.body,
        fontSize: 13,
        minHeight: 50,
        textAlignVertical: 'top',
    },
    voiceBtn: {
        width: '100%',
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceBtnRecording: {
        borderColor: '#00FF64',
        backgroundColor: 'rgba(0, 255, 100, 0.07)',
    },
    playbackBtn: {
        borderColor: Colors.accentCyan + '55',
        backgroundColor: 'rgba(0, 245, 255, 0.05)',
    },
    voiceBtnText: { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.textPrimary, letterSpacing: 1 },

    btn: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 20 },
    // Buttons use <GlassButton/> now (global liquid glass look)
    cameraText: { color: '#fff', textAlign: 'center', padding: 40 },
});
