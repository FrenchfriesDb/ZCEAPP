import {
    View, Text, StyleSheet, TextInput, Pressable, Animated,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image
} from 'react-native';
import { PanGestureHandler, State, NativeViewGestureHandler } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { db } from '@/services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const STEP1_FIELDS = [
    { key: 'name', label: 'CODENAME', icon: '◈', placeholder: 'Your name', secure: false, board: 'default' as const },
    { key: 'username', label: 'LEADERBOARD ALIAS', icon: '@', placeholder: 'dark_ceo_zane', secure: false, board: 'default' as const },
];
const STEP2_FIELDS = [
    { key: 'email', label: 'AGENT ID (EMAIL)', icon: '◉', placeholder: 'agent@zce.io', secure: false, board: 'email-address' as const },
    { key: 'password', label: 'ACCESS CODE', icon: '◈', placeholder: '••••••••', secure: true, board: 'default' as const },
    { key: 'confirmPassword', label: 'CONFIRM ACCESS CODE', icon: '◈', placeholder: '••••••••', secure: true, board: 'default' as const },
];

export default function SignupScreen() {
    const { signUp, setHasCompletedOnboarding, setReturnToOnboardingStage } = useUser();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [signupStep, setSignupStep] = useState<1 | 2>(1);
    const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;
    const gestureX = useRef(new Animated.Value(0)).current;
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollRef = useRef<ScrollView>(null);
    const fieldY = useRef<Record<string, number>>({});

    const scrollToField = (field: string) => {
        const y = fieldY.current[field] ?? 0;
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
    };

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, []);

    const checkUsername = useCallback(async (value: string) => {
        if (!USERNAME_REGEX.test(value)) { setUsernameStatus('invalid'); return; }
        setUsernameStatus('checking');
        try {
            const snap = await getDocs(query(collection(db, 'users'), where('username', '==', value.toLowerCase())));
            setUsernameStatus(snap.empty ? 'available' : 'taken');
        } catch { setUsernameStatus('idle'); }
    }, []);

    const handleUsernameChange = (raw: string) => {
        const clean = raw.replace(/\s/g, '').slice(0, 20);
        setUsername(clean);
        if (clean.length < 3) { setUsernameStatus('idle'); return; }
        setUsernameStatus('checking');
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => checkUsername(clean), 600);
    };

    const usernameColor = () => {
        if (usernameStatus === 'available') return '#FFFFFF';
        if (usernameStatus === 'taken') return 'rgba(255,255,255,0.5)';
        if (usernameStatus === 'invalid') return 'rgba(255,255,255,0.5)';
        return '#FFFFFF';
    };

    const usernameMessage = () => {
        if (usernameStatus === 'available') return '✓  USERNAME AVAILABLE';
        if (usernameStatus === 'taken') return '✗  ALREADY TAKEN';
        if (usernameStatus === 'invalid') return '⚠  3–20 CHARS, LETTERS/NUMBERS/_ ONLY';
        if (usernameStatus === 'checking') return '◌  CHECKING REGISTRY...';
        return '';
    };

    const handleSignup = async () => {
        if (!name || !username || !email || !password || !confirmPassword) {
            setError('All fields required.'); return;
        }
        if (!USERNAME_REGEX.test(username)) {
            setError('Username: 3–20 characters, letters, numbers, underscores only.'); return;
        }
        if (usernameStatus === 'taken') { setError('Username taken. Choose another.'); return; }
        if (usernameStatus === 'checking') { setError('Still verifying username. Try again in a moment.'); return; }
        if (password !== confirmPassword) { setError('Access codes do not match.'); return; }

        setLoading(true);
        setError('');
        try {
            await signUp(email, password, name, username.toLowerCase());
        } catch (e: any) {
            setError(e.message || 'Signup failed.');
            setLoading(false);
        }
    };

    const fieldValue = (key: string) => {
        if (key === 'name') return name;
        if (key === 'username') return username;
        if (key === 'email') return email;
        if (key === 'password') return password;
        if (key === 'confirmPassword') return confirmPassword;
        return '';
    };
    const setFieldValue = (key: string, v: string) => {
        if (key === 'name') setName(v);
        else if (key === 'username') handleUsernameChange(v);
        else if (key === 'email') setEmail(v);
        else if (key === 'password') setPassword(v);
        else if (key === 'confirmPassword') setConfirmPassword(v);
    };

    return (
        <PanGestureHandler
            onGestureEvent={Animated.event([{ nativeEvent: { translationX: gestureX } }], { useNativeDriver: false })}
            onHandlerStateChange={(event) => {
                if (event.nativeEvent.state === State.END) {
                    const { translationX } = event.nativeEvent;
                    // Swipe right: return to onboarding at stage 6 (Create identity), not stage 1
                    if (translationX > 30) {
                        setHasCompletedOnboarding(false);
                        setReturnToOnboardingStage(6);
                        router.replace('/auth/onboarding');
                    }
                }
            }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, backgroundColor: '#000000' }}
            >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="interactive"
            >
                <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                    {/* ── HEADER ── */}
                    <View style={styles.header}>
                        {/* ZCE logo */}
                        <View style={styles.logoBadge}>
                            <Image 
                                source={require('../../assets/images/ZCELOGO1.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>INITIATE</Text>
                        <Text style={styles.subtitle}>CREATE YOUR IDENTITY</Text>
                        <View style={styles.tagRow}>
                            <View style={styles.tagDot} />
                            <Text style={styles.tag}>FIRMWARE V2.0.1</Text>
                            <View style={styles.tagDivider} />
                            <Text style={styles.tag}>STRICT AUTH</Text>
                            <View style={styles.tagDot} />
                        </View>
                    </View>

                    {/* ── FORM CARD ── */}
                    <View style={styles.card}>
                        <View style={styles.cardInner}>
                            {(signupStep === 1 ? STEP1_FIELDS : STEP2_FIELDS).map((field) => {
                                const isFocused = focusedField === field.key;
                                const isUsername = field.key === 'username';
                                const showStatus = isUsername && usernameMessage() !== '';

                                return (
                                    <View
                                        key={field.key}
                                        style={styles.fieldGroup}
                                        onLayout={e => { fieldY.current[field.key] = e.nativeEvent.layout.y; }}
                                    >
                                        <View style={styles.labelRow}>
                                            <Text style={[styles.labelIcon, isFocused && { color: '#FFFFFF' }]}>
                                                {field.key === 'username' ? `@` : field.icon}
                                            </Text>
                                            <Text style={[styles.label, isFocused && { color: '#FFFFFF' }]}>
                                                {field.label}
                                            </Text>
                                            {isUsername && usernameStatus === 'checking' && (
                                                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 6 }} />
                                            )}
                                        </View>

                                        <NativeViewGestureHandler>
                                        <View style={[
                                            styles.inputWrap,
                                            isFocused && styles.inputWrapFocused,
                                            isUsername && usernameStatus === 'available' && styles.inputWrapGreen,
                                            isUsername && usernameStatus === 'taken' && styles.inputWrapRed,
                                        ]}>
                                            <TextInput
                                                style={styles.input}
                                                value={fieldValue(field.key)}
                                                onChangeText={v => setFieldValue(field.key, v)}
                                                placeholder={field.placeholder}
                                                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                                secureTextEntry={field.secure}
                                                autoCapitalize={field.key === 'name' ? 'words' : 'none'}
                                                autoCorrect={false}
                                                keyboardType={field.board}
                                                onFocus={() => { setFocusedField(field.key); scrollToField(field.key); }}
                                                onBlur={() => setFocusedField(null)}
                                            />
                                            {/* Inline status for username */}
                                            {isUsername && usernameStatus !== 'checking' && usernameStatus !== 'idle' && (
                                                <View style={[styles.statusPill, { backgroundColor: usernameColor() + '22', borderColor: usernameColor() + '55' }]}>
                                                    <Text style={[styles.statusPillText, { color: usernameColor() }]}>
                                                        {usernameStatus === 'available' ? '✓' : usernameStatus === 'taken' ? '✗' : '⚠'}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
</NativeViewGestureHandler>

                                        {showStatus && (
                                            <Text style={[styles.statusHint, { color: usernameColor() }]}>
                                                {usernameMessage()}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}

                            {/* Error */}
                            {!!error && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>⚠  {error}</Text>
                                </View>
                            )}

                            {/* Step 1: Next | Step 2: Submit */}
                            {signupStep === 1 ? (
                                <Pressable
                                    onPress={() => {
                                        if (!name.trim() || !username.trim()) {
                                            setError('Codename and Leaderboard Alias required.');
                                            return;
                                        }
                                        if (!USERNAME_REGEX.test(username)) {
                                            setError('Username: 3–20 characters, letters, numbers, underscores only.');
                                            return;
                                        }
                                        if (usernameStatus === 'taken') {
                                            setError('Username taken. Choose another.');
                                            return;
                                        }
                                        if (usernameStatus === 'checking') {
                                            setError('Still verifying username. Wait a moment.');
                                            return;
                                        }
                                        setError('');
                                        setSignupStep(2);
                                    }}
                                    style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
                                >
                                    <View style={styles.submitInner}>
                                        <Text style={styles.submitText}>NEXT →</Text>
                                    </View>
                                </Pressable>
                            ) : (
                                <>
                                    <Pressable onPress={() => { setError(''); setSignupStep(1); }} style={({ pressed }) => [styles.backStepLink, pressed && { opacity: 0.8 }]}>
                                        <Text style={styles.backStepText}>← BACK</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={handleSignup}
                                        disabled={loading}
                                        style={({ pressed }) => [styles.submitBtn, pressed && !loading && styles.submitBtnPressed]}
                                    >
                                        <View style={styles.submitInner}>
                                            {loading ? (
                                                <ActivityIndicator color="#FFFFFF" />
                                            ) : (
                                                <Text style={styles.submitText}>BEGIN PROTOCOL</Text>
                                            )}
                                        </View>
                                    </Pressable>
                                </>
                            )}
                        </View>
                    </View>

                    {/* ── FOOTER ── */}
                    <Pressable onPress={() => router.replace('/auth/login')} style={styles.loginLink}>
                        <Text style={styles.loginLinkText}>ALREADY HAVE ACCESS?  </Text>
                        <Text style={[styles.loginLinkText, styles.loginLinkAccent]}>LOG IN →</Text>
                    </Pressable>

                    <Pressable onPress={() => router.replace('/(tabs)')} style={styles.npcLink}>
                        <Text style={styles.npcLinkText}>PROCEED AS NPC (DEMO MODE)</Text>
                    </Pressable>

                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
        </PanGestureHandler>
    );
}

const styles = StyleSheet.create({
    scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: 80 },
    inner: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 36 },

    blob: { position: 'absolute', width: 320, height: 320, borderRadius: 160 },

    // ── HEADER
    header: { alignItems: 'center', gap: 16 },
    logoBadge: {
        width: 80, height: 80, borderRadius: 0,
        backgroundColor: 'transparent',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 6,
    },
    logoImage: { width: 70, height: 70 },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 40,
        color: '#FFFFFF',
        letterSpacing: 8,
        fontWeight: '900',
    },
    subtitle: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 4,
    },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    tagDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' },
    tagDivider: { width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
    tag: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5 },

    // ── CARD
    card: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    cardInner: { padding: 24, gap: 18, backgroundColor: 'transparent' },

    // ── FIELDS (liquid glass)
    fieldGroup: { gap: 7 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    labelIcon: { fontFamily: Fonts.mono, fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 14, textAlign: 'center' },
    label: { fontFamily: Fonts.monoBold, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 },

    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
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
        paddingHorizontal: 16,
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
    inputWrapGreen: { borderTopColor: 'rgba(255, 255, 255, 0.5)', borderLeftColor: 'rgba(255, 255, 255, 0.5)', borderBottomColor: 'rgba(255, 255, 255, 0.5)', borderRightColor: 'rgba(255, 255, 255, 0.5)' },
    inputWrapRed: { borderTopColor: 'rgba(255,100,100,0.5)', borderLeftColor: 'rgba(255,100,100,0.5)', borderBottomColor: 'rgba(255,100,100,0.5)', borderRightColor: 'rgba(255,100,100,0.5)' },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontFamily: Fonts.body,
        fontSize: 15,
    },
    statusPill: {
        width: 24, height: 24, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, marginLeft: 8,
    },
    statusPillText: { fontFamily: Fonts.monoBold, fontSize: 11 },
    statusHint: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5, marginLeft: 20 },

    // ── ERROR
    errorBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 0,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    errorText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3, textAlign: 'center' },

    // ── SUBMIT (cold cyan liquid glass)
    submitBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 4,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: 'rgba(255, 255, 255, 0.15)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
    },
    submitBtnPressed: { borderColor: 'rgba(255, 255, 255, 0.9)', transform: [{ scale: 0.97 }] },
    submitInner: { height: 56, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    submitText: {
        fontFamily: Fonts.heading,
        fontSize: 14,
        color: '#FFFFFF',
        letterSpacing: 3,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    backStepLink: { alignSelf: 'center', paddingVertical: 8, marginBottom: 4 },
    backStepText: { fontFamily: Fonts.monoBold, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 },

    // ── FOOTER
    loginLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    loginLinkText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
    loginLinkAccent: { color: '#FFFFFF' },
    npcLink: { alignSelf: 'center', marginTop: 12, opacity: 0.7 },
    npcLinkText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textDecorationLine: 'underline' },
});
