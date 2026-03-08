import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Modal, TextInput, KeyboardAvoidingView, Platform, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '@/constants/theme';
import XPBar from '@/components/XPBar';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import MentorEntity from '@/components/MentorEntity';
import { useUser } from '@/context/UserContext';

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
  { id: 'dm_stranger', icon: '🔥', title: 'COLD OPEN STRANGER', xp: 10 },
  { id: 'dm_eyelock', icon: '👁️', title: 'EYE-LOCK: BLINK FIRST = LOSE', xp: 10 },
  { id: 'dm_compliment', icon: '💣', title: 'DROP BOLD COMPLIMENT', xp: 10 },
  { id: 'dm_roast', icon: '🤜', title: 'BRUTAL ROAST (FRIEND)', xp: 10 },
  { id: 'dm_group', icon: '⚡', title: 'INFILTRATE COLD GROUP', xp: 10 },
  { id: 'dm_command', icon: '👑', title: 'COMMAND ROOM 60S', xp: 10 },
  { id: 'dm_flip', icon: '🔄', title: 'FRAME FLIP DEFENSIVE LINE', xp: 10 },
  { id: 'dm_joke', icon: '🎭', title: 'EXTRACT 3 LAUGHS', xp: 10 },
  { id: 'dm_reject', icon: '🛡️', title: 'HUNT REJECTION', xp: 10 },
  { id: 'dm_lead', icon: '🎤', title: 'SEIZE CONVERSATIONAL REINS', xp: 10 },
  { id: 'dm_story', icon: '🔮', title: 'HOOK AUDIENCE: 60S STORY', xp: 10 },
  { id: 'dm_confront', icon: '⚔️', title: 'ASSERT RAW TRUTH', xp: 10 },
];

const QUEST_POOL = [
  { id: 'q_mirror', icon: '🪞', title: '5-MIN MIRROR SIEGE', xp: 10 },
  { id: 'q_record', icon: '🎥', title: 'RECORD & AUDIT VOICE', xp: 10 },
  { id: 'q_cold', icon: '🥶', title: 'COLD SHOWER DISCIPLINE', xp: 10 },
  { id: 'q_posture', icon: '💪', title: 'CLAIM YOUR SPACE: 1HR POSTURE', xp: 10 },
  { id: 'q_nofiller', icon: '🤐', title: 'ZERO FILLER WORDS: 1HR', xp: 10 },
  { id: 'q_villain', icon: '👹', title: 'DRAFT YOUR VILLAIN ARC', xp: 10 },
  { id: 'q_dominate', icon: '🏆', title: 'LIST 3 DOMINANCE REPS', xp: 10 },
  { id: 'q_silence', icon: '📵', title: 'SILENCE THE NOISE: 2HR OFFLINE', xp: 10 },
  { id: 'q_journal', icon: '📓', title: 'RAW OPERATION JOURNAL', xp: 10 },
  { id: 'q_breath', icon: '🌬️', title: 'BOX BREATHING: 4-4-4-4', xp: 10 },
  { id: 'q_shadow', icon: '🌑', title: 'SHADOW WORK: FACE FEAR', xp: 10 },
  { id: 'q_meditate', icon: '🧘', title: 'SILENCE WATCHER: 10M SIEGE', xp: 10 },
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
  const { user, completeQuest, resetQuests, recoverStreak } = useUser();
  const [roastIndex, setRoastIndex] = useState(() => Math.floor(Math.random() * ROASTS.length));
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * ZANE_QUOTES.length));
  const fadeAnim = useRef(new Animated.Value(1)).current;


  const [dailyMissions, setDailyMissions] = useState<any[]>(() => pick8(DAILY_MISSION_POOL));
  const [fieldQuests, setFieldQuests] = useState<any[]>(() => pick8(QUEST_POOL));
  const [modalVisible, setModalVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemLog, setItemLog] = useState('');
  const [historyTab, setHistoryTab] = useState<'drills' | 'journal'>('drills');
  const [recoveryVisible, setRecoveryVisible] = useState(false);
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');

  // Roast rotation with fade
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setRoastIndex(prev => (prev + 1) % ROASTS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);





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
  }, [allDailyDone]);

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

  const claimItem = async () => {
    if (!selectedItem) return;
    await completeQuest(selectedItem.id, selectedItem.xp, itemLog);
    setModalVisible(false);
    setItemLog('');
    setSelectedItem(null);
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
    return (
      <Pressable
        onPress={() => handlePress(item)}
        disabled={isDone}
        style={({ pressed }) => [{ opacity: isDone ? 0.4 : pressed ? 0.85 : 1 }, { marginBottom: 10 }]}
      >
        <View style={[styles.missionCard, isDone && styles.missionCardDone]}>
          <BlurView intensity={16} tint="dark" style={StyleSheet.absoluteFill} />
          {/* Left accent bar */}
          <View style={[styles.missionAccentBar, isDone && { backgroundColor: '#00F5FF', opacity: 1 }]} />

          {/* Icon badge */}
          <View style={[styles.missionIconBadge, isDone && styles.missionIconBadgeDone]}>
            <Text style={[styles.missionIcon, isDone && { color: '#00F5FF' }]}>{isDone ? '✓' : item.icon}</Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.missionTitle, isDone && styles.missionTitleDone]}>
              {item.title.toUpperCase()}
            </Text>
            <Text style={styles.missionId}>ID_{item.id.toUpperCase()}</Text>
          </View>

          {/* XP pill */}
          <View style={[styles.xpPill, isDone && { backgroundColor: 'rgba(0, 245, 255, 0.1)', borderColor: 'rgba(0, 245, 255, 0.2)' }]}>
            <Text style={[styles.xpPillText, isDone && { color: '#00F5FF' }]}>
              {isDone ? 'DONE' : `+${item.xp}`}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  // ── SECTION HEADER ───────────────────────────────────────────────────────────
  const SectionHeader = ({ title, done, onReboot, count, total }: {
    title: string; done: boolean; onReboot: () => void; count: number; total: number;
  }) => (
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

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

      {/* No Neural Grid Overlay - Reverted to clean version */}


      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header — Clean Spacing */}
        <View style={styles.header}>
          {/* XP Bar moved below hero streak */}
        </View>

        <View style={styles.heroSection}>
          <View style={styles.heroStreakWrapper}>
            <Text style={[
              styles.heroNumber,
              (user?.streakAtRisk && streakCount > 0) && { color: Colors.accentDanger, textShadowColor: 'rgba(255, 68, 68, 0.3)' }
            ]}>
              {streakCount}
            </Text>
            <Text style={[
              styles.heroUnit,
              (user?.streakAtRisk && streakCount > 0) && { color: Colors.accentDanger, opacity: 1 }
            ]}>
              {(user?.streakAtRisk && streakCount > 0) ? 'REPAIR REQUIRED' : 'DAY STREAK'}
            </Text>
          </View>

          <Text style={styles.welcomeText}>
            Welcome back, {user?.name || 'Agent'}.
          </Text>


          {/* XP Progression — Directly below streak as requested */}
          <View style={styles.heroXPContainer}>
            <XPBar currentXP={user?.xp || 0} />
            <Text style={styles.xpSubLabel} numberOfLines={1} adjustsFontSizeToFit>
              CHARISMA ENGINE // PROGRESSION {user?.xp || 0} XP TOTAL
            </Text>
          </View>
        </View>



        {/* ═══ PRIMARY CTA ═══ */}
        <View>
          <GlassButton
            label="Talk to Zane"
            onPress={() => router.push('/chat')}
            size="lg"
            tint="blue"
            variant="pill"
            glow
            style={{ width: '100%' }}
          />
        </View>

        {/* ═══ ZANE ROAST OF THE DAY ═══ */}
        <Pressable
          onPress={() => setRoastIndex((roastIndex + 1) % ROASTS.length)}
          style={styles.roastCard}
        >
          <View style={styles.roastHeader}>
            <Text style={styles.roastLabel}>🔥 ZANE'S ROAST</Text>
            <Text style={styles.roastTap}>tap to refresh</Text>
          </View>
          <Text style={styles.roastCardText}>“{ROASTS[roastIndex]}”</Text>
        </Pressable>

        {/* ═══ DAILY QUOTE ═══ */}
        <Pressable
          onPress={() => setQuoteIndex((quoteIndex + 1) % ZANE_QUOTES.length)}
          style={styles.quoteCard}
        >
          <View style={styles.quoteHeader}>
            <Text style={styles.quoteLabel}>⚡ DAILY QUOTE</Text>
            <Text style={styles.quoteTap}>tap to refresh</Text>
          </View>
          <Text style={styles.quoteTextMain}>“{ZANE_QUOTES[quoteIndex]}”</Text>
          <Text style={styles.quoteAttr}>— Zane × Goggins Engine</Text>
        </Pressable>

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
            <Text style={styles.archivesBtnIcon}>📂</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.archivesBtnTitle}>Archives</Text>
              <Text style={styles.archivesBtnSub}>Training logs, mission journals, Zane entries</Text>
            </View>
            <Text style={styles.archivesBtnArrow}>→</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* ── CLAIM MODAL ── */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContentWrapper}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>MISSION LOG</Text>
              <Text style={styles.modalSub}>{selectedItem?.title}</Text>
              <Text style={styles.modalLabel}>HOW DID IT GO?</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Briefly log the interaction..."
                placeholderTextColor={Colors.textTertiary}
                value={itemLog}
                onChangeText={setItemLog}
                multiline
              />
              <View style={styles.modalButtons}>
                <GlassButton
                  label="CANCEL"
                  onPress={() => setModalVisible(false)}
                  tint="dark"
                  size="md"
                  style={{ flex: 1 }}
                />
                <GlassButton
                  label={`CLAIM +${selectedItem?.xp} XP`}
                  onPress={claimItem}
                  tint="blue"
                  size="md"
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
    </View>
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
    color: 'rgba(255,255,255,0.4)',
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
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
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
    fontFamily: Fonts.monoBold,
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
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    fontStyle: 'italic',
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
    fontFamily: Fonts.monoBold,
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
  archivesBtnIcon: { fontSize: 24 },
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
    gap: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingRight: 14,
    marginBottom: 8,
  },
  missionCardDone: {
    borderColor: 'rgba(255,255,255,0.15)',
  },
  missionAccentBar: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#00F5FF',
    opacity: 0.6,
  },
  missionIconBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionIconBadgeDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  missionIcon: {
    fontSize: 16,
    color: '#00F5FF',
  },
  missionTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  missionTitleDone: {
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  missionId: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  xpPill: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  xpPillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: '#00F5FF',
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
    color: '#00F5FF',
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
    backgroundColor: 'rgba(0, 245, 255, 0.12)',
    borderColor: '#00F5FF',
  },
  historyTabText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11, color: Colors.textSecondary, letterSpacing: 2,
  },
  historyTabTextActive: { color: '#00F5FF' },
  historyList: { padding: Spacing.xl, gap: 14, paddingBottom: 120 },
  logCard: { borderRadius: Radius.lg },
  logTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  logType: {
    fontFamily: Fonts.monoBold,
    fontSize: 11, color: '#00F5FF', letterSpacing: 2,
  },
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
});
