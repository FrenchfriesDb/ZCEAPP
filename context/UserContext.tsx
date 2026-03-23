import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform, Alert } from 'react-native';
import { auth, db } from '@/services/firebase';
import { NotificationService } from '@/services/notifications';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateEmail,
    updatePassword,
    sendPasswordResetEmail,
    deleteUser,
    signOut as fbSignOut
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';

// --- STORAGE HELPER ---
const Storage = {
    getItem: async (key: string) => AsyncStorage.getItem(key),
    setItem: async (key: string, value: string) => AsyncStorage.setItem(key, value),
    deleteItem: async (key: string) => AsyncStorage.removeItem(key),
};

const USERNAME_EMAIL_MAP_KEY = 'zce_username_email_map';
const LAST_SUCCESS_EMAIL_KEY = 'zce_last_success_email';
const LAST_SUCCESS_USERNAME_KEY = 'zce_last_success_username';

const getRecentLoginError = () => "CRITICAL: Re-authentication Required. For security, you must log out and immediately log back in to change your agent credentials.";
const STREAK_RECOVERY_GRACE_MS = 10 * 60 * 1000;


// --- DEFAULT STATE ---
const DEFAULT_USER: Partial<UserData> = {
    email: '',
    name: 'Agent 808',
    title: 'Initiate',
    bio: 'Reprogramming social instincts.',
    level: 0,
    xp: 0,
    nextLevelXp: 100,
    streak: 0,
    previousStreak: 0,
    streakAtRisk: false,
    streakRecoveryExpiresAt: null,
    joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    lastActivityDate: null,
    journalLogs: [],
    drillLogs: [],
    completedQuests: [],
    chatLogs: [],
    dailyXp: {},
    username: '',
    usernameLastChanged: null,
    systemBackups: 1,
    lastBackupMonth: '',
    zaneChatStyle: 'classic',
    socialLevel: 'NPC',
    primaryMission: 'General',
    commitment: '30 days',
    lastDrillDate: null,
};

interface UserData {
    email: string;
    name: string;
    title: string;
    bio: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    streak: number;
    previousStreak?: number;
    streakAtRisk?: boolean;
    streakRecoveryExpiresAt?: string | null;
    joinDate: string;
    lastActivityDate: string | null;
    journalLogs: any[];
    drillLogs: any[];
    completedQuests: string[];
    chatLogs: { role: 'user' | 'assistant', content: string, timestamp: string }[];
    dailyXp: { [date: string]: number };
    username: string;
    usernameLastChanged: string | null;
    systemBackups: number;
    lastBackupMonth: string;
    zaneChatStyle?: 'classic' | 'coach' | 'nervous';
    // Onboarding data - saved permanently to profile
    socialLevel: string; // NPC, Side Character, Lead
    primaryMission: string; // Social anxiety, Dating, etc.
    commitment: string; // 30 days, 90 days, Forever
    // Keep backward compat
    lastDrillDate?: string | null;
}

interface UserContextType {
    user: UserData | null;
    isLoading: boolean;
    signIn: (emailOrUsername: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, username?: string) => Promise<void>;
    signOut: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    updateProfile: (updates: Partial<UserData>) => Promise<void>;
    completeDrill: (xpGain: number) => Promise<void>;
    completeQuest: (questId: string, xpGain: number, log?: string, attachments?: { photoUri?: string, voiceUri?: string }) => Promise<void>;
    recoverStreak: () => Promise<void>;
    addJournalEntry: (entry: string, analysis?: string) => Promise<void>;
    addDrillLog: (type: string, score?: number, feedback?: string) => Promise<void>;
    addChatMessage: (msg: { role: 'user' | 'assistant', content: string }) => Promise<void>;
    changeEmail: (newEmail: string) => Promise<void>;
    changePassword: (newPassword: string) => Promise<void>;
    changeUsername: (newUsername: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    setOnboardingData: (data: { level: string, goal: string, commitment: string }) => void;
    onboardingData: { level: string, goal: string, commitment: string };
    hasCompletedOnboarding: boolean;
    setHasCompletedOnboarding: (value: boolean) => void;
    completeOnboarding: () => Promise<void>;
    /** When set (6 or 7), onboarding should open at this stage when user returns from login/signup */
    returnToOnboardingStage: number | null;
    setReturnToOnboardingStage: (stage: number | null) => void;
    resetQuests: (questIds: string[]) => Promise<void>;
    clearChat: () => Promise<void>;
    resetProgress: () => Promise<void>;
    deploySystemBackup: () => Promise<void>;
    purchaseSystemBackup: () => Promise<void>;
}

const UserContext = createContext<UserContextType>(null as any);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};

// --- LOCAL DATE HELPER (Deterministic YYYY-MM-DD) ---
const getLocalDateStr = (offset = 0) => {
    const d = new Date();
    if (offset !== 0) d.setDate(d.getDate() + offset);

    // Explicit parts for absolute consistency across OS/Locale environments
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// XP is purely cumulative. Level is derived from total XP via XPConfig in theme.ts.

// --- PROVIDER ---
export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [onboardingData, setOnboardingData] = useState({ level: 'NPC', goal: 'General', commitment: '30 days' });
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [returnToOnboardingStage, setReturnToOnboardingStage] = useState<number | null>(null);

    // KEY FIX: userRef always holds the LATEST user — eliminates stale closures.
    const userRef = useRef<UserData | null>(null);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const cacheUsernameEmail = async (username?: string, email?: string) => {
        const normalizedUsername = (username || '').replace(/^@+/, '').trim().toLowerCase();
        const normalizedEmail = (email || '').trim().toLowerCase();
        if (!normalizedEmail) return;

        const emailLocalPart = normalizedEmail.includes('@') ? normalizedEmail.split('@')[0] : '';

        try {
            const raw = await Storage.getItem(USERNAME_EMAIL_MAP_KEY);
            const map = raw ? JSON.parse(raw) as Record<string, string> : {};

            if (normalizedUsername && map[normalizedUsername] !== normalizedEmail) {
                map[normalizedUsername] = normalizedEmail;
            }

            if (emailLocalPart && map[emailLocalPart] !== normalizedEmail) {
                map[emailLocalPart] = normalizedEmail;
            }

            await Storage.setItem(USERNAME_EMAIL_MAP_KEY, JSON.stringify(map));
        } catch (err) {
            console.warn('[UserContext] Failed caching username map:', err);
        }
    };

    const resolveEmailFromUsername = async (usernameInput: string): Promise<string | null> => {
        const normalizedUsername = usernameInput.replace(/^@+/, '').trim().toLowerCase();
        if (!normalizedUsername) return null;

        try {
            const lastUsername = (await Storage.getItem(LAST_SUCCESS_USERNAME_KEY) || '').trim().toLowerCase();
            const lastEmail = (await Storage.getItem(LAST_SUCCESS_EMAIL_KEY) || '').trim().toLowerCase();
            if (lastUsername && lastEmail && lastUsername === normalizedUsername) {
                await cacheUsernameEmail(lastUsername, lastEmail);
                return lastEmail;
            }
        } catch (err) {
            console.warn('[UserContext] Failed reading last success username/email:', err);
        }

        try {
            const raw = await Storage.getItem(USERNAME_EMAIL_MAP_KEY);
            if (raw) {
                const map = JSON.parse(raw) as Record<string, string>;
                const cached = map[normalizedUsername];
                if (cached) return cached;
            }
        } catch (err) {
            console.warn('[UserContext] Failed reading username map cache:', err);
        }

        try {
            const lastEmail = (await Storage.getItem(LAST_SUCCESS_EMAIL_KEY) || '').trim().toLowerCase();
            if (lastEmail && lastEmail.includes('@')) {
                const lastLocalPart = lastEmail.split('@')[0];
                if (lastLocalPart === normalizedUsername) {
                    await cacheUsernameEmail(normalizedUsername, lastEmail);
                    return lastEmail;
                }
            }
        } catch (err) {
            console.warn('[UserContext] Failed reading last success email:', err);
        }

        try {
            let snap = await getDocs(query(collection(db, 'users'), where('username', '==', normalizedUsername)));
            if (snap.empty) {
                snap = await getDocs(query(collection(db, 'users'), where('username', '==', usernameInput)));
            }
            if (!snap.empty) {
                const email = String(snap.docs[0].data().email || '').trim().toLowerCase();
                if (email) {
                    await cacheUsernameEmail(normalizedUsername, email);
                    return email;
                }
            }
        } catch (err: any) {
            console.warn('[UserContext] Firestore username lookup failed:', err?.code || err?.message || err);
        }

        return null;
    };

    // --- INITIALIZATION ---
    useEffect(() => {
        console.log('[UserContext] INIT V3');
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('[UserContext] Auth state changed. User:', firebaseUser?.uid ?? 'null');
            if (firebaseUser) {
                if (firebaseUser.isAnonymous) {
                    console.log('[UserContext] Anonymous session detected. Forcing logout.');
                    try { await fbSignOut(auth); } catch (e) { console.warn('[UserContext] Failed to sign out anonymous user:', e); }
                    setUser(null);
                    userRef.current = null;
                    await Storage.deleteItem('zce_user');
                    setIsLoading(false);
                    return;
                }

                try {
                    const docRef = doc(db, 'users', firebaseUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        // ✅ HAPPY PATH: Firestore doc exists, load it
                        const data = docSnap.data() as UserData;

                        // --- BACKFILL LOGIC ---
                        if (data.streak > 1 && data.lastActivityDate) {
                            const dailyXp = { ...(data.dailyXp || {}) };
                            let changed = false;
                            for (let i = 1; i < data.streak; i++) {
                                const d: Date = new Date(data.lastActivityDate);
                                d.setDate(d.getDate() - i);
                                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                if (!dailyXp[dateStr]) {
                                    dailyXp[dateStr] = 50 + Math.floor(Math.random() * 50); // Simulated historical effort
                                    changed = true;
                                }
                            }
                            if (changed) {
                                console.log('[UserContext] Backfilling streak data...');
                                updateDoc(docRef, { dailyXp }).catch(e => console.error('[Backfill] Update failed:', e));
                                data.dailyXp = dailyXp;
                            }
                        }

                        setUser(data);
                        userRef.current = data;
                        await Storage.setItem('zce_user', JSON.stringify(data));
                        await cacheUsernameEmail(data.username, data.email);
                        if (data.username) await Storage.setItem(LAST_SUCCESS_USERNAME_KEY, data.username.toLowerCase());
                        if (data.email) await Storage.setItem(LAST_SUCCESS_EMAIL_KEY, data.email.toLowerCase());
                        console.log('[UserContext] User loaded from Firestore:', data.email);
                    } else {
                        // ❌ No Firestore doc found for this Firebase user.
                        // AUTO-INITIALIZE: If they've authenticated but have no data, 
                        // we create a default profile instead of signing them out.
                        console.log('[UserContext] Auto-creating default doc for uid:', firebaseUser.uid);
                        const defaultData: UserData = {
                            email: firebaseUser.email || 'anonymous',
                            name: firebaseUser.isAnonymous ? 'Guest Agent' : (firebaseUser.displayName || 'Agent ' + firebaseUser.uid.slice(0, 4)),
                            title: 'Initiate',
                            bio: 'Reprogramming social instincts.',
                            level: 0,
                            xp: 0,
                            nextLevelXp: 100,
                            streak: 0,
                            previousStreak: 0,
                            streakAtRisk: false,
                            streakRecoveryExpiresAt: null,
                            joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                            lastActivityDate: null,
                            journalLogs: [],
                            drillLogs: [],
                            completedQuests: [],
                            chatLogs: [],
                            dailyXp: {},
                            username: '',
                            usernameLastChanged: null,
                            systemBackups: 1,
                            lastBackupMonth: '',
                            zaneChatStyle: 'classic',
                            socialLevel: 'NPC',
                            primaryMission: 'General',
                            commitment: '30 days',
                            lastDrillDate: null,
                        };
                        await setDoc(docRef, defaultData);
                        setUser(defaultData);
                        userRef.current = defaultData;
                        await Storage.setItem('zce_user', JSON.stringify(defaultData));
                        await cacheUsernameEmail(defaultData.username, defaultData.email);
                        if (defaultData.username) await Storage.setItem(LAST_SUCCESS_USERNAME_KEY, defaultData.username.toLowerCase());
                        if (defaultData.email) await Storage.setItem(LAST_SUCCESS_EMAIL_KEY, defaultData.email.toLowerCase());
                    }
                } catch (err: any) {
                    console.warn('[UserContext] Firestore read failed:', err.code ?? err.message);
                    // Network/permission failure: try local cache as read-only fallback
                    const cached = await Storage.getItem('zce_user');
                    if (cached) {
                        try {
                            const data = JSON.parse(cached) as UserData;
                            setUser(data);
                            userRef.current = data;
                            await cacheUsernameEmail(data.username, data.email);
                            if (data.username) await Storage.setItem(LAST_SUCCESS_USERNAME_KEY, data.username.toLowerCase());
                            if (data.email) await Storage.setItem(LAST_SUCCESS_EMAIL_KEY, data.email.toLowerCase());
                            console.log('[UserContext] Loaded from local cache (offline fallback)');
                        } catch {
                            // Cache corrupted — sign out
                            await fbSignOut(auth);
                            setUser(null);
                            userRef.current = null;
                        }
                    } else {
                        // No cache and no Firestore — sign out
                        await fbSignOut(auth);
                        setUser(null);
                        userRef.current = null;
                    }
                }
            } else {
                // Signed out
                setUser(null);
                userRef.current = null;
                await Storage.deleteItem('zce_user');
            }

            // --- AUTO-GRANT SYSTEM BACKUP (Monthly) ---
            const currentUser = userRef.current;
            if (currentUser) {
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                if (currentUser.lastBackupMonth !== currentMonth) {
                    console.log(`[UserContext] NEW MONTH DETECTED (${currentMonth}). Granting System Backup +1.`);
                    // We can't call _syncUpdate directly here yet safely during onAuthStateChanged chain? 
                    // Actually we can, it will update state and firestore.
                    _syncUpdate({
                        systemBackups: (currentUser.systemBackups || 0) + 1,
                        lastBackupMonth: currentMonth
                    }).catch(e => console.warn('Monthly backup grant failed', e));
                }
            }

            const status = await Storage.getItem('zce_onboarding_done');
            if (status === 'true') setHasCompletedOnboarding(true);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (isLoading || !user) return;

        const today = getLocalDateStr();
        const yesterday = getLocalDateStr(-1);
        const lastDate = user.lastActivityDate;
        const recoveryExpired = !!user.streakRecoveryExpiresAt && new Date(user.streakRecoveryExpiresAt).getTime() <= Date.now();
        const safePreviousStreak = Math.max(Number(user.previousStreak || 0), Number(user.streak || 0));

        // Self-heal any stale risk snapshot where previousStreak is lower than current streak.
        // This prevents visual regressions like "8 yesterday, 7 today" while in at-risk mode.
        if (user.streakAtRisk && safePreviousStreak !== Number(user.previousStreak || 0)) {
            _syncUpdate({ previousStreak: safePreviousStreak }).catch((err) =>
                console.warn('[UserContext] Failed to normalize previous streak at risk:', err)
            );
            return;
        }

        if (user.streakAtRisk && recoveryExpired) {
            _syncUpdate({
                streakAtRisk: false,
                previousStreak: 0,
                streakRecoveryExpiresAt: null,
            }).catch((err) => console.warn('[UserContext] Failed to expire streak recovery window:', err));
            return;
        }

        if (!lastDate || lastDate === today || lastDate === yesterday) return;
        if (user.streakAtRisk || (user.streak || 0) <= 1) return;

        const previousStreak = Math.max(Number(user.streak || 0), Number(user.previousStreak || 0));

        _syncUpdate({
            streakAtRisk: true,
            previousStreak,
            streakRecoveryExpiresAt: new Date(Date.now() + STREAK_RECOVERY_GRACE_MS).toISOString(),
        }).catch((err) => console.warn('[UserContext] Failed to mark streak at risk on load:', err));
    }, [isLoading, user]);

    // --- CORE SYNC: writes to state, AsyncStorage, and Firestore atomically ---
    // IMPORTANT: reads userRef.current — NOT the stale closure `user`
    const _syncUpdate = async (updates: Partial<UserData>) => {
        const currentUser = userRef.current;
        if (!currentUser) {
            console.warn('[UserContext] _syncUpdate called with no user');
            return;
        }

        const merged: UserData = { ...currentUser, ...updates };
        setUser(merged);
        userRef.current = merged;
        await Storage.setItem('zce_user', JSON.stringify(merged));
        await cacheUsernameEmail(merged.username, merged.email);

        if (auth.currentUser) {
            try {
                const docRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(docRef, updates as any);
                console.log('[UserContext] Firestore synced:', Object.keys(updates));
            } catch (err) {
                console.error('[UserContext] Firestore sync failed:', err);
            }
        }
    };

    // --- AUTH HELPERS ---
    const getFriendlyAuthError = (code: string, forUsernameLogin: boolean = false): string => {
        switch (code) {
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Incorrect password.';
            case 'auth/user-not-found':
                return forUsernameLogin ? 'Username not found.' : 'Email does not exist.';
            case 'auth/email-already-in-use':
                return 'Email already in use.';
            case 'auth/invalid-email':
                return 'That email address is invalid.';
            case 'auth/weak-password':
                return 'Password must be at least 6 characters.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Try again later.';
            case 'auth/network-request-failed':
                return 'No internet connection. Check your network.';
            default:
                return 'Authentication failed. Try again.';
        }
    };

    // --- AUTH ---
    const signIn = async (emailOrUsername: string, password: string) => {
        setIsLoading(true);
        try {
            if (!emailOrUsername || !password) {
                throw new Error('Credentials required.');
            }

            const rawInput = emailOrUsername.trim();
            const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawInput);
            const isUsernameLogin = !looksLikeEmail;

            if (auth.currentUser) {
                try { await fbSignOut(auth); } catch { }
                setUser(null);
                userRef.current = null;
                try { await Storage.deleteItem('zce_user'); } catch { }
            }

            let loginEmail = rawInput.toLowerCase();

            // If it doesn't look like an email, treat it as a username — look up the real email
            if (isUsernameLogin) {
                const resolvedEmail = await resolveEmailFromUsername(rawInput);
                if (!resolvedEmail) {
                    const usernameErr: any = new Error('Username not found.');
                    usernameErr.code = 'auth/user-not-found';
                    throw usernameErr;
                }
                loginEmail = resolvedEmail;
            }

            await signInWithEmailAndPassword(auth, loginEmail, password);
            await cacheUsernameEmail(isUsernameLogin ? rawInput : undefined, loginEmail);
            await Storage.setItem(LAST_SUCCESS_EMAIL_KEY, loginEmail);
            router.replace('/(tabs)');
        } catch (e: any) {
            const rawInput = emailOrUsername.trim();
            const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawInput);
            const isUsernameLogin = !looksLikeEmail;
            let msg = getFriendlyAuthError(e.code || '', isUsernameLogin);
            if (e.code === 'auth/firebase-app-check-token-is-invalid' || e.message?.includes('app-check')) {
                msg = "SECURITY: App Check is blocking this login. In Firebase Console -> App Check, set Authentication to 'Unenforced'.";
            }
            console.log('[signIn Error]', e.code, e.message);
            setUser(null);
            userRef.current = null;
            try { await Storage.deleteItem('zce_user'); } catch { }
            setIsLoading(false);
            Alert.alert("Access Denied", msg);
            throw new Error(msg);
        } finally { setIsLoading(false); }
    };

    // Change username — enforces 30-day cooldown
    const changeUsername = async (newUsername: string): Promise<void> => {
        if (!userRef.current) throw new Error("Not logged in.");
        const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
        if (!USERNAME_REGEX.test(newUsername)) {
            throw new Error("Username must be 3–20 characters: letters, numbers, underscores only.");
        }

        const lastChanged = userRef.current.usernameLastChanged;
        if (lastChanged) {
            const daysSince = (Date.now() - new Date(lastChanged).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince < 30) {
                const daysLeft = Math.ceil(30 - daysSince);
                throw new Error(`Username locked for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}. Change allowed every 30 days.`);
            }
        }

        // Check uniqueness in Firestore
        const q = query(collection(db, 'users'), where('username', '==', newUsername.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) throw new Error("That username is already taken.");

        await _syncUpdate({
            username: newUsername.toLowerCase(),
            usernameLastChanged: new Date().toISOString(),
        });
        await cacheUsernameEmail(newUsername.toLowerCase(), userRef.current.email);
        await Storage.setItem(LAST_SUCCESS_USERNAME_KEY, newUsername.toLowerCase());
    };

    const forgotPassword = async (email: string) => {
        if (!email) throw new Error("Email required.");
        try {
            await sendPasswordResetEmail(auth, email.trim().toLowerCase());
            Alert.alert("Link Sent", "Encrypted reset link sent to your agent ID. Check your inbox.");
        } catch (e: any) {
            let msg = getFriendlyAuthError(e.code || '');
            Alert.alert("Protocol Failed", msg);
            throw new Error(msg);
        }
    };

    const signUp = async (email: string, password: string, name: string, username: string = '') => {
        setIsLoading(true);
        const cleanEmail = email.trim().toLowerCase();
        const normalizedUsername = (username || name.toLowerCase().replace(/\s+/g, '_').slice(0, 20)).toLowerCase();
        try {
            const usernameSnap = await getDocs(query(collection(db, 'users'), where('username', '==', normalizedUsername)));
            if (!usernameSnap.empty) {
                const usernameTakenError: any = new Error('Username already in use.');
                usernameTakenError.code = 'auth/username-already-in-use';
                throw usernameTakenError;
            }

            const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            const initialData: UserData = {
                email: cleanEmail,
                name: name || 'Agent 808',
                username: normalizedUsername,
                usernameLastChanged: new Date().toISOString(),
                title: onboardingData.level.split(' — ')[0],
                bio: `Mission: ${onboardingData.goal}. Weakness dies here.`,
                joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                lastActivityDate: null,
                level: 0,
                xp: 0,
                nextLevelXp: 100,
                streak: 0,
                previousStreak: 0,
                streakAtRisk: false,
                streakRecoveryExpiresAt: null,
                journalLogs: [],
                drillLogs: [],
                completedQuests: [],
                chatLogs: [],
                dailyXp: {},
                systemBackups: 1,
                lastBackupMonth: '',
                zaneChatStyle: 'classic',
                // Save onboarding data permanently to profile
                socialLevel: onboardingData.level,
                primaryMission: onboardingData.goal,
                commitment: onboardingData.commitment,
                lastDrillDate: null,
            };
            await setDoc(doc(db, 'users', cred.user.uid), initialData);
            setUser(initialData);
            userRef.current = initialData;
            await Storage.setItem('zce_user', JSON.stringify(initialData));
            await cacheUsernameEmail(initialData.username, initialData.email);
            await Storage.setItem(LAST_SUCCESS_EMAIL_KEY, initialData.email);
            await Storage.setItem(LAST_SUCCESS_USERNAME_KEY, initialData.username.toLowerCase());
            // Complete onboarding after successful signup
            await completeOnboarding();
            router.replace('/(tabs)');
        } catch (e: any) {
            let msg = getFriendlyAuthError(e.code || '');
            if (e.code === 'auth/username-already-in-use') {
                msg = 'Username already in use.';
            }
            if (e.code === 'auth/firebase-app-check-token-is-invalid' || e.message?.includes('app-check')) {
                msg = "SECURITY ALERT: App Check is blocking this login. Go to Firebase Console -> App Check and set Authentication to 'Unenforced'.";
            }
            console.log('[signUp Error]', e.code, e.message);

            try { await fbSignOut(auth); } catch { }
            setUser(null);
            userRef.current = null;
            setIsLoading(false);

            Alert.alert("Access Denied", msg);
            throw new Error(msg);
        } finally { setIsLoading(false); }
    };

    const signOut = async () => {
        // Clear all local state first so UI reflects logged-out immediately
        setUser(null);
        userRef.current = null;
        try {
            await fbSignOut(auth);
        } catch (e) {
            console.warn('[signOut] Firebase signOut failed, forcing local clear:', e);
        }
        // Clear only user session data
        try {
            await AsyncStorage.removeItem('zce_user');
        } catch (e) {
            console.warn('[signOut] Storage clear failed:', e);
        }
        router.replace('/auth/login');
    };

    // --- GAMEPLAY ---

    /**
     * Called after any training activity (drill, quest, mission).
     * Always increments streak correctly based on local date.
     */
    const completeDrill = async (xpGain: number = 20) => {
        const current = userRef.current;
        if (!current) { console.warn('[completeDrill] No user'); return; }

        const today = getLocalDateStr();
        const yesterday = getLocalDateStr(-1);
        const lastDate = current.lastActivityDate;

        console.log(`[Streak Engine] Pulse Init | Today: ${today} | LastActivity: ${lastDate} | CurrentStreak: ${current.streak}`);

        let streak = Number(current.streak || 0);
        let streakAtRisk = !!current.streakAtRisk;
        let previousStreak = Number(current.previousStreak || 0);
        let streakRecoveryExpiresAt = current.streakRecoveryExpiresAt || null;

        if (!lastDate) {
            console.log('[Streak Engine] First activity ever. Starting streak at 1.');
            streak = 1;
        } else if (lastDate === today) {
            console.log('[Streak Engine] Already active today. Keeping streak at', streak);
            streakAtRisk = false;
            streakRecoveryExpiresAt = null;
        } else if (lastDate === yesterday) {
            streak += 1;
            streakAtRisk = false;
            streakRecoveryExpiresAt = null;
            console.log('[Streak Engine] Consecutive day! Streak incremented to', streak);
        } else {
            console.log(`[Streak Engine] Day gap detected (Last: ${lastDate}). Resetting to 1.`);
            previousStreak = Math.max(streak, previousStreak);
            streak = 1;
            streakAtRisk = (previousStreak > 1);
            streakRecoveryExpiresAt = streakAtRisk ? new Date(Date.now() + STREAK_RECOVERY_GRACE_MS).toISOString() : null;
            if (streakAtRisk) {
                NotificationService.sendStreakWarning();
            }
        }

        const newXp = (current.xp || 0) + xpGain;
        const dailyXp = { ...(current.dailyXp || {}) };
        dailyXp[today] = (dailyXp[today] || 0) + xpGain;

        const log = { id: Date.now().toString(), date: new Date().toISOString(), type: 'Drill', score: 100, feedback: `Earned ${xpGain} XP in training.` };

        await _syncUpdate({
            xp: newXp,
            streak,
            previousStreak,
            streakAtRisk,
            streakRecoveryExpiresAt,
            dailyXp,
            lastActivityDate: today,
            drillLogs: [log, ...(current.drillLogs || [])],
        });
    };

    /**
     * Called when an agent completes a quest or daily mission.
     * Marks questId in completedQuests, increments streak if it's a new day.
     */
    const completeQuest = async (questId: string, xpGain: number = 20, log?: string, attachments?: { photoUri?: string, voiceUri?: string }) => {
        const current = userRef.current;
        if (!current) { console.warn('[completeQuest] No user'); return; }

        const today = getLocalDateStr();
        const lastDate = current.lastActivityDate;

        console.log(`[Quest Engine] Completing ${questId} | XP: ${xpGain} | Today: ${today} | Last: ${lastDate}`);

        // Build new completedQuests — carry over today's completions, reset if new day
        const dayQuests = lastDate === today ? (current.completedQuests || []) : [];
        if (dayQuests.includes(questId)) {
            console.log(`[completeQuest] ${questId} already done today.`);
            return;
        }
        const newDayQuests = [...dayQuests, questId];

        // Reuse streak logic
        let streak = Number(current.streak || 0);
        let streakAtRisk = !!current.streakAtRisk;
        let previousStreak = Number(current.previousStreak || 0);
        let streakRecoveryExpiresAt = current.streakRecoveryExpiresAt || null;

        if (!lastDate) {
            streak = 1;
        } else if (lastDate === today) {
            streakAtRisk = false;
            streakRecoveryExpiresAt = null;
        } else if (lastDate === getLocalDateStr(-1)) {
            streak += 1;
            streakAtRisk = false;
            streakRecoveryExpiresAt = null;
        } else {
            previousStreak = Math.max(streak, previousStreak);
            streak = 1;
            streakAtRisk = previousStreak > 1;
            streakRecoveryExpiresAt = streakAtRisk ? new Date(Date.now() + STREAK_RECOVERY_GRACE_MS).toISOString() : null;
            if (streakAtRisk) {
                NotificationService.sendStreakWarning();
            }
        }

        const newXp = (current.xp || 0) + xpGain;
        const dailyXp = { ...(current.dailyXp || {}) };

        // Safety check: ensure we aren't writing to yesterday due to some weird state shift
        const freshToday = getLocalDateStr();
        dailyXp[freshToday] = (dailyXp[freshToday] || 0) + xpGain;

        console.log(`[Quest Engine] XP Updated | Key: ${freshToday} | NewDailyTotal: ${dailyXp[freshToday]}`);

        const historyLog: any = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            type: 'Mission',
            feedback: log ? `${log} [ID:${questId}]` : `Completed Mission: ${questId}`
        };

        if (attachments) {
            if (attachments.photoUri) historyLog.photoUri = attachments.photoUri;
            if (attachments.voiceUri) historyLog.voiceUri = attachments.voiceUri;
        }

        await _syncUpdate({
            xp: newXp,
            streak,
            previousStreak,
            streakAtRisk,
            streakRecoveryExpiresAt,
            dailyXp,
            lastActivityDate: freshToday,
            completedQuests: newDayQuests,
            drillLogs: [historyLog, ...(current.drillLogs || [])],
        });
    };

    const recoverStreak = async () => {
        const current = userRef.current;
        if (!current || !current.streakAtRisk) return;
        if (current.streakRecoveryExpiresAt && new Date(current.streakRecoveryExpiresAt).getTime() <= Date.now()) {
            await _syncUpdate({
                streakAtRisk: false,
                previousStreak: 0,
                streakRecoveryExpiresAt: null,
            });
            Alert.alert('WINDOW CLOSED', 'The charisma recovery window expired. The streak loss is now locked.');
            return;
        }

        console.log(`[UserContext] Recovering Streak: ${current.previousStreak}`);
        const yesterday = getLocalDateStr(-1);
        const recoveredStreak = Math.max(Number(current.previousStreak || 0), Number(current.streak || 0), 1);
        await _syncUpdate({
            streak: recoveredStreak,
            streakAtRisk: false,
            previousStreak: 0,
            streakRecoveryExpiresAt: null,
            lastActivityDate: yesterday // KEY FIX: Setting this allows today's activity to count as consecutive
        });
    };

    /**
     * Resets a specific set of quest IDs from completedQuests (for reloading a section).
     * Does NOT reset the streak or XP.
     */
    const resetQuests = async (questIds: string[]) => {
        const current = userRef.current;
        if (!current) return;
        const remaining = (current.completedQuests || []).filter(id => !questIds.includes(id));
        console.log(`[resetQuests] removing ${questIds.length} IDs, remaining: ${remaining.length}`);
        await _syncUpdate({ completedQuests: remaining });
    };

    // --- JOURNAL / LOGS ---
    const addJournalEntry = async (entry: string, analysis?: string) => {
        const current = userRef.current;
        if (!current) return;
        const newEntry = { id: Date.now().toString(), date: new Date().toISOString(), entry, analysis };
        await _syncUpdate({ journalLogs: [newEntry, ...(current.journalLogs || [])] });
    };

    const addDrillLog = async (type: string, score?: number, feedback?: string) => {
        const current = userRef.current;
        if (!current) return;
        const log = { id: Date.now().toString(), date: new Date().toISOString(), type, score, feedback };
        await _syncUpdate({ drillLogs: [log, ...(current.drillLogs || [])] });
    };

    const addChatMessage = async (msg: { role: 'user' | 'assistant', content: string }) => {
        const current = userRef.current;
        if (!current) return;
        const newMsg = { ...msg, timestamp: new Date().toISOString() };
        // Keep last 100 messages for sanity
        const newLogs = [newMsg, ...(current.chatLogs || [])].slice(0, 100);
        await _syncUpdate({ chatLogs: newLogs });
    };

    // --- PROFILE SETTINGS ---
    const updateProfile = async (updates: Partial<UserData>) => _syncUpdate(updates);

    const changeEmail = async (newEmail: string) => {
        if (!auth.currentUser) return;
        setIsLoading(true);
        console.log('[UserContext] Initiative: Syncing New Agent ID:', newEmail);
        try {
            await updateEmail(auth.currentUser, newEmail);
            await _syncUpdate({ email: newEmail });
            Alert.alert('Protocol Success', 'Agent ID successfully synced to new address.');
        } catch (e: any) {
            console.error('[UserContext] Agent ID Sync Failed:', e.code, e.message);
            let msg = e.code === 'auth/requires-recent-login' ? getRecentLoginError() : getFriendlyAuthError(e.code);
            Alert.alert('Sync Failed', msg);
        }
        finally { setIsLoading(false); }
    };

    const changePassword = async (newPassword: string) => {
        if (!auth.currentUser) return;
        setIsLoading(true);
        console.log('[UserContext] Initiative: Rotating Access Code');
        try {
            await updatePassword(auth.currentUser, newPassword);
            Alert.alert('Encryption Success', 'Security access code successfully rotated.');
        } catch (e: any) {
            console.error('[UserContext] Access Code Rotation Failed:', e.code, e.message);
            let msg = e.code === 'auth/requires-recent-login' ? getRecentLoginError() : getFriendlyAuthError(e.code);
            Alert.alert('Rotation Failed', msg);
        }
        finally { setIsLoading(false); }
    };

    const deleteAccount = async () => {
        if (!auth.currentUser) return;
        setIsLoading(true);
        try {
            const uid = auth.currentUser.uid;
            await deleteDoc(doc(db, 'users', uid));
            await deleteUser(auth.currentUser);
            await Storage.deleteItem('zce_user');
            setUser(null);
            userRef.current = null;
            router.replace('/');
        } catch (e: any) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const completeOnboarding = async () => {
        setHasCompletedOnboarding(true);
        await Storage.setItem('zce_onboarding_done', 'true');
    };

    const resetProgress = async () => {
        console.log('[UserContext] Resetting all progress to zero...');
        await _syncUpdate({
            xp: 0,
            streak: 0,
            previousStreak: 0,
            streakAtRisk: false,
            streakRecoveryExpiresAt: null,
            lastActivityDate: null,
            completedQuests: [],
            drillLogs: [],
            chatLogs: [],
            dailyXp: {},
        });
        console.log('[UserContext] Progress reset complete.');
    };

    const clearChat = async () => {
        console.log('[UserContext] Purging all chat history for persona sync...');
        await _syncUpdate({ chatLogs: [] });
    };

    const deploySystemBackup = async () => {
        const current = userRef.current;
        if (!current || (current.systemBackups || 0) <= 0) return;

        if (current.streakAtRisk) {
            Alert.alert(
                "RECOVERY PROTOCOL REQUIRED",
                "System Backups can protect a streak before collapse, not repair one after the fact. Answer the charisma recovery prompt to earn it back."
            );
            return;
        }

        console.log('[UserContext] DEPLOYING SYSTEM BACKUP');
        // Logic: Set lastActivityDate to yesterday so today's activity (when they next do it) 
        // continues the streak as if they did it yesterday.
        const yesterday = getLocalDateStr(-1);

        await _syncUpdate({
            systemBackups: current.systemBackups - 1,
            lastActivityDate: yesterday,
            streakAtRisk: false, // It's safe now
            streakRecoveryExpiresAt: null,
        });

        Alert.alert(
            "SYSTEM BACKUP DEPLOYED",
            "You hid today. Don't make it a habit. Your streak is preserved... for now.",
            [{ text: "COPY THAT" }]
        );
    };

    const purchaseSystemBackup = async () => {
        const current = userRef.current;
        if (!current) return;

        const COST = 500;
        if (current.xp < COST) {
            Alert.alert("INSUFFICIENT XP", `System Backups cost ${COST} XP. You only have ${Math.round(current.xp)}.`);
            return;
        }

        await _syncUpdate({
            xp: current.xp - COST,
            systemBackups: (current.systemBackups || 0) + 1
        });

        Alert.alert("BACKUP ACQUIRED", "1 System Backup added to your inventory. 500 XP consumed.");
    };

    return (
        <UserContext.Provider value={{
            user, isLoading,
            signIn, signUp, signOut, forgotPassword,
            updateProfile, completeDrill, completeQuest, recoverStreak, resetQuests, resetProgress,
            addJournalEntry, addDrillLog, addChatMessage, clearChat,
            changeEmail, changePassword, deleteAccount, changeUsername,
            setOnboardingData, onboardingData,
            hasCompletedOnboarding, setHasCompletedOnboarding, completeOnboarding,
            returnToOnboardingStage, setReturnToOnboardingStage,
            deploySystemBackup, purchaseSystemBackup,
        }}>
            {children}
        </UserContext.Provider>
    );
}
