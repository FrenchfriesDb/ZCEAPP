import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Animated, ScrollView } from 'react-native';
import { PanGestureHandler, State, NativeViewGestureHandler } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Fonts, Spacing } from '@/constants/theme';
import { useUser } from '@/context/UserContext';

export default function ForgotPasswordScreen() {
    const { forgotPassword, isLoading } = useUser();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const gestureX = useRef(new Animated.Value(0)).current;
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
        <PanGestureHandler
            onGestureEvent={Animated.event([{ nativeEvent: { translationX: gestureX } }], { useNativeDriver: false })}
            onHandlerStateChange={(event) => {
                if (event.nativeEvent.state === State.END) {
                    const { translationX } = event.nativeEvent;
                    if (translationX > 50) {
                        router.replace('/auth/login');
                    }
                }
            }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1, backgroundColor: '#000000' }}
            >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                        <View style={styles.header}>
                            <Text style={styles.title}>ZCE</Text>
                            <Text style={styles.subtitle}>IDENTITY RECOVERY</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8, fontFamily: Fonts.mono, marginTop: 10 }}>FIRMWARE V2.0.1 (RECOVERY MODE)</Text>
                        </View>

                        {success ? (
                            <View style={styles.form}>
                                <View style={styles.successContainer}>
                                    <Text style={styles.successTitle}>PROTOCOL INITIATED</Text>
                                    <Text style={styles.successText}>An encrypted reset link has been dispatched to your agent ID.</Text>
                                    <Text style={styles.successSub}>Check your inbox and follow the instructions to restore access.</Text>
                                </View>

                                <Pressable onPress={() => router.replace('/auth/login')} style={styles.link}>
                                    <Text style={styles.linkText}>RETURN TO LOGIN →</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>AGENT ID / EMAIL</Text>
                                    <NativeViewGestureHandler>
                                        <View style={[styles.inputWrap, focusedField === 'email' && styles.inputWrapFocused]}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="agent@zce.io"
                                                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                                value={email}
                                                onChangeText={setEmail}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                keyboardType="email-address"
                                                onFocus={() => setFocusedField('email')}
                                                onBlur={() => setFocusedField(null)}
                                            />
                                        </View>
                                    </NativeViewGestureHandler>
                                </View>

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <Pressable onPress={handleResetRequest} style={({ pressed }) => [styles.button, pressed && !isLoading && styles.buttonPressed]}>
                                    <View style={styles.buttonInner}>
                                        <Text style={styles.buttonText}>{isLoading ? 'TRANSMITTING...' : 'SEND RESET LINK'}</Text>
                                    </View>
                                </Pressable>

                                <Pressable onPress={() => router.back()} style={styles.link}>
                                    <Text style={styles.linkText}>CANCEL PROTOCOL</Text>
                                </Pressable>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </PanGestureHandler>
    );
}

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
    content: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 28 },
    header: { alignItems: 'center', gap: 10 },
    title: { fontFamily: Fonts.heading, fontSize: 52, color: '#FFFFFF', letterSpacing: 10, fontWeight: '800' },
    subtitle: { fontFamily: Fonts.monoBold, fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 4, textTransform: 'uppercase' },
    form: { gap: 24, paddingHorizontal: 16 },
    inputGroup: { gap: 10 },
    label: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, fontWeight: '600' },
    inputWrap: {
        height: 52,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.12)',
        borderLeftColor: 'rgba(255, 255, 255, 0.12)',
        borderBottomColor: 'rgba(0, 0, 0, 0.3)',
        borderRightColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 10,
        paddingHorizontal: 18,
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontFamily: Fonts.body,
        fontSize: 15,
        padding: 0,
    },
    inputWrapFocused: {
        borderTopColor: 'rgba(255, 255, 255, 0.5)',
        borderLeftColor: 'rgba(255, 255, 255, 0.5)',
        borderBottomColor: 'rgba(255, 255, 255, 0.5)',
        borderRightColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: 'rgba(255, 255, 255, 0.4)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 6,
    },
    button: {
        height: 56,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: 'rgba(255, 255, 255, 0.15)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
    },
    buttonPressed: { borderColor: 'rgba(255, 255, 255, 0.9)', transform: [{ scale: 0.97 }] },
    buttonInner: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    buttonText: { fontFamily: Fonts.heading, fontSize: 14, color: '#FFFFFF', letterSpacing: 3, fontWeight: '800', textTransform: 'uppercase' },
    errorText: { color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.mono, fontSize: 10, textAlign: 'center' },
    link: { alignItems: 'center', marginTop: 16 },
    linkText: { fontFamily: Fonts.monoBold, fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline', letterSpacing: 1 },
    successContainer: { gap: 16, alignItems: 'center', paddingHorizontal: 16 },
    successTitle: { color: '#FFFFFF', fontFamily: Fonts.heading, fontSize: 20, letterSpacing: 2, textAlign: 'center', fontWeight: '800' },
    successText: { color: 'rgba(255,255,255,0.8)', fontFamily: Fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    successSub: { color: 'rgba(255,255,255,0.6)', fontFamily: Fonts.mono, fontSize: 11, textAlign: 'center', lineHeight: 18, marginTop: 8 },
});
