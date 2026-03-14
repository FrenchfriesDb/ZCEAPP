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
    signInAnonymously,
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

const getRecentLoginError = () => "CRITICAL: Re-authentication Required. For security, you must log out and immediately log back in to change your agent credentials.";


// --- DEFAULT STATE ---
const DEFAULT_USER = {
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
    joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    lastActivityDate: null as string | null,
    journalLogs: [] as any[],
    drillLogs: [] as any[],
    completedQuests: [] as string[],
    chatLogs: [] as { role: 'user' | 'assistant', content: string, timestamp: string }[],
    dailyXp: {} as { [date: string]: number },
    username: '' as string,
    usernameLastChanged: null as string | null,
    systemBackups: 1, // Start with one
    lastBackupMonth: '' as string, // YYYY-MM
};

// --- TYPES ---
export interface UserData {
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
    // Keep backward compat
    lastDrillDate?: string | null;
}

interface UserContextType {
    user: UserData | null;
    isLoading: boolean;
    signIn: (emailOrUsername?: string, password?: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, username?: string) => Promise<void>;
    signOut: () => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    updateProfile: (updates: Partial<UserData>) => Promise<void>;
    completeDrill: (xpGain: number) => Promise<void>;
    completeQuest: (questId: string, xpGain: number, log?: string) => Promise<void>;
    recoverStreak: () => Promise<void>;
    addJournalEntry: (entry: string, analysis?: string) => Promise<void>;
    addDrillLog: (type: string, score?: number, feedback?: string) => Promise<void>;
    addChatMessage: (msg: { role: 'user' | 'assistant', content: string }) => Promise<void>;
    changeEmail: (newEmail: string) => Promise<void>;
    changePassword: (newPassword: string) => Promise<void>;
    changeUsername: (newUsername: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    setOnboardingData: (data: { level: string, goal: string }) => void;
    onboardingData: { level: string, goal: string };
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => Promise<void>;
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
    const [onboardingData, setOnboardingData] = useState({ level: 'NPC', goal: 'General' });
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

    // KEY FIX: userRef always holds the LATEST user — eliminates stale closures.
    const userRef = useRef<UserData | null>(null);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // --- INITIALIZATION ---
    useEffect(() => {
        console.log('[UserContext] INIT V3');
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('[UserContext] Auth state changed. User:', firebaseUser?.uid ?? 'null');
            if (firebaseUser) {
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
                        console.log('[UserContext] User loaded from Firestore:', data.email);
                    } else {
                        // ❌ No Firestore doc found for this Firebase user.
                        // AUTO-INITIALIZE: If they've authenticated but have no data, 
                        // we create a default profile instead of signing them out.
                        console.log('[UserContext] Auto-creating default doc for uid:', firebaseUser.uid);
                        const defaultData = {
                            ...DEFAULT_USER,
                            email: firebaseUser.email || 'anonymous',
                            name: firebaseUser.isAnonymous ? 'Guest Agent' : (firebaseUser.displayName || 'Agent ' + firebaseUser.uid.slice(0, 4)),
                        };
                        await setDoc(docRef, defaultData);
                        setUser(defaultData);
                        userRef.current = defaultData;
                        await Storage.setItem('zce_user', JSON.stringify(defaultData));
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
    const getFriendlyAuthError = (code: string): string => {
        switch (code) {
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Incorrect password.';
            case 'auth/user-not-found':
                return "Email does not exist.";
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
    const signIn = async (emailOrUsername?: string, password?: string) => {
        setIsLoading(true);
        try {
            if (emailOrUsername && password) {
                let loginEmail = emailOrUsername.trim().toLowerCase();

                // If it doesn't look like an email, treat it as a username — look up the real email
                if (!loginEmail.includes('@')) {
                    const q = query(collection(db, 'users'), where('username', '==', loginEmail));
                    const snap = await getDocs(q);
                    if (snap.empty) {
                        setIsLoading(false);
                        Alert.alert("Access Denied", "No agent found with that username.");
                        throw new Error("Username not found.");
                    }
                    loginEmail = snap.docs[0].data().email;
                }

                await signInWithEmailAndPassword(auth, loginEmail, password);
                router.replace('/(tabs)');
            } else {
                // Anonymous guest mode
                await signInAnonymously(auth);
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            if (e.message === "Username not found.") throw e;
            let msg = getFriendlyAuthError(e.code || '');
            if (e.code === 'auth/firebase-app-check-token-is-invalid' || e.message?.includes('app-check')) {
                msg = "SECURITY: App Check is blocking this login. In Firebase Console -> App Check, set Authentication to 'Unenforced'.";
            }
            console.log('[signIn Error]', e.code, e.message);
            try { await fbSignOut(auth); } catch { }
            setUser(null);
            userRef.current = null;
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
        try {
            const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            const initialData: UserData = {
                ...DEFAULT_USER,
                email: cleanEmail,
                name: name || 'Agent 808',
                username: username || name.toLowerCase().replace(/\s+/g, '_').slice(0, 20),
                usernameLastChanged: new Date().toISOString(),
                title: onboardingData.level.split(' (')[0],
                bio: `Mission: ${onboardingData.goal}. Reprogramming social instincts.`,
                joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                lastActivityDate: null,
            };
            await setDoc(doc(db, 'users', cred.user.uid), initialData);
            setUser(initialData);
            userRef.current = initialData;
            await Storage.setItem('zce_user', JSON.stringify(initialData));
            router.replace('/(tabs)');
        } catch (e: any) {
            let msg = getFriendlyAuthError(e.code || '');
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
        // Clear every known storage key — leave no ghost session behind
        try {
            await AsyncStorage.multiRemove(['zce_user', 'zce_onboarding_done']);
        } catch (e) {
            console.warn('[signOut] Storage clear failed:', e);
        }
        setHasCompletedOnboarding(false);
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

        if (!lastDate) {
            console.log('[Streak Engine] First activity ever. Starting streak at 1.');
            streak = 1;
        } else if (lastDate === today) {
            console.log('[Streak Engine] Already active today. Keeping streak at', streak);
            streakAtRisk = false;
        } else if (lastDate === yesterday) {
            streak += 1;
            streakAtRisk = false;
            console.log('[Streak Engine] Consecutive day! Streak incremented to', streak);
        } else {
            console.log(`[Streak Engine] Day gap detected (Last: ${lastDate}). Resetting to 1.`);
            previousStreak = streak > 0 ? streak : previousStreak;
            streak = 1;
            streakAtRisk = (previousStreak > 1);
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
            dailyXp,
            lastActivityDate: today,
            drillLogs: [log, ...(current.drillLogs || [])],
        });
    };

    /**
     * Called when an agent completes a quest or daily mission.
     * Marks questId in completedQuests, increments streak if it's a new day.
     */
    const completeQuest = async (questId: string, xpGain: number = 20, log?: string) => {
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

        if (!lastDate) {
            streak = 1;
        } else if (lastDate === today) {
            streakAtRisk = false;
        } else if (lastDate === getLocalDateStr(-1)) {
            streak += 1;
            streakAtRisk = false;
        } else {
            previousStreak = streak > 0 ? streak : previousStreak;
            streak = 1;
            streakAtRisk = previousStreak > 1;
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

        const historyLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            type: 'Mission',
            feedback: log ? `${log} [ID:${questId}]` : `Completed Mission: ${questId}`
        };

        await _syncUpdate({
            xp: newXp,
            streak,
            previousStreak,
            streakAtRisk,
            dailyXp,
            lastActivityDate: freshToday,
            completedQuests: newDayQuests,
            drillLogs: [historyLog, ...(current.drillLogs || [])],
        });
    };

    const recoverStreak = async () => {
        const current = userRef.current;
        if (!current || !current.streakAtRisk) return;

        console.log(`[UserContext] Recovering Streak: ${current.previousStreak}`);
        const yesterday = getLocalDateStr(-1);
        await _syncUpdate({
            streak: current.previousStreak || 1,
            streakAtRisk: false,
            previousStreak: 0,
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

        console.log('[UserContext] DEPLOYING SYSTEM BACKUP');
        // Logic: Set lastActivityDate to yesterday so today's activity (when they next do it) 
        // continues the streak as if they did it yesterday.
        const yesterday = getLocalDateStr(-1);

        await _syncUpdate({
            systemBackups: current.systemBackups - 1,
            lastActivityDate: yesterday,
            streakAtRisk: false, // It's safe now
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
            hasCompletedOnboarding, completeOnboarding,
            deploySystemBackup, purchaseSystemBackup,
        }}>
            {children}
        </UserContext.Provider>
    );
}
