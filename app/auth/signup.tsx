import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { Animated } from 'react-native';

export default function SignupScreen() {
    const { signUp } = useUser();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            setError('All fields are required.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            await signUp(email, password, name);
        } catch (e: any) {
            setError(e.message || 'Signup failed.');
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#050508', '#080816', '#000000']} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>INITIATE</Text>
                        <Text style={styles.subtitle}>CREATE YOUR IDENTITY</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8, fontFamily: Fonts.mono, marginTop: 10 }}>FIRMWARE V2.0.1 (STRICT AUTH)</Text>
                    </View>

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.form}>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CODENAME</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Agent Name"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>EMAIL</Text>
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>PASSWORD</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CONFIRM PASSWORD</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Pressable onPress={handleSignup} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                            <LinearGradient
                                colors={['#4A9EFF', '#7B61FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>{loading ? 'INITIALIZING...' : 'BEGIN PROTOCOL'}</Text>
                            </LinearGradient>
                        </Pressable>

                        <Pressable onPress={() => router.replace('/auth/login')} style={styles.link}>
                            <Text style={styles.linkText}>ALREADY HAVE ACCESS? LOG IN</Text>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgPrimary },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
    content: { width: '100%', maxWidth: 400, alignSelf: 'center', gap: 40 },
    header: { alignItems: 'center', gap: 10 },
    title: { fontFamily: Fonts.heading, fontSize: 36, color: Colors.textPrimary, letterSpacing: 6, fontWeight: '800' },
    subtitle: { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 4, textTransform: 'uppercase' },
    form: { gap: 20, paddingHorizontal: 16 },
    inputGroup: { gap: 8 },
    label: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary, letterSpacing: 1, fontWeight: '600' },
    input: {
        height: 52,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingHorizontal: 16,
        color: Colors.textPrimary,
        fontFamily: Fonts.body,
        fontSize: 15,
    },
    button: { height: 54, borderRadius: 14, overflow: 'hidden', marginTop: 12 },
    buttonPressed: { opacity: 0.8 },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonText: { fontFamily: Fonts.heading, fontSize: 14, color: '#fff', letterSpacing: 2.5, fontWeight: '800' },
    link: { alignItems: 'center', marginTop: 16 },
    linkText: { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.textTertiary, textDecorationLine: 'underline', letterSpacing: 1 },
    errorText: { color: Colors.danger, fontFamily: Fonts.mono, fontSize: 10, textAlign: 'center' },
});
