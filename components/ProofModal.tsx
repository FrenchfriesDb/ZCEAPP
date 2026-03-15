import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TextInput, Pressable,
    Image, Alert, ScrollView, Platform, ActionSheetIOS,
    KeyboardAvoidingView
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Radius } from '@/constants/theme';
import GlassButton from './GlassButton';

interface ProofModalProps {
    visible: boolean;
    onClose: () => void;
    onComplete: (proofData: { text?: string, photoUri?: string }) => void;
    questTitle: string;
}

export default function ProofModal({ visible, onClose, onComplete, questTitle }: ProofModalProps) {
    const [textProof, setTextProof] = useState('');
    const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

    const handleSubmit = () => {
        if (!textProof && !photoUri) {
            Alert.alert('PROOF REQUIRED', 'Submit at least one form of proof: text or photo.');
            return;
        }
        onComplete({ textProof, photoUri });
        setTextProof('');
        setPhotoUri(undefined);
        onClose();
    };

    const handlePhoto = async () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Take Photo', 'Choose from Library', 'Cancel'],
                    cancelButtonIndex: 2,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) takePhoto();
                    else if (buttonIndex === 1) pickImage();
                }
            );
        } else {
            Alert.alert('Photo Proof', 'Choose photo source', [
                { text: 'Take Photo', onPress: takePhoto },
                { text: 'Choose from Library', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' },
            ]);
        }
    };

    const takePhoto = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
            }
        } catch (err: any) {
            Alert.alert('Camera Error', err?.message ?? 'Unable to access camera.');
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
            }
        } catch (err: any) {
            Alert.alert('Gallery Error', err?.message ?? 'Unable to access photo library.');
        }
    };

    if (!visible) return null;

    return (
        <Modal animationType="fade" transparent visible onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <BlurView intensity={40} style={StyleSheet.absoluteFill} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>PROOF OF COMPLETION</Text>
                        <Text style={styles.modalSub}>{questTitle}</Text>

                        <ScrollView style={styles.proofSection} showsVerticalScrollIndicator={false}>
                            {/* Text Proof */}
                            <View style={styles.proofBlock}>
                                <Text style={styles.proofLabel}>TEXT PROOF</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Describe what happened..."
                                    placeholderTextColor={Colors.textTertiary}
                                    multiline
                                    value={textProof}
                                    onChangeText={setTextProof}
                                    maxLength={500}
                                />
                                <Text style={styles.charCount}>{textProof.length}/500</Text>
                            </View>

                            {/* Photo Proof */}
                            <View style={styles.proofBlock}>
                                <Text style={styles.proofLabel}>PHOTO PROOF</Text>
                                {photoUri ? (
                                    <View style={styles.photoPreview}>
                                        <Image source={{ uri: photoUri }} style={styles.previewImage} />
                                        <Pressable style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                                            <Text style={styles.removePhotoText}>REMOVE</Text>
                                        </Pressable>
                                    </View>
                                ) : (
                                    <Pressable style={styles.photoButton} onPress={handlePhoto}>
                                        <Text style={styles.photoButtonText}>+ ADD PHOTO</Text>
                                    </Pressable>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <GlassButton
                                label="CANCEL"
                                onPress={onClose}
                                style={styles.cancelButton}
                            />
                            <GlassButton
                                label="SUBMIT PROOF"
                                onPress={handleSubmit}
                                style={styles.submitButton}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
    },
    modalCard: {
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.borderGlass,
        padding: 24,
    },
    modalTitle: {
        fontFamily: Fonts.heading,
        fontSize: 20,
        color: Colors.textPrimary,
        textAlign: 'center',
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    modalSub: {
        fontFamily: Fonts.mono,
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 1,
    },
    proofSection: {
        maxHeight: 400,
    },
    proofBlock: {
        marginBottom: 20,
    },
    proofLabel: {
        fontFamily: Fonts.monoBold,
        fontSize: 11,
        color: Colors.textSecondary,
        letterSpacing: 1.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: Radius.md,
        padding: 16,
        color: Colors.textPrimary,
        fontFamily: Fonts.body,
        fontSize: 15,
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: Colors.borderGlass,
        marginBottom: 8,
    },
    charCount: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: Colors.textTertiary,
        textAlign: 'right',
    },
    photoButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.borderGlass,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoButtonText: {
        fontFamily: Fonts.monoBold,
        fontSize: 12,
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    photoPreview: {
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: Radius.md,
    },
    removePhoto: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: Colors.danger,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Radius.pill,
    },
    removePhotoText: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.borderGlass,
    },
    submitButton: {
        flex: 2,
    },
});
