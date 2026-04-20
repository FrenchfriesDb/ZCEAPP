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
