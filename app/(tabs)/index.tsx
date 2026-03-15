import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, ScrollView, Pressable, Animated, Dimensions,
    KeyboardAvoidingView, Platform, TextInput, Modal, Alert, StyleSheet, FlatList,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useUser } from '@/context/UserContext';
import { Colors, Fonts, FontSizes, Spacing, Radius, XPConfig } from '@/constants/theme';
import { useTimeColors } from '@/hooks/useTimeColors';
import { useXPBarColors } from '@/hooks/useXPBarColors';
import { db } from '@/services/firebase';
import {
    collection, doc, setDoc, getDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, onSnapshot,
    getDocs, writeBatch, Timestamp,
} from 'firebase/firestore';
import ProofModal from '@/components/ProofModal';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import XPBar from '@/components/XPBar';
import { getFirstName, formatDisplayName } from '@/utils/formatters';

const ROASTS = [
  "You didn't talk to anyone today? Bro, I'm a robot and even I'm disappointed.",
  "Still reading motivational quotes instead of being the quote? Classic.",
  "Your social battery is at 100% because you never use it. That's not a flex.",
  "I ran your confidence level through my algorithms. We need to talk.",
  "Another day of watching people socialize from the sidelines? Bold strategy.",
  "You rehearsed that conversation 47 times in the shower... then said nothing. Elite.",
  "Your comfort zone has a comfort zone. Think about that.",
  "Goggins runs 100 miles. You can't even run a 10-second conversation.",
  "I've seen NPCs with more dialogue options than you.",
  "Your eye contact game is so weak, even blind people look away.",
  "You ghosted a real conversation to read about being charismatic. Irony is alive.",
  "The only thing you've been consistent at is being inconsistent. Let's fix that.",
  "You treat small talk like it's a final boss. It's literally level 1.",
  "Every excuse you make is a rep you didn't do. And you've got a LOT of reps.",
  "You think confidence is genetic? Nah. It's reps. And your rep count is tragic.",
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

const pick8 = (pool: any[]) => [...pool].sort(() => 0.5 - Math.random()).slice(0, 8);

export default function DojoScreen() {
  const { user, completeQuest, resetQuests, recoverStreak, deploySystemBackup } = useUser();
  const timePalette = useTimeColors();
  // Special handling for 9 PM Moon Dust theme - force lavender color
  const currentHour = new Date().getHours();
  const isMoonDustTheme = currentHour >= 21 && currentHour < 22; // 9-10 PM
  const systemColor = isMoonDustTheme ? '#CCB3D1' : timePalette[timePalette.length - 1];
  // Convert hex to rgba for textShadowColor
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const glowColor = hexToRgba(systemColor, 0.8);
  const xpBarColors = useXPBarColors();
  const [roastIndex, setRoastIndex] = useState(() => Math.floor(Math.random() * ROASTS.length));
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * ZANE_QUOTES.length));

  // ... rest of the component state ...
  const fadeAnim = useRef(new Animated.Value(1)).current;


  const [dailyMissions, setDailyMissions] = useState<any[]>(() => pick8(DAILY_MISSION_POOL));
  const [fieldQuests, setFieldQuests] = useState<any[]>(() => pick8(QUEST_POOL));
  const [modalVisible, setModalVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [historyTab, setHistoryTab] = useState<'drills' | 'journal'>('drills');
  const [recoveryVisible, setRecoveryVisible] = useState(false);
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const hasShownNudge = useRef(false);

  // Trigger Nudge: "Yesterday you chose average. Today choose power."
  useEffect(() => {
    if (user?.streakAtRisk && !hasShownNudge.current) {
      setNudgeVisible(true);
      hasShownNudge.current = true;
    }
  }, [user?.streakAtRisk]);

  // Roast rotation with fade
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setRoastIndex(prev => (prev + 1) % ROASTS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [fadeAnim]);





  const completedIds = user?.completedQuests || [];
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
    setDailyMissions(pick8(DAILY_MISSION_POOL));
  };

  const rebootQuests = async () => {
    const oldIds = fieldQuests.map(q => q.id);
    await resetQuests(oldIds);
    setFieldQuests(pick8(QUEST_POOL));
  };

  const handlePress = (item: any) => {
    if (completedIds.includes(item.id)) return;
    if (user?.streakAtRisk) {
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
    const accentGradient = isDone
      ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'] as const
      : xpBarColors as any;
    const themeColor = systemColor;
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
            <Text allowFontScaling={false} style={[styles.missionIcon, { color: '#FFFFFF', fontSize: 16 }, isDone && { opacity: 0.5 }]}>{isDone ? '✓' : item.icon}</Text>
          </View>

          <View style={{ flex: 1, gap: 1 }}>
            <Text style={[styles.missionTitle, isDone && styles.missionTitleDone, { color: '#FFFFFF' }]}>
              {item.title.toUpperCase()}
            </Text>
            <Text style={[styles.missionId, isDone && styles.missionTitleDone]}>{item.desc}</Text>
          </View>

          <View style={[styles.xpPill, { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderColor: 'rgba(255,255,255,0.2)' }, isDone && { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={[styles.xpPillText, { fontFamily: Fonts.monoBold, fontSize: 9, color: themeColor }, isDone && { color: 'rgba(255,255,255,0.3)' }]}>
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
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{count}/{total} COMPLETED</Text>
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
        colors={['#00000033', '#33333333']} // ~20% opacity black/gray gradient
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header — Clean Spacing */}
        <View style={styles.header}>
          {/* XP Bar moved below hero streak */}
        </View>

        <View style={styles.heroSection}>
          <View style={styles.heroStreakWrapper}>
            <Text style={[
              styles.heroNumber,
              { 
                textShadowColor: glowColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 25
              },
              (user?.streakAtRisk && streakCount > 0) && { color: Colors.accentDanger }
            ]}>
              {streakCount}
            </Text>
            <Text style={[
              styles.heroUnit,
              { color: systemColor },
              (user?.streakAtRisk && streakCount > 0) && { color: Colors.accentDanger, opacity: 1 }
            ]}>
              {(user?.streakAtRisk && streakCount > 0) ? 'REPAIR REQUIRED' : 'DAY STREAK'}
            </Text>
          </View>

          <Text style={styles.welcomeText}>
            Welcome back, {getFirstName(user?.name)}.
          </Text>

          {/* XP Progression — Directly below streak as requested */}
          <View style={styles.heroXPContainer}>
            <XPBar xp={user?.xp || 0} />
            <Text style={styles.xpSubLabel} numberOfLines={1} adjustsFontSizeToFit>
              CHARISMA ENGINE // PROGRESSION {user?.xp || 0} XP TOTAL
            </Text>
          </View>
        </View>

        {/* ═══ SYSTEM BACKUP ALERT ═══ */}
        {user && (user.streakAtRisk || (new Date().getHours() >= 21 && user.xp === (user.dailyXp?.[new Date().toISOString().split('T')[0]] || 0) && (user.systemBackups || 0) > 0)) && (
          <GlassCard style={[styles.backupBanner, user.streakAtRisk && styles.backupBannerCritical]}>
            <View style={styles.backupBannerContent}>
              <Text style={styles.backupBannerTitle}>
                {user.streakAtRisk ? '🚨 CRITICAL: STREAK VULNERABLE' : '⚠️ NIGHT OPS: NO ACTIVITY'}
              </Text>
              <Text style={styles.backupBannerSub}>
                {user.streakAtRisk
                  ? "Your streak is offline. Deploy a backup now to repair the engine."
                  : "9PM and zero reps. Use a System Backup or get to work."}
              </Text>

              {(user.systemBackups || 0) > 0 ? (
                <GlassButton
                  label={`DEPLOY SYSTEM BACKUP (${user.systemBackups} LEFT)`}
                  onPress={deploySystemBackup}
                  tint={user.streakAtRisk ? "red" : "blue"}
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
            onPress={() => router.push('/chat')}
            size="lg"
            tint="monochrome"
            variant="pill"
            glow
            style={{ width: '100%' }}
          />
        </View>

        {/* ═══ ZANE ROAST OF THE DAY ═══ */}
        <GlassCard
          onPress={() => setRoastIndex((roastIndex + 1) % ROASTS.length)}
          style={styles.roastCard}
        >
          <View style={styles.roastHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.emojiIcon}>🔥</Text>
              <Text allowFontScaling={false} style={styles.roastLabel}>ZANE&apos;S ROAST</Text>
            </View>
            <Text style={styles.roastTap}>tap to refresh</Text>
          </View>
          <Text style={styles.roastCardText}>“{ROASTS[roastIndex]}”</Text>
        </GlassCard>

        {/* ═══ DAILY QUOTE ═══ */}
        <GlassCard
          onPress={() => setQuoteIndex((quoteIndex + 1) % ZANE_QUOTES.length)}
          style={styles.quoteCard}
        >
          <View style={styles.quoteHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.emojiIcon}>⚡</Text>
              <Text allowFontScaling={false} style={styles.quoteLabel}>DAILY QUOTE</Text>
            </View>
            <Text style={styles.quoteTap}>tap to refresh</Text>
          </View>
          <Text style={[styles.quoteTextMain, { color: '#FFFFFF' }]}>“{ZANE_QUOTES[quoteIndex]}”</Text>
          <Text style={[styles.quoteAttr, { color: 'rgba(255,255,255,0.7)' }]}>— Zane × Goggins Engine</Text>
        </GlassCard>

        {/* ═══ DIVIDER ═══ */}
        <View style={styles.divider} />

        {/* ═══ STANDING ORDERS ═══ */}
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

        {/* ═══ ARCHIVES ═══ */}
        <View style={styles.divider} />
        <Pressable onPress={() => setHistoryVisible(true)} style={styles.archivesBtn}>
          <View style={styles.archivesBtnInner}>
            <Text allowFontScaling={false} style={styles.archivesBtnIcon}>📂</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.archivesBtnTitle}>Archives</Text>
              <Text style={styles.archivesBtnSub}>Training logs, mission journals, Zane entries</Text>
            </View>
            <Text style={styles.archivesBtnArrow}>→</Text>
          </View>
        </Pressable>

        <Pressable onPress={() => router.push('/research')} style={styles.archivesBtn}>
          <View style={styles.archivesBtnInner}>
            <Text allowFontScaling={false} style={styles.archivesBtnIcon}>📖</Text>
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

          await completeQuest(selectedItem.id, selectedItem.xp, log);
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
              <Text style={[styles.modalTitle, { color: Colors.accentDanger }]}>STREAK BROKEN</Text>
              <Text style={styles.modalSub}>RECOVERY PROTOCOL REQUIRED</Text>
              <Text style={[styles.modalLabel, { color: Colors.textPrimary, fontSize: 13, marginBottom: 16 }]}>
                {recoveryQuestion}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Argue your charisma recovery..."
                placeholderTextColor={Colors.textTertiary}
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
            <Pressable onPress={() => setHistoryVisible(false)} style={styles.backBtn}>
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
              <GlassCard style={styles.logCard}>
                <View style={styles.logTop}>
                  <Text style={styles.logType}>
                    {historyTab === 'drills' ? item.type?.toUpperCase() : (item._source === 'mission' ? 'MISSION LOG' : 'JOURNAL ENTRY')}
                  </Text>
                  <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.logBody}>
                  {historyTab === 'drills' ? item.feedback : item.entry}
                </Text>
                {historyTab === 'journal' && item.analysis && (
                  <View style={styles.analysisBox}>
                    <Text style={styles.analysisLabel}>ZANE ANALYSIS:</Text>
                    <Text style={styles.analysisContent}>{item.analysis}</Text>
                  </View>
                )}
              </GlassCard>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No data in neural buffers.</Text>}
          />
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
    color: '#E8E8E8',
    lineHeight: 220, // Further increased to prevent cutoff
    paddingTop: 10,  // Added padding to ensure top isn't sliced
    letterSpacing: -8,
    textAlignVertical: 'center',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: -10,
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
    fontFamily: Fonts.body,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    fontWeight: '500', // Making text slightly bolder for "light" feel
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
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
    fontFamily: Platform.OS === 'ios' ? 'Apple Color Emoji' : undefined,
    fontWeight: 'normal',
    letterSpacing: 0,
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
  missionIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: 'normal',
    letterSpacing: 0,
  },
  emojiIcon: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontWeight: 'normal',
    letterSpacing: 0,
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
    fontFamily: Fonts.monoBold,
    fontSize: 11, letterSpacing: 1,
  },
  historyTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: 10,
    marginBottom: 20,
  },
  historyTabBtn: {
    flex: 1, height: 46, borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderGlass,
  },
  historyTabBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  historyTabText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11, color: Colors.textSecondary, letterSpacing: 2,
  },
  historyTabTextActive: { color: '#FFFFFF' },
  historyList: { padding: Spacing.xl, gap: 14, paddingBottom: 120 },
  logCard: { borderRadius: Radius.lg },
  logTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  logType: {
    fontFamily: Fonts.monoBold,
    fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 2,
  },
  footerLink: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.4)', fontSize: 9, textDecorationLine: 'underline' },
  footerVersion: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.3)', fontSize: 8 },
  logDate: {
    fontFamily: Fonts.mono, fontSize: 11, color: Colors.textTertiary,
  },
  logBody: {
    fontFamily: Fonts.body, fontSize: 15,
    color: Colors.textPrimary, lineHeight: 22,
  },
  analysisBox: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: Colors.borderGlass,
  },
  analysisLabel: {
    fontFamily: Fonts.monoBold, fontSize: 10,
    color: Colors.accentSecondary, marginBottom: 8, letterSpacing: 1.5,
  },
  analysisContent: {
    fontFamily: Fonts.body, fontSize: 14,
    color: Colors.textSecondary, lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center', color: Colors.textTertiary,
    fontFamily: Fonts.mono, marginTop: 40, fontSize: 13,
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
});
