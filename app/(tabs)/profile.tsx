import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Spacing, Radius, XPConfig } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import { useUser } from '@/context/UserContext';
import { router } from 'expo-router';
import { useState } from 'react';

export default function ProfileScreen() {
    const { user, signOut } = useUser();
    const [archivesVisible, setArchivesVisible] = useState(false);
    const [archiveTab, setArchiveTab] = useState<'drills' | 'journal'>('journal');
    const levelInfo = XPConfig.getLevel(user?.xp || 0);
    const xpInLevel = XPConfig.getXpInCurrentLevel(user?.xp || 0);

    // Derive activity stats from drill logs and completed quests
    const totalDrills = user?.drillLogs?.length || 0;
    const totalMissions = user?.completedQuests?.length || 0;
    // Jokes told = completed Stand-Up Drill sessions (comedian drill)
    const jokesTold = user?.drillLogs?.filter((l: any) => l.type === 'Stand-Up Drill').length || 0;
    // Convos started = social-type quests/missions completed
    const SOCIAL_IDS = ['qs_stranger', 'qs_lead', 'qs_cold', 'dm_stranger', 'dm_eyelock', 'dm_compliment', 'dm_door', 'dm_highfive', 'dm_direction', 'dm_joke', 'dm_lead', 'dm_rival'];
    const convosStarted = (user?.completedQuests || []).filter((id: string) => SOCIAL_IDS.includes(id)).length;

    if (!user) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 24, padding: 32 }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 3 }}>IDENTITY NOT FOUND</Text>
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontFamily: Fonts.mono, fontSize: 9, textAlign: 'center', letterSpacing: 1 }}>
                Session error detected.{`\n`}Force logout to return to login.
            </Text>
            <Pressable
                onPress={() => signOut()}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }}
            >
                <Text style={{ color: Colors.textPrimary, fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 2 }}>FORCE LOGOUT</Text>
            </Pressable>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header / Identity Card */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                        </View>
                        <View style={styles.onlineBadge} />
                    </View>
                    <View style={styles.identity}>
                        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>{user.name.toUpperCase()}</Text>
                        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{user.title}</Text>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>LVL {levelInfo.level} • {levelInfo.title.toUpperCase()}</Text>
                        </View>
                    </View>

                    <Pressable onPress={() => router.push('/settings/edit-profile')} style={styles.settingsBtn}>
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </Pressable>
                </View>

                {/* Stats Grid — 4 real stats */}
                <View style={styles.statsGrid}>
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>LEVEL XP</Text>
                        <Text style={styles.statValue}>{xpInLevel}</Text>
                        <Text style={styles.statSub}>/ {levelInfo.xpToComplete} XP</Text>
                    </GlassCard>
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>STREAK</Text>
                        <Text style={styles.statValue}>{user.streak}</Text>
                        <Text style={styles.statSub}>DAYS ACTIVE</Text>
                    </GlassCard>
                </View>
                <View style={styles.statsGrid}>
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>DRILLS DONE</Text>
                        <Text style={styles.statValue}>{totalDrills}</Text>
                        <Text style={styles.statSub}>TOTAL REPS</Text>
                    </GlassCard>
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>MISSIONS</Text>
                        <Text style={styles.statValue}>{totalMissions}</Text>
                        <Text style={styles.statSub}>COMPLETED</Text>
                    </GlassCard>
                </View>
                {(jokesTold > 0 || convosStarted > 0) && (
                    <View style={styles.statsGrid}>
                        {jokesTold > 0 && (
                            <GlassCard style={styles.statCard}>
                                <Text style={styles.statLabel}>JOKES TOLD</Text>
                                <Text style={styles.statValue}>{jokesTold}</Text>
                                <Text style={styles.statSub}>STAND-UP SETS</Text>
                            </GlassCard>
                        )}
                        {convosStarted > 0 && (
                            <GlassCard style={styles.statCard}>
                                <Text style={styles.statLabel}>CONVOS STARTED</Text>
                                <Text style={styles.statValue}>{convosStarted}</Text>
                                <Text style={styles.statSub}>SOCIAL OPS</Text>
                            </GlassCard>
                        )}
                    </View>
                )}

                {/* Bio / Mission */}
                <GlassCard style={styles.bioCard}>
                    <Text style={styles.sectionTitle}>MISSION STATEMENT</Text>
                    <Text style={styles.bioText}>"{user.bio}"</Text>
                </GlassCard>



                {/* Archives Access */}
                <Pressable onPress={() => setArchivesVisible(true)} style={styles.archivesBtn}>
                    <Text style={styles.archivesBtnIcon}>📂</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.archivesBtnTitle}>Archives</Text>
                        <Text style={styles.archivesBtnSub}>Training logs, mission journals, Zane entries</Text>
                    </View>
                    <Text style={styles.archivesBtnArrow}>→</Text>
                </Pressable>

                {/* Sign Out */}
                <Pressable
                    onPress={() => signOut()}
                    style={{
                        marginTop: 12, marginBottom: 16,
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: 10, paddingVertical: 16,
                        alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)',
                    }}
                >
                    <Text style={{ fontFamily: Fonts.mono, color: Colors.textSecondary, fontSize: 12, letterSpacing: 2 }}>
                        ⏻  SIGN OUT
                    </Text>
                </Pressable>

                {/* Footer Links (Review Requirements) */}
                <View style={{ marginTop: 20, marginBottom: 40, alignItems: 'center', gap: 12 }}>
                    <Pressable onPress={() => Alert.alert('LEGAL PROTOCOL', 'Terms of Service version 2.0.1. \n\nBy using the Engine, you agree to Forge your character without excuses.')}>
                        <Text style={{ fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.2)', fontSize: 9, textDecorationLine: 'underline' }}>TERMS OF SERVICE</Text>
                    </Pressable>
                    <Pressable onPress={() => Alert.alert('PRIVACY PROTOCOL', 'Privacy Policy version 2.0.1. \n\nYour data is encrypted and used only for internal Engine training.')}>
                        <Text style={{ fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.2)', fontSize: 9, textDecorationLine: 'underline' }}>PRIVACY POLICY</Text>
                    </Pressable>
                    <Text style={{ fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.1)', fontSize: 8 }}>SESSION V2.0.1 (STABLE)</Text>
                </View>

            </ScrollView>

            {/* Archives Modal */}
            <Modal animationType="fade" transparent visible={archivesVisible} onRequestClose={() => setArchivesVisible(false)}>
                <View style={styles.archiveModalOverlay}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
                    <View style={styles.archiveHeader}>
                        <Pressable onPress={() => setArchivesVisible(false)} style={{ padding: 8 }}>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.mono, fontSize: 12 }}>← CLOSE</Text>
                        </Pressable>
                        <Text style={styles.archiveHeaderTitle}>ARCHIVES</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    <View style={styles.archiveTabs}>
                        {(['drills', 'journal'] as const).map(tab => (
                            <Pressable
                                key={tab}
                                onPress={() => setArchiveTab(tab)}
                                style={[styles.archiveTabBtn, archiveTab === tab && styles.archiveTabBtnActive]}
                            >
                                <Text style={[styles.archiveTabText, archiveTab === tab && styles.archiveTabTextActive]}>
                                    {tab === 'drills' ? 'TRAINING' : 'JOURNAL'}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <FlatList
                        data={(() => {
                            if (archiveTab === 'drills') {
                                return (user?.drillLogs || []).filter((l: any) => l.type !== 'Mission');
                            } else {
                                const missionLogs = (user?.drillLogs || []).filter((l: any) => l.type === 'Mission').map((l: any) => ({
                                    ...l, entry: l.feedback, analysis: null, _source: 'mission'
                                }));
                                const journals = (user?.journalLogs || []).map((j: any) => ({ ...j, _source: 'journal' }));
                                return [...missionLogs, ...journals].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                            }
                        })()}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <GlassCard style={{ padding: 16, marginBottom: 12, borderRadius: Radius.lg }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontFamily: Fonts.mono, fontSize: 9, color: Colors.accentPrimary, letterSpacing: 1 }}>
                                        {archiveTab === 'drills' ? item.type?.toUpperCase() : (item._source === 'mission' ? 'MISSION LOG' : 'JOURNAL ENTRY')}
                                    </Text>
                                    <Text style={{ fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary }}>{new Date(item.date).toLocaleDateString()}</Text>
                                </View>
                                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: Colors.textPrimary, lineHeight: 20 }}>
                                    {archiveTab === 'drills' ? item.feedback : item.entry}
                                </Text>
                                {archiveTab === 'journal' && item.analysis && (
                                    <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' }}>
                                        <Text style={{ fontFamily: Fonts.mono, fontSize: 9, color: Colors.accentPrimary, letterSpacing: 1, marginBottom: 4 }}>ZANE ANALYSIS:</Text>
                                        <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 }}>{item.analysis}</Text>
                                    </View>
                                )}
                            </GlassCard>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No data in neural buffers.</Text>}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgPrimary },
    scrollContent: { padding: Spacing.lg, paddingBottom: 100, paddingTop: 60 },

    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 16 },
    avatarContainer: { position: 'relative' },
    avatar: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: 'rgba(96, 165, 250, 0.08)',
        borderWidth: 1, borderColor: 'rgba(96, 165, 250, 0.2)',
        justifyContent: 'center', alignItems: 'center'
    },
    avatarText: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.textPrimary, fontWeight: '800' },
    onlineBadge: {
        position: 'absolute', bottom: -2, right: -2,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: Colors.accentPrimary, borderWidth: 2, borderColor: Colors.bgPrimary,
        shadowColor: Colors.accentPrimary, shadowRadius: 10, shadowOpacity: 0.8
    },

    identity: { flex: 1, gap: 2 },
    name: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.textPrimary, fontWeight: '800' },
    title: { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.accentPrimary, letterSpacing: 2, textTransform: 'uppercase' },
    levelBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: Radius.sm, alignSelf: 'flex-start',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    levelText: { fontFamily: Fonts.monoBold, fontSize: 9, color: Colors.textSecondary, letterSpacing: 1 },

    settingsBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
    },
    settingsIcon: { fontSize: 12, color: Colors.textPrimary, fontFamily: Fonts.monoBold, opacity: 0.8 },

    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statCard: { flex: 1, padding: 16, alignItems: 'center', borderRadius: Radius.lg },
    statLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary, marginBottom: 4, letterSpacing: 1.5, fontWeight: '600' },
    statValue: { fontFamily: Fonts.heading, fontSize: 28, color: Colors.textPrimary, fontWeight: '800' },
    statSub: { fontFamily: Fonts.monoBold, fontSize: 9, color: Colors.accentPrimary, letterSpacing: 1 },

    bioCard: { padding: 20, marginBottom: 30, marginTop: 12, borderRadius: Radius.lg },
    sectionTitle: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textSecondary, marginBottom: 12, letterSpacing: 3, fontWeight: '700' },
    bioText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textPrimary, fontStyle: 'italic', lineHeight: 22, opacity: 0.9 },

    sectionHeader: { fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, marginBottom: 16, letterSpacing: 1, fontWeight: '800' },
    achievements: { gap: 12 },
    achievementRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, borderRadius: Radius.lg },
    achIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    achInfo: { flex: 1, gap: 2 },
    achTitle: { fontFamily: Fonts.heading, fontSize: 14, color: Colors.textPrimary, fontWeight: '700' },
    achDate: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.textTertiary, letterSpacing: 0.5 },
    achXp: { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.accentPrimary, fontWeight: '800' },
    emptyText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textTertiary, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },

    // Archives button
    archivesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 16,
        paddingHorizontal: 18,
        gap: 14,
        marginTop: 24,
        marginBottom: 8,
    },
    archivesBtnIcon: { fontSize: 24 },
    archivesBtnTitle: { fontFamily: Fonts.heading, fontSize: 16, color: Colors.textPrimary, letterSpacing: 0.5 },
    archivesBtnSub: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
    archivesBtnArrow: { fontFamily: Fonts.heading, fontSize: 20, color: Colors.textTertiary },

    // Archives modal
    archiveModalOverlay: { flex: 1 },
    archiveHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20,
    },
    archiveHeaderTitle: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff', letterSpacing: 3, textAlign: 'center' },
    archiveTabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 8 },
    archiveTabBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    archiveTabBtnActive: {
        backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.3)',
    },
    archiveTabText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.textTertiary, letterSpacing: 2 },
    archiveTabTextActive: { color: Colors.accentPrimary },
});
