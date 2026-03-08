import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { useUser } from '@/context/UserContext';

export default function ForgotPasswordScreen() {
    const { forgotPassword, isLoading } = useUser();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);

    const handleResetRequest = async () => {
        if (!email) {
            setError('Agent ID (Email) required.');
            return;
        }
        try {
            setError('');
            await forgotPassword(email);
            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Transmission failed.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
        >
            <LinearGradient colors={['#050508', '#080816', '#000000']} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>IDENTITY RECOVERY</Text>
                        <Text style={styles.subtitle}>REQUEST ACCESS CODE RESET</Text>
                    </View>

                    {success ? (
                        <View style={styles.successContainer}>
                            <Text style={styles.successText}>PROTOCOL INITIATED.</Text>
                            <Text style={styles.successSub}>An encrypted reset link has been dispatched to {email}. Check your inbox and follow the instructions to restore access.</Text>
                            <Pressable onPress={() => router.replace('/auth/login')} style={styles.backButton}>
                                <Text style={styles.backButtonText}>RETURN TO LOGIN</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>AGENT ID / EMAIL</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="agent@zce.io"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            <Pressable onPress={handleResetRequest} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                                <LinearGradient
                                    colors={['#4A9EFF', '#7B61FF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    <Text style={styles.buttonText}>{isLoading ? 'TRANSMITTING...' : 'SEND RESET LINK'}</Text>
                                </LinearGradient>
                            </Pressable>

                            <Pressable onPress={() => router.back()} style={styles.link}>
                                <Text style={styles.linkText}>CANCEL PROTOCOL</Text>
                            </Pressable>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
    content: { width: '100%', maxWidth: 400, alignSelf: 'center', gap: 40 },
    header: { alignItems: 'center', gap: 8 },
    title: { fontFamily: Fonts.heading, fontSize: 32, color: '#fff', letterSpacing: 4, textAlign: 'center' },
    subtitle: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 4, textAlign: 'center' },
    form: { gap: 24, paddingHorizontal: 16 },
    inputGroup: { gap: 8 },
    label: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
    input: {
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: Radius.md,
        paddingHorizontal: 16,
        color: '#fff',
        fontFamily: Fonts.body,
        fontSize: 14,
    },
    button: { height: 50, borderRadius: Radius.md, overflow: 'hidden', marginTop: 16 },
    buttonPressed: { opacity: 0.8 },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonText: { fontFamily: Fonts.heading, fontSize: 14, color: '#fff', letterSpacing: 2 },
    errorText: { color: Colors.danger, fontFamily: Fonts.mono, fontSize: 10, textAlign: 'center' },
    link: { alignItems: 'center', marginTop: 16 },
    linkText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline' },
    successContainer: { gap: 20, alignItems: 'center', paddingHorizontal: 16 },
    successText: { color: Colors.accentPrimary, fontFamily: Fonts.heading, fontSize: 24, letterSpacing: 2 },
    successSub: { color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 22 },
    backButton: { marginTop: 20, padding: 12 },
    backButtonText: { color: '#fff', fontFamily: Fonts.mono, fontSize: 12, textDecorationLine: 'underline' },
});
