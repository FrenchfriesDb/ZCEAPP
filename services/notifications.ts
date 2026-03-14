import { Platform } from 'react-native';

/**
 * NotificationService (Web/Fallback)
 * 
 * This file is picked up by Metro for web/SSR builds.
 * It contains zero-op implementations of the notification service
 * to prevent 'localStorage' crashes.
 * 
 * The native implementation is in notifications.native.ts.
 */

const noop = () => Promise.resolve();

export const NotificationService = {
    requestPermissions: () => Promise.resolve(false),
    scheduleRecurring: noop,
    rescheduleRecurring: noop,
    onUserActivity: noop,
    sendQuestReminder: noop,
    sendStreakMilestone: noop,
    sendLevelUp: noop,
    touchReengagement: noop,
    initForUser: noop,
    sendStreakWarning: noop,
    scheduleDailyReminder: noop,
};
