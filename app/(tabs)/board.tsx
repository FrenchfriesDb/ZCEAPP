import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import { useState } from 'react';

// Mock Data
const MOCK_USERS = [
    { id: 1, name: 'Agent 001', rank: 1, xp: 15400, avatar: 'A', stats: { wit: 95, conf: 92, conv: 98 } },
    { id: 2, name: 'Siren', rank: 2, xp: 14200, avatar: 'S', stats: { wit: 88, conf: 95, conv: 90 } },
    { id: 3, name: 'Viper', rank: 3, xp: 13800, avatar: 'V', stats: { wit: 92, conf: 85, conv: 91 } },
    { id: 4, name: 'Ghost', rank: 4, xp: 12100, avatar: 'G', stats: { wit: 80, conf: 88, conv: 85 } },
    { id: 5, name: 'Agent 808', rank: 5, xp: 2450, avatar: 'Y', stats: { wit: 65, conf: 70, conv: 60 }, isMe: true },
];

const TABS = ['DAILY', 'WEEKLY', 'ALL TIME'];
const CATEGORIES = ['OVERALL', 'WIT', 'CONFIDENCE'];

export default function LeaderboardScreen() {
    const [activeTab, setActiveTab] = useState('WEEKLY');
    const [activeCat, setActiveCat] = useState('OVERALL');

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#050508', '#080816', '#0A0A12']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Text style={styles.title}>ELITE RANKINGS</Text>
                <Text style={styles.sub}>COMPETE OR FADE AWAY</Text>
            </View>

            {/* Time Tabs */}
            <View style={styles.tabs}>
                {TABS.map(tab => (
                    <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Category Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 20 }}>
                {CATEGORIES.map(cat => (
                    <Pressable key={cat} onPress={() => setActiveCat(cat)} style={[styles.catTab, activeCat === cat && styles.activeCatTab]}>
                        <Text style={[styles.catText, activeCat === cat && styles.activeCatText]}>{cat}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.list}>
                {MOCK_USERS.map((user) => (
                    <GlassCard key={user.id} style={StyleSheet.flatten([styles.row, user.isMe ? styles.myRow : undefined])} glowColor={user.isMe ? Colors.dark.accentPrimary : undefined}>
                        <Text style={[styles.rank, user.rank <= 3 && styles.topRank]}>{user.rank}</Text>

                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user.avatar}</Text>
                        </View>

                        <View style={styles.info}>
                            <Text style={[styles.name, user.isMe && styles.myName]}>{user.name}</Text>
                            <View style={styles.statsRow}>
                                <Text style={styles.statLabel}>WIT: {user.stats.wit}</Text>
                                <Text style={styles.statLabel}>CONF: {user.stats.conf}</Text>
                            </View>
                        </View>

                        <Text style={styles.xp}>{user.xp.toLocaleString()} XP</Text>
                    </GlassCard>
                ))}
            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60 },
    header: { paddingHorizontal: 20, marginBottom: 20 },
    title: { fontFamily: Fonts.heading, fontSize: 24, color: '#fff', letterSpacing: 2 },
    sub: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textSecondary, marginTop: 4, letterSpacing: 1 },

    tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
    activeTab: { backgroundColor: '#fff' },
    tabText: { fontFamily: Fonts.heading, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    activeTabText: { color: '#000' },

    catScroll: { maxHeight: 40, marginBottom: 20 },
    catTab: { marginRight: 10, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    activeCatTab: { borderColor: Colors.accentPrimary, backgroundColor: 'rgba(74, 158, 255, 0.1)' },
    catText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)' },
    activeCatText: { color: Colors.accentPrimary },

    list: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
    myRow: { borderColor: Colors.accentPrimary, borderWidth: 1 },

    rank: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff', width: 30, textAlign: 'center' },
    topRank: { color: Colors.accentGold, fontSize: 24 },

    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontFamily: Fonts.heading, fontSize: 16, color: '#fff' },

    info: { flex: 1 },
    name: { fontFamily: Fonts.heading, fontSize: 16, color: '#fff', marginBottom: 4 },
    myName: { color: Colors.accentPrimary },

    statsRow: { flexDirection: 'row', gap: 10 },
    statLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.4)' },

    xp: { fontFamily: Fonts.mono, fontSize: 14, color: Colors.accentPrimary, fontWeight: '700' },
});
