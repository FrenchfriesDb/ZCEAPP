import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import { db } from '@/services/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useUser } from '@/context/UserContext';

const SIMULATED_DATA = [
    { rank: 1, name: 'DarkCEO_Zane', level: 9, title: 'Dark CEO', xp: 4200, aura: 9850, streak: 47 },
    { rank: 2, name: 'ShadowArchitect', level: 8, title: 'Social Architect', xp: 3400, aura: 8200, streak: 32 },
    { rank: 3, name: 'MidnightWolf', level: 7, title: 'Charisma Lord', xp: 2800, aura: 6900, streak: 28 },
    { rank: 4, name: 'IronMindset', level: 6, title: 'Magnetic', xp: 1900, aura: 4500, streak: 21 },
    { rank: 5, name: 'TheProtocol', level: 5, title: 'Influencer', xp: 1200, aura: 3200, streak: 15 },
    { rank: 6, name: 'NeuralEdge', level: 5, title: 'Influencer', xp: 1100, aura: 2900, streak: 12 },
    { rank: 7, name: 'QuantumSocial', level: 4, title: 'Connector', xp: 800, aura: 2100, streak: 9 },
    { rank: 8, name: 'ColdApproach99', level: 3, title: 'Socialite', xp: 500, aura: 1200, streak: 6 },
    { rank: 9, name: 'SilentStorm', level: 2, title: 'Apprentice', xp: 200, aura: 600, streak: 3 },
    { rank: 10, name: 'NewRecruit_42', level: 1, title: 'Observer', xp: 50, aura: 150, streak: 1 },
];

const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return Colors.textTertiary;
};

const getRankLabel = (rank: number) => {
    if (rank <= 9) return `0${rank}`;
    return `${rank}`;
};

// Detect if this is the current user's row (simulated = last rank)
const isUserRow = (rank: number, data: any[]) => rank === data.length;

export default function LeaderboardScreen() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'TACTICAL' | 'GLOBAL'>('TACTICAL');
    const [globalData, setGlobalData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'GLOBAL') fetchGlobalRankings();
    }, [activeTab]);

    const fetchGlobalRankings = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(20));
            const snapshot = await getDocs(q);
            const rankings: any[] = [];
            let r = 1;
            snapshot.forEach((doc) => {
                const data = doc.data();
                rankings.push({
                    rank: r++,
                    name: data.name || 'Anonymous Agent',
                    level: data.level || 0,
                    title: data.title || 'Initiate',
                    xp: data.xp || 0,
                    aura: ((data.level || 0) * 1000) + (data.xp || 0),
                    streak: data.streak || 0,
                    isMe: doc.id === user?.email,
                });
            });
            setGlobalData(rankings);
        } catch (e: any) {
            console.error('GLOBAL RANKINGS ERROR:', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const currentData = activeTab === 'TACTICAL' ? SIMULATED_DATA : globalData;

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerEyebrow}>MAGNETIC AURA RANKINGS</Text>
                    <View style={styles.titleRow}>
                        <Text style={styles.headerTitle}>Board</Text>
                        <View style={styles.tabSwitcher}>
                            {(['TACTICAL', 'GLOBAL'] as const).map(tab => (
                                <Pressable
                                    key={tab}
                                    onPress={() => setActiveTab(tab)}
                                    style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
                                >
                                    <Text style={[styles.tabPillText, activeTab === tab && styles.tabPillTextActive]}>
                                        {tab === 'TACTICAL' ? 'SIM' : 'LIVE'}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Top-3 podium */}
                {!isLoading && currentData.length >= 3 && (
                    <View style={styles.podium}>
                        {[currentData[1], currentData[0], currentData[2]].map((entry, i) => {
                            const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32'];
                            const heights = [80, 110, 60];
                            return (
                                <View key={entry.rank} style={styles.podiumSlot}>
                                    <Text style={styles.podiumName} numberOfLines={1}>{entry.name.split('_')[0]}</Text>
                                    <View style={[styles.podiumBlock, {
                                        height: heights[i],
                                        borderTopColor: podiumColors[i],
                                        shadowColor: podiumColors[i],
                                    }]}>
                                        <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                                        <Text style={[styles.podiumRank, { color: podiumColors[i] }]}>
                                            #{entry.rank}
                                        </Text>
                                        <Text style={styles.podiumAura}>{(entry.aura / 1000).toFixed(1)}k</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Rankings list */}
                {isLoading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator color={Colors.accentPrimary} />
                        <Text style={styles.loaderText}>SCANNING ENCRYPTED DATA...</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {currentData.map((entry, i) => {
                            const isMe = entry.isMe || (activeTab === 'TACTICAL' && i === currentData.length - 1);
                            const isTop3 = entry.rank <= 3;
                            const rankColor = isMe ? Colors.accentDanger : getRankColor(entry.rank);

                            return (
                                <View
                                    key={i}
                                    style={[
                                        styles.row,
                                        isMe && styles.rowMe,
                                        isTop3 && { borderColor: `${rankColor}30` },
                                    ]}
                                >
                                    <BlurView intensity={isMe ? 20 : 12} tint="dark" style={StyleSheet.absoluteFill} />

                                    {/* Left accent line */}
                                    {isMe && <View style={[styles.meAccent, { backgroundColor: Colors.accentDanger }]} />}

                                    {/* Rank badge */}
                                    <View style={[styles.rankBadge, { borderColor: `${rankColor}50` }]}>
                                        <Text style={[styles.rankText, { color: rankColor }]}>
                                            {getRankLabel(entry.rank)}
                                        </Text>
                                    </View>

                                    {/* User info */}
                                    <View style={styles.rowContent}>
                                        <Text style={[styles.rowName, isMe && { color: Colors.accentPrimary }]}>
                                            {entry.name.toUpperCase()}
                                            {isMe ? '  ◈ YOU' : ''}
                                        </Text>
                                        <View style={styles.rowMeta}>
                                            <Text style={styles.rowTitle}>{entry.title}</Text>
                                            <View style={[styles.levelPill, { backgroundColor: `${rankColor}15`, borderColor: `${rankColor}30` }]}>
                                                <Text style={[styles.levelPillText, { color: rankColor }]}>L{entry.level}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Aura score */}
                                    <View style={styles.rowRight}>
                                        <Text style={[styles.auraScore, { color: isMe ? Colors.accentDanger : (isTop3 ? rankColor : Colors.accentPrimary) }]}>
                                            {entry.aura.toLocaleString()}
                                        </Text>
                                        <Text style={styles.auraLabel}>AURA</Text>
                                    </View>
                                </View>
                            );
                        })}
                        {activeTab === 'GLOBAL' && currentData.length === 0 && (
                            <Text style={styles.emptyText}>NO AGENTS FOUND IN SECTOR.</Text>
                        )}
                    </View>
                )}
                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingTop: 60 },

    ambientGlow: {
        position: 'absolute', top: 0, right: -40,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(255, 68, 68, 0.04)',
    },

    header: { marginBottom: 24 },
    headerEyebrow: {
        fontFamily: Fonts.monoBold,
        fontSize: 9, color: Colors.accentPrimary,
        letterSpacing: 3, marginBottom: 6, opacity: 0.7,
    },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: {
        fontFamily: Fonts.heading,
        fontSize: FontSizes.h1,
        color: Colors.textPrimary,
        fontWeight: '800', letterSpacing: 0.5,
    },
    tabSwitcher: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: Radius.pill,
        padding: 3, gap: 4,
        borderWidth: 1, borderColor: Colors.borderGlass,
    },
    tabPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.pill },
    tabPillActive: {
        backgroundColor: 'rgba(144, 202, 249, 0.12)',
        shadowColor: Colors.accentPrimary,
        shadowRadius: 8, shadowOpacity: 0.3,
    },
    tabPillText: { fontFamily: Fonts.monoBold, fontSize: 9, color: Colors.textTertiary, letterSpacing: 1 },
    tabPillTextActive: { color: Colors.accentPrimary },

    // Podium
    podium: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    podiumSlot: { flex: 1, alignItems: 'center', gap: 6 },
    podiumName: {
        fontFamily: Fonts.monoBold, fontSize: 9,
        color: Colors.textSecondary, letterSpacing: 0.5,
    },
    podiumBlock: {
        width: '100%',
        borderTopWidth: 2,
        overflow: 'hidden',
        borderRadius: Radius.sm,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 16, shadowOpacity: 0.4,
    },
    podiumRank: { fontFamily: Fonts.monoBold, fontSize: FontSizes.xl, fontWeight: '800' },
    podiumAura: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary, letterSpacing: 1 },

    // List rows
    listContainer: { gap: 8 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.borderGlass,
        overflow: 'hidden',
        position: 'relative',
    },
    rowMe: {
        borderColor: Colors.borderDanger,
        shadowColor: Colors.accentDanger,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 16,
        shadowOpacity: 0.25,
    },
    meAccent: {
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, borderRadius: 2,
    },

    rankBadge: {
        width: 38, height: 38,
        borderRadius: Radius.sm,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    rankText: { fontFamily: Fonts.monoBold, fontSize: FontSizes.md, fontWeight: '800' },

    rowContent: { flex: 1, gap: 3 },
    rowName: {
        fontFamily: Fonts.headingSemi,
        fontSize: FontSizes.md, color: Colors.textPrimary, fontWeight: '700', letterSpacing: 0.3,
    },
    rowMeta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    rowTitle: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textSecondary, letterSpacing: 0.5 },
    levelPill: {
        paddingHorizontal: 7, paddingVertical: 1,
        borderRadius: Radius.pill, borderWidth: 1,
    },
    levelPillText: { fontFamily: Fonts.monoBold, fontSize: 8, letterSpacing: 0.5 },

    rowRight: { alignItems: 'flex-end' },
    auraScore: { fontFamily: Fonts.monoBold, fontSize: FontSizes.xl, fontWeight: '800' },
    auraLabel: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.textTertiary, letterSpacing: 2 },

    loader: { padding: 40, alignItems: 'center', gap: 15 },
    loaderText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textTertiary, letterSpacing: 2 },
    emptyText: { textAlign: 'center', color: Colors.textTertiary, fontFamily: Fonts.mono, fontSize: 10, marginTop: 40 },
});
