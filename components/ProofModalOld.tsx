import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput, Pressable,
    Animated, Image, Alert, ScrollView, Platform, ActionSheetIOS,
    KeyboardAvoidingView
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassButton from './GlassButton';

interface ProofModalProps {
    visible: boolean;
    onClose: () => void;
    onComplete: (proofData: { text?: string, voiceUri?: string, photoUri?: string }) => void;
    questTitle: string;
}

export default function ProofModal({ visible, onClose, onComplete, questTitle }: ProofModalProps) {
    const [textProof, setTextProof] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

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

    // ── IMAGE: show action sheet on iOS (camera / library), just library on Android ──
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
        if (isRecording) {
            // — STOP —
            setIsRecording(false);
            try {
                if (recordingRef.current) {
                    await recordingRef.current.stopAndUnloadAsync();
                    const uri = recordingRef.current.getURI();
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
                    try { await recordingRef.current.stopAndUnloadAsync(); } catch { }
                    recordingRef.current = null;
                }

                const { status } = await Audio.AudioRecorder.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Mic Permission Needed', 'Please allow microphone access in Settings.');
                    return;
                }
                await Audio.setAudioModeAsync({
                    allowsRecording: true,
                    playsInSilentModeIOS: true,
                });
                const { recording: rec } = await Audio.AudioRecorder.createAsync(
                    Audio.RecordingPresets.HIGH_QUALITY
                );
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
                                        <Text style={styles.mediaIcon}>📸</Text>
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
                                    <Text style={styles.mediaIcon}>🎙️</Text>
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
                        <GlassButton label="VERIFY & COMPLETE" onPress={handleSubmit} tint="blue" size="md" glow />
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
        maxHeight: '88%',
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
        aspectRatio: 1,
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
