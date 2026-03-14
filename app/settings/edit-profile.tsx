import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import GlassCard from '@/components/GlassCard';

export default function EditProfileScreen() {
    const { user, updateProfile, signOut, changeEmail, changePassword, deleteAccount, resetProgress, changeUsername } = useUser();

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
    const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

    const handleSave = async () => {
        setIsSaving(true);
        await updateProfile({ name, title, bio });
        setTimeout(() => {
            setIsSaving(false);
            router.back();
        }, 800);
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const handleUpdateEmail = async () => {
        if (!newEmail || newEmail === user?.email) return;

        const confirmChange = () => {
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

        const execute = async () => {
            setIsUpdatingEmail(true);
            try {
                await changeEmail(newEmail);
            } catch (e) {
                // Error handled in UserContext
            } finally {
                setIsUpdatingEmail(false);
            }
        };

        confirmChange();
    };

    const handleUpdatePassword = async () => {
        if (!newPassword) return;

        const confirmChange = () => {
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

        const execute = async () => {
            setIsUpdatingPassword(true);
            try {
                await changePassword(newPassword);
                setNewPassword('');
            } catch (e) {
                // Error handled in UserContext
            } finally {
                setIsUpdatingPassword(false);
            }
        };

        confirmChange();
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
                    deleteAccount();
                }
            } else {
                Alert.alert(
                    'FINAL WARNING',
                    'ARE YOU ABSOLUTELY SURE?\n\nAll your charisma progress will be lost forever.',
                    [
                        { text: 'ABORT', style: 'cancel' },
                        { text: 'CONFIRM DELETE', style: 'destructive', onPress: deleteAccount }
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
        } catch (e: any) {
            setUsernameError(e?.message || 'Failed to update username.');
        } finally {
            setIsChangingUsername(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#050508', '#080816', '#000000']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← BACK</Text>
                </Pressable>
                <Text style={styles.headerTitle}>IDENTITY PROTOCOL</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <GlassCard style={styles.formCard}>
                    <Text style={styles.sectionTitle}>PUBLIC DOSSIER</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CODENAME</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>DESIGNATION</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>MISSION STATEMENT (BIO)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>USERNAME · LEADERBOARD IDENTITY</Text>
                        <View style={styles.usernameCurrentRow}>
                            <Text style={styles.usernameAt}>@</Text>
                            <Text style={styles.usernameCurrent}>{user?.username || '—not set—'}</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={newUsername}
                            onChangeText={v => { setNewUsername(v.replace(/\s/g, '').slice(0, 20)); setUsernameError(''); }}
                            placeholder="new_username"
                            placeholderTextColor={Colors.textTertiary}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {!!usernameError && <Text style={styles.fieldError}>{usernameError}</Text>}
                        <Text style={styles.fieldHint}>30-day cooldown after changing. Choose wisely.</Text>
                        <Pressable
                            onPress={handleUsernameUpdate}
                            style={({ pressed }) => [styles.smallBtn, pressed && styles.pressed, !newUsername && { opacity: 0.4 }]}
                            disabled={!newUsername || isChangingUsername}
                        >
                            <Text style={styles.smallBtnText}>
                                {isChangingUsername ? 'UPDATING...' : 'UPDATE USERNAME'}
                            </Text>
                        </Pressable>
                    </View>

                    <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}>
                        <LinearGradient
                            colors={['#4A9EFF', '#7B61FF']}
                            style={styles.gradientBtn}
                        >
                            <Text style={styles.saveText}>{isSaving ? 'UPDATING...' : 'SAVE PUBLIC PROFILE'}</Text>
                        </LinearGradient>
                    </Pressable>
                </GlassCard>

                <GlassCard style={styles.formCard}>
                    <Text style={styles.sectionTitle}>SECURITY PROTOCOLS</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CURRENT IDENTITY</Text>
                        <Text style={{ color: '#fff', fontFamily: Fonts.mono, fontSize: 12, marginBottom: 4 }}>{user?.email}</Text>
                        <View style={styles.divider} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>NEW AGENT ID (EMAIL)</Text>
                        <TextInput
                            style={styles.input}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder="agent@zce.io"
                            placeholderTextColor={Colors.textTertiary}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <Pressable
                            onPress={handleUpdateEmail}
                            style={({ pressed }) => [styles.smallBtn, pressed && styles.pressed]}
                            disabled={newEmail === user?.email}
                        >
                            <Text style={[styles.smallBtnText, newEmail === user?.email && { opacity: 0.5 }]}>
                                {isUpdatingEmail ? 'SYNCING...' : 'UPDATE EMAIL'}
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ACCESS CODE (PROTECTED)</Text>
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.textTertiary}
                            secureTextEntry
                        />
                        <Pressable
                            onPress={handleUpdatePassword}
                            style={({ pressed }) => [styles.smallBtn, pressed && styles.pressed]}
                            disabled={!newPassword}
                        >
                            <Text style={[styles.smallBtnText, !newPassword && { opacity: 0.5 }]}>
                                {isUpdatingPassword ? 'ENCRYPTING...' : 'UPDATE PASSWORD'}
                            </Text>
                        </Pressable>
                    </View>
                </GlassCard>

                <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
                    <Text style={styles.signOutText}>BURN IDENTITY (SIGN OUT)</Text>
                </Pressable>

                {/* Reset Progress — wipes XP/streak but keeps account */}
                <Pressable
                    style={[styles.signOutBtn, { borderColor: 'rgba(255, 160, 50, 0.4)', backgroundColor: 'rgba(255, 140, 0, 0.05)', marginTop: 12 }]}
                    onPress={() => Alert.alert(
                        '⚠️ WIPE ALL PROGRESS?',
                        'This resets your XP, streak, and completed missions to zero — but keeps your account. Cannot be undone.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'RESET', style: 'destructive', onPress: () => resetProgress() },
                        ]
                    )}
                >
                    <Text style={[styles.signOutText, { color: '#FFA040' }]}>WIPE PROGRESS (KEEP ACCOUNT)</Text>
                </Pressable>

                <Pressable onPress={handleDeleteAccount} style={[styles.signOutBtn, styles.deleteBtn]}>
                    <Text style={styles.deleteText}>TERMINATE AGENT (DELETE ACCOUNT)</Text>
                </Pressable>
            </ScrollView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    },
    backBtn: { padding: 10 },
    backText: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 12 },
    headerTitle: { color: '#fff', fontFamily: Fonts.heading, fontSize: 16, letterSpacing: 2 },

    content: { padding: 20, gap: 24 },
    formCard: { padding: 24, gap: 20 },
    sectionTitle: { color: Colors.accentPrimary, fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 2, marginBottom: 8 },

    inputGroup: { gap: 8 },
    label: { color: Colors.textSecondary, fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1 },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: '#fff',
        padding: 12,
        fontFamily: Fonts.body,
        fontSize: 14,
    },
    textArea: { height: 100, textAlignVertical: 'top' },

    saveBtn: { borderRadius: Radius.md, overflow: 'hidden', marginTop: 8 },
    gradientBtn: { padding: 16, alignItems: 'center' },
    saveText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 14, letterSpacing: 2 },
    pressed: { opacity: 0.8 },

    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8 },
    smallBtn: { paddingVertical: 10, alignItems: 'flex-end' },
    smallBtnText: { color: Colors.accentPrimary, fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1, textDecorationLine: 'underline' },

    signOutBtn: { padding: 16, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)', borderRadius: Radius.md },
    signOutText: { color: '#FF3B30', fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1 },

    deleteBtn: { marginTop: 12, borderColor: 'rgba(255, 0, 0, 0.5)', backgroundColor: 'rgba(255, 0, 0, 0.05)' },
    deleteText: { color: '#FF4444', fontFamily: Fonts.monoBold, fontSize: 12, letterSpacing: 1 },

    // Username section
    usernameCurrentRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    usernameAt: { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.accentPrimary },
    usernameCurrent: { fontFamily: Fonts.mono, fontSize: 13, color: '#fff', letterSpacing: 0.5 },
    fieldError: { color: '#FF3B30', fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.3 },
    fieldHint: { color: 'rgba(255,255,255,0.25)', fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.3 },
});
