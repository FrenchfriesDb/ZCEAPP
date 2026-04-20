import { useSubscription } from '@/context/SubscriptionContext';
import { useUser } from '@/context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

type PaywallContext =
    | 'ai_limit'
    | 'drill_locked'
    | 'theme_locked'
    | 'streak_milestone'
    | 'leaderboard_cap'
    | 'profile_banner'
    | 'day3_engagement';

type PresentPaywallOptions = {
    title: string;
    body: string;
    ctaLabel?: string;
    skipLabel?: string;
    oncePerDay?: boolean;
};

const DAILY_SHOWN_KEY = '@zce/paywall_daily_shown_v1';
const EVENT_COUNTS_KEY = '@zce/paywall_event_counts_v1';
const DAY3_SHOWN_KEY = '@zce/paywall_day3_prompt_shown_v1';
const STREAK_SHOWN_PREFIX = '@zce/paywall_streak_milestone_shown_v1_';

function getTodayKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function readJsonMap(key: string): Promise<Record<string, string>> {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

async function readJsonCountMap(key: string): Promise<Record<string, number>> {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};
        return Object.fromEntries(
            Object.entries(parsed).map(([k, v]) => [k, Number(v) || 0])
        );
    } catch {
        return {};
    }
}

export function usePaywall() {
    const { isPremium } = useSubscription();
    const { user } = useUser();

    const hasCompletedQuest = Boolean((user?.completedQuests || []).length > 0);
    const canUpsell = !isPremium && hasCompletedQuest;

    const markContextAnalytics = async (context: PaywallContext) => {
        const counts = await readJsonCountMap(EVENT_COUNTS_KEY);
        counts[context] = (counts[context] || 0) + 1;
        await AsyncStorage.setItem(EVENT_COUNTS_KEY, JSON.stringify(counts));
    };

    const canShowContextToday = async (context: PaywallContext) => {
        const today = getTodayKey();
        const shown = await readJsonMap(DAILY_SHOWN_KEY);
        return shown[context] !== today;
    };

    const markContextShownToday = async (context: PaywallContext) => {
        const today = getTodayKey();
        const shown = await readJsonMap(DAILY_SHOWN_KEY);
        shown[context] = today;
        await AsyncStorage.setItem(DAILY_SHOWN_KEY, JSON.stringify(shown));
    };

    const presentPaywall = async (context: PaywallContext, options: PresentPaywallOptions) => {
        if (!canUpsell) return false;

        const oncePerDay = options.oncePerDay !== false;
        if (oncePerDay) {
            const canShow = await canShowContextToday(context);
            if (!canShow) return false;
            await markContextShownToday(context);
        }

        await markContextAnalytics(context);

        Alert.alert(
            options.title,
            options.body,
            [
                { text: options.skipLabel || 'Maybe Later', style: 'cancel' },
                {
                    text: options.ctaLabel || 'UNLOCK DIRECTOR MODE',
                    onPress: () => {
                        router.push({
                            pathname: '/settings/subscription',
                            params: { triggerContext: context },
                        } as any);
                    },
                },
            ]
        );

        return true;
    };

    const maybeShowDay3EngagementPrompt = async () => {
        if (!canUpsell) return false;
        if ((user?.streak || 0) < 3) return false;
        try {
            const alreadyShown = await AsyncStorage.getItem(DAY3_SHOWN_KEY);
            if (alreadyShown === 'true') return false;
            await AsyncStorage.setItem(DAY3_SHOWN_KEY, 'true');
        } catch {
            return false;
        }

        return presentPaywall('day3_engagement', {
            title: '3 Days In. You Are Not Average.',
            body: 'Directors who upgrade in the first week retain longer and level up faster.',
            ctaLabel: 'BECOME A DIRECTOR',
            skipLabel: 'Not Yet',
            oncePerDay: false,
        });
    };

    const maybeShowStreakMilestonePrompt = async (streak: number) => {
        if (!canUpsell) return false;
        if (![7, 14, 30].includes(streak)) return false;

        const key = `${STREAK_SHOWN_PREFIX}${streak}`;
        try {
            const shown = await AsyncStorage.getItem(key);
            if (shown === 'true') return false;
            await AsyncStorage.setItem(key, 'true');
        } catch {
            return false;
        }

        return presentPaywall('streak_milestone', {
            title: `${streak} DAY STREAK. That Is Rare.`,
            body: 'Protect it with Director perks like Streak Freeze and full protocol access.',
            ctaLabel: 'PROTECT MY STREAK',
            skipLabel: 'Maybe Later',
            oncePerDay: false,
        });
    };

    return {
        canUpsell,
        presentPaywall,
        maybeShowDay3EngagementPrompt,
        maybeShowStreakMilestonePrompt,
    };
}
