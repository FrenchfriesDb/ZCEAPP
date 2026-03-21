import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, FontSizes, Spacing, Radius, XPConfig } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import { db, auth } from '@/services/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useUser } from '@/context/UserContext';
import { formatDisplayName } from '@/utils/formatters';
import { useTextColors } from '@/context/TextColorsContext';

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

const getMetalPalette = (rank: number) => {
    if (rank === 1) {
        return { edge: '#FFD76A', light: 'rgba(255, 245, 204, 0.65)', fillA: 'rgba(255, 215, 0, 0.22)', fillB: 'rgba(255, 172, 28, 0.04)' };
    }
    if (rank === 2) {
        return { edge: '#D3D3D3', light: 'rgba(255, 255, 255, 0.55)', fillA: 'rgba(210, 210, 210, 0.2)', fillB: 'rgba(115, 125, 138, 0.05)' };
    }
    return { edge: '#CD7F32', light: 'rgba(255, 216, 183, 0.55)', fillA: 'rgba(205, 127, 50, 0.2)', fillB: 'rgba(97, 54, 22, 0.05)' };
};

const getSolidThemeAccent = (color: string) => {
    const rgbaMatch = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (rgbaMatch) {
        return `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
    }
    return color.replace(/88$/i, '').replace(/44$/i, '');
};

const getThemeTint = (color: string, alpha: number) => {
    const rgbMatch = color.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
    if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
    }

    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
        return `rgba(${parseInt(hexMatch[1], 16)}, ${parseInt(hexMatch[2], 16)}, ${parseInt(hexMatch[3], 16)}, ${alpha})`;
    }

    return color;
};

export default function LeaderboardScreen() {
    const { user } = useUser();
    const { textSecondary } = useTextColors();
    const selfHighlight = getSolidThemeAccent(textSecondary);
    const glassBorder = getThemeTint(selfHighlight, 0.24);
    const glassFill = getThemeTint(selfHighlight, 0.12);
    const glassFillSoft = getThemeTint(selfHighlight, 0.1);
    const glassText = selfHighlight;
    const glassSheen = getThemeTint(selfHighlight, 0.14);
    const [globalData, setGlobalData] = useState<any[]>([]);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchGlobalRankings();
    }, []);

    const fetchGlobalRankings = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));
            const snapshot = await getDocs(q);
            const rankings: any[] = [];
            let r = 1;
            let identifiedRank = null;

            snapshot.forEach((doc) => {
                const data = doc.data();
                // Prioritize username, fallback to agent tag if empty
                const rawUsername = data.username || data.name || 'ANON';
                const displayName = `@${rawUsername.replace(/\s+/g, '_').toLowerCase()}`;

                const isMe = doc.id === auth.currentUser?.uid;

                if (isMe) identifiedRank = r;

                rankings.push({
                    rank: r++,
                    name: displayName,
                    level: data.level || 0,
                    title: data.title || 'Initiate',
                    xp: data.xp || 0,
                    aura: ((data.level || 0) * 1000) + (data.xp || 0),
                    streak: data.streak || 0,
                    isMe,
                });
            });
            setGlobalData(rankings);
            setMyRank(identifiedRank);
        } catch (e: any) {
            console.error('GLOBAL RANKINGS ERROR:', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const currentData = globalData;

    // My Display Info for Sticky (LIVE TAB ONLY)
    const myDisplayInfo = {
        rank: myRank || '>50',
        aura: ((XPConfig.getLevel(user?.xp || 0).level || 0) * 1000) + (user?.xp || 0),
        username: `@${(user?.username || formatDisplayName(user?.name) || 'INITIATE').replace(/\s+/g, '_').toLowerCase()}`
    };

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerEyebrow}>MAGNETIC AURA RANKINGS</Text>
                    <View style={styles.titleRow}>
                        <Text style={styles.headerTitle}>Board</Text>
                        <View style={styles.livePillShell}>
                            <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={[glassFill, 'rgba(255,255,255,0.02)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={[styles.livePillHighlight, { backgroundColor: glassSheen }]} />
                            <Text style={[styles.livePillText, { color: glassText }]}>LIVE LEADERBOARD</Text>
                        </View>
                    </View>
                </View>

                {/* Top-3 podium */}
                {!isLoading && currentData.length >= 3 && (
                    <View style={styles.podium}>
                        {[currentData[1], currentData[0], currentData[2]].map((entry, i) => {
                            const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32'];
                            const heights = [80, 110, 60];
                            const displayName = entry.name;
                            const metal = getMetalPalette(entry.rank);
                            return (
                                <View key={entry.rank} style={styles.podiumSlot}>
                                    <Text style={styles.podiumName} numberOfLines={1}>{displayName.split('_')[0]}</Text>
                                    <View style={[styles.podiumBlock, {
                                        height: heights[i],
                                        borderTopColor: metal.edge,
                                        borderColor: `${metal.edge}55`,
                                        shadowColor: metal.edge,
                                    }]}>
                                        <LinearGradient
                                            colors={[metal.fillA, metal.fillB]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <LinearGradient
                                            colors={[metal.light, 'rgba(255,255,255,0.06)', 'transparent']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.podiumSheen}
                                        />
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
                            const isMe = !!entry.isMe;
                            const isTop3 = entry.rank <= 3;
                            const rankColor = isMe ? selfHighlight : getRankColor(entry.rank);

                            return (
                                <View
                                    key={i}
                                    style={[
                                        styles.row,
                                        isMe && [styles.rowMe, { borderColor: `${selfHighlight}50`, shadowColor: selfHighlight }],
                                        isTop3 && { borderColor: `${rankColor}30` },
                                    ]}
                                >
                                    <BlurView intensity={isMe ? 30 : 12} tint="dark" style={StyleSheet.absoluteFill} />

                                    {/* Left accent line */}
                                    {isMe && <View style={[styles.meAccent, { backgroundColor: selfHighlight }]} />}

                                    {/* Rank badge */}
                                    <View style={[styles.rankBadge, { borderColor: `${rankColor}50` }]}>
                                        <Text style={[styles.rankText, { color: rankColor }]}>
                                            {getRankLabel(entry.rank)}
                                        </Text>
                                    </View>

                                    {/* User info */}
                                    <View style={styles.rowContent}>
                                        <Text style={[styles.rowName, isMe && { color: selfHighlight }]}>
                                            {entry.name}
                                            {isMe ? ' ◈ YOU' : ''}
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
                                        <Text style={[styles.auraScore, { color: isMe ? selfHighlight : (isTop3 ? rankColor : Colors.accentPrimary) }]}>
                                            {entry.aura.toLocaleString()}
                                        </Text>
                                        <Text style={styles.auraLabel}>AURA</Text>
                                    </View>
                                </View>
                            );
                        })}
                        {currentData.length === 0 && (
                            <Text style={styles.emptyText}>NO AGENTS FOUND IN SECTOR.</Text>
                        )}
                    </View>
                )}
                <View style={{ height: 160 }} />
            </ScrollView>

            {/* Floating Personal Rank Indicator (LIVE TAB ONLY) */}
            {!isLoading && (
                <View style={styles.floatingContainer}>
                    <View style={[styles.floatingRankBubble, { borderColor: glassBorder, shadowColor: glassText }]}>
                        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                            colors={[glassFill, 'rgba(255, 255, 255, 0.03)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={[styles.floatingTopSheen, { backgroundColor: glassSheen }]} />
                        <View style={styles.floatingContent}>
                            <View style={styles.floatingInfo}>
                                <Text style={styles.floatingLabel}>YOUR STANDING</Text>
                                <Text style={styles.floatingUser} numberOfLines={1}>{myDisplayInfo.username}</Text>
                            </View>

                            <View style={styles.floatingDivider} />

                            <View style={styles.floatingStats}>
                                <View style={[styles.rankPill, { borderColor: glassBorder, backgroundColor: glassFillSoft }]}>
                                    <Text style={[styles.rankPillValue, { color: glassText }]}>#{myDisplayInfo.rank}</Text>
                                </View>
                                <View style={styles.auraBox}>
                                    <Text style={[styles.auraVal, { color: glassText }]}>{myDisplayInfo.aura.toLocaleString()}</Text>
                                    <Text style={styles.auraSub}>AURA</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            )}
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
    livePillShell: {
        minWidth: 142,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 18,
        shadowOpacity: 0.08,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    livePillHighlight: {
        position: 'absolute',
        top: 1,
        left: 10,
        right: 10,
        height: '48%',
        borderRadius: 16,
        opacity: 0.9,
    },
    livePillText: {
        fontFamily: Fonts.monoBold,
        fontSize: 9,
        letterSpacing: 1.5,
        textAlign: 'center',
    },

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
        borderWidth: 1,
        borderTopWidth: 2,
        overflow: 'hidden',
        borderRadius: Radius.sm,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 16, shadowOpacity: 0.4,
    },
    podiumSheen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '62%',
    },
    podiumRank: { fontFamily: Fonts.monoBold, fontSize: FontSizes.xl, fontWeight: '800' },
    podiumAura: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary, letterSpacing: 1 },

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

    floatingContainer: {
        position: 'absolute',
        bottom: 95, // Lifted higher to clear tab bar
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    floatingRankBubble: {
        width: '100%',
        maxWidth: 400,
        height: 72,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        shadowOpacity: 0.15,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    floatingTopSheen: {
        position: 'absolute',
        top: 2,
        left: 12,
        right: 12,
        height: '46%',
        borderRadius: 18,
    },
    floatingContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
    },
    floatingInfo: { flex: 1, gap: 2 },
    floatingLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 },
    floatingUser: { fontFamily: Fonts.heading, fontSize: 16, color: '#fff', fontWeight: '800' },
    floatingDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 15,
    },
    floatingStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rankPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
    },
    rankPillValue: { fontFamily: Fonts.monoBold, fontSize: 18 },
    auraBox: { alignItems: 'flex-end' },
    auraVal: { fontFamily: Fonts.monoBold, fontSize: 15 },
    auraSub: { fontFamily: Fonts.mono, fontSize: 7, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
});
