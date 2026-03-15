import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Animated, ScrollView } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Fonts, Spacing } from '@/constants/theme';
import { useUser } from '@/context/UserContext';

export default function LoginScreen() {
    const { signIn, forgotPassword, isLoading } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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
                    // Swipe right (positive translationX) to go back to onboarding
                    if (translationX > 50) {
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
                            <TextInput
                                style={styles.input}
                                placeholder="dark_ceo_zane  or  agent@zce.io"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="default"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>ACCESS CODE</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        <Pressable
                                onPress={() => router.push('/auth/forgot-password')}
                                style={{ alignSelf: 'flex-end', marginTop: 4 }}
                            >
                                <Text style={[styles.linkText, { color: '#FFFFFF', fontSize: 9 }]}>FORGOT ACCESS CODE?</Text>
                            </Pressable>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Pressable onPress={handleLogin} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                            <View style={styles.buttonInner}>
                                <Text style={styles.buttonText}>{isLoading ? 'AUTHENTICATING...' : 'ENTER THE DOJO'}</Text>
                            </View>
                        </Pressable>

                        <Pressable onPress={() => router.push('/auth/signup')} style={styles.link}>
                            <Text style={styles.linkText}>INITIATE NEW PROTOCOL (SIGN UP)</Text>
                        </Pressable>

                        <Pressable onPress={() => signIn()} style={[styles.link, { marginTop: 24 }]}>
                            <Text style={[styles.linkText, { color: 'rgba(255,255,255,0.7)', opacity: 0.8 }]}>PROCEED AS GUEST (DEMO MODE)</Text>
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
    input: {
        height: 52,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 0,
        paddingHorizontal: 18,
        color: '#FFFFFF',
        fontFamily: Fonts.body,
        fontSize: 15,
    },
    button: { height: 54, borderRadius: 0, overflow: 'hidden', marginTop: 16, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
    buttonPressed: { opacity: 0.8 },
    buttonInner: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    buttonText: { fontFamily: Fonts.heading, fontSize: 14, color: '#000000', letterSpacing: 2.5, fontWeight: '800' },
    errorText: { color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.mono, fontSize: 10, textAlign: 'center' },
    link: { alignItems: 'center', marginTop: 16 },
    linkText: { fontFamily: Fonts.monoBold, fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline', letterSpacing: 1 },
});
