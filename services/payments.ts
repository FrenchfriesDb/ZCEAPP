import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

export type SubscriptionSku = 'monthly' | 'yearly';

export type PaymentConfig = {
    entitlementId: string;
    monthlyProductId: string;
    yearlyProductId: string;
    iosApiKey: string;
    androidApiKey: string;
};

export type EntitlementSnapshot = {
    isPremium: boolean;
    tier: 'initiate' | 'director';
    activeEntitlements: string[];
    activeProductId: string | null;
    expiresAt: string | null;
};

export type ProductMetadata = {
    id: string;
    title: string;
    priceLabel: string;
};

type PurchasesModule = {
    configure: (params: { apiKey: string; appUserID?: string }) => void;
    logIn?: (appUserID: string) => Promise<any>;
    logOut?: () => Promise<any>;
    syncPurchases?: () => Promise<any>;
    setLogLevel?: (level: unknown) => void;
    setLogHandler?: (handler?: (level: unknown, message: string) => void) => void;
    getCustomerInfo: () => Promise<any>;
    getOfferings: () => Promise<any>;
    purchasePackage: (pkg: any) => Promise<any>;
    restorePurchases: () => Promise<any>;
};

let initializedApiKey: string | null = null;
let initializedAppUserID: string | null = null;
let didConfigure = false;

function getPaymentConfig(): PaymentConfig {
    const extra = (Constants.expoConfig?.extra || {}) as any;
    const revenuecat = extra.revenuecat || {};

    return {
        entitlementId: revenuecat.entitlementId || 'ZCE Pro',
        monthlyProductId: revenuecat.monthlyProductId || 'zce_director_monthly_sub',
        yearlyProductId: revenuecat.yearlyProductId || 'zce_director_yearly_sub',
        iosApiKey: revenuecat.iosApiKey || '',
        androidApiKey: revenuecat.androidApiKey || '',
    };
}

function getPlatformApiKey(config: PaymentConfig): string {
    return Platform.OS === 'ios' ? config.iosApiKey : config.androidApiKey;
}

function getPurchasesModule(): PurchasesModule | null {
    try {
        const module = require('react-native-purchases');
        const resolved = (module?.default ?? module) as PurchasesModule | null;
        return resolved && typeof resolved.configure === 'function' ? resolved : null;
    } catch {
        return null;
    }
}

function getRevenueCatLogLevelError(): unknown {
    try {
        const module = require('react-native-purchases');
        return module?.LOG_LEVEL?.ERROR;
    } catch {
        return null;
    }
}

function isCancelledPurchaseLog(message: string): boolean {
    const msg = String(message || '').toLowerCase();
    return msg.includes('purchase was cancelled') || msg.includes('purchase cancelled') || msg.includes('user cancelled');
}

function mapCustomerInfoToEntitlements(customerInfo: any, config: PaymentConfig): EntitlementSnapshot {
    const active = customerInfo?.entitlements?.active || {};
    const entitlementKeys = Object.keys(active);
    const focused = active[config.entitlementId] || (entitlementKeys.length > 0 ? active[entitlementKeys[0]] : null);
    const activeSubscriptions: string[] = Array.isArray(customerInfo?.activeSubscriptions)
        ? customerInfo.activeSubscriptions
        : [];
    const hasConfiguredProductActive = activeSubscriptions.includes(config.monthlyProductId)
        || activeSubscriptions.includes(config.yearlyProductId);
    const activeProductId = focused?.productIdentifier || focused?.productPlanIdentifier || null;
    const expirationCandidates: any[] = [
        focused?.expirationDate,
        focused?.expiresDate,
        customerInfo?.latestExpirationDate,
    ];
    const allExpirationDates = customerInfo?.allExpirationDates;
    if (allExpirationDates && typeof allExpirationDates === 'object') {
        for (const value of Object.values(allExpirationDates)) {
            expirationCandidates.push(value);
        }
    }
    const normalizedExpirationDates = expirationCandidates
        .map((value) => (value ? String(value) : ''))
        .filter((value) => value.length > 0)
        .map((value) => new Date(value))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => b.getTime() - a.getTime());
    const expiresAt = normalizedExpirationDates.length > 0
        ? normalizedExpirationDates[0].toISOString()
        : null;
    const isPremium = entitlementKeys.length > 0 || hasConfiguredProductActive;

    return {
        isPremium,
        tier: isPremium ? 'director' : 'initiate',
        activeEntitlements: entitlementKeys,
        activeProductId: activeProductId
            ? String(activeProductId)
            : (activeSubscriptions[0] ? String(activeSubscriptions[0]) : null),
        expiresAt,
    };
}

export const PaymentService = {
    getConfig(): PaymentConfig {
        return getPaymentConfig();
    },

    isRevenueCatConfigured(): boolean {
        const config = getPaymentConfig();
        return Boolean(config.iosApiKey || config.androidApiKey);
    },

    getProductIdForSku(sku: SubscriptionSku): string {
        const config = getPaymentConfig();
        if (sku === 'monthly') return config.monthlyProductId;
        return config.yearlyProductId;
    },

    isRevenueCatSdkInstalled(): boolean {
        if (Platform.OS === 'web') {
            return Boolean(getPurchasesModule());
        }
        if (Constants.appOwnership === 'expo') {
            return false;
        }
        return Boolean(getPurchasesModule()) && Boolean(NativeModules?.RNPurchases);
    },

    isRevenueCatUiSupported(): boolean {
        if (Platform.OS === 'web') return false;
        if (Constants.appOwnership === 'expo') return false;
        return Boolean(NativeModules?.RNPaywalls);
    },

    async initialize(appUserID?: string): Promise<boolean> {
        const purchases = getPurchasesModule();
        if (!purchases) return false;

        const config = getPaymentConfig();
        const apiKey = getPlatformApiKey(config);
        if (!apiKey) return false;
        const normalizedAppUserID = appUserID || null;

        if (initializedApiKey === apiKey && initializedAppUserID === normalizedAppUserID && didConfigure) {
            return true;
        }

        // Keep SDK noise low in development while guarding against runtimes where this call can throw.
        const errorLogLevel = getRevenueCatLogLevelError();
        if (errorLogLevel != null && typeof purchases.setLogLevel === 'function') {
            try {
                purchases.setLogLevel(errorLogLevel);
            } catch {
                // Ignore and continue initialization.
            }
        }

        if (typeof purchases.setLogHandler === 'function') {
            try {
                purchases.setLogHandler((level, message) => {
                    if (isCancelledPurchaseLog(message)) {
                        return;
                    }
                    const text = `[RevenueCat] ${String(message || '')}`;
                    const numericLevel = typeof level === 'number' ? level : -1;
                    if (numericLevel >= 3) {
                        console.warn(text);
                        return;
                    }
                    if (__DEV__) {
                        console.log(text);
                    }
                });
            } catch {
                // Ignore and continue initialization.
            }
        }

        if (!didConfigure || initializedApiKey !== apiKey) {
            purchases.configure({ apiKey });
            didConfigure = true;
        }

        if (normalizedAppUserID) {
            if (typeof purchases.logIn === 'function') {
                await purchases.logIn(normalizedAppUserID);
            } else {
                purchases.configure({ apiKey, appUserID: normalizedAppUserID });
            }
        } else if (initializedAppUserID && typeof purchases.logOut === 'function') {
            await purchases.logOut();
        }

        initializedApiKey = apiKey;
        initializedAppUserID = normalizedAppUserID;
        return true;
    },

    async getEntitlementSnapshot(): Promise<EntitlementSnapshot | null> {
        const purchases = getPurchasesModule();
        if (!purchases) return null;

        const config = getPaymentConfig();
        const customerInfo = await purchases.getCustomerInfo();
        return mapCustomerInfoToEntitlements(customerInfo, config);
    },

    async purchaseSubscription(sku: SubscriptionSku): Promise<EntitlementSnapshot | null> {
        const purchases = getPurchasesModule();
        if (!purchases) return null;

        const config = getPaymentConfig();
        const targetProductId = this.getProductIdForSku(sku);
        const offerings = await purchases.getOfferings();
        const allPackages: any[] = [
            ...(offerings?.current?.availablePackages || []),
            ...(offerings?.all
                ? Object.values(offerings.all).flatMap((o: any) => o?.availablePackages || [])
                : []),
        ];

        const selectedPackage = allPackages.find((pkg) => pkg?.product?.identifier === targetProductId);
        if (!selectedPackage) {
            throw new Error(`RevenueCat package not found for product: ${targetProductId}`);
        }

        const result = await purchases.purchasePackage(selectedPackage);
        return mapCustomerInfoToEntitlements(result?.customerInfo, config);
    },

    async getAvailableProductIds(): Promise<string[]> {
        const purchases = getPurchasesModule();
        if (!purchases) return [];

        const offerings = await purchases.getOfferings();
        const allPackages: any[] = [
            ...(offerings?.current?.availablePackages || []),
            ...(offerings?.all
                ? Object.values(offerings.all).flatMap((o: any) => o?.availablePackages || [])
                : []),
        ];

        const ids = allPackages
            .map((pkg) => pkg?.product?.identifier)
            .filter((id): id is string => typeof id === 'string' && id.length > 0);

        return Array.from(new Set(ids));
    },

    async getOfferingByIdentifier(identifier: string): Promise<any | null> {
        if (!identifier) return null;
        const purchases = getPurchasesModule();
        if (!purchases) return null;

        const offerings = await purchases.getOfferings();
        return offerings?.all?.[identifier] ?? null;
    },

    async getCurrentOffering(): Promise<any | null> {
        const purchases = getPurchasesModule();
        if (!purchases) return null;

        const offerings = await purchases.getOfferings();
        return offerings?.current ?? null;
    },

    async getProductMetadata(): Promise<ProductMetadata[]> {
        const purchases = getPurchasesModule();
        if (!purchases) return [];

        const offerings = await purchases.getOfferings();
        const allPackages: any[] = [
            ...(offerings?.current?.availablePackages || []),
            ...(offerings?.all
                ? Object.values(offerings.all).flatMap((o: any) => o?.availablePackages || [])
                : []),
        ];

        const records = allPackages
            .map((pkg) => {
                const id = pkg?.product?.identifier;
                if (typeof id !== 'string' || !id) return null;

                const title =
                    (typeof pkg?.product?.title === 'string' && pkg.product.title) ||
                    id;

                const localizedPrice =
                    (typeof pkg?.product?.priceString === 'string' && pkg.product.priceString) ||
                    (typeof pkg?.product?.localizedPriceString === 'string' && pkg.product.localizedPriceString) ||
                    (typeof pkg?.product?.price === 'number' ? `$${pkg.product.price.toFixed(2)}` : null) ||
                    'N/A';

                return {
                    id,
                    title,
                    priceLabel: localizedPrice,
                } as ProductMetadata;
            })
            .filter((item): item is ProductMetadata => item !== null);

        const dedupedById = new Map<string, ProductMetadata>();
        for (const item of records) {
            if (!dedupedById.has(item.id)) dedupedById.set(item.id, item);
        }

        return Array.from(dedupedById.values());
    },

    async restorePurchases(): Promise<EntitlementSnapshot | null> {
        const purchases = getPurchasesModule();
        if (!purchases) return null;
        const config = getPaymentConfig();
        const customerInfo = await purchases.restorePurchases();
        return mapCustomerInfoToEntitlements(customerInfo, config);
    },

    async syncPurchases(): Promise<void> {
        const purchases = getPurchasesModule();
        if (!purchases || typeof purchases.syncPurchases !== 'function') return;
        try {
            await purchases.syncPurchases();
        } catch {
            // Best-effort only; restore flow continues without hard failing.
        }
    },
};
