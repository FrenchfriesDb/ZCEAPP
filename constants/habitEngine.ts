export type HabitQuestTier = 'micro' | 'standing' | 'field';

export interface HabitQuest {
  id: string;
  icon: string;
  title: string;
  xp: number;
  desc: string;
  tier: HabitQuestTier;
  category?: string;
  proofLevel?: 'none' | 'text' | 'media';
}

type UserSnapshot = {
  xp?: number;
  streak?: number;
  dailyXp?: Record<string, number>;
  drillLogs?: Array<{ type?: string; feedback?: string; date?: string }>;
};

export const MICRO_OPS: HabitQuest[] = [
  { id: 'mo_eye_2s', icon: '👁️', title: '2-SECOND EYE HOLD', xp: 6, desc: 'Make eye contact with one person and hold it for 2 seconds before looking away naturally.', tier: 'micro', proofLevel: 'none', category: 'confidence' },
  { id: 'mo_thanks_lock', icon: '🙏', title: 'THANKS WITH EYE CONTACT', xp: 6, desc: 'Say “thanks” with eye contact and a visible little smile.', tier: 'micro', proofLevel: 'none', category: 'charisma' },
  { id: 'mo_phone_down', icon: '📵', title: 'NO PHONE SHIELD', xp: 7, desc: 'Keep your phone down during one short social moment instead of hiding behind it.', tier: 'micro', proofLevel: 'none', category: 'presence' },
  { id: 'mo_different_seat', icon: '🪑', title: 'SIT SOMEWHERE DIFFERENT', xp: 7, desc: 'Take a slightly more visible seat than you normally would.', tier: 'micro', proofLevel: 'none', category: 'confidence' },
  { id: 'mo_nod_first', icon: '🙂', title: 'FIRST NOD', xp: 5, desc: 'Acknowledge one person first with a nod instead of waiting to be noticed.', tier: 'micro', proofLevel: 'none', category: 'social' },
  { id: 'mo_stand_tall', icon: '🧍', title: '60-SECOND POSTURE REP', xp: 6, desc: 'Stand taller than feels normal for 60 seconds in a public space.', tier: 'micro', proofLevel: 'none', category: 'presence' },
  { id: 'mo_hey_first', icon: '🗣️', title: 'SAY HEY FIRST', xp: 8, desc: 'Be the first one to say “hey” in one interaction today.', tier: 'micro', proofLevel: 'none', category: 'social' },
  { id: 'mo_1_question', icon: '❓', title: 'ONE TINY QUESTION', xp: 8, desc: 'Ask one simple follow-up question instead of ending the interaction early.', tier: 'micro', proofLevel: 'text', category: 'social' },
  { id: 'mo_clear_voice', icon: '📢', title: '10% LOUDER', xp: 7, desc: 'Speak 10% louder than your default in one interaction.', tier: 'micro', proofLevel: 'text', category: 'presence' },
  { id: 'mo_cashier_smile', icon: '🛒', title: 'CASHIER REP', xp: 6, desc: 'Thank a cashier or worker with a little warmth instead of autopilot.', tier: 'micro', proofLevel: 'none', category: 'charisma' },
  { id: 'mo_hold_silence', icon: '⏳', title: 'DON’T BREAK SILENCE', xp: 8, desc: 'Let one tiny silence breathe for 2 beats instead of panicking to fill it.', tier: 'micro', proofLevel: 'text', category: 'confidence' },
  { id: 'mo_observe_out_loud', icon: '💬', title: 'ONE OBSERVATION', xp: 8, desc: 'Say one harmless observation out loud instead of keeping it in your head.', tier: 'micro', proofLevel: 'text', category: 'charisma' },
  { id: 'mo_name_use', icon: '🏷️', title: 'USE THEIR NAME', xp: 7, desc: 'Use someone’s name once in conversation today.', tier: 'micro', proofLevel: 'text', category: 'social' },
  { id: 'mo_open_shoulders', icon: '🪽', title: 'OPEN CHEST WALK', xp: 5, desc: 'Walk one hallway or room with open shoulders and no hunching.', tier: 'micro', proofLevel: 'none', category: 'presence' },
  { id: 'mo_dont_floor', icon: '⬆️', title: 'NO FLOOR GAZE', xp: 6, desc: 'For one full minute in public, do not look down at the floor.', tier: 'micro', proofLevel: 'none', category: 'confidence' },
  { id: 'mo_real_howareyou', icon: '🧠', title: 'REAL ANSWER', xp: 8, desc: 'When someone says “how are you,” answer with one real sentence instead of “good.”', tier: 'micro', proofLevel: 'text', category: 'charisma' },
  { id: 'mo_reenter_room', icon: '🚪', title: 'RE-ENTER WITH ENERGY', xp: 7, desc: 'When you walk back into a room, don’t shrink your presence.', tier: 'micro', proofLevel: 'none', category: 'presence' },
  { id: 'mo_hold_frame_face', icon: '😐', title: 'RELAX YOUR FACE', xp: 6, desc: 'Catch your tense face once and soften it without collapsing your posture.', tier: 'micro', proofLevel: 'none', category: 'mental' },
  { id: 'mo_one_laugh_attempt', icon: '🎭', title: 'TRY ONE JOKE', xp: 9, desc: 'Make one small attempt at humor, even if it only gets a smirk.', tier: 'micro', proofLevel: 'text', category: 'humor' },
  { id: 'mo_enter_middle', icon: '🎯', title: 'CENTER-LANE REP', xp: 9, desc: 'Choose a more visible walking path or standing spot once today.', tier: 'micro', proofLevel: 'none', category: 'confidence' },
];

export const STANDING_ORDERS: HabitQuest[] = [
  { id: 'dm_stranger', icon: '🔥', title: 'COLD OPEN STRANGER', xp: 10, desc: 'Initiate a conversation with a total stranger.', tier: 'standing' },
  { id: 'dm_eyelock', icon: '👁️', title: 'EYE-LOCK: BLINK FIRST = LOSE', xp: 10, desc: 'Hold eye contact until they break. No exceptions.', tier: 'standing' },
  { id: 'dm_compliment', icon: '💣', title: 'DROP BOLD COMPLIMENT', xp: 10, desc: 'Give someone a genuine, high-status compliment.', tier: 'standing' },
  { id: 'dm_roast', icon: '🤜', title: 'BRUTAL ROAST (FRIEND)', xp: 10, desc: 'Sharpen your wit with a playful, sharp remark.', tier: 'standing' },
  { id: 'dm_group', icon: '⚡', title: 'INFILTRATE COLD GROUP', xp: 10, desc: 'Approach and join a group of people already talking.', tier: 'standing' },
  { id: 'dm_command', icon: '👑', title: 'COMMAND ROOM 60S', xp: 10, desc: 'Enter a room and dominate the energy for 1 minute.', tier: 'standing' },
  { id: 'dm_flip', icon: '🔄', title: 'FRAME FLIP DEFENSIVE LINE', xp: 10, desc: 'Turn a defensive moment into a status win.', tier: 'standing' },
  { id: 'dm_joke', icon: '🎭', title: 'EXTRACT 3 LAUGHS', xp: 10, desc: 'Use clever wit to make three people laugh genuinely.', tier: 'standing' },
  { id: 'dm_reject', icon: '🛡️', title: 'HUNT REJECTION', xp: 10, desc: 'Purposefully seek out a "No" to build immunity.', tier: 'standing' },
  { id: 'dm_lead', icon: '🎤', title: 'SEIZE CONVERSATIONAL REINS', xp: 10, desc: 'Direct the topic of conversation in a group.', tier: 'standing' },
  { id: 'dm_story', icon: '🔮', title: 'HOOK AUDIENCE: 60S STORY', xp: 10, desc: 'Control the attention with a magnetic 60s tale.', tier: 'standing' },
  { id: 'dm_confront', icon: '⚔️', title: 'ASSERT RAW TRUTH', xp: 10, desc: 'State a blunt, honest truth without flinching.', tier: 'standing' },
];

export const FIELD_OPS: HabitQuest[] = [
  { id: 'q_mirror', icon: '🪞', title: '5-MIN MIRROR SIEGE', xp: 10, desc: 'Practice micro-expressions and tone in the mirror.', tier: 'field' },
  { id: 'q_record', icon: '🎥', title: 'RECORD & AUDIT VOICE', xp: 10, desc: 'Analyze your pitch, pace, and vocal presence.', tier: 'field' },
  { id: 'q_cold', icon: '🥶', title: 'COLD SHOWER DISCIPLINE', xp: 10, desc: 'Do 2 minutes of freezing water. Kill the comfort.', tier: 'field' },
  { id: 'q_posture', icon: '💪', title: 'CLAIM YOUR SPACE: 1HR POSTURE', xp: 10, desc: 'Maintain absolute alpha posture for 60 minutes.', tier: 'field' },
  { id: 'q_nofiller', icon: '🤐', title: 'ZERO FILLER WORDS: 1HR', xp: 10, desc: 'Eliminate "um," "like," and "basically" completely.', tier: 'field' },
  { id: 'q_villain', icon: '👹', title: 'DRAFT YOUR VILLAIN ARC', xp: 10, desc: 'Define your boundaries and the things you stop tolerating.', tier: 'field' },
  { id: 'q_dominate', icon: '🏆', title: 'LIST 3 DOMINANCE REPS', xp: 10, desc: 'Write down three times you led or influenced a room.', tier: 'field' },
  { id: 'q_silence', icon: '📵', title: 'SILENCE THE NOISE: 2HR OFFLINE', xp: 10, desc: 'Go 120 minutes without a single digital distraction.', tier: 'field' },
  { id: 'q_journal', icon: '📓', title: 'RAW OPERATION JOURNAL', xp: 10, desc: 'Document your victories and mistakes with zero filter.', tier: 'field' },
  { id: 'q_breath', icon: '🌬️', title: 'BOX BREATHING: 4-4-4-4', xp: 10, desc: 'Calm the neural stack with 5 minutes of box breathing.', tier: 'field' },
  { id: 'q_shadow', icon: '🌑', title: 'SHADOW WORK: FACE FEAR', xp: 10, desc: 'Confront one thing you are currently avoiding.', tier: 'field' },
  { id: 'q_meditate', icon: '🧘', title: 'SILENCE WATCHER: 10M SIEGE', xp: 10, desc: 'Sit in absolute silence for 10 minutes. Watch the mind.', tier: 'field' },
];

function shuffle<T>(items: T[]) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayXp(user?: UserSnapshot | null) {
  if (!user?.dailyXp) return 0;
  return user.dailyXp[getTodayKey()] || 0;
}

export function getQuestTierProfile(user?: UserSnapshot | null) {
  const activeDays = Object.values(user?.dailyXp || {}).filter((xp) => xp > 0).length;
  const streak = user?.streak || 0;
  const totalXp = user?.xp || 0;
  const missionLogs = (user?.drillLogs || []).filter((log) => log.type === 'Mission').length;

  if (streak >= 12 || totalXp >= 1400 || missionLogs >= 45) {
    return { microCount: 1, standingCount: 4, fieldCount: 4, mode: 'aggressive' as const };
  }

  if (streak >= 5 || totalXp >= 350 || activeDays >= 5) {
    return { microCount: 2, standingCount: 4, fieldCount: 3, mode: 'balanced' as const };
  }

  return { microCount: 3, standingCount: 3, fieldCount: 2, mode: 'stabilize' as const };
}

export function pickAdaptiveDojoLoadout(user?: UserSnapshot | null) {
  const profile = getQuestTierProfile(user);
  return {
    profile,
    microOps: shuffle(MICRO_OPS).slice(0, profile.microCount),
    standingOrders: shuffle(STANDING_ORDERS).slice(0, profile.standingCount),
    fieldOps: shuffle(FIELD_OPS).slice(0, profile.fieldCount),
  };
}

export function getNightlyRiskSnapshot(user?: UserSnapshot | null) {
  const streak = user?.streak || 0;
  const todayXp = getTodayXp(user);
  const totalXp = user?.xp || 0;
  return {
    todayXp,
    streak,
    xpAtRisk: Math.max(120, Math.min(totalXp, Math.round(streak * 38))),
    titleAtRisk: streak >= 14 ? 'Title downgrade risk' : streak >= 7 ? 'Momentum downgrade risk' : 'Streak identity risk',
  };
}

export function getQuestBehaviorSignals(user?: UserSnapshot | null) {
  const missionLogs = (user?.drillLogs || []).filter((log) => log.type === 'Mission');
  const feedbackBlob = missionLogs.slice(0, 15).map((log) => log.feedback || '').join('\n');
  const avoidedHumor = !/laugh|joke|humor|roast/i.test(feedbackBlob);
  const avoidedRejection = !/reject|no\b|cold open|stranger/i.test(feedbackBlob);
  const avoidedVoice = !/voice|speak|project|conversation|story/i.test(feedbackBlob);

  return {
    missionCount: missionLogs.length,
    avoidedHumor,
    avoidedRejection,
    avoidedVoice,
  };
}
