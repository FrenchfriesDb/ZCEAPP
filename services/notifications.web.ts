import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    SETTINGS: '@zce_notif_settings',
};

export interface NotifSettings {
    morningIgnition: boolean;
    noonRoast: boolean;
    streakProtector: boolean;
    questReminder: boolean;
    streakMilestone: boolean;
    levelUp: boolean;
    reengagement: boolean;
}

export const DEFAULT_SETTINGS: NotifSettings = {
    morningIgnition: true,
    noonRoast: true,
    streakProtector: true,
    questReminder: true,
    streakMilestone: true,
    levelUp: true,
    reengagement: true,
};

export async function loadNotifSettings(): Promise<NotifSettings> {
    try {
        const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
        if (raw) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        }
    } catch { }
    return DEFAULT_SETTINGS;
}

export async function saveNotifSettings(settings: NotifSettings) {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export const NotificationService = {
    requestPermissions: () => Promise.resolve(false),
    scheduleRecurring: () => Promise.resolve(),
    rescheduleRecurring: () => Promise.resolve(),
    onUserActivity: () => Promise.resolve(),
    sendQuestReminder: () => Promise.resolve(),
    sendStreakMilestone: () => Promise.resolve(),
    sendLevelUp: () => Promise.resolve(),
    touchReengagement: () => Promise.resolve(),
    initForUser: () => Promise.resolve(),
    sendStreakWarning: () => Promise.resolve(),
    scheduleDailyReminder: () => Promise.resolve(),
};
