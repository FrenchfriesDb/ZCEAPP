
import { Colors, Fonts, FontSizes, Radius, Spacing } from '@/constants/theme';
import { useSubscription } from '@/context/SubscriptionContext';
import { useUser } from '@/context/UserContext';
import { usePaywall } from '@/hooks/usePaywall';
import { useTimeColors } from '@/hooks/useTimeColors';
import { AIService, type ZaneChatStyle } from '@/services/ai';
import { getFirstName } from '@/utils/formatters';
import { buildZaneMemoryContext } from '@/utils/zaneMemory';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Clipboard, Easing, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: string;
}

const getTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatScreen() {
    const { user, addChatMessage, clearChat, updateProfile } = useUser();
    const { canUseAIChat, dailyChatUsed, dailyChatLimit, freeWindowRemainingMs, recordAIInteraction } = useSubscription();
    const { presentPaywall } = usePaywall();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatStyle, setChatStyle] = useState<ZaneChatStyle>((user?.zaneChatStyle as ZaneChatStyle) || 'classic');
    const scrollRef = useRef<ScrollView>(null);
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);
    const insets = useSafeAreaInsets();
    const { palette: timePalette } = useTimeColors();
    const systemColor = Array.isArray(timePalette) && timePalette.length > 0 ? timePalette[0] : Colors.accentPrimary;
    const dotAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const inputFocusAnim = useRef(new Animated.Value(0)).current;
    const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const memoryContext = buildZaneMemoryContext(user);
    const runtimeName = getFirstName(user?.name) || 'AGENT';
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);

    const shouldUseMemoryContext = (text: string) => {
        const q = String(text || '').toLowerCase();
        return /(remember|last time|previous|earlier|from before|my streak|my xp|tracker|my logs|cfop|rubik|based on my|as i said|you said)/i.test(q);
    };

    const maybeMemoryContextFor = (text: string) => (shouldUseMemoryContext(text) ? memoryContext : undefined);

    const copyMessage = async (id: number, text: string) => {
        try {
            Clipboard.setString(text);
            setCopiedMessageId(id);
            if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
            copyResetTimerRef.current = setTimeout(() => setCopiedMessageId(null), 1200);
        } catch {
            setCopiedMessageId(null);
        }
    };

    useEffect(() => {
        setChatStyle((user?.zaneChatStyle as ZaneChatStyle) || 'classic');
    }, [user?.zaneChatStyle]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        ).start();
    }, [pulseAnim]);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardActive(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardActive(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        return () => {
            if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
        };
    }, []);

    // Restart if user changes or history is empty
    useEffect(() => {
        if (user?.chatLogs && user.chatLogs.length > 0) {
            const mapped = [...user.chatLogs].reverse().map((log, i) => ({
                id: i,
                text: log.content,
                sender: log.role === 'assistant' ? 'ai' : 'user' as 'ai' | 'user',
                timestamp: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setMessages(mapped);
        } else {
            const fetchWelcome = async () => {
                setIsTyping(true);
                try {
                    const welcomeText = await AIService.generateResponse(
                        [{ role: 'user', content: 'REQUEST: AUDIT OPENING. Start the session.' }],
                        'groq',
                        runtimeName,
                        user?.level || 1,
                        'main',
                        { chatStyle }
                    );
                    setMessages([{
                        id: 0,
                        text: welcomeText,
                        sender: 'ai',
                        timestamp: getTimeString()
                    }]);
                    addChatMessage({ role: 'assistant', content: welcomeText });
                } catch {
                    const firstName = getFirstName(user?.name);
                    const fallback = `${firstName}-la. Connection unstable. Go find a rep while I reboot.`;
                    setMessages([{ id: 0, text: fallback, sender: 'ai', timestamp: getTimeString() }]);
                } finally {
                    setIsTyping(false);
                }
            };
            fetchWelcome();
        }
    }, [addChatMessage, chatStyle, memoryContext, runtimeName, user?.chatLogs, user?.email, user?.level, user?.name]);

    useEffect(() => {
        if (isTyping) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [dotAnim, isTyping]);

    const addAiMessage = (text: string) => {
        setMessages(prev => [
            ...prev,
            {
                id: prev.length,
                text,
                sender: 'ai',
                timestamp: getTimeString(),
            }
        ]);
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text) return;
        if (!canUseAIChat) {
            const mins = Math.max(1, Math.ceil(freeWindowRemainingMs / 60000));
            const limitNote = `${runtimeName}-la. That's your 10 free sessions today. ZANE goes quiet for NPCs. Directors get unlimited access.`;
            addAiMessage(limitNote);
            await addChatMessage({ role: 'assistant', content: limitNote });
            void presentPaywall('ai_limit', {
                title: 'Free AI Limit Hit',
                body: `You are at ${dailyChatUsed}/${dailyChatLimit}. Next slot unlocks in ~${mins} min. Directors get unlimited ZANE access.`,
                ctaLabel: 'UNLOCK DIRECTOR MODE',
                skipLabel: 'Maybe Later',
            });
            return;
        }

        // Add user message to local state
        const userMsg: Message = {
            id: messages.length,
            text: text,
            sender: 'user',
            timestamp: getTimeString(),
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);
        recordAIInteraction();

        // Save to persistence
        await addChatMessage({ role: 'user', content: text });

        try {
            // SLICE HISTORY: Only take last 10 messages to avoid "softness" poisoning from old AI responses
            const history = newMessages.slice(-10).map(m => ({
                role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: m.text
            }));

            let responseText = await AIService.generateResponse(
                history,
                'groq',
                runtimeName,
                user?.level || 1,
                'main',
                { chatStyle, memoryContext: maybeMemoryContextFor(text) }
            );

            // Fail-safe: Strip any trailing fluff added after the official closer
            const closers = ['Lock in.', 'Start now.', 'Move.', 'Execute.', 'Execute or stay average.'];
            for (const closer of closers) {
                const index = responseText.lastIndexOf(closer);
                if (index !== -1) {
                    const after = responseText.substring(index + closer.length).trim();
                    if (after.length > 0) {
                        responseText = responseText.substring(0, index + closer.length);
                    }
                    break;
                }
            }

            // Keep section headers intact so the response structure from ai.ts is visible to the user.
            responseText = responseText.trim();

            setIsTyping(false);
            addAiMessage(responseText);
            await addChatMessage({ role: 'assistant', content: responseText });

        } catch {
            setIsTyping(false);
            const fallback = "Neural link saturated. I'm busy auditing your last failure. Go approach someone.";
            addAiMessage(fallback);
            await addChatMessage({ role: 'assistant', content: fallback });
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#000000']}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.34)' }]} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 22) }]}>
                <View style={styles.headerLeft}>
                    <Pressable onPress={() => router.back()} style={styles.backBtnHeader}>
                        <Text style={styles.backIconHeader}>←</Text>
                    </Pressable>
                    <Animated.View style={[styles.aiAvatar, { transform: [{ scale: pulseAnim }], backgroundColor: systemColor, shadowColor: systemColor }]}> 
                        <Text style={styles.monogram}>Z</Text>
                    </Animated.View>
                    <View style={styles.headerMeta}>
                        <Text style={styles.headerTitle} numberOfLines={1}>Z.A.N.E. AI</Text>
                        <Text style={styles.headerSub} numberOfLines={1}>ARCHITECT MODE: {isTyping ? 'ANALYZING...' : 'ONLINE'}</Text>
                    </View>
                </View>
                <Pressable onPress={() => clearChat()} style={styles.purgeBtn}>
                    <Text style={styles.purgeText}>PURGE HISTORY</Text>
                </Pressable>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.styleSelectorScroll}
                contentContainerStyle={styles.styleSelectorRow}
            >
                {([
                    { id: 'classic', label: 'CLASSIC ZANE' },
                    { id: 'coach', label: 'ZANE-COACH' },
                    { id: 'nervous', label: 'NERVOUS SYSTEM' },
                ] as { id: ZaneChatStyle; label: string }[]).map((option) => (
                    <Pressable
                        key={option.id}
                        onPress={async () => {
                            setChatStyle(option.id);
                            await updateProfile({ zaneChatStyle: option.id });
                        }}
                        style={({ pressed }) => [
                            styles.stylePill,
                            chatStyle === option.id && styles.stylePillActive,
                            pressed && styles.stylePillPressed,
                        ]}
                    >
                        <Text style={[styles.stylePillText, chatStyle === option.id && styles.stylePillTextActive]}>
                            {option.label}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <KeyboardAvoidingView
                style={styles.chatArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.messages}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => scrollRef.current?.scrollToEnd({ animated: false })}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg, index) => (
                        <View key={`${msg.id}-${index}`} style={[styles.msgRow, msg.sender === 'user' && styles.msgRowUser]}>
                            {msg.sender === 'ai' && (
                                <View style={[styles.msgAvatarSmall, { backgroundColor: systemColor + '11', borderColor: systemColor + '33' }]}>
                                    <Text style={[styles.monogramSmall, { color: systemColor }]}>Z</Text>
                                </View>
                            )}
                            <View style={[styles.bubble, msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                                <Text selectable style={[styles.bubbleText, msg.sender === 'user' && styles.bubbleTextUser]}>
                                    {msg.text}
                                </Text>
                                <View style={styles.bubbleMetaRow}>
                                    <Text selectable style={styles.timestamp}>{msg.timestamp}</Text>
                                    <Pressable
                                        onPress={() => copyMessage(msg.id, msg.text)}
                                        style={({ pressed }) => [
                                            styles.copyBtn,
                                            copiedMessageId === msg.id && styles.copyBtnActive,
                                            pressed && styles.copyBtnPressed,
                                        ]}
                                        hitSlop={8}
                                    >
                                        <Text style={styles.copyIcon}>{copiedMessageId === msg.id ? '✓' : '⧉'}</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    ))}

                    {isTyping && (
                        <View style={styles.msgRow}>
                            <View style={[styles.msgAvatarSmall, { backgroundColor: systemColor + '11', borderColor: systemColor + '33' }]}>
                                <Text style={[styles.monogramSmall, { color: systemColor }]}>Z</Text>
                            </View>
                            <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                                <Animated.View style={[styles.typingDots, { opacity: dotAnim }]}>
                                    <View style={[styles.dot, { backgroundColor: systemColor }]} />
                                    <View style={[styles.dot, { backgroundColor: systemColor }]} />
                                    <View style={[styles.dot, { backgroundColor: systemColor }]} />
                                </Animated.View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input */}
                <View
                    style={[
                        styles.inputContainer,
                        {
                            paddingBottom: isKeyboardActive
                                ? 6
                                : Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6),
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.inputBox,
                            {
                                transform: [{
                                    scale: inputFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.01] })
                                }, {
                                    translateY: inputFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -1] })
                                }],
                                shadowOpacity: inputFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.18] }),
                                shadowRadius: inputFocusAnim.interpolate({ inputRange: [0, 1], outputRange: [11, 16] }),
                                borderColor: inputFocusAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.30)'] }),
                            },
                        ]}
                    >
                        <TextInput
                            style={styles.input}
                            placeholder="Deep dive protocol..."
                            placeholderTextColor={Colors.textTertiary}
                            value={input}
                            onChangeText={setInput}
                            onFocus={() => {
                                Animated.timing(inputFocusAnim, {
                                    toValue: 1,
                                    duration: 220,
                                    easing: Easing.out(Easing.cubic),
                                    useNativeDriver: false,
                                }).start();
                                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
                            }}
                            onTouchStart={() => {
                                Animated.timing(inputFocusAnim, {
                                    toValue: 1,
                                    duration: 160,
                                    easing: Easing.out(Easing.cubic),
                                    useNativeDriver: false,
                                }).start();
                            }}
                            onBlur={() => {
                                Animated.timing(inputFocusAnim, {
                                    toValue: 0,
                                    duration: 200,
                                    easing: Easing.inOut(Easing.cubic),
                                    useNativeDriver: false,
                                }).start();
                            }}
                            onSubmitEditing={sendMessage}
                            returnKeyType="send"
                            multiline={false}
                        />
                        <Pressable onPress={sendMessage} style={styles.sendBtn}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                                style={styles.sendGradient}
                            >
                                <Text style={styles.sendIcon}>↑</Text>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
    headerMeta: { flex: 1, minWidth: 0 },
    aiAvatar: {
        width: 36, height: 36, borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center', alignItems: 'center',
        shadowRadius: 15, shadowOpacity: 0.5,
    },
    monogram: { fontFamily: Fonts.heading, fontSize: 18, color: '#000000', fontWeight: '900' },
    aiDot: { width: 10, height: 10, borderRadius: 3, backgroundColor: Colors.accentPrimary, shadowColor: Colors.accentPrimary, shadowRadius: 10, shadowOpacity: 0.8 },
    headerTitle: { fontFamily: Fonts.heading, fontSize: FontSizes.lg, color: Colors.textPrimary, letterSpacing: 2, fontWeight: '800' },
    headerSub: { fontFamily: Fonts.headingSemi, fontSize: 9, color: Colors.accentPrimary, letterSpacing: 1.5, textTransform: 'uppercase' },
    backBtnHeader: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    backIconHeader: { color: '#fff', fontSize: 18, fontWeight: '800' },
    purgeBtn: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        marginLeft: 10,
        flexShrink: 0,
    },
    purgeText: { color: Colors.textTertiary, fontSize: 8, fontFamily: Fonts.headingSemi, letterSpacing: 1 },
    styleSelectorScroll: { maxHeight: 52 },
    styleSelectorRow: { paddingHorizontal: Spacing.lg, paddingBottom: 10, gap: 10 },
    stylePill: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.035)',
    },
    stylePillActive: {
        borderColor: 'rgba(255,255,255,0.34)',
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    stylePillPressed: {
        transform: [{ scale: 0.97 }],
    },
    stylePillText: {
        color: 'rgba(255,255,255,0.62)',
        fontSize: 12,
        fontFamily: Fonts.nunito,
        fontWeight: '800',
        letterSpacing: 0.35,
    },
    stylePillTextActive: {
        color: '#FFFFFF',
    },

    chatArea: { flex: 1 },
    messages: { flex: 1 },
    messagesContent: { padding: Spacing.lg, gap: 14, paddingBottom: 14 },

    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 4 },
    msgRowUser: { justifyContent: 'flex-end' },
    msgAvatarSmall: {
        width: 28, height: 28, borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center', alignItems: 'center', marginBottom: 2,
    },
    monogramSmall: { fontFamily: Fonts.heading, fontSize: 13, fontWeight: '900' },
    msgAvatarDot: { width: 6, height: 6, borderRadius: 2, backgroundColor: Colors.accentPrimary },

    bubble: { maxWidth: '82%', borderRadius: 18, padding: 16, gap: 6 },
    bubbleAI: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderTopLeftRadius: 4 },
    bubbleUser: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', borderBottomRightRadius: 4 },
    bubbleText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
    bubbleTextUser: { color: '#fff', fontWeight: '500' },
    timestamp: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.textTertiary, alignSelf: 'flex-end', marginTop: 4, letterSpacing: 1 },
    bubbleMetaRow: { marginTop: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    copyBtn: {
        minWidth: 24,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    copyBtnActive: {
        borderColor: 'rgba(160,235,190,0.55)',
        backgroundColor: 'rgba(96,201,136,0.18)',
    },
    copyBtnPressed: {
        transform: [{ scale: 0.96 }],
    },
    copyIcon: {
        color: 'rgba(235,240,250,0.88)',
        fontFamily: Fonts.headingSemi,
        fontSize: 11,
        lineHeight: 12,
    },

    typingBubble: { paddingVertical: 14, paddingHorizontal: 18, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' },
    typingDots: { flexDirection: 'row', gap: 4 },
    dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.accentPrimary },

    inputContainer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 6,
        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
        backgroundColor: Colors.bgPrimary,
    },
    inputBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: Radius.pill,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
        paddingHorizontal: 16, paddingVertical: 2,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.09,
        shadowRadius: 12,
    },
    input: { flex: 1, fontFamily: Fonts.body, fontSize: 16, color: Colors.textPrimary, paddingVertical: 12 },
    sendBtn: { borderRadius: 22, overflow: 'hidden' },
    sendGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    sendIcon: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
