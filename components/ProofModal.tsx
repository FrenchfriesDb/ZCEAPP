import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTextColors } from '@/context/TextColorsContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { requireOptionalNativeModule } from 'expo-modules-core';
import React, { useEffect, useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    Animated, Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import FluentEmoji from './FluentEmoji';
import GlassButton from './GlassButton';

// Web platform check
const isWeb = Platform.OS === 'web';
const webSans = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const proofBodyFont = isWeb ? webSans : Fonts.body;
const proofHeadingFont = isWeb ? webSans : Fonts.heading;
const proofMonoFont = isWeb ? webSans : Fonts.mono;
const proofMonoBoldFont = isWeb ? webSans : Fonts.monoBold;

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

// Use expo-audio only. Avoid touching expo-av in builds where ExponentAV is missing.
let _cachedAudio: any | null | undefined;
const loadAudio = async () => {
    if (Platform.OS === 'web') return null;
    if (_cachedAudio !== undefined) return _cachedAudio;
    try {
        _cachedAudio = requireOptionalNativeModule<any>('ExpoAudio');
    } catch {
        _cachedAudio = null;
    }
    return _cachedAudio;
};

const getExpoAudioRecorderClass = (audioMod: any) =>
    audioMod?.AudioRecorder ?? audioMod?.AudioModule?.AudioRecorder ?? null;

interface ProofModalProps {
    visible: boolean;
    onClose: () => void;
    onComplete: (proofData: { text?: string, photoUri?: string, voiceUri?: string }) => void;
    questTitle: string;
}

export default function ProofModal({ visible, onClose, onComplete, questTitle }: ProofModalProps) {
    const [textProof, setTextProof] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [voiceUri, setVoiceUri] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const sheetTranslateY = React.useRef(new Animated.Value(0)).current;
    const recordingRef = React.useRef<any>(null);
    const webStreamRef = React.useRef<any>(null);
    const webChunksRef = React.useRef<any[]>([]);
    const { textPrimary } = useTextColors();
    const { palette: timePalette } = useTimeColors();
    const systemColor = timePalette[timePalette.length - 1];
    const middleColor = timePalette[Math.floor(timePalette.length / 2)];
    const firstColor = timePalette[0];

    const closeWithSwipe = React.useCallback(() => {
        Animated.timing(sheetTranslateY, {
            toValue: 520,
            duration: 180,
            useNativeDriver: true,
        }).start(() => {
            sheetTranslateY.setValue(0);
            onClose();
        });
    }, [onClose, sheetTranslateY]);

    const panResponder = React.useMemo(
        () => PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => {
                const vertical = Math.abs(gesture.dy) > Math.abs(gesture.dx);
                return vertical && gesture.dy > 8;
            },
            onPanResponderMove: (_, gesture) => {
                if (gesture.dy > 0) {
                    sheetTranslateY.setValue(gesture.dy);
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > 120 || gesture.vy > 1) {
                    closeWithSwipe();
                    return;
                }
                Animated.spring(sheetTranslateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 12,
                }).start();
            },
            onPanResponderTerminate: () => {
                Animated.spring(sheetTranslateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 12,
                }).start();
            },
        }),
        [closeWithSwipe, sheetTranslateY]
    );

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [isRecording, pulseAnim]);

    useEffect(() => {
        if (!isRecording) {
            setRecordingSeconds(0);
            return;
        }
        const interval = setInterval(() => {
            setRecordingSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isRecording]);

    useEffect(() => {
        return () => {
            if (webStreamRef.current) {
                webStreamRef.current.getTracks?.().forEach((track: any) => track.stop());
                webStreamRef.current = null;
            }
            if (voiceUri?.startsWith?.('blob:')) {
                URL.revokeObjectURL(voiceUri);
            }
        };
    }, [voiceUri]);

    // ── IMAGE: show action sheet on iOS (camera / library), just library on Android/web ──
    const handlePickImage = async () => {
        const requestLibrary = async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Needed', 'Please enable photo library access in Settings.');
                return null;
            }
            return ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });
        };

        if (isWeb) {
            Alert.alert('Photo Proof', 'Camera is not available on web. Please choose from library.', [
                { text: 'Choose from Library', onPress: async () => { const r = await requestLibrary(); if (r && !r.canceled) setPhotoUri(r.assets[0].uri); } },
                { text: 'Cancel', style: 'cancel' },
            ]);
            return;
        }

        const requestCamera = async () => {
            try {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Needed', 'Please enable camera access in Settings.');
                    return null;
                }
                return await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    quality: 0.8,
                });
            } catch (err: any) {
                const message = String(err?.message || '');
                if (/camera not available on simulator/i.test(message)) {
                    Alert.alert('Camera Not Available', 'Camera is not available on simulator. Choose from library instead.');
                    return null;
                }
                Alert.alert('Camera Error', err?.message ?? 'Unable to access camera.');
                return null;
            }
        };

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    title: 'PHOTO PROOF',
                    options: ['Cancel', 'Take Photo', 'Choose from Library'],
                    cancelButtonIndex: 0,
                },
                async (index) => {
                    if (index === 0) return;
                    const result = await (index === 1 ? requestCamera() : requestLibrary());
                    if (result && !result.canceled) setPhotoUri(result.assets[0].uri);
                }
            );
        } else {
            Alert.alert('PHOTO PROOF', 'How do you want to add a photo?', [
                { text: 'Take Photo', onPress: async () => { const r = await requestCamera(); if (r && !r.canceled) setPhotoUri(r.assets[0].uri); } },
                { text: 'Choose from Library', onPress: async () => { const r = await requestLibrary(); if (r && !r.canceled) setPhotoUri(r.assets[0].uri); } },
                { text: 'Cancel', style: 'cancel' },
            ]);
        }
    };

    // ── MIC: tap to toggle record/stop ──
    const handleMicToggle = async () => {
        if (isWeb) {
            if (!isBrowserAudioSupported()) {
                Alert.alert('Not Available', 'This browser does not support microphone recording.');
                return;
            }

            if (isRecording) {
                setIsRecording(false);
                try {
                    recordingRef.current?.stop?.();
                } catch (err: any) {
                    console.error('Web recording stop error:', err);
                }
                return;
            }

            try {
                if (voiceUri?.startsWith?.('blob:')) {
                    URL.revokeObjectURL(voiceUri);
                }
                setVoiceUri(null);

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
            } catch (err: any) {
                console.error('Web recording start error:', err);
                Alert.alert('Recording Failed', err?.message ?? 'Unable to start microphone in this browser.');
            }
            return;
        }

        const Audio = await loadAudio();
        if (!Audio || typeof Audio.requestRecordingPermissionsAsync !== 'function') {
            console.error('[ProofModal] expo-audio support check failed', {
                hasAudio: !!Audio,
                keys: Audio ? Object.keys(Audio) : [],
            });
            Alert.alert(
                'Audio Not Available',
                'expo-audio did not load correctly in this build. Try reinstalling the simulator app and relaunching the dev build.'
            );
            return;
        }

        if (isRecording) {
            // — STOP —
            setIsRecording(false);
            try {
                if (recordingRef.current) {
                    if (typeof recordingRef.current.stop === 'function') {
                        await recordingRef.current.stop();
                    } else if (typeof recordingRef.current.stopAsync === 'function') {
                        await recordingRef.current.stopAsync();
                    }
                    const uri =
                        recordingRef.current?.uri ||
                        (typeof recordingRef.current?.getURI === 'function'
                            ? recordingRef.current.getURI()
                            : null);
                    setVoiceUri(uri || null);
                    recordingRef.current = null;
                }
            } catch (err: any) {
                console.error('Recording stop error:', err);
            }
        } else {
            // — START — always clean up any stale instance first
            try {
                if (recordingRef.current) {
                    try { await recordingRef.current.stop(); } catch { }
                    recordingRef.current = null;
                }

                const { granted } = await Audio.requestRecordingPermissionsAsync();
                if (!granted) {
                    Alert.alert('Mic Permission Needed', 'Allow microphone access in Settings.');
                    return;
                }

                await Audio.setAudioModeAsync({
                    allowsRecording: true,
                    playsInSilentMode: true,
                });
                const AudioRecorderClass = getExpoAudioRecorderClass(Audio);
                if (typeof AudioRecorderClass !== 'function') {
                    throw new Error('expo-audio recorder API is missing from this runtime.');
                }

                const ctorAttempts: Array<() => any> = [
                    () => new AudioRecorderClass(Audio?.RecordingPresets?.HIGH_QUALITY),
                    () => new AudioRecorderClass({}),
                    () => new AudioRecorderClass(),
                ];

                let rec: any = null;
                let ctorError: any = null;
                for (const attempt of ctorAttempts) {
                    try {
                        rec = attempt();
                        if (rec) break;
                    } catch (err) {
                        ctorError = err;
                    }
                }

                if (!rec) {
                    console.warn('[ProofModal] expo-audio recorder ctor failed in runtime', {
                        hasRecorderClass: typeof AudioRecorderClass === 'function',
                        hasHighQualityPreset: !!Audio?.RecordingPresets?.HIGH_QUALITY,
                        audioKeys: Audio ? Object.keys(Audio) : [],
                    });
                    throw (ctorError instanceof Error ? ctorError : new Error('Unable to initialize audio recorder in this runtime.'));
                }

                await rec.prepareToRecordAsync();
                if (typeof rec.record === 'function') {
                    rec.record();
                } else if (typeof rec.recordAsync === 'function') {
                    await rec.recordAsync();
                } else if (typeof rec.start === 'function') {
                    rec.start();
                } else {
                    throw new Error('Recorder started, but no supported record method exists in this runtime.');
                }
                recordingRef.current = rec;
                setIsRecording(true);
            } catch (err: any) {
                console.error('Recording start error:', err);
                Alert.alert('Recording Failed', err?.message ?? 'Unable to start microphone. Check app permissions.');
            }
        }
    };

    const handleSubmit = () => {
        if (!textProof && !voiceUri && !photoUri) {
            Alert.alert('PROOF REQUIRED', 'Submit at least one form of proof: text, photo, or voice.');
            return;
        }
        onComplete({ text: textProof || undefined, voiceUri: voiceUri || undefined, photoUri: photoUri || undefined });
        setTextProof('');
        setVoiceUri(null);
        setPhotoUri(null);
    };

    const handleRemovePhoto = () => {
        setPhotoUri(null);
    };

    const handleRemoveVoice = () => {
        if (voiceUri?.startsWith?.('blob:')) {
            URL.revokeObjectURL(voiceUri);
        }
        setVoiceUri(null);
        setIsRecording(false);
        setRecordingSeconds(0);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            >
                <BlurView intensity={26} style={StyleSheet.absoluteFill} tint="dark" />
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <Animated.View
                    style={styles.modal}
                >
                    <View style={styles.dragHandle} />
                    <Text style={styles.eyebrow}>VERIFICATION REQUIRED</Text>
                    <Text style={styles.title} numberOfLines={2}>{questTitle.toUpperCase()}</Text>

                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
                        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                        onScrollBeginDrag={Keyboard.dismiss}
                        alwaysBounceVertical={false}
                    >
                        {/* ── Text Proof ── */}
                        <Text style={styles.sectionLabel}>DESCRIBE THE INTERACTION</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="What happened? Who did you talk to? What was the outcome?"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                            blurOnSubmit
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                            value={textProof}
                            onChangeText={setTextProof}
                        />

                        {/* ── Media Row ── */}
                        <View style={styles.mediaRow}>
                            {/* Photo */}
                            <Pressable onPress={handlePickImage} style={[styles.mediaBtn, styles.photoBtn]}>
                                {photoUri ? (
                                    <>
                                        <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />
                                        <Pressable style={styles.removeChip} onPress={handleRemovePhoto}>
                                            <Text style={styles.removeChipText}>REMOVE</Text>
                                        </Pressable>
                                    </>
                                ) : (
                                    <View style={styles.mediaPlaceholder}>
                                        <FluentEmoji name="camera" size={30} style={styles.mediaEmojiImage} />
                                        <Text style={styles.mediaText}>PHOTO</Text>
                                        <Text style={styles.mediaHint}>Camera or Library</Text>
                                    </View>
                                )}
                            </Pressable>

                            {/* Voice — tap to toggle */}
                            <Pressable
                                onPress={handleMicToggle}
                                style={[styles.mediaBtn, styles.voiceBtn, isRecording && styles.mediaBtnActive]}
                            >
                                <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
                                    {isRecording ? (
                                        <View style={styles.recordingDot} />
                                    ) : (
                                        <FluentEmoji
                                            name={voiceUri ? 'studioMicrophone' : 'microphone'}
                                            size={30}
                                            style={styles.mediaEmojiImage}
                                        />
                                    )}
                                    <Text style={[styles.mediaText, isRecording && { color: Colors.accentCyan }]}>
                                        {isRecording ? 'TAP TO\nSTOP' : voiceUri ? 'RECORDED ✓' : 'TAP TO\nRECORD'}
                                    </Text>
                                    {isRecording && <Text style={styles.recordingCounter}>{recordingSeconds}s</Text>}
                                </Animated.View>
                            </Pressable>
                        </View>

                        {/* Status confirmations */}
                        {isRecording && <Text style={styles.statusMsg}>● Recording now. Tap the mic tile again to stop. {recordingSeconds}s captured.</Text>}
                        {voiceUri && !isRecording && <Text style={styles.statusMsg}>✅ Voice proof ready. Tap the mic tile again if you want a cleaner take.</Text>}
                        {photoUri && <Text style={styles.statusMsg}>✅ Photo proof attached.</Text>}
                        {voiceUri && !isRecording && (
                            <Pressable onPress={handleRemoveVoice} style={styles.removeVoiceBtn}>
                                <Text style={styles.removeVoiceText}>DELETE RECORDING</Text>
                            </Pressable>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>ABANDON</Text>
                        </Pressable>
                        <GlassButton 
                            label="VERIFY & COMPLETE" 
                            onPress={() => { Keyboard.dismiss(); handleSubmit(); }} 
                            look="verify"
                            tint="blue"
                            size="sm" 
                            glow
                            style={{ 
                                flex: 1,
                                minWidth: 0,
                                shadowColor: firstColor,
                            }}
                        />
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.62)', paddingHorizontal: 14 },
    modal: {
        width: '93%',
        maxWidth: 480,
        backgroundColor: '#0A0A0A',
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: Spacing.lg,
        paddingBottom: 16,
        maxHeight: '88%',
    },
    dragHandle: {
        width: 44,
        height: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.26)',
        alignSelf: 'center',
        marginBottom: 10,
    },
    eyebrow: { fontFamily: proofMonoFont, fontSize: 10, color: Colors.accentCyan, letterSpacing: 3, marginBottom: 6, textAlign: 'center' },
    title: { fontFamily: proofHeadingFont, fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 20, letterSpacing: 1, lineHeight: 24 },

    content: { maxHeight: '68%', marginBottom: 10 },
    contentContainer: { paddingBottom: 16 },
    sectionLabel: { fontFamily: proofMonoBoldFont, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 10 },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: Radius.md,
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 14,
        color: '#fff',
        fontFamily: proofBodyFont,
        fontSize: 14,
        lineHeight: 20,
        minHeight: 92,
        textAlignVertical: 'top',
        marginBottom: 10,
    },

    mediaRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    mediaBtn: {
        flex: 1,
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    photoBtn: {
        flex: 1,
    },
    voiceBtn: {
        flex: 1,
    },
    mediaBtnActive: {
        borderColor: Colors.accentCyan,
        backgroundColor: 'rgba(0, 245, 255, 0.08)',
    },
    mediaPlaceholder: { alignItems: 'center', gap: 4 },
    mediaEmoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    mediaEmojiImage: {
        marginBottom: 4,
    },
    mediaText: {
        fontFamily: proofMonoBoldFont,
        fontSize: 9,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 1,
        textAlign: 'center',
        marginTop: 2,
    },
    mediaHint: {
        fontFamily: proofMonoFont,
        fontSize: 8,
        color: 'rgba(255,255,255,0.2)',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    mediaBtnDisabled: {
        opacity: 0.4,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.22)',
    },
    removeChip: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.72)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    removeChipText: {
        fontFamily: proofMonoBoldFont,
        fontSize: 9,
        color: '#fff',
        letterSpacing: 1,
    },
    statusMsg: { fontFamily: proofMonoFont, fontSize: 10, color: Colors.accentCyan, marginTop: 4, letterSpacing: 1 },
    removeVoiceBtn: {
        marginTop: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    removeVoiceText: {
        fontFamily: proofMonoBoldFont,
        fontSize: 9,
        color: 'rgba(255,255,255,0.76)',
        letterSpacing: 1,
    },
    recordingCounter: {
        fontFamily: proofMonoBoldFont,
        fontSize: 10,
        color: Colors.accentCyan,
        letterSpacing: 1.2,
        marginTop: 6,
    },
    recordingDot: {
        width: 16,
        height: 16,
        borderRadius: 999,
        backgroundColor: '#FF3B30',
        marginBottom: 10,
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 5,
    },

    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    cancelBtn: { padding: 12 },
    cancelText: { fontFamily: proofMonoBoldFont, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },
});
