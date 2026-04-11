import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import {
    Alert,
    FlatList, Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
// Don't import expo-av at module load time — load it at runtime where available.
import FluentEmoji, { resolveFluentEmojiName } from '@/components/FluentEmoji';
import GlassButton from '@/components/GlassButton';
import GlassCard from '@/components/GlassCard';
import ProofModal from '@/components/ProofModal';
import ViralShareCard, { type ViralShareMode } from '@/components/ViralShareCard';
import XPBar from '@/components/XPBar';
import { getNightlyRiskSnapshot, pickAdaptiveDojoLoadout } from '@/constants/habitEngine';
import { Colors, Fonts, FontSizes, Radius, Spacing, XPConfig } from '@/constants/theme';
import { useTextColors } from '@/context/TextColorsContext';
import { useUser } from '@/context/UserContext';
import { useXPBarColors } from '@/hooks/useXPBarColors';
import { AIService } from '@/services/ai';
import { getFirstName } from '@/utils/formatters';
import { buildZaneMemoryContext, getHarvestReport } from '@/utils/zaneMemory';
import { requireOptionalNativeModule } from 'expo-modules-core';
import * as ExpoLinking from 'expo-linking';

const ROASTS = [
  "I've seen NPCs with more dialogue than you. Wake the beast or stay background noise.",
  "Skipped reps again? Your future self is watching and he's disgusted. 50 push-ups. Now.",
  "Still hiding in whisper mode? The cage is open. Step out or stay a ghost forever.",
  "You're letting comfort choke your fire. Feel that burn? Feed it 30 burpees. Go.",
  "Too shy to talk? The room's waiting for your chaos. Drop one loud line today or stay forgettable.",
  "You keep rehearsing and never pulling the trigger. One bold opener in the next hour. Move.",
  "Your fear is loud because your reps are quiet. Make your effort louder right now.",
  "You want legendary results with civilian effort. Ten hard reps, then come back dangerous.",
  "You keep bowing to comfort like it's a king. Break posture, claim space, and lead.",
  "You don't need more motivation, you need violence in your execution. Start one social rep now.",
  "You keep asking for confidence instead of earning it. Eye contact, smile, open—do it today.",
  "You're acting like a side character in your own mission. Seize one room before sunset.",
  "That excuse sounded elegant, still cowardice. Burn it with action and report a win.",
  "You've been training your doubt more than your charisma. Flip that script this minute.",
  "You want the crown but worship comfort. Choose pain, choose reps, choose power. Now.",
];

const ZANE_QUOTES = [
  "Every missed rep is a missed chance to make someone laugh.",
  "One bold compliment could make a stranger's whole day.",
  "Charisma isn't born. It's forged — one awkward conversation at a time.",
  "The person you're afraid to talk to? They're afraid no one will.",
  "Comfort is the enemy of character. Go be uncomfortable.",
  "You don't need a script. You need the guts to press play.",
  "The hardest rep is the first word. Everything after is momentum.",
  "Nobody remembers the guy who stayed quiet. Be memorable.",
  "Your vibe is your resume. Walk in like you've already got the job.",
  "Fear is just excitement with bad branding. Rebrand it.",
  "A stranger is just a friend you haven't had the guts to meet yet.",
  "Goggins carries the boats. You carry the conversation. Same energy.",
  "Small talk is just the lobby. The real game starts when you go deeper.",
  "The best version of you exists on the other side of one bold move.",
  "Stop waiting for the perfect moment. The perfect moment is now.",
];

const DAILY_MISSION_POOL = [
  { id: 'dm_stranger', icon: '🔥', title: 'COLD OPEN STRANGER', xp: 10, desc: 'Initiate a conversation with a total stranger.' },
  { id: 'dm_eyelock', icon: '👁️', title: 'EYE-LOCK: BLINK FIRST = LOSE', xp: 10, desc: 'Hold eye contact until they break. No exceptions.' },
  { id: 'dm_compliment', icon: '💣', title: 'DROP BOLD COMPLIMENT', xp: 10, desc: 'Give someone a genuine, high-status compliment.' },
  { id: 'dm_roast', icon: '🤜', title: 'BRUTAL ROAST (FRIEND)', xp: 10, desc: 'Sharpen your wit with a playful, sharp remark.' },
  { id: 'dm_group', icon: '⚡', title: 'INFILTRATE COLD GROUP', xp: 10, desc: 'Approach and join a group of people already talking.' },
  { id: 'dm_command', icon: '👑', title: 'COMMAND ROOM 60S', xp: 10, desc: 'Enter a room and dominate the energy for 1 minute.' },
  { id: 'dm_flip', icon: '🔄', title: 'FRAME FLIP DEFENSIVE LINE', xp: 10, desc: 'Turn a defensive moment into a status win.' },
  { id: 'dm_joke', icon: '🎭', title: 'EXTRACT 3 LAUGHS', xp: 10, desc: 'Use clever wit to make three people laugh genuinely.' },
  { id: 'dm_reject', icon: '🛡️', title: 'HUNT REJECTION', xp: 10, desc: 'Purposefully seek out a "No" to build immunity.' },
  { id: 'dm_lead', icon: '🎤', title: 'SEIZE CONVERSATIONAL REINS', xp: 10, desc: 'Direct the topic of conversation in a group.' },
  { id: 'dm_story', icon: '🔮', title: 'HOOK AUDIENCE: 60S STORY', xp: 10, desc: 'Control the attention with a magnetic 60s tale.' },
  { id: 'dm_confront', icon: '⚔️', title: 'ASSERT RAW TRUTH', xp: 10, desc: 'State a blunt, honest truth without flinching.' },
];

const QUEST_POOL = [
  { id: 'q_mirror', icon: '🪞', title: '5-MIN MIRROR SIEGE', xp: 10, desc: 'Practice micro-expressions and tone in the mirror.' },
  { id: 'q_record', icon: '🎥', title: 'RECORD & AUDIT VOICE', xp: 10, desc: 'Analyze your pitch, pace, and vocal presence.' },
  { id: 'q_cold', icon: '🥶', title: 'COLD SHOWER DISCIPLINE', xp: 10, desc: 'Do 2 minutes of freezing water. Kill the comfort.' },
  { id: 'q_posture', icon: '💪', title: 'CLAIM YOUR SPACE: 1HR POSTURE', xp: 10, desc: 'Maintain absolute alpha posture for 60 minutes.' },
  { id: 'q_nofiller', icon: '🤐', title: 'ZERO FILLER WORDS: 1HR', xp: 10, desc: 'Eliminate "um," "like," and "basically" completely.' },
  { id: 'q_villain', icon: '👹', title: 'DRAFT YOUR VILLAIN ARC', xp: 10, desc: 'Define your boundaries and the things you stop tolerating.' },
  { id: 'q_dominate', icon: '🏆', title: 'LIST 3 DOMINANCE REPS', xp: 10, desc: 'Write down three times you led or influenced a room.' },
  { id: 'q_silence', icon: '📵', title: 'SILENCE THE NOISE: 2HR OFFLINE', xp: 10, desc: 'Go 120 minutes without a single digital distraction.' },
  { id: 'q_journal', icon: '📓', title: 'RAW OPERATION JOURNAL', xp: 10, desc: 'Document your victories and mistakes with zero filter.' },
  { id: 'q_breath', icon: '🌬️', title: 'BOX BREATHING: 4-4-4-4', xp: 10, desc: 'Calm the neural stack with 5 minutes of box breathing.' },
  { id: 'q_shadow', icon: '🌑', title: 'SHADOW WORK: FACE FEAR', xp: 10, desc: 'Confront one thing you are currently avoiding.' },
  { id: 'q_meditate', icon: '🧘', title: 'SILENCE WATCHER: 10M SIEGE', xp: 10, desc: 'Sit in absolute silence for 10 minutes. Watch the mind.' },
];

const RECOVERY_QUESTIONS = [
  "If you walk into a room and no one notices you, what's your first move?",
  "A high-value person interrupts you while you're speaking. How do you respond?",
  "Someone gives you a backhanded compliment. What's the best witty retort?",
  "You're at a networking event and there's a 3-second awkward silence. How do you break it?",
  "What is the most 'Magnetic' way to introduce yourself to a group of strangers?",
];

const SIGNAL_INTERVAL_MS = 7_000;

const pick8 = (pool: any[]) => [...pool].sort(() => 0.5 - Math.random()).slice(0, 8);

// Use expo-audio only for playback. Avoid importing expo-av in builds that don't ship ExponentAV.
let _cachedAudio: any | null | undefined;
const loadAudio = async () => {
  if (Platform.OS === 'web') return null;
  if (_cachedAudio !== undefined) return _cachedAudio;
  const expoAudio = requireOptionalNativeModule<any>('ExpoAudio');
  if (!expoAudio || typeof expoAudio.setAudioModeAsync !== 'function') {
    _cachedAudio = null;
    return null;
  }
  try {
    const mod = await import('expo-audio');
    _cachedAudio = mod;
    return _cachedAudio;
  } catch {
    _cachedAudio = null;
    return null;
  }
};

function dedupeSignalText(text: string) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function buildPersonalizedHomeFallback(
  kind: 'quote' | 'roast',
  user: any,
  harvestReport: { todayXp: number; streak: number; avoidedText: string; tone: string },
  riskSnapshot: { xpAtRisk: number; titleAtRisk: string }
) {
  const name = getFirstName(user?.name || 'Agent').toUpperCase();
  const streak = user?.streakAtRisk ? user?.previousStreak || 0 : user?.streak || 0;
  const totalXp = Math.round(user?.xp || 0);

  if (kind === 'roast') {
    const rareDataRoasts = [
      `${name}, day ${streak} and your engine still hesitates. Prove you're alive—one savage rep in the next 10 minutes.`,
      `${name}, ${totalXp} XP means nothing if you still hide in safe mode. Hunt discomfort right now.`,
      `${name}, ${harvestReport.todayXp} XP and ${harvestReport.avoidedText} still owns you. Break that pattern today.`,
    ];
    const subtleRoasts = [
      `${name}, average dies quietly. End the funeral—take one hard social rep now.`,
      `${name}, fear keeps taxing your potential. Stop paying it and move first.`,
      `${name}, discipline hurts less than regret. Choose pain with purpose today.`,
      `${name}, waiting to feel ready is how ghosts are made. Act loud, act now.`,
      `${name}, comfort is eating your future in tiny bites. Bite back with action.`,
      `${name}, charisma crowns the committed, never the careful. Commit one bold move today.`,
    ];
    const pool = Math.random() < (1 / 30) ? rareDataRoasts : subtleRoasts;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (harvestReport.todayXp <= 0) {
    return `${name}-la. A streak survives when the body moves before the excuse finishes speaking.`;
  }
  if (/voice|presence/.test(harvestReport.avoidedText)) {
    return `${name}-la. Your next level is not hidden in thought. It's trapped behind one louder rep.`;
  }
  return `${name}-la. ${harvestReport.todayXp} XP means the system moved today. Now make tomorrow too expensive to skip.`;
}

function getNextSignalMode(kind: 'roast' | 'quote'): 'classic' | 'personalized' {
  if (kind === 'roast') return Math.random() < 0.18 ? 'personalized' : 'classic';
  return Math.random() < 0.22 ? 'personalized' : 'classic';
}

export default function DojoScreen() {
  const { user, completeQuest, resetQuests, recoverStreak, deploySystemBackup } = useUser();
  const { textPrimary, textTertiary } = useTextColors();
  const premiumEntitlementId =
    ((Constants.expoConfig?.extra as any)?.revenuecat?.entitlementId as string | undefined) ||
    'ZCE Pro';
  const isPremium = useMemo(() => {
    const tier = String((user as any)?.subscriptionTier || 'initiate').toLowerCase();
    const status = String((user as any)?.subscriptionStatus || 'inactive').toLowerCase();
    const entitlements = Array.isArray((user as any)?.entitlements) ? (user as any).entitlements : [];
    return (
      tier === 'director' ||
      status === 'active' ||
      status === 'grace' ||
      entitlements.includes(premiumEntitlementId)
    );
  }, [premiumEntitlementId, user]);

  // Use textPrimary as the UI accent so time themes like Battle Glory remain readable
  // (Battle Glory's last palette stop is a deep navy, which makes small UI text unreadable).
  // Convert hex to rgba for textShadowColor
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const glowColor = hexToRgba(textPrimary, 1.0);
  const subtleGlowColor = hexToRgba(textPrimary, 0.78);
  const streakGlowColor = user?.streakAtRisk ? 'rgba(255, 84, 84, 0.95)' : glowColor;
  const streakSubtleGlowColor = user?.streakAtRisk ? 'rgba(255, 84, 84, 0.68)' : subtleGlowColor;
  const xpBarColors = useXPBarColors();
  const [roastIndex, setRoastIndex] = useState(() => Math.floor(Math.random() * ROASTS.length));
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * ZANE_QUOTES.length));
  const [dynamicRoast, setDynamicRoast] = useState<string | null>(null);
  const [dynamicQuote, setDynamicQuote] = useState<string | null>(null);
  const [roastMode, setRoastMode] = useState<'classic' | 'personalized'>('classic');
  const [quoteMode, setQuoteMode] = useState<'classic' | 'personalized'>('classic');
  const [roastTimerResetKey, setRoastTimerResetKey] = useState(0);
  const [quoteTimerResetKey, setQuoteTimerResetKey] = useState(0);
  const memoryContext = buildZaneMemoryContext(user);
  const recentRoastsRef = useRef<string[]>([]);
  const recentQuotesRef = useRef<string[]>([]);
  const signalRefreshInFlightRef = useRef<{ roast: boolean; quote: boolean }>({ roast: false, quote: false });
  const signalRequestIdRef = useRef<{ roast: number; quote: number }>({ roast: 0, quote: 0 });
  const roastIndexRef = useRef(roastIndex);
  const quoteIndexRef = useRef(quoteIndex);
  const dynamicRoastRef = useRef<string | null>(dynamicRoast);
  const dynamicQuoteRef = useRef<string | null>(dynamicQuote);

  useEffect(() => { roastIndexRef.current = roastIndex; }, [roastIndex]);
  useEffect(() => { quoteIndexRef.current = quoteIndex; }, [quoteIndex]);
  useEffect(() => { dynamicRoastRef.current = dynamicRoast; }, [dynamicRoast]);
  useEffect(() => { dynamicQuoteRef.current = dynamicQuote; }, [dynamicQuote]);

  // ... rest of the component state ...
  // Audio playback for archived recordings
  const playbackRef = useRef<any>(null);
  const [playingUri, setPlayingUri] = useState<string | null>(null);

  const stopPlayback = () => {
    const player = playbackRef.current;
    if (!player) return;
    try { player.pause?.(); } catch (error) { void error; }
    try { player.seekTo?.(0); } catch (error) { void error; }
    try { player.remove?.(); } catch (error) { void error; }
    playbackRef.current = null;
  };

  const normalizeAudioUri = (raw?: string) => {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/^gs:\/\//i.test(trimmed)) {
      Alert.alert('Playback Error', 'This recording uses a Firebase storage path and cannot be streamed directly. Save a download URL to play it.');
      return null;
    }
    return trimmed.replace(/ /g, '%20');
  };

  const togglePlay = async (rawUri?: string) => {
    const uri = normalizeAudioUri(rawUri);
    if (!uri) return;
    try {
      if (playingUri === uri) {
        stopPlayback();
        setPlayingUri(null);
        return;
      }

      // stop any existing playback
      stopPlayback();

      const Audio = await loadAudio();
      if (!Audio) {
        Alert.alert('Playback Not Available', 'Audio playback is not available in this build.');
        return;
      }

      setPlayingUri(uri);
      await Audio.setAudioModeAsync({ playsInSilentMode: true });
      const player = Audio.createAudioPlayer(uri);
      playbackRef.current = player;
      player.addListener('playbackStatusUpdate', (status: any) => {
        if (status?.didJustFinish || (status?.isLoaded && !status?.playing)) {
          stopPlayback();
          setPlayingUri(null);
        }
      });
      player.play();
    } catch (err) {
      console.error('Playback error', err);
      Alert.alert('Playback Error', 'Unable to play recording.');
      stopPlayback();
      setPlayingUri(null);
    }
  };

  useEffect(() => {
    return () => {
      const player = playbackRef.current;
      if (!player) return;
      try { player.pause?.(); } catch (error) { void error; }
      try { player.seekTo?.(0); } catch (error) { void error; }
      try { player.remove?.(); } catch (error) { void error; }
      playbackRef.current = null;
    };
  }, []);

  const initialLoadout = useMemo(() => pickAdaptiveDojoLoadout(user), [user?.email]);
  const [microOps, setMicroOps] = useState<any[]>(() => initialLoadout.microOps);
  const [dailyMissions, setDailyMissions] = useState<any[]>(() => initialLoadout.standingOrders);
  const [fieldQuests, setFieldQuests] = useState<any[]>(() => initialLoadout.fieldOps);
  const [modalVisible, setModalVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyDetailItem, setHistoryDetailItem] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [historyTab, setHistoryTab] = useState<'drills' | 'journal'>('drills');
  const [recoveryVisible, setRecoveryVisible] = useState(false);
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [shareMode, setShareMode] = useState<ViralShareMode>('harvest');
  const [shareChallenge, setShareChallenge] = useState<any>(null);
  const [sharePending, setSharePending] = useState(false);
  const shareCardRef = useRef<View | null>(null);
  const hasShownNudge = useRef(false);
  const hasShownRecoveryPrompt = useRef(false);
  const recoveryWindowOpen = !!user?.streakRecoveryExpiresAt && new Date(user.streakRecoveryExpiresAt).getTime() > Date.now();
  const riskSnapshot = useMemo(() => getNightlyRiskSnapshot(user), [user]);
  const harvestReport = useMemo(() => getHarvestReport(user), [user]);
  const midnightCountdown = useMemo(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, midnight.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}H ${String(minutes).padStart(2, '0')}M`;
  }, [user?.lastActivityDate, user?.dailyXp, user?.streakAtRisk]);

  const recoveryCountdown = useMemo(() => {
    if (!user?.streakRecoveryExpiresAt) return '0H 00M';
    const diff = Math.max(0, new Date(user.streakRecoveryExpiresAt).getTime() - Date.now());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}H ${String(minutes).padStart(2, '0')}M`;
  }, [user?.streakRecoveryExpiresAt, user?.streakAtRisk]);

  useEffect(() => {
    const loadout = pickAdaptiveDojoLoadout(user);
    setMicroOps(loadout.microOps);
    setDailyMissions(loadout.standingOrders);
    setFieldQuests(loadout.fieldOps);
  }, [user?.email]);

  // Trigger Nudge: "Yesterday you chose average. Today choose power."
  useEffect(() => {
    // Keep startup interactive: do not auto-open blocking nudge modal on boot.
    if (!user?.streakAtRisk) {
      hasShownNudge.current = false;
      setNudgeVisible(false);
      return;
    }

    hasShownNudge.current = true;
    setNudgeVisible(false);
  }, [user?.streakAtRisk]);

  useEffect(() => {
    // Keep startup interactive: recovery modal should open only from explicit user action.
    if (user?.streakAtRisk && recoveryWindowOpen && !hasShownRecoveryPrompt.current) {
      setRecoveryQuestion(RECOVERY_QUESTIONS[Math.floor(Math.random() * RECOVERY_QUESTIONS.length)]);
      hasShownRecoveryPrompt.current = true;
    } else if (!user?.streakAtRisk || !recoveryWindowOpen) {
      hasShownRecoveryPrompt.current = false;
      setRecoveryVisible(false);
    }
  }, [user?.streakAtRisk, recoveryWindowOpen]);

  const refreshSignal = useCallback(async (kind: 'roast' | 'quote', modeOverride?: 'classic' | 'personalized') => {
    if (signalRefreshInFlightRef.current[kind]) return;
    signalRefreshInFlightRef.current[kind] = true;
    const requestId = ++signalRequestIdRef.current[kind];

    const mode = modeOverride || getNextSignalMode(kind);
    const pool = kind === 'roast' ? ROASTS : ZANE_QUOTES;
    const currentIndex = kind === 'roast' ? roastIndexRef.current : quoteIndexRef.current;
    let nextIndex = (currentIndex + 1) % pool.length;
    const recentSignalsRef = kind === 'roast' ? recentRoastsRef : recentQuotesRef;
    const personalizedFallback = buildPersonalizedHomeFallback(kind, user, harvestReport, riskSnapshot);
    const currentlyShown = kind === 'roast' ? dynamicRoastRef.current : dynamicQuoteRef.current;

    if (dedupeSignalText(pool[nextIndex] || '') === dedupeSignalText(currentlyShown || '')) {
      nextIndex = (nextIndex + 1) % pool.length;
    }

    const fallback = pool[nextIndex] || (kind === 'roast' ? ROASTS[0] : ZANE_QUOTES[0]);
    const fallbackAlt = pool[(nextIndex + 1) % pool.length] || fallback;

    if (currentlyShown) {
      recentSignalsRef.current = [currentlyShown, ...recentSignalsRef.current].slice(0, 6);
    }
    const optimisticSignalBase = mode === 'personalized' ? personalizedFallback : fallback;
    const optimisticSignal = dedupeSignalText(optimisticSignalBase) === dedupeSignalText(currentlyShown || '')
      ? fallbackAlt
      : optimisticSignalBase;

    if (kind === 'roast') {
      setDynamicRoast(optimisticSignal);
      dynamicRoastRef.current = optimisticSignal;
      setRoastMode(mode);
      setRoastIndex(nextIndex);
      roastIndexRef.current = nextIndex;
    } else {
      setDynamicQuote(optimisticSignal);
      dynamicQuoteRef.current = optimisticSignal;
      setQuoteMode(mode);
      setQuoteIndex(nextIndex);
      quoteIndexRef.current = nextIndex;
    }

    try {
      const response = await AIService.generateHomeSignal({
        kind,
        mode,
        userName: user?.name || 'AGENT',
        level: XPConfig.getLevel(user?.xp || 0).level,
        memoryContext,
        recentSignals: recentSignalsRef.current,
      });

      const nextSignal = (response || (mode === 'personalized' ? personalizedFallback : fallback)).trim();
      const normalized = dedupeSignalText(nextSignal);
      const recentNormalized = recentSignalsRef.current.map(dedupeSignalText);
      const finalSignal = recentNormalized.includes(normalized)
        ? (mode === 'personalized' ? personalizedFallback : fallback)
        : nextSignal;
      recentSignalsRef.current = [finalSignal, ...recentSignalsRef.current].slice(0, 6);

      if (requestId !== signalRequestIdRef.current[kind]) return;

      if (kind === 'roast') {
        const cleaned = finalSignal.replace(/^"|"$/g, '').trim();
        setDynamicRoast(cleaned);
        dynamicRoastRef.current = cleaned;
        setRoastMode(mode);
      } else {
        const cleaned = finalSignal.replace(/^"|"$/g, '').trim();
        setDynamicQuote(cleaned);
        dynamicQuoteRef.current = cleaned;
        setQuoteMode(mode);
      }
    } catch (error) {
      const safeFallback = mode === 'personalized' ? personalizedFallback : fallback;
      if (requestId !== signalRequestIdRef.current[kind]) return;
      if (kind === 'roast') {
        setDynamicRoast(safeFallback);
        dynamicRoastRef.current = safeFallback;
        recentRoastsRef.current = [safeFallback, ...recentRoastsRef.current].slice(0, 6);
        setRoastMode(mode);
      } else {
        setDynamicQuote(safeFallback);
        dynamicQuoteRef.current = safeFallback;
        recentQuotesRef.current = [safeFallback, ...recentQuotesRef.current].slice(0, 6);
        setQuoteMode(mode);
      }
    } finally {
      if (requestId === signalRequestIdRef.current[kind]) {
        signalRefreshInFlightRef.current[kind] = false;
      }
    }
  }, [harvestReport, memoryContext, riskSnapshot, user]);

  const rotateSignalLocally = useCallback((kind: 'roast' | 'quote') => {
    const pool = kind === 'roast' ? ROASTS : ZANE_QUOTES;
    const currentIndex = kind === 'roast' ? roastIndexRef.current : quoteIndexRef.current;
    const currentText = (kind === 'roast' ? dynamicRoastRef.current : dynamicQuoteRef.current) || pool[currentIndex] || '';

    let nextIndex = (currentIndex + 1) % pool.length;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[nextIndex] || '';
      if (dedupeSignalText(candidate) !== dedupeSignalText(currentText)) break;
      nextIndex = (nextIndex + 1) % pool.length;
    }

    const nextSignal = pool[nextIndex] || pool[0];
    if (!nextSignal) return;

    if (kind === 'roast') {
      setDynamicRoast(nextSignal);
      dynamicRoastRef.current = nextSignal;
      setRoastIndex(nextIndex);
      roastIndexRef.current = nextIndex;
      setRoastMode('classic');
      recentRoastsRef.current = [nextSignal, ...recentRoastsRef.current].slice(0, 6);
    } else {
      setDynamicQuote(nextSignal);
      dynamicQuoteRef.current = nextSignal;
      setQuoteIndex(nextIndex);
      quoteIndexRef.current = nextIndex;
      setQuoteMode('classic');
      recentQuotesRef.current = [nextSignal, ...recentQuotesRef.current].slice(0, 6);
    }
  }, []);

  useEffect(() => {
    void refreshSignal('roast', getNextSignalMode('roast'));
    void refreshSignal('quote', 'classic');
  }, [user?.email, refreshSignal]);

  useEffect(() => {
    const roastTimer = setInterval(() => {
      rotateSignalLocally('roast');
    }, SIGNAL_INTERVAL_MS);

    return () => {
      clearInterval(roastTimer);
    };
  }, [user?.email, rotateSignalLocally, roastTimerResetKey]);

  useEffect(() => {
    const quoteTimer = setInterval(() => {
      rotateSignalLocally('quote');
    }, SIGNAL_INTERVAL_MS);

    return () => {
      clearInterval(quoteTimer);
    };
  }, [user?.email, rotateSignalLocally, quoteTimerResetKey]);





  const completedIds = user?.completedQuests || [];
  const allMicroDone = microOps.length > 0 && microOps.every(q => completedIds.includes(q.id));
  const allQuestsDone = fieldQuests.length > 0 && fieldQuests.every(q => completedIds.includes(q.id));
  const allDailyDone = dailyMissions.length > 0 && dailyMissions.every(m => completedIds.includes(m.id));

  // Auto-refresh: when all daily missions are done
  const dailyMissionsRef = useRef(dailyMissions);
  dailyMissionsRef.current = dailyMissions;
  useEffect(() => {
    if (!allDailyDone) return;
    const timer = setTimeout(() => {
      const oldIds = dailyMissionsRef.current.map(m => m.id);
      resetQuests(oldIds).then(() => {
        setDailyMissions(pick8(DAILY_MISSION_POOL));
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [allDailyDone, resetQuests]);

  const rebootDaily = async () => {
    const oldIds = dailyMissions.map(m => m.id);
    await resetQuests(oldIds);
    setDailyMissions(pickAdaptiveDojoLoadout(user).standingOrders);
  };

  const rebootQuests = async () => {
    const oldIds = fieldQuests.map(q => q.id);
    await resetQuests(oldIds);
    setFieldQuests(pickAdaptiveDojoLoadout(user).fieldOps);
  };

  const rebootMicro = async () => {
    const oldIds = microOps.map(q => q.id);
    await resetQuests(oldIds);
    setMicroOps(pickAdaptiveDojoLoadout(user).microOps);
  };

  const publicShareBaseUrl = useMemo(() => {
    const fromExtra = (Constants.expoConfig?.extra as any)?.publicShareUrl as string | undefined;
    if (fromExtra && /^https?:\/\//i.test(fromExtra)) return fromExtra.replace(/\/+$/, '');
    const fromEnv = (process.env.EXPO_PUBLIC_SHARE_URL || '').trim();
    if (fromEnv && /^https?:\/\//i.test(fromEnv)) return fromEnv.replace(/\/+$/, '');
    // Last resort fallback for local/testing only.
    return ExpoLinking.createURL('/');
  }, []);

  const rankLabel = isPremium ? 'Director' : 'NPC';
  const streakTarget = 10;
  const rankProgress = Math.min(1, Math.max(0, harvestReport.streak / streakTarget));
  const nextRankLabel = harvestReport.streak >= streakTarget ? 'Maxed' : `Next: ${streakTarget}-Day`;

  const auraCells = useMemo(() => {
    const totalCells = 28;
    const activityCount = Math.min(
      totalCells,
      Math.max(harvestReport.streak, (user?.completedQuests || []).length)
    );
    return Array.from({ length: totalCells }, (_, idx) => {
      if (idx >= activityCount) return 0;
      if (idx >= activityCount - 3) return 3;
      if (idx >= activityCount - 8) return 2;
      return 1;
    });
  }, [harvestReport.streak, user?.completedQuests]);

  const shareFriendChallenge = async () => {
    const challenge = fieldQuests[0] || dailyMissions[0] || microOps[0];
    if (!challenge) return;
    setShareMode('challenge');
    setShareChallenge(challenge);
    setShareVisible(true);
  };

  const shareHarvestReport = async () => {
    setShareMode('harvest');
    setShareChallenge(null);
    setShareVisible(true);
  };

  const shareAppInvite = async () => {
    setShareMode('invite');
    setShareChallenge(null);
    setShareVisible(true);
  };

  const handleShareProtocol = useCallback(async () => {
    if (sharePending) return;
    setSharePending(true);
    try {
      let uri: string | null = null;
      try {
        const hasViewShotNative = !!requireOptionalNativeModule('RNViewShot');
        if (hasViewShotNative && shareCardRef.current) {
          const ViewShot = await import('react-native-view-shot');
          uri = await ViewShot.captureRef(shareCardRef.current, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
        }
      } catch {
        // RNViewShot native module may be missing in current dev client build.
      }
      if (uri) {
        try {
          const hasExpoSharingNative = !!requireOptionalNativeModule('ExpoSharing');
          if (hasExpoSharingNative) {
            const Sharing = await import('expo-sharing');
            const canUseImageSharing = await Sharing.isAvailableAsync();
            if (canUseImageSharing) {
              await Sharing.shareAsync(uri, {
                dialogTitle: 'Share your Protocol',
                mimeType: 'image/png',
                UTI: 'public.png',
              });
              return;
            }
          }
        } catch {
          // ExpoSharing native module may be missing in current dev client build.
        }
      }
      Alert.alert(
        'Share Requires App Build',
        'Image-only sharing needs the native modules. Install expo-sharing + react-native-view-shot and rebuild the app (dev client or production build).'
      );
    } catch {
      Alert.alert(
        'Share Requires App Build',
        'Image-only sharing needs the native modules. Install expo-sharing + react-native-view-shot and rebuild the app (dev client or production build).'
      );
    } finally {
      setSharePending(false);
    }
  }, [sharePending]);

  const handlePress = (item: any) => {
    if (completedIds.includes(item.id)) return;
    if (user?.streakAtRisk && recoveryWindowOpen) {
      setRecoveryQuestion(RECOVERY_QUESTIONS[Math.floor(Math.random() * RECOVERY_QUESTIONS.length)]);
      setRecoveryVisible(true);
      return;
    }
    setSelectedItem(item);
    setModalVisible(true);
  };


  const handleRecovery = async () => {
    if (!recoveryAnswer.trim()) {
      Alert.alert('Protocol Error', 'You must provide a charisma-based justification.');
      return;
    }
    await recoverStreak();
    setRecoveryVisible(false);
    setRecoveryAnswer('');
    Alert.alert('Protocol Success', 'Streak restored. Character integrity intact.');
  };

  const streakCount = user?.streakAtRisk ? (user?.previousStreak || 0) : (user?.streak || 0);

  // ── MISSION ROW ──────────────────────────────────────────────────────────────
  const MissionRow = ({ item }: { item: any }) => {
    const isDone = completedIds.includes(item.id);
    const fluentIconName = resolveFluentEmojiName(item.icon);
    const accentGradient = isDone
      ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'] as const
      : xpBarColors as any;
    const xpLabelColor = '#9B9B9B';
    return (
      <GlassCard
        darkGlass
        glowColor="#00D4FF"
        onPress={() => handlePress(item)}
        style={[
          styles.missionCard,
          isDone && styles.missionCardDone,
          { padding: 0, marginBottom: 8, borderWidth: 0, shadowOpacity: 0.08, shadowRadius: 8 },
        ]}
      >
        {/* Left accent bar — solid bar + big glow extending right into card */}
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 20 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 16 }}>
            <LinearGradient
              colors={[
                (accentGradient as string[])[0] + '80',
                (accentGradient as string[])[accentGradient.length - 1] + '20',
                'transparent',
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 }}>
            <LinearGradient
              colors={accentGradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, paddingLeft: 20, gap: 10 }}>
          <View style={[styles.missionIconBadge, isDone && styles.missionIconBadgeDone]}>
            {isDone ? (
              <Text allowFontScaling={false} style={[styles.missionIcon, { color: '#FFFFFF', fontSize: 16 }, isDone && { opacity: 0.5 }]}>✓</Text>
            ) : fluentIconName ? (
              <FluentEmoji
                name={fluentIconName}
                size={20}
                style={isDone ? { opacity: 0.5 } : undefined}
              />
            ) : (
              <Text allowFontScaling={false} style={[styles.missionIcon, { color: '#FFFFFF', fontSize: 16 }, isDone && { opacity: 0.5 }]}>
                {item.icon || '•'}
              </Text>
            )}
          </View>

          <View style={{ flex: 1, gap: 1 }}>
            <Text style={[styles.missionTitle, isDone && styles.missionTitleDone, { color: '#FFFFFF' }]}>
              {item.title.toUpperCase()}
            </Text>
            <Text style={[styles.missionId, isDone && styles.missionTitleDone]}>{item.desc}</Text>
          </View>

          <View style={[styles.xpPill, { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderColor: 'rgba(255,255,255,0.2)' }, isDone && { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={[styles.xpPillText, { fontFamily: Fonts.monoBold, fontSize: 9, color: xpLabelColor }, isDone && { color: 'rgba(255,255,255,0.3)' }]}>
              {isDone ? 'DONE' : `+${item.xp}`}
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  // ── SECTION HEADER ───────────────────────────────────────────────────────────
  const SectionHeader = ({ title, done, onReboot, count, total }: {
    title: string; done: boolean; onReboot: () => void; count: number; total: number;
  }) => {
    return (
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: '#FFFFFF',
                textShadowColor: subtleGlowColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.sectionSub,
              {
                color: '#FFFFFF',
                textShadowColor: subtleGlowColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 6,
              },
            ]}
          >
            {count}/{total} COMPLETED
          </Text>
        </View>
        {done ? (
          <GlassButton
            label="◆ REBOOT"
            onPress={onReboot}
            size="sm"
            tint="blue"
            style={{ marginLeft: 8 }}
          />
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#000000']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.34)' }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        scrollEnabled
        nestedScrollEnabled
        alwaysBounceVertical
        bounces
      >
        {/* Profile Header — Clean Spacing */}
        <View style={styles.header}>
          {/* XP Bar moved below hero streak */}
        </View>

        <View style={styles.heroSection}>
          <View style={styles.heroStreakWrapper}>
            <Text style={[
              styles.heroNumber,
              { 
                color: '#FFFFFF',
                textShadowColor: streakGlowColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 58,
                fontSize: 184,
                lineHeight: 225
              },
            ]}>
              {streakCount}
            </Text>
            <Text style={[
              styles.heroUnit,
              {
                color: '#FFFFFF',
                textShadowColor: streakSubtleGlowColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              },
            ]}>
              {(user?.streakAtRisk && streakCount > 0) ? 'REPAIR REQUIRED' : 'DAY STREAK'}
            </Text>
          </View>

          <Text style={[
            styles.welcomeText,
            {
              color: '#FFFFFF',
              textShadowColor: subtleGlowColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 8,
            },
          ]}>
            Welcome back, {getFirstName(user?.name)}.
          </Text>

          {/* XP Progression — Directly below streak as requested */}
          <View style={styles.heroXPContainer}>
            <XPBar xp={user?.xp || 0} />
            <Text
              style={[
                styles.xpSubLabel,
                {
                  color: '#FFFFFF',
                  textShadowColor: subtleGlowColor,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              CHARISMA ENGINE // PROGRESSION {user?.xp || 0} XP TOTAL
            </Text>
          </View>
        </View>

        {/* ═══ SYSTEM BACKUP ALERT ═══ */}
        {user && ((user.streakAtRisk && recoveryWindowOpen) || (new Date().getHours() >= 21 && user.xp === (user.dailyXp?.[new Date().toISOString().split('T')[0]] || 0) && (user.systemBackups || 0) > 0)) && (
          <GlassCard style={[styles.backupBanner, user.streakAtRisk && styles.backupBannerCritical]}>
            <View style={styles.backupBannerContent}>
              <Text style={styles.backupBannerTitle}>
                {user.streakAtRisk ? '🚨 CRITICAL: STREAK VULNERABLE' : '⚠️ NIGHT OPS: NO ACTIVITY'}
              </Text>
              <Text style={styles.backupBannerSub}>
                {user.streakAtRisk
                  ? "Your streak is offline. Answer the charisma recovery prompt to repair the engine."
                  : "9PM and zero reps. Use a System Backup or get to work."}
              </Text>
              <View style={styles.riskMetricsRow}>
                <View style={styles.riskMetricPill}>
                  <Text style={styles.riskMetricLabel}>AT RISK</Text>
                  <Text style={styles.riskMetricValue}>{riskSnapshot.xpAtRisk} XP</Text>
                </View>
                <View style={styles.riskMetricPill}>
                  <Text style={styles.riskMetricLabel}>WINDOW</Text>
                  <Text style={styles.riskMetricValue}>{user.streakAtRisk ? recoveryCountdown : midnightCountdown}</Text>
                </View>
                <View style={styles.riskMetricPill}>
                  <Text style={styles.riskMetricLabel}>COST</Text>
                  <Text style={styles.riskMetricValue}>{riskSnapshot.titleAtRisk}</Text>
                </View>
              </View>

              {user.streakAtRisk ? (
                <GlassButton
                  label="OPEN RECOVERY PROTOCOL"
                  onPress={() => {
                    setRecoveryQuestion(RECOVERY_QUESTIONS[Math.floor(Math.random() * RECOVERY_QUESTIONS.length)]);
                    setRecoveryVisible(true);
                  }}
                  tint="red"
                  size="sm"
                  style={{ marginTop: 12 }}
                />
              ) : (user.systemBackups || 0) > 0 ? (
                <GlassButton
                  label={`DEPLOY SYSTEM BACKUP (${user.systemBackups} LEFT)`}
                  onPress={deploySystemBackup}
                  tint="blue"
                  size="sm"
                  style={{ marginTop: 12 }}
                />
              ) : (
                <Text style={styles.noBackupText}>OUT OF SYSTEM BACKUPS. EARN 500XP TO PURCHASE.</Text>
              )}
            </View>
          </GlassCard>
        )}

        {/* ═══ PRIMARY CTA ═══ */}
        <View>
          <GlassButton
            label="Talk to Zane"
            onPress={() => router.navigate('/chat')}
            size="sm"
            look="glass"
            tint="blue"
            variant="pill"
            glow
            compact
            style={{ width: '100%' }}
            labelStyle={{ fontSize: 14 }}
          />
        </View>

        {/* ═══ ZANE ROAST OF THE DAY ═══ */}
        <Pressable
          onPress={() => {
            rotateSignalLocally('roast');
            setRoastTimerResetKey(prev => prev + 1);
          }}
        >
        <GlassCard
          style={styles.roastCard}
        >
          <View style={styles.roastHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FluentEmoji name="fire" size={18} style={styles.emojiIconImage} />
              <Text allowFontScaling={false} style={styles.roastLabel}>ZANE&apos;S ROAST</Text>
            </View>
            <Text style={styles.roastTap}>{roastMode === 'personalized' ? 'personal' : 'classic'}</Text>
          </View>
          <Text style={styles.roastCardText}>“{dynamicRoast || ROASTS[roastIndex]}”</Text>
        </GlassCard>
        </Pressable>

        {/* ═══ DAILY QUOTE ═══ */}
        <Pressable
          onPress={() => {
            rotateSignalLocally('quote');
            setQuoteTimerResetKey(prev => prev + 1);
          }}
        >
        <GlassCard
          style={styles.quoteCard}
        >
          <View style={styles.quoteHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FluentEmoji name="highVoltage" size={18} style={styles.emojiIconImage} />
              <Text allowFontScaling={false} style={styles.quoteLabel}>DAILY QUOTE</Text>
            </View>
            <Text style={styles.quoteTap}>{quoteMode === 'personalized' ? 'rare personal' : 'classic'}</Text>
          </View>
          <Text style={[styles.quoteTextMain, { color: '#FFFFFF' }]}>“{dynamicQuote || ZANE_QUOTES[quoteIndex]}”</Text>
          <Text style={[styles.quoteAttr, { color: 'rgba(255,255,255,0.7)' }]}>— Zane × Goggins Engine</Text>
        </GlassCard>
        </Pressable>

        <GlassCard style={styles.harvestCard}>
          <View style={styles.harvestHeader}>
            <Text style={styles.harvestLabel}>NIGHTLY HARVEST REPORT</Text>
            <Text style={styles.harvestTone}>{harvestReport.tone.toUpperCase()}</Text>
          </View>
          <Text style={styles.harvestHeadline}>
            Today you harvested {harvestReport.todayXp} XP. Current streak pressure: {harvestReport.streak} days.
          </Text>
          <Text style={styles.harvestBody}>
            Avoidance pattern: {harvestReport.avoidedText}. If you stop now, midnight hits in {midnightCountdown}.
          </Text>
          <GlassButton
            label="SHARE HARVEST"
            onPress={shareHarvestReport}
            size="sm"
            tint="blue"
            style={{ alignSelf: 'flex-start', marginTop: 12 }}
          />
        </GlassCard>

        {/* ═══ DIVIDER ═══ */}
        <View style={styles.divider} />

        {/* ═══ MICRO OPS ═══ */}
        <SectionHeader
          title="TODAY'S MINIMUM MOVE"
          done={allMicroDone}
          onReboot={rebootMicro}
          count={microOps.filter(m => completedIds.includes(m.id)).length}
          total={microOps.length}
        />
        {microOps.map(m => <MissionRow key={m.id} item={m} />)}

        {/* ═══ STANDING ORDERS ═══ */}
        <View style={styles.divider} />
        <SectionHeader
          title="STANDING ORDERS"
          done={allDailyDone}
          onReboot={rebootDaily}
          count={dailyMissions.filter(m => completedIds.includes(m.id)).length}
          total={dailyMissions.length}
        />
        {dailyMissions.map(m => <MissionRow key={m.id} item={m} />)}

        {/* ═══ FIELD OPS ═══ */}
        <View style={styles.divider} />
        <SectionHeader
          title="FIELD OPS"
          done={allQuestsDone}
          onReboot={rebootQuests}
          count={fieldQuests.filter(q => completedIds.includes(q.id)).length}
          total={fieldQuests.length}
        />
        {fieldQuests.map(q => <MissionRow key={q.id} item={q} />)}

        <GlassCard style={styles.friendOpsCard}>
          <Text style={styles.friendOpsLabel}>FRIEND OPS</Text>
          <Text style={styles.friendOpsText}>
            Send today&apos;s pressure to someone else. If they complete it too, you just turned retention into recruitment.
          </Text>
          <View style={styles.friendOpsButtons}>
            <GlassButton
              label="CHALLENGE A FRIEND"
              onPress={shareFriendChallenge}
              size="sm"
              tint="dark"
              style={{ flex: 1 }}
            />
            <GlassButton
              label="SHARE APP"
              onPress={shareAppInvite}
              size="sm"
              tint="blue"
              style={{ flex: 1 }}
            />
          </View>
        </GlassCard>

        {/* ═══ ARCHIVES ═══ */}
        <View style={styles.divider} />
        <Pressable onPress={() => setHistoryVisible(true)} style={styles.archivesBtn}>
          <View style={styles.archivesBtnInner}>
            <FluentEmoji name="openFileFolder" size={28} style={styles.archivesBtnIconImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.archivesBtnTitle}>Archives</Text>
              <Text style={styles.archivesBtnSub}>Training logs, mission journals, Zane entries</Text>
            </View>
            <Text style={styles.archivesBtnArrow}>→</Text>
          </View>
        </Pressable>

        <Pressable onPress={() => router.push('/research')} style={styles.archivesBtn}>
          <View style={styles.archivesBtnInner}>
            <FluentEmoji name="blueBook" size={28} style={styles.archivesBtnIconImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.archivesBtnTitle}>Research & Lore</Text>
              <Text style={styles.archivesBtnSub}>Study the social engineering archives</Text>
            </View>
            <Text style={styles.archivesBtnArrow}>→</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* ── PROOF MODAL ── */}
      <ProofModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onComplete={async (proofData) => {
          if (!selectedItem) return;

          let log = `Verified: ${selectedItem.title}.`;
          if (proofData.text) log += ` Description: ${proofData.text}`;
          if (proofData.photoUri) log += ` [Photo Proof Attached]`;
          if (proofData.voiceUri) log += ` [Voice Proof Attached]`;

          await completeQuest(selectedItem.id, selectedItem.xp, log, { photoUri: proofData.photoUri, voiceUri: proofData.voiceUri });
          setModalVisible(false);
          setSelectedItem(null);
        }}
        questTitle={selectedItem?.title || ''}
      />

      {/* ── RECOVERY MODAL ── */}
      <Modal animationType="slide" transparent visible={recoveryVisible} onRequestClose={() => setRecoveryVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContentWrapper}>
            <View style={[styles.modalCard, { borderColor: 'rgba(255,68,68,0.2)' }]}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>STREAK BROKEN</Text>
              <Text style={styles.modalSub}>RECOVERY PROTOCOL REQUIRED</Text>
              <Text style={[styles.modalLabel, { color: textPrimary, fontSize: 13, marginBottom: 16 }]}>
                {recoveryQuestion}
              </Text>
              <TextInput
                style={[styles.modalInput, { color: textPrimary }]}
                placeholder="Argue your charisma recovery..."
                placeholderTextColor={textTertiary}
                value={recoveryAnswer}
                onChangeText={setRecoveryAnswer}
                multiline
              />
              <View style={styles.modalButtons}>
                <GlassButton
                  label="ACCEPT LOSS"
                  onPress={() => setRecoveryVisible(false)}
                  tint="dark"
                  size="md"
                  style={{ flex: 1 }}
                />
                <GlassButton
                  label="REPAIR ENGINE"
                  onPress={handleRecovery}
                  tint="red"
                  size="md"
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── ARCHIVES MODAL ── */}
      <Modal animationType="fade" transparent visible={historyVisible} onRequestClose={() => setHistoryVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
          <View style={styles.historyHeader}>
            <Pressable onPress={() => { setHistoryVisible(false); setHistoryDetailItem(null); }} style={styles.backBtn}>
              <Text style={styles.backText}>← CLOSE</Text>
            </Pressable>
            <Text style={styles.historyTitle}>ARCHIVES</Text>
          </View>
          <View style={styles.historyTabs}>
            {(['drills', 'journal'] as const).map(tab => (
              <Pressable
                key={tab}
                onPress={() => setHistoryTab(tab)}
                style={[styles.historyTabBtn, historyTab === tab && styles.historyTabBtnActive]}
              >
                <Text style={[styles.historyTabText, historyTab === tab && styles.historyTabTextActive]}>
                  {tab === 'drills' ? 'TRAINING' : 'JOURNAL'}
                </Text>
              </Pressable>
            ))}
          </View>
                <FlatList
            data={(() => {
              if (historyTab === 'drills') {
                return (user?.drillLogs || []).filter((l: any) => l.type !== 'Mission');
              } else {
                const missionLogs = (user?.drillLogs || []).filter((l: any) => l.type === 'Mission').map((l: any) => ({
                  ...l, entry: l.feedback, analysis: null, _source: 'mission'
                }));
                const journals = (user?.journalLogs || []).map((j: any) => ({ ...j, _source: 'journal' }));
                return [...missionLogs, ...journals].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
              }
            })()}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.historyList}
                renderItem={({ item }) => (
                  <GlassCard style={styles.logCard} onPress={() => setHistoryDetailItem(item)}>
                    <View style={styles.logTopCompact}>
                      <Text style={styles.logType}>
                        {historyTab === 'drills' ? item.type?.toUpperCase() : (item._source === 'mission' ? 'MISSION LOG' : 'JOURNAL ENTRY')}
                      </Text>
                      <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.logTapHint}>Tap to view details</Text>
                  </GlassCard>
                )}
            ListEmptyComponent={<Text style={styles.emptyText}>No data in neural buffers.</Text>}
          />
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={!!historyDetailItem}
        onRequestClose={() => setHistoryDetailItem(null)}
      >
        <View style={styles.historyDetailOverlay}>
          <GlassCard style={styles.historyDetailCard}>
            {(() => {
              const item = historyDetailItem;
              if (!item) return null;

              const typeLabel = historyTab === 'drills'
                ? item.type?.toUpperCase()
                : (item._source === 'mission' ? 'MISSION LOG' : 'JOURNAL ENTRY');

              const content = (historyTab === 'drills' ? item.feedback : item.entry) || '';
              let cleaned = content.replace(/\[ID:[^\]]+\]/g, '').trim();
              cleaned = cleaned.replace(/\b(?:qs_|dm_|q_|id_)[A-Za-z0-9_-]+\b/gi, (match) => {
                const pretty = match.replace(/^(?:qs_|dm_|q_|id_)/i, '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return pretty;
              });

              const img = item.photoUri || item.imageUrl || item.image || item.photo || (item.media && item.media[0]);
              const audio = item.recording || item.recordingUri || item.voiceUri || item.audio;

              return (
                <>
                  <View style={styles.logTop}>
                    <Text style={styles.logType}>{typeLabel}</Text>
                    <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()}</Text>
                  </View>

                  {img ? (
                    <Image source={{ uri: img }} style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 8 }} resizeMode="cover" />
                  ) : audio ? (
                    <Pressable onPress={() => togglePlay(audio)} style={{ marginTop: 8, padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <Text style={{ color: textPrimary }}>{playingUri === audio ? 'Playing...' : 'Play recording'}</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.logBody}>{cleaned || '(no description provided)'}</Text>
                  )}

                  {historyTab === 'journal' && item.analysis && (
                    <View style={styles.analysisBox}>
                      <Text style={styles.analysisLabel}>ZANE ANALYSIS:</Text>
                      <Text style={styles.analysisContent}>{item.analysis}</Text>
                    </View>
                  )}
                </>
              );
            })()}

            <Pressable onPress={() => setHistoryDetailItem(null)} style={styles.historyDetailCloseBtn}>
              <Text style={styles.historyDetailCloseText}>CLOSE</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>

      {/* ── BEHAVIORAL NUDGE MODAL ── */}
      <Modal visible={nudgeVisible} transparent animationType="fade" onRequestClose={() => setNudgeVisible(false)}>
        <View style={styles.nudgeOverlay}>
          <BlurView intensity={40} style={StyleSheet.absoluteFill} />
          <GlassCard style={styles.nudgeCard}>
            <Text style={styles.nudgeTitle}>SYSTEM ALERT</Text>
            <Text style={styles.nudgeQuote}>"Yesterday you chose average."</Text>
            <Text style={styles.nudgeSubTitle}>Today choose power.</Text>
            <View style={styles.nudgeDivider} />
            <Text style={styles.nudgeInstruction}>Your streak handle is compromised. Initiate a session immediately to stabilize your momentum.</Text>
            <GlassButton label="RECLAIM STATUS" onPress={() => setNudgeVisible(false)} tint="blue" size="lg" glow style={{ width: '100%', marginTop: 20 }} />
          </GlassCard>
        </View>
      </Modal>

      <Modal animationType="slide" visible={shareVisible} onRequestClose={() => setShareVisible(false)}>
        <View style={styles.shareScreen}>
          <View style={styles.shareTop}>
            <Pressable onPress={() => setShareVisible(false)} style={styles.shareCloseBtn}>
              <Text style={styles.shareCloseText}>CLOSE</Text>
            </Pressable>
            <Text style={styles.shareTopTitle}>SHARE PROTOCOL</Text>
            <View style={styles.shareTopRightSpacer} />
          </View>

          <View style={styles.shareCardWrap}>
            <View
              ref={(ref) => { shareCardRef.current = ref; }}
              collapsable={false}
              style={styles.shareShotFrame}
            >
              <ViralShareCard
                mode={shareMode}
                agentName={getFirstName(user?.name)}
                archetype={((user as any)?.subscriptionTier || 'Initiate').toString()}
                streak={harvestReport.streak}
                todayXp={harvestReport.todayXp}
                tone={harvestReport.tone}
                rankLabel={rankLabel}
                rankProgress={rankProgress}
                nextRankLabel={nextRankLabel}
                auraCells={auraCells}
                shareUrlLabel={publicShareBaseUrl.replace(/^https?:\/\//i, '')}
                challengeTitle={shareChallenge?.title}
                challengeDesc={shareChallenge?.desc}
                challengeXp={shareChallenge?.xp}
                shareDateLabel={new Date().toLocaleDateString()}
              />
            </View>
          </View>

          <GlassButton
            label={sharePending ? 'CAPTURING...' : 'SHARE PROTOCOL'}
            onPress={handleShareProtocol}
            tint="blue"
            glow
            size="lg"
            disabled={sharePending}
            style={styles.shareBtn}
          />
        </View>
      </Modal>
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: Platform.OS === 'ios' ? 130 : 110,
    gap: 24,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 40,
    marginBottom: 0,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  heroStreakWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 40,
    minHeight: 200,
  },
  welcomeText: {
    fontFamily: Fonts.body,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: -10,
  },
  heroNumber: {
    fontFamily: Fonts.heading,
    fontSize: 180,
    fontWeight: '900',
    lineHeight: 220,
    paddingTop: 15,
    letterSpacing: -8,
    textAlignVertical: 'center',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: -5,
    // Removed hardcoded textShadow to use dynamic theme glow
  },
  heroUnit: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 6,
    marginTop: -35, // Adjusted for increased heroNumber lineHeight
    fontWeight: '800',
    opacity: 0.8,
  },
  heroXPContainer: {
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  xpSubLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1.5,
  },
  roastText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  roastCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
  },
  roastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roastLabel: {
    fontSize: 10,
    color: '#888888',
    letterSpacing: 3,
    fontWeight: '800',
  },
  roastTap: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
  },
  roastCardText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  // Backup Banner
  backupBanner: {
    padding: 20,
    backgroundColor: 'rgba(0, 150, 255, 0.05)',
    borderColor: 'rgba(0, 150, 255, 0.2)',
    borderRadius: Radius.xl,
  },
  backupBannerCritical: {
    backgroundColor: 'rgba(255, 50, 50, 0.05)',
    borderColor: 'rgba(255, 50, 50, 0.3)',
  },
  backupBannerContent: {
    alignItems: 'center',
  },
  backupBannerTitle: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 6,
  },
  backupBannerSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
  noBackupText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 12,
    letterSpacing: 1,
  },
  riskMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  riskMetricPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 92,
  },
  riskMetricLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 8,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 4,
  },
  riskMetricValue: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  quoteCard: {
    backgroundColor: 'rgba(125, 125, 125, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(125, 125, 125, 0.12)',
    padding: 18,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quoteLabel: {
    fontSize: 10,
    color: '#777777',
    letterSpacing: 3,
    fontWeight: '800',
  },
  quoteTap: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
  },
  quoteTextMain: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  quoteAttr: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: 'rgba(125, 125, 125, 0.5)',
    marginTop: 10,
    letterSpacing: 1,
  },
  harvestCard: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
  },
  harvestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  harvestLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: '#9B9B9B',
    letterSpacing: 2.5,
  },
  harvestTone: {
    fontFamily: Fonts.monoBold,
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 1,
    opacity: 0.5,
  },
  harvestHeadline: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  harvestBody: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
  },
  friendOpsCard: {
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  friendOpsLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: '#8E8E8E',
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  friendOpsText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.62)',
  },
  friendOpsButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  archivesBtn: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  archivesBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  archivesBtnIcon: {
    fontSize: 24,
    fontFamily: Platform.select({
      ios: 'Apple Color Emoji',
      web: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
      default: undefined,
    }),
    fontWeight: 'normal',
    letterSpacing: 0,
  },
  archivesBtnIconImage: {
    marginRight: 16,
  },
  archivesBtnTitle: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  archivesBtnSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  archivesBtnArrow: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.textTertiary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: '#888888',
    letterSpacing: 4,
    fontWeight: '800',
  },
  sectionSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    marginTop: 2,
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  missionCardDone: {
    borderColor: 'rgba(255,255,255,0.15)',
  },
  missionAccentBar: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#EF745C', // Will be overridden by inline style with XP bar colors
    opacity: 0.6,
  },
  missionIconBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionIconBadgeDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  missionIconStack: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionIconImageOverlay: {
    position: 'absolute',
  },
  missionIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Platform.select({
      ios: 'Apple Color Emoji',
      web: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
      default: undefined,
    }),
    fontWeight: 'normal',
    letterSpacing: 0,
  },
  emojiIcon: {
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Apple Color Emoji',
      web: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
      default: undefined,
    }),
    fontWeight: 'normal',
    letterSpacing: 0,
  },
  emojiIconImage: {
    marginRight: 2,
  },
  missionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  missionTitleDone: {
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  missionId: {
    fontFamily: Fonts.headingSemi,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  xpPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  xpPillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContentWrapper: { width: '100%' },
  modalCard: {
    borderRadius: Radius.xl,
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 22,
  },
  modalTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.h3,
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '800',
  },
  modalSub: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
    letterSpacing: 1,
  },
  modalLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 1,
  },

  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.md,
    padding: 16,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  historyHeader: {
    padding: Spacing.xl,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
    letterSpacing: 3,
    marginRight: 60,
    fontWeight: '800',
  },
  backBtn: { padding: 8 },
  backText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  historyTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: 10,
    marginBottom: 20,
  },
  historyTabBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderGlass,
  },
  historyTabBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  historyTabText: {
    fontFamily: Fonts.bodySemi,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  historyTabTextActive: { color: '#FFFFFF' },
  historyList: { padding: Spacing.xl, gap: 14, paddingBottom: 120 },
  logCard: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  logTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  logTopCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logTapHint: {
    marginTop: 8,
    fontFamily: Fonts.nunito,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
  logType: {
    fontFamily: Fonts.nunito,
    fontSize: 12,
    color: 'rgba(255,255,255,0.74)',
    letterSpacing: 0.7,
  },
  logDate: {
    fontFamily: Fonts.nunito,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  logBody: {
    fontFamily: Fonts.nunito,
    fontSize: 15,
    color: Colors.textPrimary, lineHeight: 22,
  },
  footerLink: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.4)', fontSize: 9, textDecorationLine: 'underline' },
  analysisBox: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: Colors.borderGlass,
  },
  analysisLabel: {
    fontFamily: Fonts.bodySemi,
    fontSize: 11,
    color: Colors.accentSecondary,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  analysisContent: {
    fontFamily: Fonts.body, fontSize: 14,
    color: Colors.textSecondary, lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center', color: Colors.textTertiary,
    fontFamily: Fonts.mono, marginTop: 40, fontSize: 13,
  },
  historyDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  historyDetailCard: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  historyDetailCloseBtn: {
    marginTop: 16,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  historyDetailCloseText: {
    fontFamily: Fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.72)',
  },
  nudgeOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  nudgeCard: { width: '100%', padding: 30, alignItems: 'center' },
  nudgeTitle: { fontFamily: Fonts.monoBold, fontSize: 10, color: '#FF3B30', letterSpacing: 4, marginBottom: 20 },
  nudgeQuote: { fontFamily: Fonts.heading, fontSize: 24, color: '#fff', textAlign: 'center', fontWeight: '900' },
  nudgeSubTitle: { fontFamily: Fonts.heading, fontSize: 20, color: Colors.accentPrimary, textAlign: 'center', marginTop: 8 },
  nudgeDivider: { width: 60, height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 24 },
  nudgeInstruction: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
  shareScreen: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'ios' ? 64 : 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  shareTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  shareCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 62,
  },
  shareCloseText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  shareTopTitle: {
    color: '#FFFFFF',
    fontFamily: Fonts.headingSemi,
    fontSize: 14,
    letterSpacing: 1.4,
  },
  shareTopRightSpacer: {
    minWidth: 62,
  },
  shareCardWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  shareShotFrame: {
    width: '100%',
  },
  shareBtn: {
    width: '100%',
    marginTop: 18,
  },
});
