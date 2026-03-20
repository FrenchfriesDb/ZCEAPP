import { getFirstName } from './formatters';
import { getNightlyRiskSnapshot, getQuestBehaviorSignals, getTodayXp } from '@/constants/habitEngine';

type LogEntry = { type?: string; feedback?: string; date?: string };
type ChatEntry = { role?: 'user' | 'assistant'; content?: string; timestamp?: string };

export type ZaneMemoryUser = {
  name?: string;
  title?: string;
  xp?: number;
  streak?: number;
  previousStreak?: number;
  streakAtRisk?: boolean;
  dailyXp?: Record<string, number>;
  primaryMission?: string;
  socialLevel?: string;
  commitment?: string;
  drillLogs?: LogEntry[];
  chatLogs?: ChatEntry[];
};

export function buildZaneMemoryContext(user?: ZaneMemoryUser | null) {
  if (!user) return 'No user memory available.';

  const firstName = getFirstName(user.name);
  const todayXp = getTodayXp(user);
  const risk = getNightlyRiskSnapshot(user);
  const signals = getQuestBehaviorSignals(user);
  const recentChat = (user.chatLogs || [])
    .slice(0, 6)
    .reverse()
    .map((entry) => `${entry.role === 'assistant' ? 'ZANE' : firstName.toUpperCase()}: ${entry.content}`)
    .join('\n');
  const recentMissionNotes = (user.drillLogs || [])
    .filter((log) => log.type === 'Mission')
    .slice(0, 5)
    .map((log) => log.feedback || '')
    .join('\n');

  return `
LIVE USER MEMORY:
- Name: ${firstName}
- Title: ${user.title || 'Initiate'}
- Total XP: ${Math.round(user.xp || 0)}
- Today's XP: ${todayXp}
- Current Streak: ${user.streak || 0}
- Previous Streak: ${user.previousStreak || 0}
- Streak At Risk: ${user.streakAtRisk ? 'YES' : 'NO'}
- Primary Mission: ${user.primaryMission || 'General'}
- Social Identity: ${user.socialLevel || 'NPC'}
- Commitment Window: ${user.commitment || '30 days'}
- Mission Count Logged: ${signals.missionCount}
- Avoiding Humor Reps: ${signals.avoidedHumor ? 'YES' : 'NO'}
- Avoiding Rejection Reps: ${signals.avoidedRejection ? 'YES' : 'NO'}
- Avoiding Voice/Presence Reps: ${signals.avoidedVoice ? 'YES' : 'NO'}
- Nightly XP At Risk: ${risk.xpAtRisk}
- Nightly Identity Risk: ${risk.titleAtRisk}

RECENT MISSION SIGNALS:
${recentMissionNotes || 'No recent mission notes.'}

RECENT CHAT HISTORY:
${recentChat || 'No recent chat history.'}

Use this memory naturally. Reference patterns, streaks, XP, avoided behaviors, and recent history when useful. Do not dump the raw memory block back to the user.
`.trim();
}

export function getHarvestReport(user?: ZaneMemoryUser | null) {
  const todayXp = getTodayXp(user);
  const streak = user?.streakAtRisk ? user?.previousStreak || 0 : user?.streak || 0;
  const signals = getQuestBehaviorSignals(user);

  const avoided = [
    signals.avoidedRejection ? 'rejection reps' : null,
    signals.avoidedHumor ? 'humor reps' : null,
    signals.avoidedVoice ? 'voice/presence reps' : null,
  ].filter(Boolean);

  return {
    todayXp,
    streak,
    avoidedText: avoided.length > 0 ? avoided.join(', ') : 'nothing obvious',
    tone:
      todayXp <= 0
        ? 'starved'
        : todayXp < 20
          ? 'barely alive'
          : todayXp < 60
            ? 'stable'
            : 'on fire',
  };
}
