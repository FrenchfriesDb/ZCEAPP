import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Animated, ScrollView } from 'react-native';
import { PanGestureHandler, State, NativeViewGestureHandler } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Fonts, Spacing } from '@/constants/theme';
import { useUser } from '@/context/UserContext';

export default function LoginScreen() {
    const { signIn, forgotPassword, isLoading, setReturnToOnboardingStage } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const gestureX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Credentials required.');
            return;
        }
        try {
            setError('');
            await signIn(email, password);
        } catch (e: any) {
            setError(e.message || 'Authentication failed.');
        }
    };

    return (
        <PanGestureHandler
            onGestureEvent={Animated.event([{ nativeEvent: { translationX: gestureX } }], { useNativeDriver: false })}
            onHandlerStateChange={(event) => {
                if (event.nativeEvent.state === State.END) {
                    const { translationX } = event.nativeEvent;
                    // Swipe right: return to onboarding at stage 7 (Sign in), not stage 1
                    if (translationX > 50) {
                        setReturnToOnboardingStage(7);
                        router.replace('/auth/onboarding');
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
                        <Text style={styles.subtitle}>ACCESS RESTRICTED</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8, fontFamily: Fonts.mono, marginTop: 10 }}>FIRMWARE V2.0.1 (STRICT AUTH)</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>USERNAME OR EMAIL</Text>
                            <NativeViewGestureHandler>
                            <View style={[styles.inputWrap, focusedField === 'email' && styles.inputWrapFocused]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="dark_ceo_zane  or  agent@zce.io"
                                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="default"
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
</NativeViewGestureHandler>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>ACCESS CODE</Text>
                            <NativeViewGestureHandler>
                            <View style={[styles.inputWrap, focusedField === 'password' && styles.inputWrapFocused]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
</NativeViewGestureHandler>
                        <Pressable
                                onPress={() => router.push('/auth/forgot-password')}
                                style={{ alignSelf: 'flex-end', marginTop: 4 }}
                            >
                                <Text style={[styles.linkText, { color: '#FFFFFF', fontSize: 9 }]}>FORGOT ACCESS CODE?</Text>
                            </Pressable>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Pressable onPress={handleLogin} style={({ pressed }) => [styles.button, pressed && !isLoading && styles.buttonPressed]}>
                            <View style={styles.buttonInner}>
                                <Text style={styles.buttonText}>{isLoading ? 'AUTHENTICATING...' : 'ENTER THE DOJO'}</Text>
                            </View>
                        </Pressable>

                        <Pressable onPress={() => router.push('/auth/signup')} style={styles.link}>
                            <Text style={styles.linkText}>INITIATE NEW PROTOCOL (SIGN UP)</Text>
                        </Pressable>

                        <Pressable onPress={() => signIn()} style={[styles.link, { marginTop: 24 }]}>
                            <Text style={[styles.linkText, { color: 'rgba(255,255,255,0.9)', opacity: 1.0 }]}>PROCEED AS GUEST (DEMO MODE)</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
        </PanGestureHandler>
    );
}

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
    content: { width: '100%', maxWidth: 400, alignSelf: 'center', gap: 40 },
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
});
