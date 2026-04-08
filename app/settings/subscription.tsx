import GlassButton from '@/components/GlassButton';
import { Fonts, Spacing } from '@/constants/theme';
import { useTextColors } from '@/context/TextColorsContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { useSubscription } from '@/context/SubscriptionContext';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const FEATURES = [
    'Streak system is fully free for everyone',
    'Basic plan includes 3 daily quests + 10 AI messages per hour',
    'Pro unlocks unlimited quests + unlimited Z.A.N.E. chat',
    'Sky-Sync dynamic themes are Pro-exclusive',
];

const PLAN_COMPARE = [
    { feature: 'Streak system', basic: 'Fully unlocked', pro: 'Fully unlocked' },
    { feature: 'Daily quests', basic: '3 per day', pro: 'Unlimited' },
    { feature: 'ZANE AI chat', basic: '10 messages / hour', pro: 'Unlimited' },
    { feature: 'Drill access', basic: 'Mirror, Eye Lock, Response Speed', pro: 'All 14+ drills' },
    { feature: 'Themes', basic: 'Static pure black only', pro: 'Sky-Sync dynamic themes' },
    { feature: 'Proof verification', basic: 'Standard', pro: 'Advanced + voice analysis' },
    { feature: 'Streak freeze', basic: 'No monthly freeze', pro: '1 freeze per month' },
    { feature: 'Leaderboard', basic: 'View + capped at L3 competition', pro: 'Premium ranking tier' },
];

const PRO_WELCOME_SLIDES = [
    {
        title: 'WELCOME TO ZCE PRO',
        body: 'Director tier is now active. Your protocol just upgraded.',
        bullets: ['Unlimited Z.A.N.E. reps unlocked', 'Unlimited daily quest access is live'],
    },
    {
        title: 'AI + COACHING BOOST',
        body: 'You now get deeper feedback loops and faster response routing.',
        bullets: ['Unlimited chat with ZANE', 'No free-tier hourly cap'],
    },
    {
        title: 'TRAINING UNLOCKS',
        body: 'You can push harder with the full training stack.',
        bullets: ['All 14+ drills unlocked', 'Advanced proof verification + voice analysis'],
    },
    {
        title: 'DIRECTOR CONTROL',
        body: 'Your account now carries Pro status across app flows.',
        bullets: ['Sky-Sync dynamic theme engine', 'Premium leaderboard placement + 1 streak freeze / month'],
    },
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
    const [showWelcome, setShowWelcome] = useState(false);
    const [welcomeSlideIndex, setWelcomeSlideIndex] = useState(0);
    const { textPrimary } = useTextColors();
    const { textColors } = useTimeColors();
    const proAccent = textColors?.primary ?? textPrimary;

    const handleClose = () => {
        const canGoBack = (router as any).canGoBack?.();
        if (canGoBack) {
            router.back();
            return;
        }
        router.replace('/(tabs)/profile');
    };

    const openWelcome = () => {
        setWelcomeSlideIndex(0);
        setShowWelcome(true);
    };

    const handlePurchase = async (sku: 'monthly' | 'yearly') => {
        const upgraded = await purchaseSubscription(sku);
        await refreshEntitlements();
        if (upgraded) {
            openWelcome();
        }
    };

    const handleRestore = async () => {
        const restored = await restorePurchases();
        await refreshEntitlements();
        if (restored) {
            openWelcome();
            return;
        }
        Alert.alert(
            'Restore Complete',
            'No active Pro entitlement found. Restore is tied to Apple ID purchase history, not your app email login.'
        );
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

    const slide = PRO_WELCOME_SLIDES[welcomeSlideIndex];
    const isLastSlide = welcomeSlideIndex === PRO_WELCOME_SLIDES.length - 1;
    const activePlanLabel = currentProductId?.toLowerCase().includes('yearly')
        ? 'YEARLY'
        : currentProductId?.toLowerCase().includes('monthly')
            ? 'MONTHLY'
            : 'PRO';

    return (
        <View style={styles.container}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.eyebrow}>ZCE MEMBERSHIP</Text>
                <Text style={styles.title}>BASIC VS PRO</Text>
                <Text style={styles.subtitle}>
                    Choose your tier. Compare everything clearly before checkout.
                </Text>

                <View style={styles.featureList}>
                    {FEATURES.map((feature) => (
                        <View key={feature} style={styles.featureRow}>
                            <Text style={styles.featureDot}>◆</Text>
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.compareCard}>
                    <View style={styles.compareHeaderRow}>
                        <Text style={[styles.compareHeadCell, styles.compareHeadFeature]}>FEATURE</Text>
                        <Text style={styles.compareHeadCell}>BASIC</Text>
                        <Text style={styles.compareHeadCell}>PRO</Text>
                    </View>
                    {PLAN_COMPARE.map((row) => (
                        <View key={row.feature} style={styles.compareRow}>
                            <Text style={[styles.compareCell, styles.compareFeature]}>{row.feature}</Text>
                            <Text style={styles.compareCell}>{row.basic}</Text>
                            <Text style={[styles.compareCell, styles.comparePro]}>{row.pro}</Text>
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
                    <Text style={[styles.statusGood, { color: proAccent }]}>
                        ACTIVE: ZCE PRO • {activePlanLabel}
                    </Text>
                )}

                {!!lastError && <Text style={styles.errorText}>{lastError}</Text>}

                <View style={styles.actionRow}>
                    <GlassButton
                        label="RESTORE"
                        onPress={() => { void handleRestore(); }}
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
                    {isPremium ? (
                        <GlassButton
                            label="VIEW PRO TOUR"
                            onPress={openWelcome}
                            look="glass"
                            tint="dark"
                            size="sm"
                            compact
                            style={styles.actionButton}
                        />
                    ) : null}
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
            </ScrollView>

            <Modal
                visible={showWelcome}
                transparent={false}
                animationType="fade"
                onRequestClose={() => setShowWelcome(false)}
            >
                <View style={styles.welcomeOverlay}>
                    <View style={styles.welcomeMain}>
                        <Text style={styles.welcomeEyebrow}>ZCE PRO ACTIVATED</Text>
                        <Text style={styles.welcomeTitle}>{slide.title}</Text>
                        <Text style={styles.welcomeBody}>{slide.body}</Text>
                        <View style={styles.welcomeBullets}>
                            {slide.bullets.map((item) => (
                                <View key={item} style={styles.welcomeBulletRow}>
                                    <Text style={styles.welcomeBulletDot}>◆</Text>
                                    <Text style={styles.welcomeBulletText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.welcomeFooter}>
                        <View style={styles.welcomeProgressRow}>
                            {PRO_WELCOME_SLIDES.map((_, i) => (
                                <View key={`slide-${i}`} style={[styles.progressDot, i === welcomeSlideIndex && styles.progressDotActive]} />
                            ))}
                        </View>
                        <View style={styles.welcomeActions}>
                            <Pressable
                                onPress={() => {
                                    if (welcomeSlideIndex === 0) {
                                        setShowWelcome(false);
                                        return;
                                    }
                                    setWelcomeSlideIndex((prev) => Math.max(0, prev - 1));
                                }}
                                style={styles.welcomeActionBtn}
                            >
                                <Text style={styles.welcomeActionText}>{welcomeSlideIndex === 0 ? 'CANCEL' : 'BACK'}</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    if (isLastSlide) {
                                        setShowWelcome(false);
                                        return;
                                    }
                                    setWelcomeSlideIndex((prev) => Math.min(PRO_WELCOME_SLIDES.length - 1, prev + 1));
                                }}
                                style={styles.welcomeActionBtn}
                            >
                                <Text style={styles.welcomeActionText}>{isLastSlide ? 'START' : 'NEXT'}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 32,
        paddingBottom: 32,
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
    compareCard: {
        marginTop: 4,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
    },
    compareHeaderRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    compareHeadCell: {
        flex: 0.9,
        textAlign: 'center',
        fontFamily: Fonts.headingSemi,
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 1,
    },
    compareHeadFeature: {
        flex: 1.8,
        textAlign: 'left',
    },
    compareRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    compareCell: {
        flex: 0.9,
        textAlign: 'center',
        fontFamily: Fonts.body,
        fontSize: 11,
        color: 'rgba(255,255,255,0.72)',
        lineHeight: 16,
    },
    compareFeature: {
        flex: 1.8,
        textAlign: 'left',
    },
    comparePro: {
        color: '#FFFFFF',
        fontFamily: Fonts.bodyMedium,
    },
    planRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
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
    promoCard: {
        marginTop: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.035)',
        padding: 12,
        gap: 8,
    },
    promoTitle: {
        fontFamily: Fonts.headingSemi,
        fontSize: 12,
        letterSpacing: 1,
        color: '#FFFFFF',
    },
    promoSubtitle: {
        fontFamily: Fonts.body,
        fontSize: 12,
        lineHeight: 18,
        color: 'rgba(255,255,255,0.68)',
    },
    promoInput: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#FFFFFF',
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
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
    welcomeOverlay: {
        flex: 1,
        backgroundColor: '#000000',
        paddingHorizontal: 22,
        paddingTop: 56,
        paddingBottom: 26,
    },
    welcomeMain: {
        flex: 1,
        justifyContent: 'center',
    },
    welcomeEyebrow: {
        fontFamily: Fonts.headingSemi,
        fontSize: 10,
        letterSpacing: 2,
        color: 'rgba(255,255,255,0.66)',
        marginBottom: 8,
    },
    welcomeTitle: {
        fontFamily: Fonts.heading,
        fontSize: 22,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    welcomeBody: {
        fontFamily: Fonts.body,
        fontSize: 14,
        lineHeight: 20,
        color: 'rgba(255,255,255,0.82)',
        marginBottom: 10,
    },
    welcomeBullets: {
        gap: 7,
    },
    welcomeBulletRow: {
        flexDirection: 'row',
        gap: 8,
    },
    welcomeBulletDot: {
        color: '#FFFFFF',
        fontSize: 10,
        paddingTop: 3,
    },
    welcomeBulletText: {
        flex: 1,
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        lineHeight: 18,
        color: 'rgba(255,255,255,0.88)',
    },
    welcomeProgressRow: {
        flexDirection: 'row',
        gap: 7,
        marginBottom: 14,
        justifyContent: 'center',
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.24)',
    },
    progressDotActive: {
        backgroundColor: '#FFFFFF',
    },
    welcomeFooter: {
        paddingBottom: 10,
    },
    welcomeActions: { flexDirection: 'row', gap: 10 },
    welcomeActionBtn: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingVertical: 12,
        alignItems: 'center',
    },
    welcomeActionText: {
        fontFamily: Fonts.headingSemi,
        fontSize: 12,
        letterSpacing: 1,
        color: '#FFFFFF',
    },
});
