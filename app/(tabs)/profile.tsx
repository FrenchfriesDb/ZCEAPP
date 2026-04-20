import FluentEmoji from '@/components/FluentEmoji';
import GlassCard from '@/components/GlassCard';
import ProgressGraph from '@/components/ProgressGraph';
import StaticMap from '@/components/StaticMap';
import { Fonts, Radius, Spacing, XPConfig } from '@/constants/theme';
import { useSubscription } from '@/context/SubscriptionContext';
import { useTextColors } from '@/context/TextColorsContext';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { formatDisplayName } from '@/utils/formatters';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

let _cachedAudio: any | null | undefined;
const loadAudio = async () => {
    if (Platform.OS === 'web') return null;
    if (_cachedAudio !== undefined) return _cachedAudio;
    try {
        const audioModule = requireOptionalNativeModule<any>('ExpoAudio');
        _cachedAudio = audioModule || null;
        return _cachedAudio;
    } catch {
        _cachedAudio = null;
        return null;
    }
};

const getExpoAudioApi = (audioMod: any) =>
    audioMod?.AudioModule ?? audioMod ?? null;

export default function ProfileScreen() {
    const { user, isLoading, signOut, changeUsername, purchaseSystemBackup, updateProfile } = useUser();
    const { isPremium } = useSubscription();
    const { textColors } = useTimeColors();
    const { textPrimary, textSecondary } = useTextColors();

    // UI State
    const [archivesVisible, setArchivesVisible] = useState(false);
    const [archiveTab, setArchiveTab] = useState<'logs' | 'verify' | 'trash'>('logs');
    const [archiveDetailItem, setArchiveDetailItem] = useState<any | null>(null);
    const [usernameModalVisible, setUsernameModalVisible] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);
    const playbackRef = useRef<any>(null);
    const webAudioRef = useRef<any>(null);
    const playbackStartedRef = useRef(false);
    const [playingUri, setPlayingUri] = useState<string | null>(null);
    const archiveListRef = useRef<FlatList<any> | null>(null);
    const archiveScrollOffsetRef = useRef(0);
    const TRASH_RETENTION_MS = 15 * 24 * 60 * 60 * 1000;

    const restoreArchiveScrollPosition = () => {
        const offset = archiveScrollOffsetRef.current;
        requestAnimationFrame(() => {
            setTimeout(() => {
                archiveListRef.current?.scrollToOffset({ offset, animated: false });
            }, 0);
        });
    };

    const stopPlayback = () => {
        playbackStartedRef.current = false;

        const webAudio = webAudioRef.current;
        if (webAudio) {
            try { webAudio.pause?.(); } catch (error) { void error; }
            try { webAudio.src = ''; } catch (error) { void error; }
            webAudioRef.current = null;
        }

        const player = playbackRef.current;
        if (!player) return;
        try { player.pause?.(); } catch (error) { void error; }
        try { player.seekTo?.(0); } catch (error) { void error; }
        try { player.remove?.(); } catch (error) { void error; }
        playbackRef.current = null;
    };

    const normalizeAudioUri = (raw?: string) => {
        if (!raw || typeof raw !== 'string') return null;
        const trimmed = raw.trim();
        if (!trimmed) return null;
        if (/^gs:\/\//i.test(trimmed)) {
            Alert.alert('Playback Error', 'This recording uses a Firebase storage path and cannot be streamed directly. Save a download URL to play it.');
            return null;
        }
        return trimmed.replace(/ /g, '%20');
    };

    const togglePlay = async (rawUri?: string) => {
        const uri = normalizeAudioUri(rawUri);
        if (!uri) return;
        try {
            if (playingUri === uri) {
                stopPlayback();
                setPlayingUri(null);
                return;
            }

            stopPlayback();

            if (Platform.OS === 'web') {
                const webAudio = new globalThis.Audio(uri);
                webAudioRef.current = webAudio;
                setPlayingUri(uri);
                webAudio.onended = () => {
                    stopPlayback();
                    setPlayingUri(null);
                };
                webAudio.onerror = () => {
                    stopPlayback();
                    setPlayingUri(null);
                    Alert.alert('Playback Error', 'Unable to play this recording in your browser.');
                };
                await webAudio.play();
                return;
            }

            const Audio = await loadAudio();
            const audioApi = getExpoAudioApi(Audio);
            if (!audioApi) {
                Alert.alert('Playback Not Available', 'Audio playback is not available in this build.');
                return;
            }

            const setAudioModeAsync = audioApi?.setAudioModeAsync;
            const createAudioPlayer = audioApi?.createAudioPlayer;
            const AudioPlayerCtor = audioApi?.AudioPlayer;
            const buildPlayer =
                typeof createAudioPlayer === 'function'
                    ? (source: string) => {
                        try {
                            return createAudioPlayer({ uri: source });
                        } catch {
                            return createAudioPlayer(source);
                        }
                    }
                    : (typeof AudioPlayerCtor === 'function'
                        ? (source: string) => {
                            const attempts = [
                                () => new AudioPlayerCtor(source, 500, false, 0),
                                () => new AudioPlayerCtor({ uri: source }, 500, false, 0),
                                () => {
                                    const player = new AudioPlayerCtor(null, 500, false, 0);
                                    if (typeof player?.replace === 'function') {
                                        try {
                                            player.replace(source);
                                        } catch {
                                            player.replace({ uri: source });
                                        }
                                    }
                                    return player;
                                },
                            ];

                            let lastError: unknown = null;
                            for (const attempt of attempts) {
                                try {
                                    const player = attempt();
                                    if (player) return player;
                                } catch (err) {
                                    lastError = err;
                                }
                            }
                            throw lastError instanceof Error ? lastError : new Error('Failed to initialize audio player');
                        }
                        : null);
            if (!buildPlayer) {
                Alert.alert('Playback Not Available', 'Audio player is not available in this build.');
                return;
            }

            setPlayingUri(uri);
            playbackStartedRef.current = false;
            if (typeof setAudioModeAsync === 'function') {
                await setAudioModeAsync({ playsInSilentMode: true });
            }

            const player = buildPlayer(uri);
            playbackRef.current = player;
            player?.addListener?.('playbackStatusUpdate', (status: any) => {
                if (status?.playing) {
                    playbackStartedRef.current = true;
                    return;
                }
                if (
                    status?.didJustFinish
                    || status?.error
                    || (playbackStartedRef.current && status?.isLoaded && !status?.playing)
                ) {
                    stopPlayback();
                    setPlayingUri(null);
                }
            });

            if (typeof player?.play === 'function') {
                player.play();
            } else if (typeof player?.playAsync === 'function') {
                await player.playAsync();
            } else {
                throw new Error('Audio player instance has no supported play method.');
            }
        } catch (err) {
            console.error('Playback error', err);
            Alert.alert('Playback Error', 'Unable to play recording.');
            stopPlayback();
            setPlayingUri(null);
        }
    };

    useEffect(() => {
        return () => {
            stopPlayback();
            setPlayingUri(null);
        };
    }, []);

    const handleCopyUsername = () => {
        if (!user?.username) return;
        const value = `@${user.username.toLowerCase()}`;
        Clipboard.setString(value);
        Alert.alert('Copied', `${value} copied to clipboard.`);
    };

    // Derived Constants
    const levelInfo = XPConfig.getLevel(user?.xp || 0);
    const systemColor = textColors?.primary ?? textPrimary;
    const velocityColor = textSecondary;
    const subscriptionStatus = isPremium ? 'ACTIVE' : ((user as any)?.subscriptionStatus || 'inactive').toString().toUpperCase();
    const subscriptionTier = isPremium ? 'DIRECTOR' : ((user as any)?.subscriptionTier || 'initiate').toString().toUpperCase();
    const subscriptionExpiresAt = ((user as any)?.subscriptionExpiresAt || null) as string | null;
    const hasActiveSubscription = isPremium || subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'GRACE';
    const expirationLabel = subscriptionExpiresAt
        ? new Date(subscriptionExpiresAt).toLocaleDateString()
        : null;

    const getLogTimestamp = (value: any, fallbackId?: string): number => {
        if (!value) return 0;
        if (typeof value === 'string' || typeof value === 'number') {
            const parsed = new Date(value).getTime();
            if (Number.isFinite(parsed)) return parsed;
            const idTs = Number(fallbackId);
            return Number.isFinite(idTs) ? idTs : 0;
        }
        if (typeof value?.toDate === 'function') {
            const parsed = value.toDate().getTime();
            if (Number.isFinite(parsed)) return parsed;
            const idTs = Number(fallbackId);
            return Number.isFinite(idTs) ? idTs : 0;
        }
        if (typeof value?.seconds === 'number') {
            return value.seconds * 1000;
        }
        const idTs = Number(fallbackId);
        if (Number.isFinite(idTs)) return idTs;
        return 0;
    };

    const formatLogDate = (value: any, fallbackId?: string): string => {
        const ts = getLogTimestamp(value, fallbackId);
        return ts > 0 ? new Date(ts).toLocaleDateString() : 'Unknown date';
    };

    const getLogDateValue = (item: any) => (
        item?.date ?? item?.createdAt ?? item?.timestamp ?? item?.at ?? item?.updatedAt ?? null
    );

    const getLogStableId = (item: any, index: number): string => {
        const rawId = item?.id || item?.logId || item?.createdAt || item?.timestamp;
        if (rawId !== undefined && rawId !== null && String(rawId).trim() !== '') {
            return `${item?._source || 'log'}-${String(rawId)}`;
        }
        const ts = getLogTimestamp(getLogDateValue(item));
        return `${item?._source || 'log'}-${ts}-${index}`;
    };

    const isVerifyRepLog = (item: any): boolean => {
        const type = String(item?.type || '').toLowerCase();
        const content = `${item?.feedback || ''} ${item?.entry || ''}`.toLowerCase();
        const hasProofMedia = Boolean(
            item?.proof ||
            item?.proofData ||
            item?.mediaProof ||
            item?.photoUri ||
            item?.voiceUri ||
            item?.imageUri ||
            item?.recording ||
            item?.recordingUri ||
            item?.textProof ||
            item?.proof?.photoUri ||
            item?.proof?.voiceUri ||
            item?.proof?.imageUri ||
            item?.proof?.audioUri ||
            item?.photoURL ||
            item?.voiceURL ||
            item?.audioUrl ||
            item?.attachments?.photoUri ||
            item?.attachments?.imageUri ||
            item?.attachments?.voiceUri ||
            item?.attachments?.audioUri ||
            item?.attachments?.photoURL ||
            item?.attachments?.voiceURL ||
            item?.attachments?.url ||
            item?.attachments?.media ||
            (Array.isArray(item?.media) && item.media.length > 0)
        );

        if (type === 'mission') return true;
        if (type === 'quest') return true;
        if (content.includes('verified:')) return true;
        if (content.includes('completed mission')) return true;
        if (/\[id:\s*(?:q_|qs_|dm_)/i.test(content)) return true;
        if (/\[(?:photo|voice|media)\s*proof\s*attached\]/i.test(content)) return true;
        if (hasProofMedia) return true;
        return false;
    };

    const getTrashExpiryTs = (item: any): number => {
        const raw = item?.trashExpiresAt || item?.deletedAt;
        if (!raw) return 0;
        const ts = new Date(raw).getTime();
        return Number.isFinite(ts) ? ts : 0;
    };

    const isInTrash = (item: any): boolean => Boolean(item?.deletedAt || item?.trashExpiresAt);
    const isTrashExpired = (item: any): boolean => {
        const ts = getTrashExpiryTs(item);
        if (!ts) return false;
        return ts <= Date.now();
    };

    useEffect(() => {
        if (!user) return;

        const now = Date.now();
        const keep = (entry: any) => {
            const raw = entry?.trashExpiresAt || entry?.deletedAt;
            if (!raw) return true;
            const ts = new Date(raw).getTime();
            return !Number.isFinite(ts) || ts > now;
        };

        const currentDrillLogs = user.drillLogs || [];
        const currentJournalLogs = user.journalLogs || [];
        const nextDrillLogs = currentDrillLogs.filter(keep);
        const nextJournalLogs = currentJournalLogs.filter(keep);

        const changed = nextDrillLogs.length !== currentDrillLogs.length || nextJournalLogs.length !== currentJournalLogs.length;
        if (!changed) return;

        void updateProfile({
            drillLogs: nextDrillLogs,
            journalLogs: nextJournalLogs,
        } as any);
    }, [updateProfile, user]);

    const moveArchiveItemToTrash = async (item: any) => {
        if (!user || isInTrash(item)) return;

        const deletedAt = new Date().toISOString();
        const trashExpiresAt = new Date(Date.now() + TRASH_RETENTION_MS).toISOString();

        if (item._source === 'journal') {
            const nextJournalLogs = (user.journalLogs || []).map((entry: any, index: number) => {
                if (index !== item._sourceIndex) return entry;
                return { ...entry, deletedAt, trashExpiresAt };
            });
            await updateProfile({ journalLogs: nextJournalLogs } as any);
            return;
        }

        const nextDrillLogs = (user.drillLogs || []).map((entry: any, index: number) => {
            if (index !== item._sourceIndex) return entry;
            return { ...entry, deletedAt, trashExpiresAt };
        });
        await updateProfile({ drillLogs: nextDrillLogs } as any);
    };

    if (isLoading) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}> 
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.34)' }]} />
            <ActivityIndicator color={textPrimary} />
        </View>
    );

    if (!user) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 24, padding: 32 }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.34)' }]} />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 3 }}>IDENTITY NOT FOUND</Text>
            <Pressable
                onPress={() => signOut()}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }}
            >
                <Text style={{ color: textPrimary, fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 2 }}>FORCE LOGOUT</Text>
            </Pressable>
        </View>
    );

    // Stats derivation
    const totalDrills = (user.drillLogs || []).filter((l: any) => l.type === 'Drill' || l.type === 'Session').length;
    const totalMissions = (user.drillLogs || []).filter((l: any) => l.type === 'Mission').length;
    const missionLogs = (user.drillLogs || []).filter((l: any) => l.type === 'Mission');
    const openersMade = missionLogs.filter((l: any) => {
        const text = `${l?.feedback || ''}`.toLowerCase();
        return /cold open|stranger|dm_stranger|say hey first|first word/.test(text);
    }).length;
    const laughsGotten = missionLogs.filter((l: any) => {
        const text = `${l?.feedback || ''}`.toLowerCase();
        return /laugh|joke|wit|humor|dm_joke|extract 3 laughs/.test(text);
    }).length;
    const rejectionsHunted = missionLogs.filter((l: any) => {
        const text = `${l?.feedback || ''}`.toLowerCase();
        return /rejection|reject|hunt rejection|\bno\b|dm_reject/.test(text);
    }).length;
    const complimentsDropped = missionLogs.filter((l: any) => {
        const text = `${l?.feedback || ''}`.toLowerCase();
        return /compliment|dm_compliment|drop bold compliment/.test(text);
    }).length;

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.34)' }]} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {/* Header Identity Card */}
                <GlassCard themed style={styles.header} intensity={35}>
                    <View style={styles.headerContent}>
                        <View style={styles.identity}>
                            <View style={styles.nameRow}>
                                <View style={styles.avatarContainer}>
                                    <View style={styles.avatar}>
                                        <Text style={[styles.avatarText, { color: textPrimary }]}>{formatDisplayName(user.name).charAt(0)}</Text>
                                    </View>
                                    <View style={[styles.onlineBadge, { backgroundColor: systemColor, shadowColor: systemColor }]} />
                                </View>
                                <Text
                                    style={[styles.name, { color: textPrimary }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.8}
                                >
                                    {formatDisplayName(user.name).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.identityMetaWrapper}>
                                <View style={styles.identityMeta}>
                                    {user.username ? (
                                        <Pressable onPress={handleCopyUsername} onLongPress={() => setUsernameModalVisible(true)} delayLongPress={280}>
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
                                <FluentEmoji name="gear" size={24} />
                            </Pressable>
                            <Pressable onPress={() => router.push('/settings/notification-settings')} style={styles.settingsBtn}>
                                <FluentEmoji name="bell" size={24} />
                            </Pressable>
                        </View>
                    </View>
                </GlassCard>

                {!hasActiveSubscription && (
                    <GlassCard themed style={styles.subscriptionBanner} intensity={22} noPadding>
                        <Pressable onPress={() => router.push('/settings/subscription')} style={styles.subscriptionBannerPressable}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.26)', 'rgba(0,0,0,0.52)']}
                                start={{ x: 0.12, y: 0 }}
                                end={{ x: 0.9, y: 1 }}
                                style={styles.subscriptionBannerRim}
                                pointerEvents="none"
                            />
                            <LinearGradient
                                colors={['rgba(170,170,170,0.14)', 'rgba(120,120,120,0.035)', 'rgba(255,255,255,0.00)']}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={styles.subscriptionBannerSheen}
                                pointerEvents="none"
                            />
                            <LinearGradient
                                colors={['rgba(120,120,120,0.08)', 'rgba(90,90,90,0.02)', 'rgba(255,255,255,0.00)']}
                                start={{ x: 0.2, y: 0.05 }}
                                end={{ x: 0.82, y: 0.95 }}
                                style={styles.subscriptionBannerVeil}
                                pointerEvents="none"
                            />
                            <View style={styles.subscriptionBannerPillPrimary} pointerEvents="none" />
                            <View style={styles.subscriptionBannerPillSecondary} pointerEvents="none" />
                            <View style={styles.subscriptionBannerLeft}>
                                <Text style={styles.subscriptionBannerTitle}>ZCE PRO STATUS</Text>
                                <Text style={styles.subscriptionBannerPlan}>
                                    INITIATE (FREE)
                                </Text>
                                <Text style={styles.subscriptionBannerSub}>
                                    Upgrade to ZCE Pro for premium drills, deeper analytics, and full protocol unlocks.
                                </Text>
                            </View>
                            <Text style={styles.subscriptionBannerArrow}>→</Text>
                        </Pressable>
                    </GlassCard>
                )}

                {/* Velocity Monitor */}
                <GlassCard themed style={styles.graphCard} intensity={20}>
                    <ProgressGraph
                        dailyXp={user.dailyXp || {}}
                        color={velocityColor}
                        totalXp={user.xp || 0}
                        currentStreak={user.streak || 0}
                    />
                </GlassCard>

                {/* Static Map Heatmap */}
                <GlassCard themed style={styles.heatmapCard} intensity={25}>
                    <StaticMap dailyXp={user.dailyXp || {}} drillLogs={user.drillLogs || []} />
                </GlassCard>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <GlassCard themed style={styles.statCard} intensity={12}>
                        <Text style={styles.statLabel}>OPENERS MADE</Text>
                        <Text style={[styles.statValue, { color: textPrimary, textShadowColor: textPrimary + '40' }]}>{openersMade}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>FIRST MOVES</Text>
                    </GlassCard>
                    <GlassCard themed style={styles.statCard} intensity={12}>
                        <Text style={styles.statLabel}>REJECTIONS HUNTED</Text>
                        <Text style={[styles.statValue, { color: textPrimary, textShadowColor: textPrimary + '40' }]}>{rejectionsHunted}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>EXPOSURE REPS</Text>
                    </GlassCard>
                </View>

                <View style={styles.statsGrid}>
                    <GlassCard themed style={styles.statCard} intensity={12}>
                        <Text style={styles.statLabel}>COMPLIMENTS DROPPED</Text>
                        <Text style={[styles.statValue, { color: textPrimary, textShadowColor: textPrimary + '40' }]}>{complimentsDropped}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>SOCIAL WINS</Text>
                    </GlassCard>
                    <GlassCard themed style={styles.statCard} intensity={12}>
                        <Text style={styles.statLabel}>LAUGHS GOTTEN</Text>
                        <Text style={[styles.statValue, { color: textPrimary, textShadowColor: textPrimary + '40' }]}>{laughsGotten}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>HUMOR REPS</Text>
                    </GlassCard>
                </View>

                <View style={styles.statsGrid}>
                    <GlassCard themed style={styles.statCard} intensity={15}>
                        <Text style={styles.statLabel}>NEURAL LEVEL</Text>
                        <Text style={[styles.statValue, { color: textPrimary, textShadowColor: textPrimary + '40' }]}>{levelInfo.level}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>{levelInfo.title.toUpperCase()}</Text>
                    </GlassCard>
                    <GlassCard themed style={styles.statCard} intensity={15}>
                        <Text style={styles.statLabel}>SYSTEM BACKUPS</Text>
                        <Text style={[styles.statValue, { color: textPrimary, textShadowColor: textPrimary + '40' }]}>{user.systemBackups || 0}</Text>
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
                        <Text style={[styles.statValue, { color: textPrimary, textShadowColor: textPrimary + '40' }]}>{totalDrills}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>REPS LOGGED</Text>
                    </GlassCard>
                    <GlassCard themed style={styles.statCard} intensity={15}>
                        <Text style={styles.statLabel}>MISSIONS</Text>
                        <Text style={[styles.statValue, { color: textPrimary, textShadowColor: textPrimary + '40' }]}>{totalMissions}</Text>
                        <Text style={[styles.statSub, { color: '#FFFFFF' }]}>FIELD OPS</Text>
                    </GlassCard>
                </View>

                <GlassCard themed style={styles.bioCard} intensity={10}>
                    <Text style={styles.sectionTitle}>MISSION STATEMENT</Text>
                    <Text style={styles.bioText}>&quot;{user.bio}&quot;</Text>
                </GlassCard>

                {/* Archives Access */}
                <GlassCard noPadding style={{ marginBottom: 12 }}>
                    <Pressable onPress={() => setArchivesVisible(true)} style={styles.archivesBtn}>
                        <FluentEmoji name="openFileFolder" size={28} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.archivesBtnTitle}>Archives</Text>
                            <Text style={styles.archivesBtnSub}>Training logs, mission journals, ZANE entries</Text>
                        </View>
                        <Text style={styles.archivesBtnArrow}>→</Text>
                    </Pressable>
                </GlassCard>

                <View style={styles.footer}>
                    <Pressable onPress={() => Alert.alert('LEGAL PROTOCOL', 'By using the Engine, you agree to Forge your character without excuses.')}>
                        <Text style={styles.footerLink}>TERMS OF SERVICE</Text>
                    </Pressable>
                    <Text style={styles.footerVersion}>SESSION V2.0.1 (STABLE)</Text>
                </View>
            </ScrollView>

            {/* Archives Modal */}
            <Modal animationType="fade" transparent visible={archivesVisible} onRequestClose={() => { setArchivesVisible(false); setArchiveDetailItem(null); }}>
                <View style={styles.archiveModalOverlay}>
                    <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.9)']}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                    />
                    <View style={styles.archiveHeader}>
                        <Pressable
                            onPress={() => {
                                if (archiveDetailItem) {
                                    setArchiveDetailItem(null);
                                    restoreArchiveScrollPosition();
                                    return;
                                }
                                setArchivesVisible(false);
                            }}
                        >
                            <Text style={styles.closeText}>{archiveDetailItem ? '← BACK' : '← CLOSE'}</Text>
                        </Pressable>
                        <Text style={styles.archiveHeaderTitle}>{archiveDetailItem ? 'LOG DETAIL' : 'ARCHIVES'}</Text>
                        <View style={styles.archiveHeaderSpacer} />
                    </View>
                    {archiveDetailItem ? (
                        <ScrollView style={styles.archiveDetailScroll} contentContainerStyle={styles.archiveDetailContent} showsVerticalScrollIndicator={false}>
                            {(() => {
                                const item = archiveDetailItem;
                                const source = item._source === 'journal' ? 'journal' : 'drill';
                                const typeLabel = source === 'journal'
                                    ? 'JOURNAL ENTRY'
                                    : (archiveTab === 'verify' ? 'VERIFY REP' : (item.type?.toUpperCase() || 'LOG'));

                                const content = (source === 'journal' ? (item.entry || item.feedback) : (item.feedback || item.entry)) || '';
                                let cleaned = content.replace(/\[ID:[^\]]+\]/g, '').trim();
                                cleaned = cleaned.replace(/\[(?:Photo|Voice|Media)\s*Proof\s*Attached\]/gi, '').trim();
                                cleaned = cleaned.replace(/\b(?:qs_|dm_|q_|id_)[A-Za-z0-9_-]+\b/gi, (match: string) => {
                                    const pretty = match.replace(/^(?:qs_|dm_|q_|id_)/i, '').replace(/[_-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                                    return pretty;
                                });

                                const mediaEntries = Array.isArray(item.media) ? item.media : [];
                                const firstMedia = mediaEntries[0];
                                const mediaImage = typeof firstMedia === 'string'
                                    ? firstMedia
                                    : (firstMedia?.uri || firstMedia?.url || firstMedia?.photoUri || firstMedia?.imageUri || firstMedia?.photoURL || null);
                                const mediaAudio = mediaEntries.find((m: any) => {
                                    const candidate = typeof m === 'string' ? m : (m?.uri || m?.url || m?.audioUri || m?.voiceUri || m?.fileUri || m?.path);
                                    if (typeof m === 'object') {
                                        const mediaType = String(m?.type || m?.mediaType || m?.mimeType || '').toLowerCase();
                                        if (mediaType.includes('audio')) return true;
                                    }
                                    return typeof candidate === 'string' && /\.(m4a|aac|mp3|wav|caf|ogg)(\?|$)/i.test(candidate);
                                });
                                const mediaAudioUri = typeof mediaAudio === 'string'
                                    ? mediaAudio
                                    : (mediaAudio?.uri || mediaAudio?.url || mediaAudio?.audioUri || mediaAudio?.voiceUri || mediaAudio?.fileUri || mediaAudio?.path || null);

                                const img = item.photoUri || item.proof?.photoUri || item.proof?.imageUri || item.proof?.photoURL || item.proofData?.photoUri || item.proofData?.imageUri || item.imageUri || item.imageUrl || item.image || item.photo || item.photoURL || item.attachments?.photoUri || item.attachments?.imageUri || item.attachments?.photoURL || item.attachments?.url || mediaImage;
                                const audio = item.voiceUri || item.proof?.voiceUri || item.proof?.audioUri || item.proof?.voiceURL || item.proofData?.voiceUri || item.proofData?.audioUri || item.recording || item.recordingUri || item.audio || item.audioUrl || item.voiceURL || item.attachments?.voiceUri || item.attachments?.audioUri || item.attachments?.voiceURL || mediaAudioUri;
                                const extractedProofText = item.proof?.text
                                    || item.proofData?.text
                                    || item.mediaProof?.text
                                    || item.textProof
                                    || ((content.match(/Description:\s*([\s\S]*?)(?:\s*\[(?:Photo|Voice|Media)\s*Proof\s*Attached\]|$)/i) || [])[1] || '')
                                        .trim();
                                const bodyWithoutProof = extractedProofText
                                    ? cleaned.replace(/Description:\s*[\s\S]*$/i, '').trim()
                                    : cleaned;

                                return (
                                    <GlassCard style={styles.archiveDetailCard}>
                                        <View style={styles.archiveItemHeader}>
                                            <Text style={styles.archiveItemType}>{typeLabel}</Text>
                                            <Text style={styles.archiveItemDate}>{formatLogDate(getLogDateValue(item), item.id || item.logId || item.timestamp)}</Text>
                                        </View>

                                        {img ? (
                                            <View style={styles.archiveDetailImageFrame}>
                                                <Image source={{ uri: img }} style={styles.archiveDetailImage} resizeMode="contain" />
                                            </View>
                                        ) : null}

                                        {audio ? (
                                            <Pressable onPress={() => togglePlay(audio)} style={{ marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                                <Text style={{ color: textPrimary }}>{playingUri === audio ? 'Playing...' : 'Play recording'}</Text>
                                            </Pressable>
                                        ) : null}

                                        {(extractedProofText || img || audio) ? (
                                            <View style={styles.analysisContainer}>
                                                <Text style={styles.analysisLabel}>PROOF:</Text>
                                                {extractedProofText ? <Text selectable selectionColor="#0A84FF" style={styles.analysisText}>{extractedProofText}</Text> : null}
                                            </View>
                                        ) : null}

                                        {bodyWithoutProof ? <Text selectable selectionColor="#0A84FF" style={styles.archiveItemText}>{bodyWithoutProof}</Text> : null}

                                        {source === 'journal' && item.analysis && (
                                            <View style={styles.analysisContainer}>
                                                <Text style={styles.analysisLabel}>ZANE ANALYSIS:</Text>
                                                <Text selectable selectionColor="#0A84FF" style={styles.analysisText}>{item.analysis}</Text>
                                            </View>
                                        )}
                                    </GlassCard>
                                );
                            })()}
                        </ScrollView>
                    ) : (
                        <>
                            <View style={styles.archiveTabs}>
                                {(['logs', 'verify', 'trash'] as const).map(tab => (
                                    <Pressable
                                        key={tab}
                                        onPress={() => setArchiveTab(tab)}
                                        style={[styles.archiveTabBtn, archiveTab === tab && styles.archiveTabBtnActive]}
                                    >
                                        <Text style={[styles.archiveTabText, archiveTab === tab && styles.archiveTabTextActive]}>
                                            {tab === 'logs' ? 'LOGS' : tab === 'verify' ? 'VERIFY REPS' : 'TRASH'}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            <FlatList
                                ref={archiveListRef}
                                data={(() => {
                                    const drillItems = [...(user.drillLogs || [])].map((d: any, idx: number) => ({ ...d, _source: 'drill', _sourceIndex: idx }));
                                    const journalItems = [...(user.journalLogs || [])].map((j: any, idx: number) => ({ ...j, _source: 'journal', _sourceIndex: idx }));
                                    const combined = [...drillItems, ...journalItems];

                                    const filtered = archiveTab === 'trash'
                                        ? combined.filter((item: any) => isInTrash(item) && !isTrashExpired(item))
                                        : archiveTab === 'verify'
                                            ? combined.filter((item: any) => !isInTrash(item) && isVerifyRepLog(item))
                                            : combined.filter((item: any) => !isInTrash(item) && !isVerifyRepLog(item));

                                    return filtered.sort((a: any, b: any) => {
                                        if (archiveTab === 'trash') {
                                            return getTrashExpiryTs(b) - getTrashExpiryTs(a);
                                        }
                                        return getLogTimestamp(getLogDateValue(b), b?.id || b?.logId || b?.timestamp) - getLogTimestamp(getLogDateValue(a), a?.id || a?.logId || a?.timestamp);
                                    });
                                })()}
                                onScroll={(event) => {
                                    archiveScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
                                }}
                                scrollEventThrottle={16}
                                keyExtractor={(item, index) => getLogStableId(item, index)}
                                contentContainerStyle={{ padding: 20 }}
                                renderItem={({ item }) => {
                                    const card = (
                                        <GlassCard style={styles.archiveItem} onPress={() => setArchiveDetailItem(item)}>
                                            <View style={styles.archiveItemHeader}>
                                                <Text style={styles.archiveItemType}>
                                                    {item._source === 'journal'
                                                        ? 'JOURNAL ENTRY'
                                                        : archiveTab === 'trash'
                                                            ? 'TRASHED LOG'
                                                            : (archiveTab === 'verify' ? 'VERIFY REP' : (item.type?.toUpperCase() || 'LOG'))}
                                                </Text>
                                                <Text style={styles.archiveItemDate}>{formatLogDate(getLogDateValue(item), item.id || item.logId || item.timestamp)}</Text>
                                            </View>
                                            {(() => {
                                                const content = item._source === 'journal'
                                                    ? (item.entry || item.feedback || '')
                                                    : (item.feedback || item.entry || '');
                                                let cleaned = content.replace(/\[ID:[^\]]+\]/g, '').trim();
                                                cleaned = cleaned.replace(/\[(?:Photo|Voice|Media)\s*Proof\s*Attached\]/gi, '').trim();
                                                cleaned = cleaned.replace(/\b(?:qs_|dm_|q_|id_)[A-Za-z0-9_-]+\b/gi, (match: string) => {
                                                    const pretty = match.replace(/^(?:qs_|dm_|q_|id_)/i, '').replace(/[_-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                                                    return pretty;
                                                });
                                                return <Text style={styles.archiveItemText}>{cleaned || '(no description provided)'}</Text>;
                                            })()}
                                            {archiveTab === 'trash' ? <Text style={styles.archiveTrashHint}>Auto deletes 15 days after trashing.</Text> : null}
                                            {item._source === 'journal' && item.analysis && (
                                                <View style={styles.analysisContainer}>
                                                    <Text style={styles.analysisLabel}>ZANE ANALYSIS:</Text>
                                                    <Text style={styles.analysisText}>{item.analysis}</Text>
                                                </View>
                                            )}
                                            <Text style={styles.archiveTapHint}>Tap to expand</Text>
                                        </GlassCard>
                                    );

                                    if (archiveTab === 'trash') return card;

                                    return (
                                        <Swipeable
                                            overshootRight={false}
                                            renderRightActions={() => (
                                                <Pressable
                                                    onPress={() => {
                                                        Alert.alert(
                                                            'Move To Trash',
                                                            'This log will remain in Trash for 15 days before auto deletion.',
                                                            [
                                                                { text: 'Cancel', style: 'cancel' },
                                                                {
                                                                    text: 'Trash',
                                                                    style: 'destructive',
                                                                    onPress: () => { void moveArchiveItemToTrash(item); },
                                                                },
                                                            ]
                                                        );
                                                    }}
                                                    style={styles.archiveTrashAction}
                                                >
                                                    <Text style={styles.archiveTrashActionIcon}>🗑</Text>
                                                </Pressable>
                                            )}
                                        >
                                            {card}
                                        </Swipeable>
                                    );
                                }}
                                ListEmptyComponent={<Text style={styles.emptyText}>No data in neural buffers.</Text>}
                            />
                        </>
                    )}
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
    avatarText: { fontFamily: Fonts.heading, fontSize: 24, fontWeight: '800' },
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
    subscriptionBanner: {
        marginBottom: 16,
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        backgroundColor: 'rgba(2, 2, 7, 0.54)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.42,
        shadowRadius: 28,
        elevation: 24,
    },
    subscriptionBannerPressable: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    subscriptionBannerRim: {
        ...StyleSheet.absoluteFillObject,
    },
    subscriptionBannerSheen: {
        position: 'absolute',
        top: 2,
        left: 8,
        right: 8,
        height: '21%',
        borderRadius: Radius.pill,
        opacity: 0.52,
    },
    subscriptionBannerVeil: {
        position: 'absolute',
        top: 2,
        left: 8,
        right: 8,
        height: '28%',
        borderRadius: Radius.pill,
        opacity: 0.28,
    },
    subscriptionBannerPillPrimary: {
        position: 'absolute',
        top: 9,
        left: 16,
        width: '42%',
        height: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(140,140,140,0.20)',
        backgroundColor: 'rgba(100,100,100,0.08)',
        opacity: 0.52,
    },
    subscriptionBannerPillSecondary: {
        position: 'absolute',
        top: 14,
        right: 24,
        width: '20%',
        height: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(130,130,130,0.18)',
        backgroundColor: 'rgba(100,100,100,0.06)',
        opacity: 0.46,
    },
    subscriptionBannerLeft: {
        flex: 1,
        minWidth: 0,
        zIndex: 2,
    },
    subscriptionBannerTitle: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.78)',
        letterSpacing: 2,
        marginBottom: 8,
    },
    subscriptionBannerPlan: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: '#FFFFFF',
        letterSpacing: 0.6,
        marginBottom: 6,
    },
    subscriptionBannerPlanActive: {
        color: '#9BE7FF',
    },
    subscriptionBannerSub: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: 'rgba(255,255,255,0.66)',
        lineHeight: 18,
    },
    subscriptionBannerArrow: {
        fontSize: 22,
        color: 'rgba(255,255,255,0.74)',
        zIndex: 2,
    },
    emojiFix: {
        fontFamily: Platform.select({
            ios: 'Apple Color Emoji',
            web: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
            default: undefined,
        }),
        fontSize: 18,
    },
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
        fontFamily: Fonts.heading, fontSize: 52, fontWeight: '900',
        textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 }
    },
    statSub: { fontFamily: Fonts.monoBold, fontSize: 9, letterSpacing: 1, marginTop: 4 },
    bioCard: { padding: 24, marginBottom: 20, borderRadius: Radius.xl, backgroundColor: 'rgba(0,0,0,0.5)' },
    sectionTitle: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 14, letterSpacing: 3, fontWeight: '800' },
    bioText: { fontFamily: Fonts.mono, fontSize: 13, color: '#FFFFFF', lineHeight: 22, opacity: 0.9 },
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
    archiveHeaderSpacer: { width: 72 },
    closeText: { color: 'rgba(255,255,255,0.68)', fontFamily: Fonts.monoBold, fontSize: 11, letterSpacing: 1 },
    archiveHeaderTitle: { flex: 1, textAlign: 'center', fontFamily: Fonts.heading, fontSize: 20, color: '#fff', letterSpacing: 3, paddingHorizontal: 10 },
    archiveTabs: { flexDirection: 'row', padding: 20, gap: 10 },
    archiveTabBtn: {
        flex: 1,
        minHeight: 46,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        shadowColor: '#AEE8FF',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
    },
    archiveTabBtnActive: {
        backgroundColor: 'rgba(174,232,255,0.15)',
        borderColor: 'rgba(174,232,255,0.65)',
        shadowOpacity: 0.24,
    },
    archiveTabText: { fontFamily: Fonts.monoBold, fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, textAlign: 'center' },
    archiveTabTextActive: { color: '#E8F7FF' },
    archiveItem: {
        padding: 16,
        marginBottom: 12,
        borderRadius: Radius.lg,
        backgroundColor: 'rgba(255,255,255,0.045)',
        borderColor: 'rgba(255,255,255,0.12)',
    },
    archiveItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    archiveItemType: { flexShrink: 1, paddingRight: 8, fontFamily: Fonts.monoBold, fontSize: 10, color: 'rgba(255,255,255,0.78)', letterSpacing: 1.3 },
    archiveItemDate: { marginLeft: 8, fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)' },
    archiveItemText: { fontFamily: Fonts.body, fontSize: 14, color: '#F1F5F7', lineHeight: 22 },
    archiveTapHint: { marginTop: 10, fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.35)' },
    archiveTrashHint: { marginTop: 8, fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.8, color: 'rgba(255,180,180,0.74)' },
    archiveTrashAction: {
        width: 72,
        marginBottom: 12,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,59,48,0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255,120,120,0.9)',
    },
    archiveTrashActionIcon: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    analysisContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
    analysisLabel: { fontFamily: Fonts.monoBold, fontSize: 9, color: '#fff', opacity: 0.4, marginBottom: 4 },
    analysisText: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
    emptyText: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
    archiveDetailContent: {
        paddingHorizontal: 20,
        paddingBottom: 28,
    },
    archiveDetailScroll: {
        flex: 1,
        minHeight: 0,
    },
    archiveDetailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    archiveDetailCard: {
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(20,20,20,0.82)',
    },
    archiveDetailImageFrame: {
        width: '100%',
        height: 240,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 4,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    archiveDetailImage: {
        width: '100%',
        height: '100%',
    },
    archiveDetailCloseBtn: {
        marginTop: 14,
        alignSelf: 'flex-end',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    archiveDetailCloseText: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        letterSpacing: 1,
        color: 'rgba(255,255,255,0.82)',
    },
    usernameModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
    usernameModalCard: { backgroundColor: '#111', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    usernameModalTitle: { fontFamily: Fonts.heading, fontSize: 18, color: '#fff', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
    usernameModalInput: { height: 56, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 20, color: '#fff', fontFamily: Fonts.mono, fontSize: 18, marginBottom: 20, textAlign: 'center' },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
    modalCancelText: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.5)', fontSize: 12 },
    modalConfirm: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    modalConfirmText: { fontFamily: Fonts.heading, color: '#000', fontSize: 13, fontWeight: '800' },
});
