import { Fonts, Radius, Spacing } from '@/constants/theme';
import GlassButton from '@/components/GlassButton';
import { useSubscription } from '@/context/SubscriptionContext';
import { useUser } from '@/context/UserContext';
import { PaymentService } from '@/services/payments';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

export default function SubscriptionScreen() {
    const {
        isRevenueCatAvailable,
        isPremium,
        currentProductId,
        refreshEntitlements,
        purchaseSubscription,
        restorePurchases,
        isLoading,
        lastError,
    } = useSubscription();
    const { user, updateProfile } = useUser();
    const config = PaymentService.getConfig();
    const [dismissed, setDismissed] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const hasNativeRevenueCatUi = PaymentService.isRevenueCatUiSupported();
    const subscriptionStatus = ((user as any)?.subscriptionStatus || 'inactive') as string;
    const subscriptionExpiresAt = ((user as any)?.subscriptionExpiresAt || null) as string | null;
    const expirationLabel = isPremium && subscriptionExpiresAt
        ? new Date(subscriptionExpiresAt).toLocaleDateString()
        : 'Not subscribed';
    const planLabel = currentProductId || (isPremium ? 'DIRECTOR' : 'FREE');
    const statusLabel = isPremium ? 'ACTIVE' : subscriptionStatus.toUpperCase();

    const handleCancel = () => {
        const canGoBack = (router as any).canGoBack?.();
        if (canGoBack) {
            router.back();
            return;
        }
        router.replace('/(tabs)/profile');
    };

    const openManageSubscriptions = async () => {
        const urls = [
            'itms-apps://apps.apple.com/account/subscriptions',
            'https://apps.apple.com/account/subscriptions',
        ];

        for (const url of urls) {
            try {
                const supported = await Linking.canOpenURL(url);
                if (!supported) continue;
                await Linking.openURL(url);
                return;
            } catch {
                // Try next candidate URL.
            }
        }

        Alert.alert(
            'Open Subscriptions Manually',
            'On iPhone: Settings > [your name] > Subscriptions.\nOn Simulator: this link may fail; test cancellation on a real device with an Apple ID.'
        );
    };

    const showNativePaywall = isRevenueCatAvailable && hasNativeRevenueCatUi && !dismissed;
    const showRuntimeNativeModuleError = Boolean(lastError && /native module|rnpurchases/i.test(lastError));
    const showBillingInitError = Boolean(lastError && /Billing initialization failed/i.test(lastError));

    const handlePurchase = async (sku: 'monthly' | 'yearly') => {
        if (!isRevenueCatAvailable) {
            Alert.alert('Development Build Required', 'Expo Go cannot run native RevenueCat checkout. Open the app in a development build or TestFlight to test real payment.');
            return;
        }
        const success = await purchaseSubscription(sku);

        if (success) {
            Alert.alert('Purchase Complete', 'ZCE PRO is now active on this account.');
            void refreshEntitlements();
        }
    };

    const handleRestore = async () => {
        if (!isRevenueCatAvailable) {
            Alert.alert('Development Build Required', 'Expo Go cannot restore native purchases. Use a development build or TestFlight.');
            return;
        }
        const restored = await restorePurchases();
        if (restored) {
            Alert.alert('Restored', 'Your previous purchase was restored.');
            void refreshEntitlements();
        }
    };

    const handlePromoTrial = async () => {
        const trimmed = promoCode.trim().toLowerCase();
        if (trimmed !== 'zaneprotocol') {
            Alert.alert('Invalid Code', 'Promo code is not valid.');
            return;
        }

        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        await updateProfile({
            subscriptionTier: 'director',
            subscriptionStatus: 'active',
            subscriptionExpiresAt: expires.toISOString(),
            entitlements: [config.entitlementId],
        } as any);
        setPromoCode('');
        Alert.alert('Promo Applied', 'Monthly ZCE PRO trial unlocked for testing.');
    };

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
            <View style={[StyleSheet.absoluteFill, styles.backdrop]} />
            <View style={styles.topActions}>
                <GlassButton
                    label="CANCEL"
                    onPress={handleCancel}
                    look="glass"
                    tint="dark"
                    size="sm"
                    compact
                    style={styles.cancelGlassBtn}
                />
            </View>

            {showNativePaywall ? (
                <View style={styles.nativePaywallWrap}>
                    <RevenueCatUI.Paywall
                        onDismiss={() => {
                            setDismissed(true);
                            void refreshEntitlements();
                        }}
                    />
                </View>
            ) : (
                <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.fallbackWrap}>
                        <View style={styles.statusCard}>
                            <Text style={styles.statusTitle}>SUBSCRIPTION STATUS</Text>
                            <Text style={styles.statusLine}>Status: {statusLabel}</Text>
                            <Text style={styles.statusLine}>Plan: {planLabel}</Text>
                            <Text style={styles.statusLine}>Expiration: {expirationLabel}</Text>
                        </View>

                        <Text style={styles.fallbackTitle}>ZCE PRO</Text>
                        <Text style={styles.fallbackBody}>
                            Native paywall UI is unavailable in this runtime. For real checkout testing, use a development build instead of Expo Go.
                        </Text>
                        <Text style={styles.methodHint}>Methods: Card, Apple Pay, Google Pay (availability depends on platform/store).</Text>
                        <View style={styles.purchaseActions}>
                            <GlassButton
                                label="START MONTHLY"
                                onPress={() => { void handlePurchase('monthly'); }}
                                look="glass"
                                tint="dark"
                                size="sm"
                                compact
                                disabled={isLoading}
                                style={[styles.paywallGlassButton, isLoading && styles.actionBtnDisabled]}
                            />
                            <GlassButton
                                label="START YEARLY"
                                onPress={() => { void handlePurchase('yearly'); }}
                                look="glass"
                                tint="dark"
                                size="sm"
                                compact
                                disabled={isLoading}
                                style={[styles.paywallGlassButton, isLoading && styles.actionBtnDisabled]}
                            />
                            <GlassButton
                                label="RESTORE PURCHASES"
                                onPress={() => { void handleRestore(); }}
                                look="glass"
                                tint="dark"
                                size="sm"
                                compact
                                disabled={isLoading}
                                style={[styles.paywallGlassButton, isLoading && styles.actionBtnDisabled]}
                            />
                        </View>
                        <Text style={styles.fallbackHint}>Entitlement: {config.entitlementId}</Text>
                        {showBillingInitError && !showRuntimeNativeModuleError && (
                            <Text style={styles.errorText}>
                                Billing is not available in this runtime. Use a development build/TestFlight with valid RevenueCat keys.
                            </Text>
                        )}
                        {!!lastError && !showRuntimeNativeModuleError && !showBillingInitError && <Text style={styles.errorText}>{lastError}</Text>}

                        <View style={styles.promoWrap}>
                            <Text style={styles.promoTitle}>TEST PROMO CODE</Text>
                            <TextInput
                                value={promoCode}
                                onChangeText={setPromoCode}
                                autoCapitalize="none"
                                autoCorrect={false}
                                placeholder="Enter promo code"
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                style={styles.promoInput}
                            />
                            <GlassButton
                                label="APPLY PROMO"
                                onPress={() => { void handlePromoTrial(); }}
                                look="glass"
                                tint="dark"
                                size="sm"
                                compact
                                style={styles.paywallGlassButton}
                            />
                        </View>

                        <GlassButton
                            label="BACK"
                            onPress={() => router.back()}
                            look="glass"
                            tint="dark"
                            size="sm"
                            compact
                            style={styles.paywallGlassButton}
                        />
                    </View>

                    <View style={styles.footerInFlow}>
                        <GlassButton
                            label="MANAGE OR CANCEL IN APP STORE"
                            onPress={() => { void openManageSubscriptions(); }}
                            look="glass"
                            tint="dark"
                            size="sm"
                            compact
                            style={styles.paywallGlassButton}
                        />
                    </View>
                </ScrollView>
            )}

            {showNativePaywall && (
                <View style={styles.footer}>
                    <GlassButton
                        label="MANAGE OR CANCEL IN APP STORE"
                        onPress={() => { void openManageSubscriptions(); }}
                        look="glass"
                        tint="dark"
                        size="sm"
                        compact
                        style={styles.paywallGlassButton}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    backdrop: {
        backgroundColor: 'rgba(0,0,0,0.22)',
    },
    scrollFlex: {
        flex: 1,
    },
    nativePaywallWrap: {
        flex: 1,
        paddingTop: 6,
    },
    scrollContent: {
        paddingTop: 10,
        paddingBottom: 34,
    },
    topActions: {
        paddingTop: 58,
        paddingHorizontal: Spacing.lg,
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    cancelGlassBtn: {
        minWidth: 110,
    },
    fallbackWrap: {
        marginHorizontal: Spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: Radius.xl,
        padding: Spacing.lg,
    },
    statusCard: {
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: Radius.lg,
        padding: 12,
        gap: 6,
    },
    statusTitle: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        letterSpacing: 1.5,
        color: '#FFFFFF',
        marginBottom: 2,
    },
    statusLine: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: 'rgba(255,255,255,0.82)',
        lineHeight: 18,
    },
    fallbackTitle: {
        fontFamily: Fonts.heading,
        fontSize: 26,
        color: '#FFFFFF',
        marginBottom: 10,
        letterSpacing: 1,
    },
    fallbackBody: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: 'rgba(255,255,255,0.78)',
        lineHeight: 22,
        marginBottom: 8,
    },
    methodHint: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: 'rgba(255,255,255,0.62)',
        marginBottom: 12,
        letterSpacing: 0.4,
    },
    purchaseActions: {
        gap: 8,
        marginBottom: 10,
    },
    actionBtnDisabled: {
        opacity: 0.5,
    },
    paywallGlassButton: {
        width: '100%',
    },
    fallbackHint: {
        fontFamily: Fonts.mono,
        fontSize: 10,
        color: 'rgba(255,255,255,0.62)',
        marginBottom: 8,
    },
    errorText: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: '#B91C1C',
        marginBottom: 10,
    },
    promoWrap: {
        marginTop: 8,
        marginBottom: 12,
        gap: 8,
    },
    promoTitle: {
        fontFamily: Fonts.monoBold,
        fontSize: 10,
        letterSpacing: 1.4,
        color: 'rgba(255,255,255,0.72)',
    },
    promoInput: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: Radius.md,
        color: '#FFFFFF',
        fontFamily: Fonts.body,
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    footer: {
        position: 'absolute',
        left: Spacing.lg,
        right: Spacing.lg,
        bottom: 34,
    },
    footerInFlow: {
        marginHorizontal: Spacing.lg,
        marginTop: 16,
    },
});
