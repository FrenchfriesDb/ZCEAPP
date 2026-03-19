import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput, Pressable,
    Animated, Image, Alert, ScrollView, Platform, ActionSheetIOS,
    KeyboardAvoidingView
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { useTimeColors } from '@/hooks/useTimeColors';
import { useTextColors } from '@/context/TextColorsContext';
import GlassButton from './GlassButton';
import { requireOptionalNativeModule } from 'expo-modules-core';

// Web platform check
const isWeb = Platform.OS === 'web';

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
    const expoAudio = requireOptionalNativeModule<any>('ExpoAudio');
    if (!expoAudio || typeof expoAudio.setAudioModeAsync !== 'function') {
        _cachedAudio = null;
        return null;
    }
    try {
        const mod = await import('expo-audio');
        _cachedAudio = mod;
        return _cachedAudio;
    } catch {
        _cachedAudio = null;
        return null;
    }
};

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
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const recordingRef = React.useRef<any>(null);
    const webStreamRef = React.useRef<any>(null);
    const webChunksRef = React.useRef<any[]>([]);
    const { textPrimary } = useTextColors();
    const { palette: timePalette } = useTimeColors();
    const systemColor = timePalette[timePalette.length - 1];
    const middleColor = timePalette[Math.floor(timePalette.length / 2)];
    const firstColor = timePalette[0];

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
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Needed', 'Please enable camera access in Settings.');
                return null;
            }
            return ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });
        };

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    title: 'PHOTO PROOF',
                    options: ['Cancel', '📷  Take Photo', '🖼️  Choose from Library'],
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
        if (!Audio) {
            Alert.alert(
                'Audio Not Available',
                'This build does not include the audio recorder. Rebuild the dev client with expo-audio enabled.'
            );
            return;
        }

        if (isRecording) {
            // — STOP —
            setIsRecording(false);
            try {
                if (recordingRef.current) {
                    await recordingRef.current.stop();
                    const uri = recordingRef.current.uri;
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
                const rec = new Audio.AudioRecorder(Audio.RecordingPresets.HIGH_QUALITY);
                await rec.prepareToRecordAsync();
                rec.record();
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

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            >
                <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />

                <View style={styles.modal}>
                    <Text style={styles.eyebrow}>VERIFICATION REQUIRED</Text>
                    <Text style={styles.title} numberOfLines={2}>{questTitle.toUpperCase()}</Text>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* ── Text Proof ── */}
                        <Text style={styles.sectionLabel}>DESCRIBE THE INTERACTION</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="What happened? Who did you talk to? What was the outcome?"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                            value={textProof}
                            onChangeText={setTextProof}
                        />

                        {/* ── Media Row ── */}
                        <View style={styles.mediaRow}>
                            {/* Photo */}
                            <Pressable onPress={handlePickImage} style={styles.mediaBtn}>
                                {photoUri ? (
                                    <Image source={{ uri: photoUri }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.mediaPlaceholder}>
                                        <Ionicons name="camera" size={30} color="rgba(255,255,255,0.86)" />
                                        <Text style={styles.mediaText}>PHOTO</Text>
                                        <Text style={styles.mediaHint}>Camera or Library</Text>
                                    </View>
                                )}
                            </Pressable>

                            {/* Voice — tap to toggle */}
                            <Pressable
                                onPress={handleMicToggle}
                                style={[styles.mediaBtn, isRecording && styles.mediaBtnActive]}
                            >
                                <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
                                    <Ionicons
                                        name={isRecording ? 'radio' : 'mic'}
                                        size={30}
                                        color={isRecording ? Colors.accentCyan : 'rgba(255,255,255,0.86)'}
                                    />
                                    <Text style={[styles.mediaText, isRecording && { color: Colors.accentCyan }]}>
                                        {isRecording ? 'TAP TO\nSTOP' : voiceUri ? 'RECORDED ✓' : 'TAP TO\nRECORD'}
                                    </Text>
                                </Animated.View>
                            </Pressable>
                        </View>

                        {/* Status confirmations */}
                        {voiceUri && !isRecording && <Text style={styles.statusMsg}>✅ Voice proof ready.</Text>}
                        {photoUri && <Text style={styles.statusMsg}>✅ Photo proof attached.</Text>}
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable onPress={onClose} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>ABANDON</Text>
                        </Pressable>
                        <GlassButton 
                            label="VERIFY & COMPLETE" 
                            onPress={handleSubmit} 
                            look="verify"
                            tint="blue"
                            size="sm" 
                            glow
                            style={{ 
                                shadowColor: firstColor,
                            }}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.82)' },
    modal: {
        width: '100%',
        backgroundColor: '#0A0A0A',
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: Spacing.xl,
        paddingBottom: 36,
        minHeight: '68%',
        maxHeight: '86%',
    },
    eyebrow: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentCyan, letterSpacing: 3, marginBottom: 6, textAlign: 'center' },
    title: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 20, letterSpacing: 1, lineHeight: 24 },

    content: { marginBottom: 20 },
    sectionLabel: { fontFamily: Fonts.monoBold, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 10 },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: Radius.md,
        padding: 14,
        color: '#fff',
        fontFamily: Fonts.body,
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 18,
    },

    mediaRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    mediaBtn: {
        flex: 1,
        minHeight: 104,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    mediaBtnActive: {
        borderColor: Colors.accentCyan,
        backgroundColor: 'rgba(0, 245, 255, 0.08)',
    },
    mediaPlaceholder: { alignItems: 'center', gap: 4 },
    mediaIcon: { fontSize: 26 },
    mediaText: {
        fontFamily: Fonts.monoBold,
        fontSize: 9,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 1,
        textAlign: 'center',
        marginTop: 2,
    },
    mediaHint: {
        fontFamily: Fonts.mono,
        fontSize: 8,
        color: 'rgba(255,255,255,0.2)',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    mediaBtnDisabled: {
        opacity: 0.4,
    },
    previewImage: { width: '100%', height: '100%' },
    statusMsg: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentCyan, marginTop: 4, letterSpacing: 1 },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    cancelBtn: { padding: 12 },
    cancelText: { fontFamily: Fonts.monoBold, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },
});
