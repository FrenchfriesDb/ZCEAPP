import FluentEmoji, { type FluentEmojiName, resolveFluentEmojiName } from '@/components/FluentEmoji';
import { Fonts, Radius } from '@/constants/theme';
import { useSubscription } from '@/context/SubscriptionContext';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { formatDisplayName } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Use explicit Fluent icon names to avoid unicode fallback glitches on web/native.
const ICONS = {
    designation: 'bullseye' as FluentEmojiName,
    bio: 'memo' as FluentEmojiName,
    codename: 'idButton' as FluentEmojiName,
    username: 'label' as FluentEmojiName,
    email: 'email' as FluentEmojiName,
    password: 'locked' as FluentEmojiName,
    subscription: 'crown' as FluentEmojiName,
    theme: <Ionicons name="color-palette-outline" size={18} color="#fff" />,
    restore: 'repeatButton' as FluentEmojiName,
    privacy: 'shield' as FluentEmojiName,
    terms: 'clipboard' as FluentEmojiName,
    // Avoid emoji tofu boxes by using a real icon glyph instead of an emoji.
    signout: <Ionicons name="log-out-outline" size={18} color="#fff" />,
    reset: 'warning' as FluentEmojiName,
    delete: 'skullAndCrossbones' as FluentEmojiName,
};

export default function EditProfileScreen() {
    const { user, updateProfile, signOut, changeEmail, changePassword, deleteAccount, resetProgress, changeUsername } = useUser();
    const { isPremium, restorePurchases, refreshEntitlements } = useSubscription();
    const insets = useSafeAreaInsets();
    const timePalette = useTimeColors();
    const systemColor = timePalette.textColors.primary || '#FFFFFF';

    // Form state
    const [name, setName] = useState(user?.name || '');
    const [title, setTitle] = useState(user?.title || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [isChangingUsername, setIsChangingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [usernameModalVisible, setUsernameModalVisible] = useState(false);
    const [emailModalVisible, setEmailModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [designationModalVisible, setDesignationModalVisible] = useState(false);
    const [bioModalVisible, setBioModalVisible] = useState(false);
    const [codenameModalVisible, setCodenameModalVisible] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);
    const [tempBio, setTempBio] = useState(bio);
    const [tempName, setTempName] = useState(name);
    const subscriptionStatus = isPremium ? 'ACTIVE' : ((user as any)?.subscriptionStatus || 'inactive').toString().toUpperCase();
    const subscriptionTier = isPremium ? 'DIRECTOR' : ((user as any)?.subscriptionTier || 'initiate').toString().toUpperCase();
    const hasActiveSubscription = isPremium || subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'GRACE';
    const subscriptionRowValue = hasActiveSubscription
        ? `${subscriptionTier} • ${subscriptionStatus}`
        : 'INACTIVE — TAP TO UPGRADE';
    const themeModeLabel = timePalette.themeMode === 'time_sync' ? 'SKY-SYNC (TIME)' : 'WHITE';

    const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

    const handleSave = async () => {
        setIsSaving(true);
        await updateProfile({ name, title, bio });
        setTimeout(() => {
            setIsSaving(false);
        }, 800);
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const handleUpdateEmail = async () => {
        if (!newEmail || newEmail === user?.email) {
            setEmailModalVisible(false);
            return;
        }

        const execute = async () => {
            setIsUpdatingEmail(true);
            try {
                await changeEmail(newEmail);
                setEmailModalVisible(false);
            } catch (_e) {
                // Error handled in UserContext
            } finally {
                setIsUpdatingEmail(false);
            }
        };

        if (Platform.OS === 'web') {
            if (confirm(`SYNC NEW IDENTITY?\n\nChanging your agent ID to ${newEmail} will update your primary access credentials.`)) {
                execute();
            }
        } else {
            Alert.alert(
                'SYNC NEW IDENTITY?',
                `Update primary credentials to: ${newEmail}?`,
                [
                    { text: 'ABORT', style: 'cancel' },
                    { text: 'CONFIRM UPDATE', onPress: execute }
                ]
            );
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword) {
            setPasswordModalVisible(false);
            return;
        }

        const execute = async () => {
            setIsUpdatingPassword(true);
            try {
                await changePassword(newPassword);
                setNewPassword('');
                setPasswordModalVisible(false);
            } catch (_e) {
                // Error handled in UserContext
            } finally {
                setIsUpdatingPassword(false);
            }
        };

        if (Platform.OS === 'web') {
            if (confirm('ENCRYPT NEW ACCESS CODE?\n\nAre you sure you want to change your security access code?')) {
                execute();
            }
        } else {
            Alert.alert(
                'ENCRYPT ACCESS CODE?',
                'Are you sure you want to rotate your security access credentials?',
                [
                    { text: 'ABORT', style: 'cancel' },
                    { text: 'CONFIRM ROTATION', onPress: execute }
                ]
            );
        }
    };

    const handleThemeModePress = () => {
        if (!isPremium) {
            Alert.alert(
                'PRO THEME CONTROL',
                'Theme mode switching is available in Director mode.',
                [
                    { text: 'NOT NOW', style: 'cancel' },
                    { text: 'UPGRADE', onPress: () => router.push('/settings/subscription') },
                ]
            );
            return;
        }

        Alert.alert(
            'THEME MODE',
            'Choose your active display mode.',
            [
                {
                    text: `WHITE${timePalette.themeMode === 'white' ? ' ✓' : ''}`,
                    onPress: () => { void timePalette.setThemeMode('white'); },
                },
                {
                    text: `SKY-SYNC (TIME)${timePalette.themeMode === 'time_sync' ? ' ✓' : ''}`,
                    onPress: () => { void timePalette.setThemeMode('time_sync'); },
                },
                { text: 'CANCEL', style: 'cancel' },
            ]
        );
    };

    const handleDeleteAccount = () => {
        const firstConfirm = () => {
            if (Platform.OS === 'web') {
                if (confirm('TERMINATE AGENT IDENTITY?\n\nThis action will permanently purge all XP, Levels, and Journal logs from the Z.A.N.E. engine. This cannot be undone.')) {
                    secondConfirm();
                }
            } else {
                Alert.alert(
                    'TERMINATE IDENTITY?',
                    'This action will permanently purge all XP, Levels, and Journal logs from the Z.A.N.E. engine. This cannot be undone.',
                    [
                        { text: 'ABORT', style: 'cancel' },
                        { text: 'PROCEED TO PURGE', style: 'destructive', onPress: secondConfirm }
                    ]
                );
            }
        };

        const secondConfirm = () => {
            if (Platform.OS === 'web') {
                if (confirm('FINAL WARNING: ARE YOU ABSOLUTELY SURE?\n\nAll your charisma progress will be lost forever.')) {
                    thirdConfirm();
                }
            } else {
                Alert.alert(
                    'FINAL WARNING',
                    'ARE YOU ABSOLUTELY SURE?\n\nAll your charisma progress will be lost forever.',
                    [
                        { text: 'ABORT', style: 'cancel' },
                        { text: 'CONFIRM DELETE', style: 'destructive', onPress: thirdConfirm }
                    ]
                );
            }
        };

        const thirdConfirm = () => {
            if (Platform.OS === 'web') {
                if (confirm('TYPE "DELETE" TO CONFIRM\n\nThis is your last chance to abort.')) {
                    deleteAccount();
                }
            } else {
                Alert.alert(
                    'TYPE "DELETE" TO CONFIRM',
                    'This is your last chance to abort.',
                    [
                        { text: 'ABORT', style: 'cancel' },
                        { text: 'DELETE FOREVER', style: 'destructive', onPress: deleteAccount }
                    ]
                );
            }
        };

        firstConfirm();
    };

    const handleResetProgress = () => {
        const firstConfirm = () => {
            if (Platform.OS === 'web') {
                if (confirm('⚠️ WIPE ALL PROGRESS?\n\nThis resets your XP, streak, and completed missions to zero — but keeps your account. Cannot be undone.')) {
                    secondConfirm();
                }
            } else {
                Alert.alert(
                    '⚠️ WIPE ALL PROGRESS?',
                    'This resets your XP, streak, and completed missions to zero — but keeps your account. Cannot be undone.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'PROCEED', onPress: secondConfirm }
                    ]
                );
            }
        };

        const secondConfirm = () => {
            if (Platform.OS === 'web') {
                if (confirm('FINAL CONFIRMATION\n\nYour progress will be gone forever.')) {
                    resetProgress();
                }
            } else {
                Alert.alert(
                    'FINAL CONFIRMATION',
                    'Your progress will be gone forever.',
                    [
                        { text: 'ABORT', style: 'cancel' },
                        { text: 'WIPE PROGRESS', style: 'destructive', onPress: resetProgress }
                    ]
                );
            }
        };

        firstConfirm();
    };

    const handleUsernameUpdate = async () => {
        setUsernameError('');
        if (!newUsername) return;
        if (!USERNAME_REGEX.test(newUsername)) {
            setUsernameError('3–20 chars, letters/numbers/underscore only.');
            return;
        }
        setIsChangingUsername(true);
        try {
            await changeUsername(newUsername.toLowerCase());
            setNewUsername('');
            setUsernameModalVisible(false);
        } catch (e: any) {
            setUsernameError(e?.message || 'Failed to update username.');
        } finally {
            setIsChangingUsername(false);
        }
    };

    // Row component for consistent styling
    const SettingRow = ({
        icon,
        label,
        value,
        onPress,
        isLast = false,
        valueColor = 'rgba(255,255,255,0.6)',
        danger = false
    }: {
        icon: React.ReactNode;
        label: string;
        value?: string;
        onPress?: () => void;
        isLast?: boolean;
        valueColor?: string;
        danger?: boolean;
    }) => {
        const iconName = typeof icon === 'string' ? (resolveFluentEmojiName(icon) || (icon as FluentEmojiName)) : null;
        return (
        <Pressable
            onPress={onPress}
            style={[styles.row, !isLast && styles.rowWithDivider]}
        >
            {typeof icon === 'string' ? (
                iconName ? (
                    <View style={styles.rowIconWrap}>
                        <FluentEmoji name={iconName} size={22} />
                    </View>
                ) : (
                    <Text style={styles.rowIcon}>{icon}</Text>
                )
            ) : (
                <View style={styles.rowIconWrap}>{icon}</View>
            )}
            <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
            <View style={styles.rowRight}>
                {value && (
                    <Text
                        style={[styles.rowValue, { color: valueColor }, danger && styles.dangerText]}
                        numberOfLines={1}
                    >
                        {value}
                    </Text>
                )}
                {onPress && <Text style={styles.rowArrow}>›</Text>}
            </View>
        </Pressable>
    );
    };

    // Section card component
    const SectionCard = ({ children, title }: { children: React.ReactNode; title: string }) => (
        <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: systemColor }]}>{title}</Text>
            <View style={styles.cardContent}>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← BACK</Text>
                </Pressable>
                <Text style={styles.headerTitle}>AGENT PROTOCOLS</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >

                {/* SECTION 1 — AGENT PROFILE */}
                <SectionCard title="AGENT PROFILE">
                    {/* Row 1: Designation and Bio */}
                    <SettingRow
                        icon={ICONS.designation}
                        label="DESIGNATION"
                        value={title || 'Add designation...'}
                        onPress={() => {
                            setTempTitle(title);
                            setDesignationModalVisible(true);
                        }}
                        valueColor={title ? '#fff' : 'rgba(255,255,255,0.3)'}
                    />
                    <SettingRow
                        icon={ICONS.bio}
                        label="MISSION STATEMENT"
                        value={bio || 'Add mission statement...'}
                        onPress={() => {
                            setTempBio(bio);
                            setBioModalVisible(true);
                        }}
                        valueColor={bio ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'}
                    />

                    {/* Row 2: Codename */}
                    <SettingRow
                        icon={ICONS.codename}
                        label="CODENAME"
                        value={formatDisplayName(user?.name)}
                        onPress={() => {
                            setTempName(name);
                            setCodenameModalVisible(true);
                        }}
                    />

                    {/* Row 3: Username */}
                    <SettingRow
                        icon={ICONS.username}
                        label="USERNAME"
                        value={user?.username ? `@${user.username}` : 'Set username...'}
                        onPress={() => setUsernameModalVisible(true)}
                        valueColor={user?.username ? systemColor : 'rgba(255,255,255,0.3)'}
                    />

                    {/* Row 4: Email */}
                    <SettingRow
                        icon={ICONS.email}
                        label="EMAIL"
                        value={user?.email}
                        onPress={() => setEmailModalVisible(true)}
                        valueColor="rgba(255,255,255,0.4)"
                    />

                    {/* Password - separate row */}
                    <SettingRow
                        icon={ICONS.password}
                        label="ACCESS CODE"
                        value="••••••••"
                        onPress={() => setPasswordModalVisible(true)}
                        isLast
                    />
                </SectionCard>

                {/* SECTION 2 — SECURITY PROTOCOLS */}
                <SectionCard title="SECURITY PROTOCOLS">
                    <SettingRow
                        icon={ICONS.subscription}
                        label="SUBSCRIPTION STATUS"
                        value={subscriptionRowValue}
                        valueColor={hasActiveSubscription ? '#9BE7FF' : 'rgba(255,255,255,0.72)'}
                        onPress={() => router.push('/settings/subscription')}
                    />
                    <SettingRow
                        icon={ICONS.theme}
                        label="THEME MODE"
                        value={themeModeLabel}
                        valueColor={isPremium ? systemColor : 'rgba(255,255,255,0.42)'}
                        onPress={handleThemeModePress}
                    />
                    <SettingRow
                        icon={ICONS.restore}
                        label="RESTORE PURCHASES"
                        onPress={async () => {
                            const restored = await restorePurchases();
                            await refreshEntitlements();
                            Alert.alert(
                                'Restore',
                                restored
                                    ? 'Purchases restored. ZCE Pro is active on this account.'
                                    : 'No active entitlement found. Restore uses Apple ID purchase history, not app email login.'
                            );
                        }}
                    />
                    <SettingRow
                        icon={ICONS.privacy}
                        label="PRIVACY POLICY"
                        onPress={() => Alert.alert('PRIVACY PROTOCOL', 'Your data is locked in a vault. We do not sell, trade, or share your information. This is your war. Your data stays yours. No third parties. No leaks. No excuses.')}
                    />
                    <SettingRow
                        icon={ICONS.terms}
                        label="TERMS OF SERVICE"
                        onPress={() => Alert.alert('TERMS OF WAR', 'By using this app, you commit to forging yourself without excuses. You will show up daily. You will do the work. You will not quit when it gets hard. This is a binding contract with yourself. We are simply the mirror.')}
                        isLast
                    />
                </SectionCard>

                {/* SECTION 3 — DANGER ZONE */}
                <SectionCard title="DANGER ZONE">
                    <SettingRow
                        icon={ICONS.signout}
                        label="SIGN OUT"
                        value="BURN IDENTITY"
                        onPress={handleSignOut}
                        danger
                    />
                    <SettingRow
                        icon={ICONS.reset}
                        label="RESET ALL PROGRESS"
                        value="WIPE DATA"
                        onPress={handleResetProgress}
                        danger
                    />
                    <SettingRow
                        icon={ICONS.delete}
                        label="DELETE ACCOUNT"
                        value="TERMINATE AGENT"
                        onPress={handleDeleteAccount}
                        danger
                        isLast
                    />
                </SectionCard>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Username Modal */}
            <Modal visible={usernameModalVisible} animationType="slide" transparent onRequestClose={() => setUsernameModalVisible(false)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>CHANGE USERNAME</Text>
                        <Text style={styles.modalSubtitle}>30-day cooldown after changing. Choose wisely.</Text>

                        <View style={styles.currentValueRow}>
                            <Text style={styles.currentValueLabel}>CURRENT:</Text>
                            <Text style={styles.currentValue}>@{user?.username || 'not set'}</Text>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            value={newUsername}
                            onChangeText={v => { setNewUsername(v.replace(/\s/g, '').slice(0, 20)); setUsernameError(''); }}
                            placeholder="new_username"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {!!usernameError && <Text style={styles.modalError}>{usernameError}</Text>}

                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setUsernameModalVisible(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalConfirm, { opacity: (!newUsername || isChangingUsername) ? 0.6 : 1 }]}
                                onPress={handleUsernameUpdate}
                                disabled={!newUsername || isChangingUsername}
                            >
                                <Text style={styles.modalConfirmText}>
                                    {isChangingUsername ? 'UPDATING...' : 'CONFIRM'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Email Modal */}
            <Modal visible={emailModalVisible} animationType="slide" transparent onRequestClose={() => setEmailModalVisible(false)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>UPDATE EMAIL</Text>

                        <View style={styles.currentValueRow}>
                            <Text style={styles.currentValueLabel}>CURRENT:</Text>
                            <Text style={styles.currentValue}>{user?.email}</Text>
                        </View>

                        <TextInput
                            style={styles.modalInput}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder="new@email.com"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setEmailModalVisible(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalConfirm, { opacity: (newEmail === user?.email || isUpdatingEmail) ? 0.6 : 1 }]}
                                onPress={handleUpdateEmail}
                                disabled={newEmail === user?.email || isUpdatingEmail}
                            >
                                <Text style={styles.modalConfirmText}>
                                    {isUpdatingEmail ? 'SYNCING...' : 'UPDATE'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Password Modal */}
            <Modal visible={passwordModalVisible} animationType="slide" transparent onRequestClose={() => setPasswordModalVisible(false)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>UPDATE ACCESS CODE</Text>
                        <Text style={styles.modalSubtitle}>Protected by access code verification</Text>

                        <TextInput
                            style={styles.modalInput}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            secureTextEntry
                        />

                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setPasswordModalVisible(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalConfirm, { opacity: (!newPassword || isUpdatingPassword) ? 0.6 : 1 }]}
                                onPress={handleUpdatePassword}
                                disabled={!newPassword || isUpdatingPassword}
                            >
                                <Text style={styles.modalConfirmText}>
                                    {isUpdatingPassword ? 'ENCRYPTING...' : 'UPDATE'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Designation Modal */}
            <Modal visible={designationModalVisible} animationType="slide" transparent onRequestClose={() => setDesignationModalVisible(false)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>EDIT DESIGNATION</Text>
                        <Text style={styles.modalSubtitle}>Your professional title or role</Text>

                        <TextInput
                            style={styles.modalInput}
                            value={tempTitle}
                            onChangeText={setTempTitle}
                            placeholder="e.g. Elite Operative"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            autoCapitalize="words"
                        />

                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setDesignationModalVisible(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalConfirm}
                                onPress={async () => {
                                    setTitle(tempTitle);
                                    await updateProfile({ name, title: tempTitle, bio });
                                    setDesignationModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalConfirmText}>SAVE</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Bio Modal */}
            <Modal visible={bioModalVisible} animationType="slide" transparent onRequestClose={() => setBioModalVisible(false)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>EDIT MISSION STATEMENT</Text>
                        <Text style={styles.modalSubtitle}>Your personal mission or bio</Text>

                        <TextInput
                            style={[styles.modalInput, { height: 120, textAlignVertical: 'top', paddingTop: 16 }]}
                            value={tempBio}
                            onChangeText={setTempBio}
                            placeholder="Enter your mission statement..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setBioModalVisible(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalConfirm}
                                onPress={async () => {
                                    setBio(tempBio);
                                    await updateProfile({ name, title, bio: tempBio });
                                    setBioModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalConfirmText}>SAVE</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Codename Modal */}
            <Modal visible={codenameModalVisible} animationType="slide" transparent onRequestClose={() => setCodenameModalVisible(false)}>
                <View style={styles.modalBg}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>EDIT CODENAME</Text>
                        <Text style={styles.modalSubtitle}>Your display name</Text>

                        <TextInput
                            style={styles.modalInput}
                            value={tempName}
                            onChangeText={setTempName}
                            placeholder="Enter your codename"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            autoCapitalize="words"
                        />

                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setCodenameModalVisible(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalConfirm}
                                onPress={async () => {
                                    setName(tempName);
                                    await updateProfile({ name: tempName, title, bio });
                                    setCodenameModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalConfirmText}>SAVE</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000000',
    },
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backBtn: {
        padding: 10,
    },
    backText: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: Fonts.mono,
        fontSize: 12,
        letterSpacing: 1,
    },
    headerTitle: {
        color: '#fff',
        fontFamily: Fonts.heading,
        fontSize: 14,
        letterSpacing: 3,
        fontWeight: '800',
    },
    content: {
        padding: 16,
        paddingBottom: 100,
        gap: 16,
    },
    sectionCard: {
        marginBottom: 0,
    },
    sectionTitle: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        letterSpacing: 3,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    cardContent: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowWithDivider: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    rowIcon: {
        fontSize: 16,
        width: 28,
        textAlign: 'center',
        marginRight: 12,
        color: '#fff',
    },
    rowIconWrap: {
        width: 28,
        height: 24,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: '#fff',
        letterSpacing: 0.3,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rowValue: {
        fontFamily: Fonts.mono,
        fontSize: 12,
        letterSpacing: 0.5,
        maxWidth: 140,
    },
    rowArrow: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.3)',
        marginLeft: 4,
    },
    rowInput: {
        flex: 1,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: '#fff',
        textAlign: 'right',
        paddingVertical: 4,
        minWidth: 100,
    },
    dangerText: {
        color: '#FF3B30',
    },

    // Modal styles
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#111',
        borderRadius: 24,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: '#fff',
        letterSpacing: 2,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 0.5,
        marginBottom: 20,
        textAlign: 'center',
    },
    currentValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    currentValueLabel: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1,
    },
    currentValue: {
        fontFamily: Fonts.mono,
        fontSize: 12,
        color: '#fff',
        letterSpacing: 0.5,
    },
    modalInput: {
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingHorizontal: 20,
        color: '#fff',
        fontFamily: Fonts.body,
        fontSize: 16,
        marginBottom: 12,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalError: {
        color: '#FF3B30',
        fontFamily: Fonts.mono,
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 12,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalCancel: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalCancelText: {
        fontFamily: Fonts.mono,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        letterSpacing: 1,
    },
    modalConfirm: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    modalConfirmText: {
        fontFamily: Fonts.heading,
        color: '#000',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1,
    },
});
