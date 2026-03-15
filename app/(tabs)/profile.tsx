import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, FlatList, Platform, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius, XPConfig } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import { useUser } from '@/context/UserContext';
import { router } from 'expo-router';
import { useTimeColors } from '@/hooks/useTimeColors';
import StaticMap from '@/components/StaticMap';
import ProgressGraph from '@/components/ProgressGraph';

export default function ProfileScreen() {
    const { user, signOut, changeUsername, purchaseSystemBackup } = useUser();

    // UI State
    const [archivesVisible, setArchivesVisible] = useState(false);
    const [archiveTab, setArchiveTab] = useState<'drills' | 'journal'>('journal');
    const [usernameModalVisible, setUsernameModalVisible] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);

    // Derived Constants
    const levelInfo = XPConfig.getLevel(user?.xp || 0);
    const timePalette = useTimeColors();
    const systemColor = timePalette[0];

    if (!user) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 24, padding: 32 }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 3 }}>IDENTITY NOT FOUND</Text>
            <Pressable
                onPress={() => signOut()}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }}
            >
                <Text style={{ color: Colors.textPrimary, fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 2 }}>FORCE LOGOUT</Text>
            </Pressable>
        </View>
    );

    // Stats derivation
    const totalDrills = (user.drillLogs || []).filter((l: any) => l.type === 'Drill' || l.type === 'Session').length;
    const totalMissions = (user.drillLogs || []).filter((l: any) => l.type === 'Mission').length;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={timePalette.map(c => `${c}33`) as any}
                style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Identity Card */}
                <GlassCard themed style={styles.header} intensity={35}>
                    <View style={styles.headerContent}>
                        <View style={styles.identity}>
                            <View style={styles.nameRow}>
                                <View style={styles.avatarContainer}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                                    </View>
                                    <View style={[styles.onlineBadge, { backgroundColor: systemColor, shadowColor: systemColor }]} />
                                </View>
                                <Text
                                    style={styles.name}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.8}
                                >
                                    {user.name.toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.identityMetaWrapper}>
                                <View style={styles.identityMeta}>
                                    {user.username ? (
                                        <Pressable onPress={() => setUsernameModalVisible(true)}>
                                            <Text style={[styles.usernameTag, { color: systemColor }]}>@{user.username.toLowerCase()}</Text>
                                        </Pressable>
                                    ) : (
                                        <Pressable onPress={() => setUsernameModalVisible(true)} style={styles.setUsernameBtn}>
                                            <Text style={styles.setUsernameBtnText}>+ SET USERNAME</Text>
                                        </Pressable>
                                    )}
                                    <View style={[styles.levelBadge, { borderColor: systemColor + '66', backgroundColor: systemColor + '22' }]}>
                                        <Text style={[styles.levelText, { color: systemColor }]}>LVL {levelInfo.level}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.headerActions}>
                            <Pressable onPress={() => router.push('/settings/edit-profile')} style={styles.settingsBtn}>
                                <Text style={styles.emojiFix}>⚙️</Text>
                            </Pressable>
                            <Pressable onPress={() => router.push('/settings/notification-settings')} style={styles.settingsBtn}>
                                <Text style={styles.emojiFix}>🔔</Text>
                            </Pressable>
                        </View>
                    </View>
                </GlassCard>

                {/* Velocity Monitor */}
                <GlassCard themed style={styles.graphCard} intensity={20}>
                    <ProgressGraph dailyXp={user.dailyXp || {}} color={systemColor} />
                </GlassCard>

                {/* Static Map Heatmap */}
                <GlassCard themed style={styles.heatmapCard} intensity={25}>
                    <StaticMap dailyXp={user.dailyXp || {}} drillLogs={user.drillLogs || []} />
                </GlassCard>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <GlassCard themed style={styles.statCard} intensity={12}>
                        <Text style={styles.statLabel}>AGENT STREAK</Text>
                        <Text style={[styles.statValue, { color: systemColor, textShadowColor: systemColor + '40' }]}>{user.streak}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>DAYS ACTIVE</Text>
                    </GlassCard>
                </View>

                <View style={styles.statsGrid}>
                    <GlassCard themed style={styles.statCard} intensity={15}>
                        <Text style={styles.statLabel}>NEURAL LEVEL</Text>
                        <Text style={[styles.statValue, { color: systemColor, textShadowColor: systemColor + '40' }]}>{levelInfo.level}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>{levelInfo.title.toUpperCase()}</Text>
                    </GlassCard>
                    <GlassCard themed style={styles.statCard} intensity={15}>
                        <Text style={styles.statLabel}>SYSTEM BACKUPS</Text>
                        <Text style={[styles.statValue, { color: systemColor, textShadowColor: systemColor + '40' }]}>{user.systemBackups || 0}</Text>
                        <Pressable onPress={purchaseSystemBackup}>
                            <Text style={[styles.statSub, { color: user.xp >= 500 ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }]}>
                                {user.xp >= 500 ? '+ BUY (500XP)' : 'XP LOW'}
                            </Text>
                        </Pressable>
                    </GlassCard>
                </View>

                <View style={styles.statsGrid}>
                    <GlassCard themed style={styles.statCard} intensity={15}>
                        <Text style={styles.statLabel}>DRILLS</Text>
                        <Text style={[styles.statValue, { color: systemColor, textShadowColor: systemColor + '40' }]}>{totalDrills}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>REPS LOGGED</Text>
                    </GlassCard>
                    <GlassCard themed style={styles.statCard} intensity={15}>
                        <Text style={styles.statLabel}>MISSIONS</Text>
                        <Text style={[styles.statValue, { color: systemColor, textShadowColor: systemColor + '40' }]}>{totalMissions}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>FIELD OPS</Text>
                    </GlassCard>
                </View>

                <GlassCard themed style={styles.bioCard} intensity={10}>
                    <Text style={styles.sectionTitle}>MISSION STATEMENT</Text>
                    <Text style={styles.bioText}>"{user.bio}"</Text>
                </GlassCard>

                {/* Archives Access */}
                <GlassCard noPadding style={{ marginBottom: 12 }}>
                    <Pressable onPress={() => setArchivesVisible(true)} style={styles.archivesBtn}>
                        <Text style={styles.emojiFix}>📂</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.archivesBtnTitle}>Archives</Text>
                            <Text style={styles.archivesBtnSub}>Training logs, mission journals, ZANE entries</Text>
                        </View>
                        <Text style={styles.archivesBtnArrow}>→</Text>
                    </Pressable>
                </GlassCard>

                {/* Sign Out */}
                <Pressable onPress={() => signOut()} style={styles.signOutBtn}>
                    <Text style={styles.signOutText}>⏻  SIGN OUT</Text>
                </Pressable>

                <View style={styles.footer}>
                    <Pressable onPress={() => Alert.alert('LEGAL PROTOCOL', 'By using the Engine, you agree to Forge your character without excuses.')}>
                        <Text style={styles.footerLink}>TERMS OF SERVICE</Text>
                    </Pressable>
                    <Text style={styles.footerVersion}>SESSION V2.0.1 (STABLE)</Text>
                </View>
            </ScrollView>

            {/* Archives Modal */}
            <Modal animationType="fade" transparent visible={archivesVisible} onRequestClose={() => setArchivesVisible(false)}>
                <View style={styles.archiveModalOverlay}>
                    <View style={styles.archiveHeader}>
                        <Pressable onPress={() => setArchivesVisible(false)}>
                            <Text style={styles.closeText}>← CLOSE</Text>
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
                            if (archiveTab === 'drills') return (user.drillLogs || []).filter((l: any) => l.type !== 'Mission');
                            const missionLogs = (user.drillLogs || []).filter((l: any) => l.type === 'Mission').map((l: any) => ({ ...l, entry: l.feedback, _source: 'mission' }));
                            const journals = (user.journalLogs || []).map((j: any) => ({ ...j, _source: 'journal' }));
                            return [...missionLogs, ...journals].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        })()}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <GlassCard style={styles.archiveItem}>
                                <View style={styles.archiveItemHeader}>
                                    <Text style={styles.archiveItemType}>
                                        {archiveTab === 'drills' ? item.type?.toUpperCase() : (item._source === 'mission' ? 'MISSION LOG' : 'JOURNAL ENTRY')}
                                    </Text>
                                    <Text style={styles.archiveItemDate}>{new Date(item.date).toLocaleDateString()}</Text>
                                </View>
                                <Text style={styles.archiveItemText}>{archiveTab === 'drills' ? item.feedback : item.entry}</Text>
                                {archiveTab === 'journal' && item.analysis && (
                                    <View style={styles.analysisContainer}>
                                        <Text style={styles.analysisLabel}>ZANE ANALYSIS:</Text>
                                        <Text style={styles.analysisText}>{item.analysis}</Text>
                                    </View>
                                )}
                            </GlassCard>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No data in neural buffers.</Text>}
                    />
                </View>
            </Modal>

            {/* Username Modal */}
            <Modal visible={usernameModalVisible} animationType="slide" transparent onRequestClose={() => setUsernameModalVisible(false)}>
                <View style={styles.usernameModalBg}>
                    <View style={styles.usernameModalCard}>
                        <Text style={styles.usernameModalTitle}>CHANGE USERNAME</Text>
                        <TextInput
                            style={styles.usernameModalInput}
                            placeholder="new_username"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={newUsername}
                            onChangeText={t => setNewUsername(t.replace(/\s/g, '').toLowerCase())}
                        />
                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setUsernameModalVisible(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalConfirm, { opacity: usernameLoading ? 0.6 : 1 }]}
                                onPress={async () => {
                                    if (!newUsername || usernameLoading) return;
                                    setUsernameLoading(true);
                                    try {
                                        await changeUsername(newUsername);
                                        setUsernameModalVisible(false);
                                        setNewUsername('');
                                    } catch (e: any) {
                                        Alert.alert('Error', e.message);
                                    } finally { setUsernameLoading(false); }
                                }}
                            >
                                {usernameLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.modalConfirmText}>CONFIRM</Text>}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    scrollContent: { padding: Spacing.lg, paddingBottom: 100, paddingTop: 60 },
    header: {
        marginBottom: 20,
        borderRadius: Radius.xl,
        overflow: 'hidden',
    },
    headerContent: {
        paddingVertical: 24,
        paddingHorizontal: 16, // Slightly reduced horizontal padding
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Slightly reduced gap
    },
    headerActions: {
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
    },
    avatarContainer: { position: 'relative' },
    avatar: {
        width: 56, height: 56, borderRadius: Radius.lg, // Sized down slightly
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontFamily: Fonts.heading, fontSize: 24, color: '#fff', fontWeight: '800' },
    onlineBadge: {
        position: 'absolute', bottom: -2, right: -2,
        width: 14, height: 14, borderRadius: 7,
        borderWidth: 3, borderColor: '#000',
    },
    identity: {
        flex: 1,
        minWidth: 0,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    name: {
        flex: 1,
        fontFamily: Fonts.heading,
        fontSize: 24,
        color: Colors.textPrimary,
        fontWeight: '900',
        letterSpacing: -1,
        lineHeight: 28,
    },
    identityMetaWrapper: {
        paddingLeft: 68, // avatar 56 + gap 12
        marginTop: 2,
    },
    identityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    usernameTag: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        letterSpacing: 0.5,
    },
    setUsernameBtn: { paddingVertical: 4 },
    setUsernameBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
    levelBadge: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6, borderWidth: 1,
    },
    levelText: { fontFamily: Fonts.monoBold, fontSize: 9, letterSpacing: 1 },
    settingsBtn: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    emojiFix: { fontFamily: Platform.OS === 'ios' ? 'System' : undefined, fontSize: 18 },
    graphCard: {
        padding: 4,
        marginBottom: 20,
    },
    heatmapCard: {
        padding: 16,
        marginBottom: 20,
        borderRadius: Radius.xl,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statCard: {
        flex: 1,
        paddingVertical: 24,
        alignItems: 'center',
    },
    statLabel: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.8)', marginBottom: 8, letterSpacing: 2, fontWeight: '800' },
    statValue: {
        fontFamily: Fonts.heading, fontSize: 52, color: '#B3E0FF', fontWeight: '900',
        textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 }
    },
    statSub: { fontFamily: Fonts.monoBold, fontSize: 9, letterSpacing: 1, marginTop: 4 },
    bioCard: { padding: 24, marginBottom: 20, borderRadius: Radius.xl, backgroundColor: 'rgba(0,0,0,0.5)' },
    sectionTitle: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 14, letterSpacing: 3, fontWeight: '800' },
    bioText: { fontFamily: Fonts.body, fontSize: 14, color: '#FFFFFF', fontStyle: 'italic', lineHeight: 22, opacity: 0.9 },
    archivesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    archivesBtnTitle: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff' },
    archivesBtnSub: { fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    archivesBtnArrow: { fontSize: 20, color: 'rgba(255,255,255,0.2)' },
    signOutBtn: {
        marginTop: 12, paddingVertical: 16, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    signOutText: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2 },
    footer: { marginTop: 40, marginBottom: 60, alignItems: 'center', gap: 12 },
    footerLink: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.2)', fontSize: 9, textDecorationLine: 'underline' },
    footerVersion: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.1)', fontSize: 8 },
    archiveModalOverlay: { flex: 1, backgroundColor: '#000' },
    archiveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
    closeText: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.mono, fontSize: 11 },
    archiveHeaderTitle: { fontFamily: Fonts.heading, fontSize: 20, color: '#fff', letterSpacing: 4 },
    archiveTabs: { flexDirection: 'row', padding: 20, gap: 10 },
    archiveTabBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    archiveTabBtnActive: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.3)' },
    archiveTabText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
    archiveTabTextActive: { color: '#fff' },
    archiveItem: { padding: 16, marginBottom: 12, borderRadius: Radius.lg },
    archiveItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    archiveItemType: { fontFamily: Fonts.monoBold, fontSize: 9, color: '#fff', opacity: 0.5 },
    archiveItemDate: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.3)' },
    archiveItemText: { fontFamily: Fonts.body, fontSize: 14, color: '#fff', lineHeight: 22 },
    analysisContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    analysisLabel: { fontFamily: Fonts.monoBold, fontSize: 9, color: '#fff', opacity: 0.4, marginBottom: 4 },
    analysisText: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
    emptyText: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
    usernameModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
    usernameModalCard: { backgroundColor: '#111', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    usernameModalTitle: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
    usernameModalInput: { height: 56, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, color: '#fff', fontFamily: Fonts.body, fontSize: 18, marginBottom: 20, textAlign: 'center' },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
    modalCancelText: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.5)', fontSize: 12 },
    modalConfirm: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    modalConfirmText: { fontFamily: Fonts.heading, color: '#000', fontSize: 13, fontWeight: '800' },
});
