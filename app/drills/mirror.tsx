import { View, Text, StyleSheet, Pressable, Animated, ScrollView, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { requireOptionalNativeModule } from 'expo-modules-core';
import * as ExpoAudio from 'expo-audio';
// Web platform check
const isWeb = Platform.OS === 'web';

type AudioBackend =
    | { kind: 'expo-audio'; mod: any };

// Use expo-audio only. Some dev builds do not include expo-av, and even optional
// imports can still trigger ExponentAV resolution errors at runtime.
let _cachedAudioBackend: AudioBackend | null | undefined;
const loadAudioBackend = async (): Promise<AudioBackend | null> => {
    if (isWeb) return null;
    if (_cachedAudioBackend !== undefined) return _cachedAudioBackend;

    const expoAudioNative = requireOptionalNativeModule<any>('ExpoAudio');
    if (expoAudioNative && typeof expoAudioNative.setAudioModeAsync === 'function') {
        if (typeof (ExpoAudio as any).AudioRecorder !== 'function' || !(ExpoAudio as any).RecordingPresets) {
            _cachedAudioBackend = null;
            return null;
        }
        _cachedAudioBackend = { kind: 'expo-audio', mod: ExpoAudio };
        return _cachedAudioBackend;
    }
    _cachedAudioBackend = null;
    return null;
};
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { useTimeColors } from '@/hooks/useTimeColors';

const isBrowserAudioSupported = () =>
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

const getWebRecorderMimeType = () => {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
        return '';
    }
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
};

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
    { emoji: '😏', label: 'SMIRK', desc: "One corner of mouth up. Eyes locked." },
    { emoji: '🧊', label: 'DEADPAN', desc: "Zero emotion. Flat voice. Intense stare." },
    { emoji: '🐢', label: 'SLOW MOTION', desc: "Double your pause time. Make them wait." },
    { emoji: '🤨', label: 'SKEPTICAL', desc: "One eyebrow raised. Lean back." },
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
    const webStreamRef = useRef<any>(null);
    const webChunksRef = useRef<any[]>([]);

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const playbackRef = useRef<any>(null);

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
            try {
                playbackRef.current?.pause?.();
                playbackRef.current?.unloadAsync?.();
                playbackRef.current?.remove?.();
            } catch { }
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync?.().catch(() => { });
                recordingRef.current.stop?.().catch(() => { });
            }
            if (webStreamRef.current) {
                webStreamRef.current.getTracks?.().forEach((track: any) => track.stop());
                webStreamRef.current = null;
            }
            if (voiceUri?.startsWith?.('blob:')) {
                URL.revokeObjectURL(voiceUri);
            }
        };
    }, [voiceUri]);

    // ── TAP TO TOGGLE RECORD / STOP ──
    const handleRecordToggle = async () => {
        if (isWeb) {
            if (!isBrowserAudioSupported()) {
                Alert.alert('Audio Not Available', 'This browser does not support microphone recording.');
                return;
            }

            if (isRecording) {
                setIsRecording(false);
                try {
                    recordingRef.current?.stop?.();
                } catch (err) {
                    console.error('[Mirror] Web stop error:', err);
                }
                return;
            }

            try {
                if (voiceUri?.startsWith?.('blob:')) {
                    URL.revokeObjectURL(voiceUri);
                }
                setVoiceUri(null);
                setIsPlaying(false);
                playbackRef.current?.pause?.();
                playbackRef.current = null;

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mimeType = getWebRecorderMimeType();
                const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

                webStreamRef.current = stream;
                webChunksRef.current = [];

                mediaRecorder.ondataavailable = (event: any) => {
                    if (event.data && event.data.size > 0) {
                        webChunksRef.current.push(event.data);
                    }
                };
                mediaRecorder.onstop = () => {
                    const blobType = mimeType || webChunksRef.current[0]?.type || 'audio/webm';
                    const blob = new Blob(webChunksRef.current, { type: blobType });
                    const uri = URL.createObjectURL(blob);
                    setVoiceUri(uri);
                    webChunksRef.current = [];
                    webStreamRef.current?.getTracks?.().forEach((track: any) => track.stop());
                    webStreamRef.current = null;
                    recordingRef.current = null;
                };

                mediaRecorder.start();
                recordingRef.current = mediaRecorder;
                setIsRecording(true);
                return;
            } catch (err: any) {
                console.error('[Mirror] Web start error:', err);
                Alert.alert('Mic Error', err?.message ?? 'Could not access your microphone in the browser.');
                return;
            }
        }

        const backend = await loadAudioBackend();
        if (!backend) {
            Alert.alert(
                'Audio Not Available',
                'This build does not include audio recording support. Rebuild your dev client after installing native audio modules.'
            );
            return;
        }

        if (isRecording) {
            // STOP recording
            setIsRecording(false);
            try {
                if (recordingRef.current && backend.kind === 'expo-audio') {
                    await recordingRef.current.stop();
                    const uri = recordingRef.current.uri ?? null;
                    setVoiceUri(uri || null);
                    recordingRef.current = null;
                }
                await backend.mod.setAudioModeAsync({
                    allowsRecording: false,
                    playsInSilentMode: true,
                });
            } catch (err) {
                console.error('[Mirror] Stop error:', err);
            }
        } else {
            // START recording — always clean up stale instance first
            setVoiceUri(null);
            setIsPlaying(false);
            try {
                playbackRef.current?.unloadAsync?.();
                playbackRef.current?.remove?.();
                playbackRef.current = null;
            } catch { }
            try {
                if (recordingRef.current) {
                    try { await recordingRef.current.stopAndUnloadAsync?.(); } catch { }
                    try { await recordingRef.current.stop?.(); } catch { }
                    recordingRef.current = null;
                }
                const { granted } = await backend.mod.requestRecordingPermissionsAsync();
                if (!granted) {
                    Alert.alert('Mic Permission Needed', 'Allow microphone access in Settings.');
                    return;
                }

                await backend.mod.setAudioModeAsync({
                    allowsRecording: true,
                    playsInSilentMode: true,
                });
                if (typeof backend.mod.AudioRecorder !== 'function' || !backend.mod.RecordingPresets?.HIGH_QUALITY) {
                    throw new Error('Audio recorder is not available in this build. Please rebuild the dev client with audio support.');
                }
                const rec = new backend.mod.AudioRecorder(backend.mod.RecordingPresets.HIGH_QUALITY);
                await rec.prepareToRecordAsync();
                rec.record();
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

        if (isWeb) {
            try {
                if (isPlaying && playbackRef.current) {
                    playbackRef.current.pause();
                    setIsPlaying(false);
                    return;
                }

                if (playbackRef.current) {
                    playbackRef.current.pause?.();
                    playbackRef.current = null;
                }

                const audio = new Audio(voiceUri);
                playbackRef.current = audio;
                audio.onended = () => {
                    setIsPlaying(false);
                    playbackRef.current = null;
                };
                await audio.play();
                setIsPlaying(true);
            } catch (err) {
                console.error('[Mirror] Web playback error:', err);
                Alert.alert('Playback Error', 'Could not play recording in this browser.');
            }
            return;
        }

        const backend = await loadAudioBackend();
        if (!backend) {
            Alert.alert('Audio Not Available', 'Playback is not available in this build.');
            return;
        }

        if (isPlaying && playbackRef.current) {
            await playbackRef.current.pauseAsync?.();
            playbackRef.current.pause?.();
            setIsPlaying(false);
            return;
        }

        try {
            if (playbackRef.current) {
                await playbackRef.current.unloadAsync?.();
                playbackRef.current.remove?.();
                playbackRef.current = null;
            }
            const player = backend.mod.createAudioPlayer(voiceUri);
            playbackRef.current = player;
            player.addListener('playbackStatusUpdate', (status: any) => {
                if (status?.didJustFinish || (status?.isLoaded && !status?.playing)) {
                    setIsPlaying(false);
                }
            });
            player.play();
            setIsPlaying(true);
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
        try {
            await playbackRef.current?.unloadAsync?.();
            playbackRef.current?.remove?.();
            playbackRef.current = null;
        } catch { }
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
        try {
            playbackRef.current?.unloadAsync?.();
            playbackRef.current?.remove?.();
            playbackRef.current = null;
        } catch { }
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
                            <Text style={styles.emojiText}>{FLAVORS[flavorIdx].emoji}</Text> {FLAVORS[flavorIdx].label}
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
        fontFamily: Platform.select({
            ios: 'Apple Color Emoji',
            web: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
            default: undefined,
        }),
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
