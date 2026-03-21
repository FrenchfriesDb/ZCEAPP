import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import {
    loadNotifSettings, saveNotifSettings, DEFAULT_SETTINGS, NotifSettings
} from '@/services/notifications';
import { useTimeColors } from '@/hooks/useTimeColors';
import FluentEmoji, { resolveFluentEmojiName } from '@/components/FluentEmoji';

const NOTIFICATION_ITEMS: {
    key: keyof NotifSettings;
    emoji: string;
    title: string;
    subtitle: string;
    time: string;
}[] = [
        {
            key: 'morningIgnition',
            emoji: '⚡',
            title: 'MORNING IGNITION',
            subtitle: 'Daily mission briefing to start your day locked in.',
            time: '8:00 AM daily',
        },
        {
            key: 'noonRoast',
            emoji: '🔥',
            title: 'MIDDAY ROAST',
            subtitle: 'Zane checks in. Gut punch. Short. Tactical.',
            time: '12:00 PM daily',
        },
        {
            key: 'streakProtector',
            emoji: '🛡️',
            title: 'STREAK PROTECTOR',
            subtitle: 'Only fires if you haven\'t trained that day. Streak anxiety is a feature.',
            time: '7:00 PM (inactive days only)',
        },
        {
            key: 'questReminder',
            emoji: '📋',
            title: 'QUEST REMINDER',
            subtitle: 'Fires when you opened DOJO but didn\'t complete anything. Accountability.',
            time: 'Triggered by behavior',
        },
        {
            key: 'streakMilestone',
            emoji: '🏆',
            title: 'STREAK MILESTONES',
            subtitle: 'Celebrates 3, 7, 14, and 30-day streaks. You earned it.',
            time: 'On achievement',
        },
        {
            key: 'levelUp',
            emoji: '⬆️',
            title: 'LEVEL UP ALERT',
            subtitle: 'When you gain enough XP to advance. The leaderboard noticed.',
            time: 'On achievement',
        },
        {
            key: 'reengagement',
            emoji: '👻',
            title: 'RE-ENGAGEMENT',
            subtitle: 'Fires ONCE after 48 hours of no app opens. Not repeatedly.',
            time: '48h after last open',
        },
    ];

export default function NotificationSettingsScreen() {
    const timePalette = useTimeColors();
    // Use the lightest color for text visibility on dark themes
    const systemColor = timePalette[timePalette.length - 1];
    const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadNotifSettings().then(loaded => {
            if (loaded) setSettings(loaded);
        });
    }, []);

    const toggle = async (key: keyof NotifSettings) => {
        const updated = { ...settings, [key]: !settings[key] };
        setSettings(updated);
        await saveNotifSettings(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    const disableAll = async () => {
        Alert.alert(
            'DISABLE ALL NOTIFICATIONS',
            'Are you sure? Zane will go silent. Your streak dies alone.',
            [
                { text: 'KEEP THEM', style: 'cancel' },
                {
                    text: 'SILENCE ZANE',
                    style: 'destructive',
                    onPress: async () => {
                        const off = Object.fromEntries(
                            Object.keys(DEFAULT_SETTINGS).map(k => [k, false])
                        ) as unknown as NotifSettings;
                        setSettings(off);
                        await saveNotifSettings(off);
                    },
                },
            ]
        );
    };

    const enableAll = async () => {
        setSettings(DEFAULT_SETTINGS);
        await saveNotifSettings(DEFAULT_SETTINGS);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    const rules = [
        { icon: '📵', text: 'Never fires between 10 PM - 7 AM' },
        { icon: '📊', text: 'Maximum 3 notifications per day' },
        { icon: '👤', text: 'Always addressed to you by name' },
        { icon: '⏰', text: 'All times in your local timezone' },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#050508', '#080816', '#000000']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← BACK</Text>
                </Pressable>
                <Text style={styles.title}>ALERT SYSTEM</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Saved confirmation */}
            {saved && (
                <View style={styles.savedBadge}>
                    <Text style={styles.savedText}>✓ SAVED</Text>
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Rules overview */}
                <View style={styles.rulesCard}>
                    <Text style={styles.rulesTitle}>STANDING RULES</Text>
                    {rules.map((rule) => {
                        const fluentName = resolveFluentEmojiName(rule.icon);
                        return (
                            <View key={rule.text} style={styles.rulesLineRow}>
                                {fluentName ? (
                                    <FluentEmoji name={fluentName} size={18} style={styles.rulesLineEmojiImage} />
                                ) : (
                                    <Text style={styles.rulesLineEmoji}>{rule.icon}</Text>
                                )}
                                <Text style={styles.rulesLine}>{rule.text}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Toggle list */}
                {NOTIFICATION_ITEMS.map((item, idx) => (
                    <Pressable
                        key={item.key}
                        style={styles.row}
                        onPress={() => toggle(item.key)}
                        android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
                    >
                        <View style={styles.rowLeft}>
                            {resolveFluentEmojiName(item.emoji) ? (
                                <FluentEmoji name={resolveFluentEmojiName(item.emoji)!} size={24} style={styles.rowEmojiImage} />
                            ) : (
                                <Text style={styles.rowEmoji}>{item.emoji}</Text>
                            )}
                            <View style={styles.rowText}>
                                <Text style={[
                                    styles.rowTitle,
                                    !settings?.[item.key] && styles.rowTitleOff
                                ]}>
                                    {item.title}
                                </Text>
                                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                                <Text style={[styles.rowTime, { color: systemColor + 'AA' }]}>
                                    {item.time}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={settings?.[item.key] ?? false}
                            onValueChange={() => toggle(item.key)}
                            trackColor={{ false: 'rgba(255,255,255,0.08)', true: systemColor + '55' }}
                            thumbColor={settings?.[item.key] ? systemColor : 'rgba(255,255,255,0.3)'}
                            ios_backgroundColor="rgba(255,255,255,0.08)"
                        />
                    </Pressable>
                ))}

                {/* Bulk actions */}
                <View style={styles.bulkRow}>
                    <Pressable style={styles.bulkBtn} onPress={enableAll}>
                        <Text style={[styles.bulkBtnText, { color: systemColor }]}>ENABLE ALL</Text>
                    </Pressable>
                    <Pressable style={[styles.bulkBtn, styles.bulkBtnDanger]} onPress={disableAll}>
                        <Text style={[styles.bulkBtnText, { color: 'rgba(255,80,80,0.8)' }]}>DISABLE ALL</Text>
                    </Pressable>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: 56,
        paddingBottom: 12,
    },
    backBtn: { padding: 8, minWidth: 60 },
    backText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1 },
    title: {
        flex: 1,
        fontFamily: Fonts.heading,
        fontSize: 15,
        color: Colors.textPrimary,
        letterSpacing: 3,
        textAlign: 'center',
    },

    savedBadge: {
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 200, 83, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(0, 200, 83, 0.4)',
        borderRadius: Radius.pill,
        paddingHorizontal: 14,
        paddingVertical: 4,
        marginBottom: 8,
    },
    savedText: { fontFamily: Fonts.monoBold, fontSize: 10, color: '#00C853', letterSpacing: 2 },

    content: { paddingHorizontal: Spacing.md, paddingTop: 8 },

    rulesCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: Radius.lg,
        padding: 16,
        marginBottom: 20,
        gap: 6,
    },
    rulesTitle: {
        fontFamily: Fonts.monoBold,
        fontSize: 9,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 2,
        marginBottom: 4,
    },
    rulesLineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rulesLineEmoji: {
        width: 18,
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    rulesLineEmojiImage: {
        width: 18,
        height: 18,
    },
    rulesLine: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 20,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: Radius.lg,
        marginBottom: 10,
        gap: 12,
    },
    rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    rowEmoji: { fontSize: 22, marginTop: 2 },
    rowEmojiImage: { marginTop: 2 },
    rowText: { flex: 1, gap: 2 },
    rowTitle: {
        fontFamily: Fonts.monoBold,
        fontSize: 11,
        color: Colors.textPrimary,
        letterSpacing: 1,
    },
    rowTitleOff: { color: 'rgba(255,255,255,0.3)' },
    rowSubtitle: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 16,
    },
    rowTime: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        letterSpacing: 0.5,
        marginTop: 2,
    },

    bulkRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    bulkBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: Radius.md,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
    },
    bulkBtnDanger: {
        borderColor: 'rgba(255,80,80,0.2)',
        backgroundColor: 'rgba(255,80,80,0.04)',
    },
    bulkBtnText: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        letterSpacing: 1.5,
    },
});
