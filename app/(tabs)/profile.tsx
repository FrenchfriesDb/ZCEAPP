import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, FlatList, Platform, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, Radius, XPConfig } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import { useUser } from '@/context/UserContext';
import { router } from 'expo-router';
import { useTimeColors } from '@/hooks/useTimeColors';
import StaticMap from '@/components/StaticMap';

export default function ProfileScreen() {
    const { user, signOut, changeUsername, completeDrill } = useUser();

    // UI State
    const [sharing, setSharing] = useState(false);
    const [archivesVisible, setArchivesVisible] = useState(false);
    const [usernameModalVisible, setUsernameModalVisible] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);

    // Derived Constants
    const levelInfo = XPConfig.getLevel(user?.xp || 0);
    const timePalette = useTimeColors();
    const systemColor = timePalette[0];

    const handleSocialBoost = async () => {
        setSharing(true);
        await new Promise(r => setTimeout(r, 1500));
        await completeDrill(50);
        Alert.alert("SOCIAL BOOST ACTIVATED", "Aura shared. +50 XP awarded to your neural stack.");
        setSharing(false);
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 3 }}>IDENTITY NOT FOUND</Text>
                <Pressable onPress={() => signOut()} style={styles.signOutBtn}>
                    <Text style={styles.signOutText}>FORCE LOGOUT</Text>
                </Pressable>
            </View>
        );
    }

    const totalDrills = (user.drillLogs || []).filter((l: any) => l.type === 'Drill' || l.type === 'Session').length;
    const totalMissions = (user.drillLogs || []).filter((l: any) => l.type === 'Mission').length;

    return (
        <View style={styles.container}>
            <LinearGradient colors={timePalette.map(c => `${c}33`) as any} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Card */}
                <GlassCard themed style={styles.header} intensity={35}>
                    <View style={styles.headerContent}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                            </View>
                            <View style={[styles.onlineBadge, { backgroundColor: systemColor, shadowColor: systemColor }]} />
                        </View>

                        <View style={styles.identity}>
                            <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>{user.name.toUpperCase()}</Text>
                            <View style={styles.identityMeta}>
                                {user.username ? (
                                    <Pressable onPress={() => setUsernameModalVisible(true)}>
                                        <Text style={[styles.usernameTag, { color: '#B3E0FF' }]}>@{user.username.toLowerCase()}</Text>
                                    </Pressable>
                                ) : (
                                    <Pressable onPress={() => setUsernameModalVisible(true)} style={styles.setUsernameBtn}>
                                        <Text style={styles.setUsernameBtnText}>+ SET USERNAME</Text>
                                    </Pressable>
                                )}
                                <View style={[styles.levelBadge, { borderColor: systemColor + '66', backgroundColor: systemColor + '22' }]}>
                                    <Text style={[styles.levelText, { color: '#B3E0FF' }]}>LVL {levelInfo.level}</Text>
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

                {/* Heatmap Section */}
                <GlassCard themed style={styles.heatmapCard} intensity={25}>
                    <StaticMap dailyXp={user.dailyXp || {}} drillLogs={user.drillLogs || []} />
                    <Pressable
                        onPress={handleSocialBoost}
                        style={styles.socialBoostBtn}
                        disabled={sharing}
                    >
                        {sharing ? (
                            <ActivityIndicator size="small" color="#FF9500" />
                        ) : (
                            <View style={styles.socialBoostMain}>
                                <Text style={styles.socialBoostIcon}>✨</Text>
                                <Text style={styles.socialBoostText}>SHARE AURA</Text>
                                <Text style={styles.socialBoostSub}>+50 XP</Text>
                            </View>
                        )}
                    </Pressable>
                </GlassCard>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <GlassCard themed style={styles.statCard} intensity={15}>
                        <Text style={styles.statLabel}>DRILLS</Text>
                        <Text style={styles.statValue}>{totalDrills}</Text>
                        <Text style={styles.statSub}>REPS LOGGED</Text>
                    </GlassCard>
                    <GlassCard themed style={styles.statCard} intensity={15}>
                        <Text style={styles.statLabel}>MISSIONS</Text>
                        <Text style={styles.statValue}>{totalMissions}</Text>
                        <Text style={styles.statSub}>FIELD OPS</Text>
                    </GlassCard>
                </View>

                {/* Bio Card */}
                <GlassCard themed style={styles.bioCard} intensity={10}>
                    <Text style={styles.sectionTitle}>MISSION STATEMENT</Text>
                    <Text style={styles.bioText}>"{user.bio}"</Text>
                </GlassCard>

                {/* Links */}
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

                <Pressable onPress={() => signOut()} style={styles.signOutBtn}>
                    <Text style={styles.signOutText}>⏻  SIGN OUT</Text>
                </Pressable>

                <View style={styles.footer}>
                    <Text style={styles.footerVersion}>SESSION V2.0.1 (STABLE)</Text>
                </View>
            </ScrollView>

            {/* Modals */}
            <Modal visible={archivesVisible} transparent animationType="fade">
                <View style={styles.archiveModalOverlay}>
                    <View style={styles.archiveHeader}>
                        <Pressable onPress={() => setArchivesVisible(false)}>
                            <Text style={styles.closeText}>← CLOSE</Text>
                        </Pressable>
                        <Text style={styles.archiveHeaderTitle}>ARCHIVES</Text>
                        <View style={{ width: 60 }} />
                    </View>
                    <FlatList
                        data={user.drillLogs || []}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item }) => (
                            <GlassCard style={styles.archiveItem}>
                                <Text style={{ color: '#fff' }}>{item.feedback || item.entry || 'Session Complete'}</Text>
                            </GlassCard>
                        )}
                        contentContainerStyle={{ padding: 20 }}
                    />
                </View>
            </Modal>

            <Modal visible={usernameModalVisible} transparent animationType="slide">
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
                                style={styles.modalConfirm}
                                onPress={async () => {
                                    if (!newUsername || usernameLoading) return;
                                    setUsernameLoading(true);
                                    try {
                                        await changeUsername(newUsername);
                                        setUsernameModalVisible(false);
                                    } catch (e: any) { Alert.alert('Error', e.message); }
                                    finally { setUsernameLoading(false); }
                                }}
                            >
                                <Text style={styles.modalConfirmText}>CONFIRM</Text>
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
    header: { marginBottom: 20, borderRadius: Radius.xl, overflow: 'hidden' },
    headerContent: { paddingVertical: 24, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 60, height: 60, borderRadius: Radius.lg, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontFamily: Fonts.heading, fontSize: 28, color: '#fff', fontWeight: '800' },
    onlineBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#000' },
    identity: { flex: 1, gap: 2 },
    name: { fontFamily: Fonts.heading, fontSize: 26, color: Colors.textPrimary, fontWeight: '900', letterSpacing: -1 },
    identityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    usernameTag: { fontFamily: Fonts.monoBold, fontSize: 10, letterSpacing: 1 },
    setUsernameBtn: { paddingVertical: 4 },
    setUsernameBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
    levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    levelText: { fontFamily: Fonts.monoBold, fontSize: 9, letterSpacing: 1 },
    headerActions: { gap: 12 },
    settingsBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    emojiFix: { fontFamily: Platform.OS === 'ios' ? 'System' : undefined, fontSize: 18 },
    heatmapCard: { padding: 16, marginBottom: 20, borderRadius: Radius.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
    socialBoostBtn: { backgroundColor: 'rgba(255, 149, 0, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 149, 0, 0.3)', borderRadius: Radius.md, paddingVertical: 12, marginTop: 16, alignItems: 'center' },
    socialBoostMain: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    socialBoostIcon: { fontSize: 14 },
    socialBoostText: { fontFamily: Fonts.monoBold, fontSize: 11, color: '#FF9500', letterSpacing: 2 },
    socialBoostSub: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255, 149, 0, 0.5)', marginTop: 2 },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    statCard: { flex: 1, paddingVertical: 24, alignItems: 'center' },
    statLabel: { fontFamily: Fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.8)', marginBottom: 8, letterSpacing: 2 },
    statValue: { fontFamily: Fonts.heading, fontSize: 52, color: '#B3E0FF', fontWeight: '900' },
    statSub: { fontFamily: Fonts.monoBold, fontSize: 9, letterSpacing: 1, color: '#fff' },
    bioCard: { padding: 24, marginBottom: 20, borderRadius: Radius.xl, backgroundColor: 'rgba(0,0,0,0.5)' },
    sectionTitle: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 14, letterSpacing: 3 },
    bioText: { fontFamily: Fonts.body, fontSize: 14, color: '#FFFFFF', fontStyle: 'italic', lineHeight: 22 },
    archivesBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
    archivesBtnTitle: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff' },
    archivesBtnSub: { fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    archivesBtnArrow: { fontSize: 20, color: 'rgba(255,255,255,0.2)' },
    signOutBtn: { marginTop: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    signOutText: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2 },
    footer: { marginTop: 40, marginBottom: 60, alignItems: 'center' },
    footerVersion: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.1)', fontSize: 8 },
    archiveModalOverlay: { flex: 1, backgroundColor: '#000' },
    archiveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
    archiveHeaderTitle: { fontFamily: Fonts.heading, fontSize: 20, color: '#fff', letterSpacing: 4 },
    closeText: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.mono, fontSize: 11 },
    archiveItem: { padding: 16, marginBottom: 12, borderRadius: Radius.lg },
    usernameModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
    usernameModalCard: { backgroundColor: '#111', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    usernameModalTitle: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
    usernameModalInput: { height: 56, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, color: '#fff', fontFamily: Fonts.body, fontSize: 18, marginBottom: 20, textAlign: 'center' },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalCancelText: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.5)', fontSize: 12 },
    modalConfirm: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    modalConfirmText: { fontFamily: Fonts.heading, color: '#000', fontSize: 13, fontWeight: '800' },
});
