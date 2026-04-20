import GlassButton from '@/components/GlassButton';
import { Fonts, Spacing } from '@/constants/theme';
import { useSubscription } from '@/context/SubscriptionContext';
import { router } from 'expo-router';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

const FEATURES = [
    'Unlimited Z.A.N.E. conversations',
    'Full drill library + advanced review',
    'Director-only system intensity tuning',
    'Priority AI routing + faster retries',
];

export default function SubscriptionScreen() {
    const {
        isPremium,
        currentProductId,
        isLoading,
        lastError,
        purchaseSubscription,
        restorePurchases,
        refreshEntitlements,
    } = useSubscription();

    const handleClose = () => {
        const canGoBack = (router as any).canGoBack?.();
        if (canGoBack) {
            router.back();
            return;
        }
        router.replace('/(tabs)/profile');
    };

    const handlePurchase = async (sku: 'monthly' | 'yearly') => {
        const upgraded = await purchaseSubscription(sku);
        await refreshEntitlements();
        if (upgraded) {
            Alert.alert('ZCE PRO ACTIVATED', 'Director access unlocked. You are live.');
        }
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
                // Try next fallback URL.
            }
        }

        Alert.alert(
            'Open Subscriptions Manually',
            'On iPhone: Settings > [your name] > Subscriptions.'
        );
    };

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            <View style={styles.content}>
                <Text style={styles.eyebrow}>ZCE MEMBERSHIP</Text>
                <Text style={styles.title}>DIRECTOR TIER</Text>
                <Text style={styles.subtitle}>
                    This screen is your custom in-app subscription page. Onboarding keeps the native RevenueCat paywall.
                </Text>

                <View style={styles.featureList}>
                    {FEATURES.map((feature) => (
                        <View key={feature} style={styles.featureRow}>
                            <Text style={styles.featureDot}>◆</Text>
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.planRow}>
                    <View style={styles.planCard}>
                        <Text style={styles.planName}>MONTHLY</Text>
                        <Text style={styles.planPrice}>$9.99</Text>
                        <Text style={styles.planMeta}>Cancel anytime</Text>
                        <GlassButton
                            label={isLoading ? 'PROCESSING...' : 'START MONTHLY'}
                            onPress={() => { void handlePurchase('monthly'); }}
                            look="glass"
                            tint="dark"
                            size="sm"
                            compact
                            disabled={isLoading}
                            style={styles.planButton}
                        />
                    </View>

                    <View style={[styles.planCard, styles.planCardFeatured]}>
                        <Text style={styles.planName}>YEARLY</Text>
                        <Text style={styles.planPrice}>$59.99</Text>
                        <Text style={styles.planMeta}>Best value</Text>
                        <GlassButton
                            label={isLoading ? 'PROCESSING...' : 'START YEARLY'}
                            onPress={() => { void handlePurchase('yearly'); }}
                            look="glass"
                            tint="dark"
                            size="sm"
                            compact
                            disabled={isLoading}
                            style={styles.planButton}
                        />
                    </View>
                </View>

                {isPremium && (
                    <Text style={styles.statusGood}>
                        ACTIVE: ZCE PRO{currentProductId ? ` (${currentProductId})` : ''}
                    </Text>
                )}

                {!!lastError && <Text style={styles.errorText}>{lastError}</Text>}

                <View style={styles.actionRow}>
                    <GlassButton
                        label="RESTORE"
                        onPress={() => { void restorePurchases(); }}
                        look="glass"
                        tint="dark"
                        size="sm"
                        compact
                        disabled={isLoading}
                        style={styles.actionButton}
                    />
                    <GlassButton
                        label="MANAGE"
                        onPress={() => { void openManageSubscriptions(); }}
                        look="glass"
                        tint="dark"
                        size="sm"
                        compact
                        style={styles.actionButton}
                    />
                    <GlassButton
                        label="CLOSE"
                        onPress={handleClose}
                        look="glass"
                        tint="dark"
                        size="sm"
                        compact
                        style={styles.actionButton}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: 32,
        paddingBottom: 24,
        gap: 12,
    },
    eyebrow: {
        fontFamily: Fonts.headingSemi,
        fontSize: 11,
        letterSpacing: 2,
        color: 'rgba(255,255,255,0.65)',
    },
    title: {
        fontFamily: Fonts.heading,
        fontSize: 30,
        letterSpacing: 1,
        color: '#FFFFFF',
    },
    subtitle: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: 'rgba(255,255,255,0.7)',
    },
    featureList: {
        marginTop: 8,
        gap: 8,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    featureDot: {
        color: '#FFFFFF',
        fontSize: 10,
        paddingTop: 4,
    },
    featureText: {
        flex: 1,
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        lineHeight: 18,
        color: 'rgba(255,255,255,0.86)',
    },
    planRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    planCard: {
        flex: 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.035)',
        padding: 12,
        gap: 5,
    },
    planCardFeatured: {
        borderColor: 'rgba(255,255,255,0.36)',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    planName: {
        fontFamily: Fonts.headingSemi,
        fontSize: 12,
        letterSpacing: 1,
        color: 'rgba(255,255,255,0.7)',
    },
    planPrice: {
        fontFamily: Fonts.heading,
        fontSize: 24,
        color: '#FFFFFF',
    },
    planMeta: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: 'rgba(255,255,255,0.63)',
        marginBottom: 2,
    },
    planButton: {
        width: '100%',
        marginTop: 4,
    },
    statusGood: {
        marginTop: 8,
        fontFamily: Fonts.headingSemi,
        fontSize: 12,
        color: '#34D399',
        letterSpacing: 0.6,
    },
    errorText: {
        marginTop: 4,
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
        lineHeight: 18,
        color: '#F87171',
    },
    actionRow: {
        marginTop: 10,
        gap: 8,
    },
    actionButton: {
        width: '100%',
    },
});
