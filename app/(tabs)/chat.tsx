
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Animated, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import { AIService, ZANE_SYSTEM_PROMPT } from '@/services/ai';
import { useUser } from '@/context/UserContext';
import { useNavigation, router } from 'expo-router';
import { useTimeColors } from '@/hooks/useTimeColors';
import { getFirstName } from '@/utils/formatters';

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
    const navigation = useNavigation();
    const { user, addChatMessage, clearChat } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);
    const timePalette = useTimeColors();
    const systemColor = timePalette[0];
    const dotAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
            setIsKeyboardActive(true);
        });
        const hideSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
            setIsKeyboardActive(false);
        });
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
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
                        user?.name?.split(' ')[0] || 'AGENT',
                        user?.level || 1
                    );
                    setMessages([{
                        id: 0,
                        text: welcomeText,
                        sender: 'ai',
                        timestamp: getTimeString()
                    }]);
                    addChatMessage({ role: 'assistant', content: welcomeText });
                } catch (e) {
                    const firstName = getFirstName(user?.name);
                    const fallback = `${firstName}-la. Connection unstable. Go find a rep while I reboot.`;
                    setMessages([{ id: 0, text: fallback, sender: 'ai', timestamp: getTimeString() }]);
                } finally {
                    setIsTyping(false);
                }
            };
            fetchWelcome();
        }
    }, [user?.email]);

    useEffect(() => {
        if (isTyping) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [isTyping]);

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
                user?.name || 'AGENT',
                user?.level || 1
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

            // Stripping bold labels (BRUTAL TRUTH:, DRILL:, CLOSER:, ZANE LINE:) just in case the AI hallucinates them
            const boldsToStrip = [/BRUTAL TRUTH:/gi, /DRILL:/gi, /CLOSER:/gi, /ZANE LINE:/gi, /ONE SURGICAL REALIZATION:/gi, /ONE NON-NEGOTIABLE DRILL:/gi, /ONE ZANE QUOTABLE:/gi, /ONE CLOSER:/gi];
            boldsToStrip.forEach(reg => {
                responseText = responseText.replace(reg, '');
            });
            responseText = responseText.trim();

            setIsTyping(false);
            addAiMessage(responseText);
            await addChatMessage({ role: 'assistant', content: responseText });

        } catch (e) {
            setIsTyping(false);
            const fallback = "Neural link saturated. I'm busy auditing your last failure. Go approach someone.";
            addAiMessage(fallback);
            await addChatMessage({ role: 'assistant', content: fallback });
        }
    };

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable onPress={() => router.back()} style={styles.backBtnHeader}>
                        <Text style={styles.backIconHeader}>←</Text>
                    </Pressable>
                    <Animated.View style={[styles.aiAvatar, { transform: [{ scale: pulseAnim }], backgroundColor: systemColor, shadowColor: systemColor }]}>
                        <Text style={styles.monogram}>Z</Text>
                    </Animated.View>
                    <View>
                        <Text style={styles.headerTitle}>Z.A.N.E. AI</Text>
                        <Text style={styles.headerSub}>ARCHITECT MODE: {isTyping ? 'ANALYZING...' : 'ONLINE'}</Text>
                    </View>
                </View>
                <Pressable onPress={() => clearChat()} style={styles.purgeBtn}>
                    <Text style={styles.purgeText}>PURGE HISTORY</Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={styles.chatArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.messages}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
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
                                <Text style={[styles.bubbleText, msg.sender === 'user' && styles.bubbleTextUser]}>
                                    {msg.text}
                                </Text>
                                <Text style={styles.timestamp}>{msg.timestamp}</Text>
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
                <View style={[styles.inputContainer, isKeyboardActive && { paddingBottom: 0 }]}>
                    <View style={styles.inputBox}>
                        <TextInput
                            style={styles.input}
                            placeholder="Deep dive protocol..."
                            placeholderTextColor={Colors.textTertiary}
                            value={input}
                            onChangeText={setInput}
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
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    aiAvatar: {
        width: 36, height: 36, borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center', alignItems: 'center',
        shadowRadius: 15, shadowOpacity: 0.5,
    },
    monogram: { fontFamily: Fonts.heading, fontSize: 18, color: '#000000', fontWeight: '900' },
    aiDot: { width: 10, height: 10, borderRadius: 3, backgroundColor: Colors.accentPrimary, shadowColor: Colors.accentPrimary, shadowRadius: 10, shadowOpacity: 0.8 },
    headerTitle: { fontFamily: Fonts.heading, fontSize: FontSizes.lg, color: Colors.textPrimary, letterSpacing: 2, fontWeight: '800' },
    headerSub: { fontFamily: Fonts.monoBold, fontSize: 8, color: Colors.accentPrimary, letterSpacing: 2, textTransform: 'uppercase' },
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
    purgeBtn: { padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
    purgeText: { color: Colors.textTertiary, fontSize: 8, fontFamily: Fonts.monoBold },

    chatArea: { flex: 1 },
    messages: { flex: 1 },
    messagesContent: { padding: Spacing.lg, gap: 14, paddingBottom: 30 },

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

    typingBubble: { paddingVertical: 14, paddingHorizontal: 18, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' },
    typingDots: { flexDirection: 'row', gap: 4 },
    dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.accentPrimary },

    inputContainer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Clean flush padding for home indicator
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
        backgroundColor: Colors.bgPrimary,
    },
    inputBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: Radius.pill,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 16, paddingVertical: 2,
    },
    input: { flex: 1, fontFamily: Fonts.body, fontSize: 16, color: Colors.textPrimary, paddingVertical: 12 },
    sendBtn: { borderRadius: 22, overflow: 'hidden' },
    sendGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    sendIcon: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
