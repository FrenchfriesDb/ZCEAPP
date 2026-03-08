import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform, Alert } from 'react-native';
import { auth, db } from '@/services/firebase';
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
    // Keep backward compat
    lastDrillDate?: string | null;
}

interface UserContextType {
    user: UserData | null;
    isLoading: boolean;
    signIn: (email?: string, password?: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
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
    deleteAccount: () => Promise<void>;
    setOnboardingData: (data: { level: string, goal: string }) => void;
    onboardingData: { level: string, goal: string };
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => Promise<void>;
    resetQuests: (questIds: string[]) => Promise<void>;
    clearChat: () => Promise<void>;
    resetProgress: () => Promise<void>;
}

const UserContext = createContext<UserContextType>(null as any);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};

// --- LOCAL DATE HELPER (avoids UTC shifts) ---
const getLocalDateStr = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    const signIn = async (email?: string, password?: string) => {
        setIsLoading(true);
        try {
            if (email && password) {
                const cleanEmail = email.trim().toLowerCase();
                await signInWithEmailAndPassword(auth, cleanEmail, password);
                router.replace('/(tabs)'); // only navigate on SUCCESS
            } else {
                // Anonymous sign in works as a "Guest" mode
                await signInAnonymously(auth);
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            let msg = getFriendlyAuthError(e.code || '');

            // SPECIAL HANDLING FOR APP CHECK
            if (e.code === 'auth/firebase-app-check-token-is-invalid' || e.message?.includes('app-check')) {
                msg = "SECURITY: App Check is blocking this login. In Firebase Console -> App Check, set Authentication to 'Unenforced' for the review process.";
            }

            console.log('[signIn Error]', e.code, e.message);

            // Force clean state
            try { await fbSignOut(auth); } catch { }
            setUser(null);
            userRef.current = null;
            setIsLoading(false);

            // Redundant alert so user CANNOT miss it
            Alert.alert("Access Denied", msg);
            throw new Error(msg);
        } finally { setIsLoading(false); }
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

    const signUp = async (email: string, password: string, name: string) => {
        setIsLoading(true);
        const cleanEmail = email.trim().toLowerCase();
        try {
            const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            const initialData: UserData = {
                ...DEFAULT_USER,
                email: cleanEmail,
                name: name || 'Agent 808',
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
    const completeDrill = async (xpGain: number) => {
        const current = userRef.current;
        if (!current) { console.warn('[completeDrill] No user'); return; }

        const today = getLocalDateStr();
        const yesterday = getLocalDateStr(-1);
        const lastDate = current.lastActivityDate || null;

        console.log(`[UserContext] Streak Pulse | Today: ${today} | Yesterday: ${yesterday} | LastActivity: ${lastDate}`);

        let streak = Number(current.streak || 0);
        let streakAtRisk = !!current.streakAtRisk;
        let previousStreak = Number(current.previousStreak || 0);

        if (lastDate !== today) {
            if (lastDate === yesterday) {
                // Happy Path: Consecutive day
                streak += 1;
                streakAtRisk = false;
            } else if (lastDate === null) {
                // First time ever
                streak = 1;
                streakAtRisk = false;
            } else {
                // Missed a day
                if (streak > 0) {
                    previousStreak = streak;
                }
                streak = 1;
                streakAtRisk = previousStreak > 0;
            }
        } else {
            // Already did something today, but let's ensure streakAtRisk is clear if they recovered
            streakAtRisk = false;
        }

        const newXp = (current.xp || 0) + xpGain;
        const log = { id: Date.now().toString(), date: new Date().toISOString(), type: 'Drill', score: 100, feedback: `Earned ${xpGain} XP in training.` };

        await _syncUpdate({
            xp: newXp,
            streak,
            previousStreak,
            streakAtRisk,
            lastActivityDate: today,
            drillLogs: [log, ...(current.drillLogs || [])],
        });
    };

    /**
     * Called when an agent completes a quest or daily mission.
     * Marks questId in completedQuests, increments streak if it's a new day.
     */
    const completeQuest = async (questId: string, xpGain: number, log?: string) => {
        const current = userRef.current;
        if (!current) { console.warn('[completeQuest] No user'); return; }

        const today = getLocalDateStr();
        const yesterday = getLocalDateStr(-1);
        const lastDate = current.lastActivityDate || null;

        // Guard: already completed this quest today
        if (lastDate === today && current.completedQuests?.includes(questId)) {
            console.log(`[completeQuest] ${questId} already done today`);
            return;
        }

        // Build new completedQuests — carry over today's completions, reset if new day
        const existingQuests = lastDate === today ? (current.completedQuests || []) : [];
        const newQuests = existingQuests.includes(questId) ? existingQuests : [...existingQuests, questId];

        // Streak logic
        let streak = Number(current.streak || 0);
        let streakAtRisk = !!current.streakAtRisk;
        let previousStreak = Number(current.previousStreak || 0);

        if (lastDate !== today) {
            if (lastDate === yesterday) {
                streak += 1;
                streakAtRisk = false;
            } else if (lastDate === null) {
                streak = 1;
                streakAtRisk = false;
            } else {
                if (streak > 0) {
                    previousStreak = streak;
                }
                streak = 1;
                streakAtRisk = previousStreak > 0;
            }
        } else {
            streakAtRisk = false;
        }

        const newXp = (current.xp || 0) + xpGain;
        const drillLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            type: 'Mission',
            score: 100,
            feedback: log || `Mission complete: ${questId}. +${xpGain} XP`,
        };

        console.log(`[completeQuest] ${questId} | streak: ${current.streak} → ${streak} | atRisk: ${streakAtRisk}`);

        await _syncUpdate({
            xp: newXp,
            streak,
            previousStreak,
            streakAtRisk,
            lastActivityDate: today,
            completedQuests: newQuests,
            drillLogs: [drillLog, ...(current.drillLogs || [])],
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
        });
        console.log('[UserContext] Progress reset complete.');
    };

    const clearChat = async () => {
        console.log('[UserContext] Purging all chat history for persona sync...');
        await _syncUpdate({ chatLogs: [] });
    };

    return (
        <UserContext.Provider value={{
            user, isLoading,
            signIn, signUp, signOut, forgotPassword,
            updateProfile, completeDrill, completeQuest, recoverStreak, resetQuests, resetProgress,
            addJournalEntry, addDrillLog, addChatMessage, clearChat,
            changeEmail, changePassword, deleteAccount,
            setOnboardingData, onboardingData,
            hasCompletedOnboarding, completeOnboarding,
        }}>
            {children}
        </UserContext.Provider>
    );
}
