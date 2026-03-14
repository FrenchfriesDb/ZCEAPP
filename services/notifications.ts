import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
    SETTINGS: '@zce_notif_settings',
    DAILY_COUNT: '@zce_notif_daily_count',
    DAILY_COUNT_DATE: '@zce_notif_daily_count_date',
    LAST_OPEN: '@zce_last_app_open',
    REENGAGEMENT_ID: '@zce_reengagement_id',
    LAST_STREAK: '@zce_last_notified_streak',
    LAST_LEVEL: '@zce_last_notified_level',
};

// ─── Notification Settings ────────────────────────────────────────────────────
export interface NotifSettings {
    morningIgnition: boolean;  // 8AM daily
    noonRoast: boolean;  // 12PM daily
    streakProtector: boolean;  // 7PM if no activity
    questReminder: boolean;  // after opening without completing
    streakMilestone: boolean;  // on 3/7/14/30-day achievements
    levelUp: boolean;  // on XP level change
    reengagement: boolean;  // after 48h no opens
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

// ─── Message Banks ────────────────────────────────────────────────────────────
const MORNING_IGNITION = (name: string) => [
    `${name}. Your freeze response is loading. DOJO drills are the kill switch. Open now.`,
    `${name}. Today someone's going to look at you. Will you look back or look away? Train first.`,
    `The version of you that owns rooms woke up an hour ago, ${name}. You're already behind.`,
    `New standing orders dropped. The awkward version of you is hoping you ignore this, ${name}.`,
    `${name}. The room won't own itself. Open DOJO.`,
    `Every rep you skip today is a rep the old you wins, ${name}. Don't let it happen.`,
    `${name}. The window between who you are and who you want to be closes every day you sleep in.`,
];

const NOON_ROAST = (name: string) => [
    `${name}, still waiting for confidence to arrive in the mail? It's not coming. Open DOJO.`,
    `Somewhere right now someone less talented than you is talking to everyone in the room. Just saying, ${name}.`,
    `Your social battery is at 100% because you never use it, ${name}. That's not a flex.`,
    `Main characters don't wait for perfect conditions, ${name}. They train during imperfect ones.`,
    `${name}. You've been "about to" level up for days. The leaderboard doesn't care about almost.`,
    `The world is moving, ${name}. You're standing still. Execute a rep or accept being average.`,
    `I've seen NPCs with more drive, ${name}. Prove me wrong. Finish your mission.`,
];

const STREAK_PROTECTOR = (name: string, streak: number) => [
    `${name}. Your ${streak}-day streak dies in 5 hours. ZANE is watching.`,
    `${streak} days of momentum, ${name}. One ignored notification ends it. Your call.`,
    `You built ${streak} days straight, ${name}. Tonight's the night you throw it away? Interesting choice.`,
    `STREAK ALERT, ${name}. ${streak} days is on the line. One drill. That's all it takes.`,
    `${name}. ${streak} days. Don't be the person who 'almost' kept the streak.`,
];

const QUEST_REMINDER = (name: string) => [
    `${name}, you opened DOJO and closed it. That's the digital equivalent of walking into a gym and leaving. Get back in.`,
    `Standing orders are waiting, ${name}. The freeze doesn't fix itself.`,
    `${name}. You showed up. That's step one. Step two is actually executing. Open your quests.`,
    `The drill isn't going to complete itself, ${name}. You were 30 seconds away earlier. Finish it.`,
];

const STREAK_MILESTONES: Record<number, string> = {
    3: `3 DAY STREAK. Most people quit on day 2. You didn't. That's already rare.`,
    7: `7 DAYS. One week of not being average. ZANE acknowledges this. Now make it two.`,
    14: `14 DAYS. You're in the top 5% of users. The old version of you would've quit by now.`,
    30: `30 DAYS. You're not the same person who downloaded this app. Prove it today.`,
};

const LEVEL_UP_MSGS = (name: string, level: number) => [
    `LEVEL UP. ${name} is now LVL ${level}. NPC → Side Character. The leaderboard noticed. Keep climbing.`,
    `${name}. You just leveled up to LVL ${level}. The gap between you and #1 is closing. Don't stop now.`,
    `LVL ${level} unlocked, ${name}. Every rep you did got you here. Keep stacking.`,
];

const REENGAGEMENT = (name: string) => [
    `${name}, you ghosted DOJO for 2 days. Your streak is gone. Your excuses aren't. Come back.`,
    `48 hours of silence, ${name}. The freeze won. Or did it? One drill says otherwise.`,
    `${name}. ZANE filed a missing persons report. Last seen: 2 days ago. Return to base.`,
    `2 days gone, ${name}. The version of you that was building something? Still waiting.`,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns false if current time is in the quiet window (10PM–7AM) */
function isQuietTime(): boolean {
    const h = new Date().getHours();
    return h >= 22 || h < 7;
}

/** Returns true if we're allowed to send more notifications today (max 3) */
async function canSendToday(): Promise<boolean> {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(KEYS.DAILY_COUNT_DATE);
    if (storedDate !== today) {
        await AsyncStorage.setItem(KEYS.DAILY_COUNT_DATE, today);
        await AsyncStorage.setItem(KEYS.DAILY_COUNT, '0');
        return true;
    }
    const count = parseInt((await AsyncStorage.getItem(KEYS.DAILY_COUNT)) || '0', 10);
    return count < 3;
}

async function incrementDailyCount() {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem(KEYS.DAILY_COUNT_DATE);
    const count = storedDate === today
        ? parseInt((await AsyncStorage.getItem(KEYS.DAILY_COUNT)) || '0', 10)
        : 0;
    await AsyncStorage.setItem(KEYS.DAILY_COUNT_DATE, today);
    await AsyncStorage.setItem(KEYS.DAILY_COUNT, String(count + 1));
}

/** Load user's notification settings, falling back to defaults */
async function loadSettings(): Promise<NotifSettings> {
    try {
        const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
        if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { }
    return DEFAULT_SETTINGS;
}

export async function saveNotifSettings(settings: NotifSettings) {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    // Re-schedule recurring notifications based on new settings
    await NotificationService.rescheduleRecurring(settings);
}

// ─── Main Service ─────────────────────────────────────────────────────────────
export const NotificationService = {

    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'web') return false;
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('[NOTIF] Permission not granted');
                return false;
            }
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'ZCE',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#00F5FF',
                });
            }
            return true;
        } catch (e) {
            console.warn('[NOTIF] Permission request failed:', e);
            return false;
        }
    },

    /** Schedule all recurring daily notifications (morning, noon, streak protector) */
    async scheduleRecurring(firstName: string) {
        const settings = await loadSettings();
        await this.rescheduleRecurring(settings, firstName);
    },

    /** Called when settings change — clears and re-schedules recurring only */
    async rescheduleRecurring(settings: NotifSettings, firstName: string = 'Agent') {
        if (Platform.OS === 'web') return;
        // Cancel ONLY the recurring (tagged) ones, not immediate ones
        try {
            const all = await Notifications.getAllScheduledNotificationsAsync();
            const recurringIds = all
                .filter(n => (n.content.data as any)?.type === 'recurring')
                .map(n => n.identifier);
            await Promise.all(recurringIds.map(id => Notifications.cancelScheduledNotificationAsync(id)));
        } catch (e) {
            console.warn('[NOTIF] Reschedule failed:', e);
            return;
        }

        const name = firstName || 'Agent';

        // 1 — Morning Ignition at 8:00 AM
        if (settings.morningIgnition) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⚡ MORNING ORDERS',
                    body: pick(MORNING_IGNITION(name)),
                    sound: true,
                    data: { type: 'recurring', subtype: 'morning' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 8,
                    minute: 0,
                },
            });
        }

        // 2 — Noon Roast at 12:00 PM
        if (settings.noonRoast) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Z.A.N.E. TACTICAL BULLETIN',
                    body: pick(NOON_ROAST(name)),
                    sound: true,
                    data: { type: 'recurring', subtype: 'noon' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 12,
                    minute: 0,
                },
            });
        }

        // 3 — Streak Protector at 7:00 PM
        // Scheduled every day; cancelled when user completes a quest that day
        if (settings.streakProtector) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🔥 STREAK AT RISK',
                    body: pick(STREAK_PROTECTOR(name, 0)), // placeholder — see note below
                    sound: true,
                    data: { type: 'recurring', subtype: 'streak_protector' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: 19,
                    minute: 0,
                },
            });
        }

        console.log('[NOTIF] Recurring notifications scheduled');
    },

    /**
     * Call this EVERY time user completes a quest / opens app with activity.
     * Cancels today's 7PM streak protector and reschedules it for tomorrow.
     * This is how we make the streak protector "only fire if no activity today."
     */
    async onUserActivity(firstName: string, streak: number) {
        const settings = await loadSettings();
        if (!settings.streakProtector) return;

        // Cancel today's streak protector notification
        if (Platform.OS === 'web') return;
        try {
            const all = await Notifications.getAllScheduledNotificationsAsync();
            const streakProtectors = all.filter(
                n => (n.content.data as any)?.subtype === 'streak_protector'
            );
            await Promise.all(
                streakProtectors.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier))
            );
        } catch (e) { }

        // Reschedule with real streak count for tomorrow's message
        const name = firstName || 'Agent';
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🔥 STREAK AT RISK',
                body: pick(STREAK_PROTECTOR(name, streak)),
                sound: true,
                data: { type: 'recurring', subtype: 'streak_protector' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 19,
                minute: 0,
            },
        });
    },

    /** Fire immediately: Quest Reminder (only if settings allow + quiet check + daily cap) */
    async sendQuestReminder(firstName: string) {
        const settings = await loadSettings();
        if (!settings.questReminder || isQuietTime()) return;
        if (!(await canSendToday())) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '📋 STANDING ORDERS PENDING',
                body: pick(QUEST_REMINDER(firstName || 'Agent')),
                sound: true,
                data: { type: 'immediate', subtype: 'quest_reminder' },
            },
            trigger: null, // immediate
        });
        await incrementDailyCount();
    },

    /** Fire immediately: Streak Milestone (3, 7, 14, 30) */
    async sendStreakMilestone(streak: number, firstName: string) {
        const settings = await loadSettings();
        if (!settings.streakMilestone) return;

        const milestones = [3, 7, 14, 30];
        if (!milestones.includes(streak)) return;

        // Only notify once per milestone
        const lastNotified = parseInt(
            (await AsyncStorage.getItem(KEYS.LAST_STREAK)) || '0', 10
        );
        if (lastNotified >= streak) return;
        await AsyncStorage.setItem(KEYS.LAST_STREAK, String(streak));

        if (isQuietTime()) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `🏆 ${streak}-DAY STREAK`,
                body: STREAK_MILESTONES[streak],
                sound: true,
                data: { type: 'immediate', subtype: 'streak_milestone' },
            },
            trigger: null,
        });
    },

    /** Fire immediately: Level Up */
    async sendLevelUp(newLevel: number, firstName: string) {
        const settings = await loadSettings();
        if (!settings.levelUp) return;

        // Only notify once per level
        const lastLevel = parseInt(
            (await AsyncStorage.getItem(KEYS.LAST_LEVEL)) || '0', 10
        );
        if (lastLevel >= newLevel) return;
        await AsyncStorage.setItem(KEYS.LAST_LEVEL, String(newLevel));

        if (isQuietTime()) return;
        if (!(await canSendToday())) return;

        const name = firstName || 'Agent';
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `⬆️ LEVEL ${newLevel} UNLOCKED`,
                body: pick(LEVEL_UP_MSGS(name, newLevel)),
                sound: true,
                data: { type: 'immediate', subtype: 'level_up' },
            },
            trigger: null,
        });
        await incrementDailyCount();
    },

    /**
     * Call on every app open:
     * 1. Cancels the existing 48h timer.
     * 2. Records current time.
     * 3. Schedules a NEW re-engagement notification 48h from now.
     * Because it's always rescheduled on open, it only fires if 48h pass without an open.
     */
    async touchReengagement(firstName: string) {
        const settings = await loadSettings();

        // Cancel previous
        if (Platform.OS === 'web') return;
        const existingId = await AsyncStorage.getItem(KEYS.REENGAGEMENT_ID);
        if (existingId) {
            await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => { });
        }

        await AsyncStorage.setItem(KEYS.LAST_OPEN, Date.now().toString());

        if (!settings.reengagement) return;

        // Schedule 48h from now
        const fortyEightHoursMs = 48 * 60 * 60 * 1000;
        const fireAt = new Date(Date.now() + fortyEightHoursMs);

        // Respect quiet hours: if it would fire between 10PM and 7AM, push to 9AM that morning
        const fireHour = fireAt.getHours();
        if (fireHour >= 22 || fireHour < 7) {
            fireAt.setHours(9, 0, 0, 0);
            if (fireHour < 7) {
                // Already adjusted to today 9AM — fine
            } else {
                // Was 10PM+, push to next morning
                fireAt.setDate(fireAt.getDate() + 1);
            }
        }

        const name = firstName || 'Agent';
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: '👻 WHERE ARE YOU?',
                body: pick(REENGAGEMENT(name)),
                sound: true,
                data: { type: 'reengagement' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: fireAt,
            },
        });
        await AsyncStorage.setItem(KEYS.REENGAGEMENT_ID, id);
    },

    /** Initialize everything on login. Call ONCE when user is confirmed authenticated. */
    async initForUser(firstName: string, currentStreak: number) {
        const granted = await this.requestPermissions();
        if (!granted) return;

        await this.scheduleRecurring(firstName);
        await this.touchReengagement(firstName);

        // Reschedule streak protector with real streak number
        const settings = await loadSettings();
        if (settings.streakProtector && currentStreak > 0) {
            if (Platform.OS === 'web') return;
            const name = firstName || 'Agent';
            try {
                const all = await Notifications.getAllScheduledNotificationsAsync();
                const sp = all.find(n => (n.content.data as any)?.subtype === 'streak_protector');
                if (sp) {
                    await Notifications.cancelScheduledNotificationAsync(sp.identifier);
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: '🔥 STREAK AT RISK',
                            body: pick(STREAK_PROTECTOR(name, currentStreak)),
                            sound: true,
                            data: { type: 'recurring', subtype: 'streak_protector' },
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DAILY,
                            hour: 19,
                            minute: 0,
                        },
                    });
                }
            } catch (e) {
                console.warn('[NOTIF] Streak protector reschedule failed:', e);
            }
        }

        console.log('[NOTIF] System initialized for:', firstName);
    },

    async sendStreakWarning() {
        const settings = await loadSettings();
        if (!settings.streakProtector || isQuietTime()) return;
        if (!(await canSendToday())) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '⚠️ STREAK AT RISK',
                body: "One day of slacking and it's over. Z.A.N.E. sees you hiding. Get a rep in.",
                sound: true,
                data: { type: 'immediate', subtype: 'streak_warning' },
            },
            trigger: null,
        });
        await incrementDailyCount();
    },

    // Legacy alias kept for _layout.tsx compatibility during migration
    async scheduleDailyReminder(_hour?: number, _minute?: number) {
        console.log('[NOTIF] scheduleDailyReminder is deprecated — using initForUser instead');
    },
};

// ─── Settings Helpers (exported for settings screen) ─────────────────────────
export async function loadNotifSettings(): Promise<NotifSettings> {
    return loadSettings();
}
