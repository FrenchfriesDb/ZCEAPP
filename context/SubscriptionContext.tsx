import { useUser } from '@/context/UserContext';
import { auth } from '@/services/firebase';
import { PaymentService, type SubscriptionSku } from '@/services/payments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type SubscriptionPlan = 'initiate' | 'director';
export type PremiumFeature = 'unlimited_chat' | 'advanced_drill_feedback' | 'all_drills' | 'sky_sync_themes' | 'advanced_biometrics';

type SubscriptionContextType = {
    plan: SubscriptionPlan;
    entitlementId: string;
    isPremium: boolean;
    currentProductId: string | null;
    dailyChatLimit: number;
    dailyChatUsed: number;
    freeWindowRemainingMs: number;
    canUseAIChat: boolean;
    canUseFeature: (feature: PremiumFeature) => boolean;
    recordAIInteraction: () => void;
    resetDailyUsage: () => void;
    isLoading: boolean;
    lastError: string | null;
    isRevenueCatAvailable: boolean;
    refreshEntitlements: () => Promise<void>;
    purchaseSubscription: (sku: SubscriptionSku) => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
};

const FREE_WINDOW_CHAT_LIMIT = 10;
const FREE_WINDOW_DURATION_MS = 60 * 60 * 1000; // 1 hour
const ENTITLEMENT_ID = PaymentService.getConfig().entitlementId;
const FREE_CHAT_WINDOW_KEY = '@zce/free_chat_window_timestamps_v1';
const BILLING_OWNER_UID_KEY = '@zce/billing_owner_uid_v1';

function pruneWindowTimestamps(timestamps: number[], now = Date.now()): number[] {
    return timestamps.filter((ts) => Number.isFinite(ts) && now - ts < FREE_WINDOW_DURATION_MS);
}

function isUserCancelledError(error: any): boolean {
    const code = String(error?.code || error?.userInfo?.code || '').toUpperCase();
    const message = String(error?.message || '').toLowerCase();
    const userCancelledFlag = Boolean(error?.userCancelled || error?.userInfo?.userCancelled);

    return (
        userCancelledFlag ||
        code.includes('PURCHASE_CANCELLED') ||
        code.includes('USER_CANCELLED') ||
        message.includes('purchase was cancelled') ||
        message.includes('purchase cancelled') ||
        message.includes('user canceled') ||
        message.includes('user cancelled')
    );
}

function isAlreadySubscribedError(error: any): boolean {
    const code = String(error?.code || error?.userInfo?.code || '').toUpperCase();
    const readableCode = String(error?.userInfo?.readable_error_code || error?.readable_error_code || '').toUpperCase();
    const message = String(error?.message || '').toLowerCase();

    return (
        code.includes('ALREADY') ||
        readableCode.includes('ALREADY') ||
        message.includes('already subscribed') ||
        message.includes('already purchased') ||
        message.includes('already an active subscription') ||
        message.includes('you are already subscribed') ||
        message.includes('already owns') ||
        message.includes('already own')
    );
}

function mapBillingErrorMessage(error: any): string {
    const raw = String(error?.message || '').trim();
    const lowered = raw.toLowerCase();
    const readableCode = String(error?.userInfo?.readable_error_code || error?.readable_error_code || '').toUpperCase();

    if (
        readableCode === 'STORE_PROBLEM' ||
        lowered.includes('not authorized to make purchases') ||
        lowered.includes('doesn\'t have permission to make in-app purchases')
    ) {
        return 'Sandbox purchase is blocked for this Apple account. Sign out of App Store on the device, then sign in with a Sandbox Tester account that has In-App Purchase access in App Store Connect.';
    }

    if (lowered.includes('problem with the app store')) {
        return 'App Store connection problem. Retry in a minute. If it persists, verify Sandbox tester login on device.';
    }

    return raw || 'Purchase failed';
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user, updateProfile } = useUser();
    const [freeChatTimestamps, setFreeChatTimestamps] = useState<number[]>([]);
    const [timeTick, setTimeTick] = useState(Date.now());
    const [isLoading, setIsLoading] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [currentProductId, setCurrentProductId] = useState<string | null>(null);
    const isRevenueCatAvailable = PaymentService.isRevenueCatConfigured() && PaymentService.isRevenueCatSdkInstalled();
    const getRevenueCatAppUserID = useCallback(() => auth.currentUser?.uid || null, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(FREE_CHAT_WINDOW_KEY);
                if (cancelled || !raw) return;
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed)) return;
                const cleaned = pruneWindowTimestamps(parsed.map((n) => Number(n)));
                setFreeChatTimestamps(cleaned);
            } catch {
                if (!cancelled) setFreeChatTimestamps([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const id = setInterval(() => setTimeTick(Date.now()), 60_000);
        return () => clearInterval(id);
    }, []);

    const isPremium = useMemo(() => {
        const entitlements = ((user as any)?.entitlements || []) as string[];
        const tier = ((user as any)?.subscriptionTier || 'initiate') as SubscriptionPlan;
        return tier === 'director' || entitlements.includes(ENTITLEMENT_ID);
    }, [user]);

    const syncEntitlementsFromRevenueCat = useCallback(async () => {
        const snapshot = await PaymentService.getEntitlementSnapshot();
        if (!snapshot) return;
        const currentUid = getRevenueCatAppUserID();
        let ownerUid = '';
        try {
            ownerUid = (await AsyncStorage.getItem(BILLING_OWNER_UID_KEY)) || '';
        } catch {
            ownerUid = '';
        }

        // Guard against RevenueCat transfer behavior leaking premium between app accounts.
        // Premium is only auto-applied when no owner is known, or when current user is the owner.
        const shouldBlockTransferredPremium = Boolean(
            snapshot.isPremium && (!currentUid || ownerUid !== currentUid)
        );

        const safeSnapshot = shouldBlockTransferredPremium
            ? {
                ...snapshot,
                isPremium: false,
                tier: 'initiate' as const,
                activeEntitlements: [],
                activeProductId: null,
                expiresAt: null,
            }
            : snapshot;

        setCurrentProductId(safeSnapshot.activeProductId);

        if (!user) {
            return safeSnapshot;
        }

        const currentTier = ((user as any)?.subscriptionTier || 'initiate') as SubscriptionPlan;
        const currentEntitlements = (((user as any)?.entitlements || []) as string[]).slice().sort().join(',');
        const nextEntitlements = safeSnapshot.activeEntitlements.slice().sort().join(',');
        const nextStatus = safeSnapshot.isPremium ? 'active' : 'inactive';
        const currentStatus = (((user as any)?.subscriptionStatus || 'inactive') as string);
        const currentExpires = (((user as any)?.subscriptionExpiresAt || null) as string | null) || null;

        if (
            currentTier !== safeSnapshot.tier ||
            currentEntitlements !== nextEntitlements ||
            currentStatus !== nextStatus ||
            currentExpires !== safeSnapshot.expiresAt
        ) {
            await updateProfile({
                subscriptionTier: safeSnapshot.tier,
                subscriptionStatus: nextStatus as 'active' | 'inactive' | 'expired' | 'grace',
                subscriptionExpiresAt: safeSnapshot.expiresAt,
                entitlements: safeSnapshot.activeEntitlements,
            } as any);
        }
        return safeSnapshot;
    }, [getRevenueCatAppUserID, updateProfile, user]);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            if (!isRevenueCatAvailable) return;
            const appUserID = getRevenueCatAppUserID();

            try {
                setIsLoading(true);
                setLastError(null);
                const initialized = await PaymentService.initialize(appUserID ?? undefined);
                if (!initialized || cancelled) return;
                const snapshot = await syncEntitlementsFromRevenueCat();
            } catch (error: any) {
                if (!cancelled) {
                    setLastError(error?.message || 'Failed to initialize billing');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        init();
        return () => {
            cancelled = true;
        };
    }, [getRevenueCatAppUserID, isRevenueCatAvailable, syncEntitlementsFromRevenueCat, updateProfile, user, user?.email]);

    const plan: SubscriptionPlan = isPremium ? 'director' : 'initiate';
    const activeWindowTimestamps = useMemo(
        () => pruneWindowTimestamps(freeChatTimestamps, timeTick),
        [freeChatTimestamps, timeTick]
    );
    const dailyChatUsed = activeWindowTimestamps.length;
    const dailyChatLimit = isPremium ? Number.POSITIVE_INFINITY : FREE_WINDOW_CHAT_LIMIT;
    const canUseAIChat = isPremium || dailyChatUsed < FREE_WINDOW_CHAT_LIMIT;
    const freeWindowRemainingMs = useMemo(() => {
        if (isPremium || activeWindowTimestamps.length === 0) return 0;
        const oldest = activeWindowTimestamps[0];
        return Math.max(0, FREE_WINDOW_DURATION_MS - (Date.now() - oldest));
    }, [activeWindowTimestamps, isPremium]);

    const value: SubscriptionContextType = {
        plan,
        entitlementId: ENTITLEMENT_ID,
        isPremium,
        currentProductId,
        dailyChatLimit,
        dailyChatUsed,
        freeWindowRemainingMs,
        canUseAIChat,
        canUseFeature: (_feature: PremiumFeature) => isPremium,
        recordAIInteraction: () => {
            if (!isPremium) {
                const now = Date.now();
                setFreeChatTimestamps((prev) => {
                    const next = [...pruneWindowTimestamps(prev, now), now];
                    void AsyncStorage.setItem(FREE_CHAT_WINDOW_KEY, JSON.stringify(next));
                    return next;
                });
            }
        },
        resetDailyUsage: () => {
            setFreeChatTimestamps([]);
            void AsyncStorage.removeItem(FREE_CHAT_WINDOW_KEY);
        },
        isLoading,
        lastError,
        isRevenueCatAvailable,
        refreshEntitlements: async () => {
            try {
                setIsLoading(true);
                setLastError(null);
                await syncEntitlementsFromRevenueCat();
            } catch (error: any) {
                setLastError(error?.message || 'Failed to refresh entitlements');
            } finally {
                setIsLoading(false);
            }
        },
        purchaseSubscription: async (sku: SubscriptionSku) => {
            try {
                setLastError(null);
                const appUserID = getRevenueCatAppUserID();
                const initialized = await PaymentService.initialize(appUserID ?? undefined);
                if (!initialized) {
                    setLastError('Billing initialization failed. Check RevenueCat keys and environment.');
                    return false;
                }
                const snapshot = await PaymentService.purchaseSubscription(sku);
                if (!snapshot) {
                    setLastError('Billing not ready. Check RevenueCat keys/offering and try again.');
                    return false;
                }
                setCurrentProductId(snapshot.activeProductId);

                if (user) {
                    await updateProfile({
                        subscriptionTier: snapshot.tier,
                        subscriptionStatus: snapshot.isPremium ? 'active' : 'inactive',
                        subscriptionExpiresAt: snapshot.expiresAt,
                        entitlements: snapshot.activeEntitlements,
                    } as any);
                }
                const currentUid = getRevenueCatAppUserID();
                if (snapshot.isPremium && currentUid) {
                    await AsyncStorage.setItem(BILLING_OWNER_UID_KEY, currentUid);
                }
                return snapshot.isPremium;
            } catch (error: any) {
                if (isUserCancelledError(error)) {
                    // User backing out of the store sheet is expected behavior.
                    setLastError(null);
                    return false;
                }
                if (isAlreadySubscribedError(error)) {
                    try {
                        await PaymentService.syncPurchases();
                        const restored = await PaymentService.restorePurchases();
                        if (restored) {
                            setCurrentProductId(restored.activeProductId);
                            if (user) {
                                await updateProfile({
                                    subscriptionTier: restored.tier,
                                    subscriptionStatus: restored.isPremium ? 'active' : 'inactive',
                                    subscriptionExpiresAt: restored.expiresAt,
                                    entitlements: restored.activeEntitlements,
                                } as any);
                            }
                            if (restored.isPremium) {
                                setLastError(null);
                                return true;
                            }
                        }
                    } catch {
                        // fall through to friendly guidance
                    }
                    setLastError('You already have an active Apple subscription. Tap Restore once to sync this app account.');
                    return false;
                }
                setLastError(mapBillingErrorMessage(error));
                return false;
            }
        },
        restorePurchases: async () => {
            try {
                setLastError(null);
                const appUserID = getRevenueCatAppUserID();
                const initialized = await PaymentService.initialize(appUserID ?? undefined);
                if (!initialized) {
                    setLastError('Billing initialization failed. Check RevenueCat keys and environment.');
                    return false;
                }
                await PaymentService.syncPurchases();
                const snapshot = await PaymentService.restorePurchases();
                if (!snapshot) {
                    setLastError('No purchases found yet. Restore works by Apple ID (App Store account), not app email.');
                    return false;
                }
                setCurrentProductId(snapshot.activeProductId);

                if (user) {
                    await updateProfile({
                        subscriptionTier: snapshot.tier,
                        subscriptionStatus: snapshot.isPremium ? 'active' : 'inactive',
                        subscriptionExpiresAt: snapshot.expiresAt,
                        entitlements: snapshot.activeEntitlements,
                    } as any);
                }
                const currentUid = getRevenueCatAppUserID();
                if (snapshot.isPremium && currentUid) {
                    await AsyncStorage.setItem(BILLING_OWNER_UID_KEY, currentUid);
                }
                return snapshot.isPremium;
            } catch (error: any) {
                setLastError(
                    error?.message ||
                    'Restore failed. Ensure you are signed into the same App Store Apple ID used for purchase.'
                );
                return false;
            }
        },
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within SubscriptionProvider');
    }
    return context;
}
