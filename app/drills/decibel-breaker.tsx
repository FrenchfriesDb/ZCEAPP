import GlassButton from '@/components/GlassButton';
import GlassCard from '@/components/GlassCard';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { useTimeColors } from '@/hooks/useTimeColors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const TEXT_PASSAGES = [
  "I've never met someone who could command a room just by standing in it. But that's exactly what you do.",
  "The way people talk about you when you're not around says everything. You've built a reputation for actually knowing what you're talking about.",
  "Most people break under pressure. You seem to get more dangerous the higher the stakes go.",
  "Confidence isn't arrogance. It's the absence of self-doubt. And you've mastered it.",
  "The best part about you is that you don't need to prove anything to anyone. You already know.",
];

const DRILL_SECONDS = 5;
const METER_FLOOR = 40;
const METER_CEILING = 95;
const MIN_DBFS = -80;
const SPEECH_GATE_DB = 52;

type DrillStage = 'ready' | 'recording' | 'complete';

const getExpoAudioRecorderClass = (audioMod: any) =>
  audioMod?.AudioRecorder ?? audioMod?.AudioModule?.AudioRecorder ?? null;

let _cachedAudioModule: any | null | undefined;
const loadAudioModule = async () => {
  if (Platform.OS === 'web') return null;
  if (_cachedAudioModule !== undefined) return _cachedAudioModule;
  try {
    _cachedAudioModule = await import('expo-audio');
  } catch {
    _cachedAudioModule = null;
  }
  return _cachedAudioModule;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Convert raw mic dBFS (-80..0) to an estimated speaking loudness scale.
// This remains an estimate (not true SPL), but is much more faithful than linear amplitude mapping.
const dbfsToEstimatedDb = (dbfs: number) => {
  const clampedDbfs = clamp(dbfs, MIN_DBFS, 0);
  const normalized = (clampedDbfs - MIN_DBFS) / Math.abs(MIN_DBFS);
  const weighted = Math.pow(normalized, 0.62);
  return METER_FLOOR + weighted * (METER_CEILING - METER_FLOOR);
};

const meteringToEstimatedDb = (metering?: number) => {
  if (typeof metering !== 'number' || !Number.isFinite(metering)) return METER_FLOOR;
  return dbfsToEstimatedDb(metering);
};

const webAmplitudeToEstimatedDb = (amplitude: number) => {
  const clamped = clamp(amplitude, 0.00001, 1);
  const dbfs = 20 * Math.log10(clamped);
  return dbfsToEstimatedDb(dbfs);
};

const robustAverage = (samples: number[]) => {
  if (samples.length === 0) return METER_FLOOR;
  const sorted = [...samples].sort((a, b) => a - b);
  const trim = Math.floor(sorted.length * 0.1);
  const start = trim;
  const end = sorted.length - trim;
  const core = end > start ? sorted.slice(start, end) : sorted;
  return core.reduce((sum, value) => sum + value, 0) / core.length;
};

const getDbQuality = (db: number) => {
  if (db >= 72) return { label: 'excellent', xp: 18 };
  if (db >= 64) return { label: 'good', xp: 15 };
  return { label: 'needs improvement', xp: 12 };
};

const getPerformanceSummary = (db: number) => {
  if (db >= 72) {
    return 'Elite projection. Strong, clear, and room-commanding delivery.';
  }
  if (db >= 64) {
    return 'Solid projection. Keep pushing from the diaphragm for more presence.';
  }
  return 'Your volume is still holding back. Drive more air and finish louder.';
};

export default function DecibelBreakerDrill() {
  const { completeDrill } = useUser();
  const { palette: timePalette } = useTimeColors();
  const systemColor = timePalette[timePalette.length - 1];

  const [passageIdx, setPassageIdx] = useState(0);
  const [stage, setStage] = useState<DrillStage>('ready');
  const [recordingTime, setRecordingTime] = useState(0);
  const currentPassage = TEXT_PASSAGES[passageIdx] || TEXT_PASSAGES[0] || 'Project your voice with confidence.';
  const [currentDb, setCurrentDb] = useState(METER_FLOOR);
  const [peakDb, setPeakDb] = useState(METER_FLOOR);
  const [averageDb, setAverageDb] = useState(METER_FLOOR);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);

  const recorderRef = useRef<any>(null);
  const meterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbSamplesRef = useRef<number[]>([]);
  const voicedSamplesRef = useRef<number[]>([]);

  const webStreamRef = useRef<MediaStream | null>(null);
  const webAudioContextRef = useRef<AudioContext | null>(null);
  const webAnalyserRef = useRef<AnalyserNode | null>(null);
  const webSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setPassageIdx(Math.floor(Math.random() * TEXT_PASSAGES.length));
  }, []);

  useEffect(() => {
    return () => {
      stopAllTimers();
      cleanupNativeRecorder();
      cleanupWebAudio();
    };
  }, []);

  const displayDb = stage === 'complete' ? averageDb : currentDb;
  const performanceSummary = useMemo(() => getPerformanceSummary(averageDb), [averageDb]);
  const meterPercent = useMemo(
    () => ((displayDb - METER_FLOOR) / (METER_CEILING - METER_FLOOR)) * 100,
    [displayDb]
  );

  function stopAllTimers() {
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }

  function cleanupWebAudio() {
    webMediaRecorderRef.current = null;
    webSourceRef.current?.disconnect?.();
    webSourceRef.current = null;
    webAnalyserRef.current = null;
    webStreamRef.current?.getTracks().forEach((track) => track.stop());
    webStreamRef.current = null;
    if (webAudioContextRef.current) {
      webAudioContextRef.current.close().catch(() => {});
      webAudioContextRef.current = null;
    }
  }

  async function cleanupNativeRecorder() {
    if (recorderRef.current) {
      try { await recorderRef.current.stop?.(); } catch {}
      recorderRef.current = null;
    }
    const Audio = await loadAudioModule();
    if (!Audio) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch {}
  }

  const resetRunState = () => {
    stopAllTimers();
    dbSamplesRef.current = [];
    voicedSamplesRef.current = [];
    setRecordingTime(0);
    setCurrentDb(METER_FLOOR);
    setPeakDb(METER_FLOOR);
    setAverageDb(METER_FLOOR);
    setVoiceUri(null);
  };

  const pushDbSample = (nextDb: number) => {
    dbSamplesRef.current.push(nextDb);
    if (nextDb >= SPEECH_GATE_DB) voicedSamplesRef.current.push(nextDb);
    const peak = Math.max(...dbSamplesRef.current);
    const sourceForAverage = voicedSamplesRef.current.length >= 5 ? voicedSamplesRef.current : dbSamplesRef.current;
    const avg = robustAverage(sourceForAverage);
    setCurrentDb(nextDb);
    setPeakDb(peak);
    setAverageDb(avg);
  };

  const finalizeRun = async (recordingUri?: string | null) => {
    stopAllTimers();
    setRecordingTime(DRILL_SECONDS);
    if (recordingUri) setVoiceUri(recordingUri);
    setStage('complete');
  };

  const startNativeMeteringLoop = (recorder: any) => {
    meterIntervalRef.current = setInterval(() => {
      const status = recorder.getStatus?.();
      const nextTime = Math.min(DRILL_SECONDS, Math.floor((status?.durationMillis ?? 0) / 1000));
      setRecordingTime(nextTime);
      pushDbSample(meteringToEstimatedDb(status?.metering));
    }, 120);
  };

  const finishNativeRecording = async () => {
    if (!recorderRef.current) return;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    try {
      await recorder.stop();
    } catch {}
    const uri = recorder.uri ?? null;
    await cleanupNativeRecorder();
    await finalizeRun(uri);
  };

  const startWebMeteringLoop = () => {
    const analyser = webAnalyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.fftSize);
    meterIntervalRef.current = setInterval(() => {
      analyser.getByteTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i += 1) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);
      pushDbSample(webAmplitudeToEstimatedDb(rms * 3.2));
      setRecordingTime((prev) => Math.min(DRILL_SECONDS, prev + 0.12));
    }, 120);
  };

  const finishWebRecording = async () => {
    stopAllTimers();
    try {
      webMediaRecorderRef.current?.stop();
    } catch {}
  };

  const handleStartRecording = async () => {
    resetRunState();

    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextCtor =
          (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
        if (!AudioContextCtor) {
          throw new Error('This browser does not support live audio metering.');
        }

        const audioContext = new AudioContextCtor();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        webStreamRef.current = stream;
        webAudioContextRef.current = audioContext;
        webAnalyserRef.current = analyser;
        webSourceRef.current = source;
        webChunksRef.current = [];

        const mimeType = typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
          ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
          : '';
        const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) webChunksRef.current.push(event.data);
        };
        mediaRecorder.onstop = async () => {
          const blob = new Blob(webChunksRef.current, { type: mimeType || webChunksRef.current[0]?.type || 'audio/webm' });
          const uri = URL.createObjectURL(blob);
          cleanupWebAudio();
          await finalizeRun(uri);
        };
        mediaRecorder.start();
        webMediaRecorderRef.current = mediaRecorder;

        setStage('recording');
        startWebMeteringLoop();
        stopTimeoutRef.current = setTimeout(() => {
          void finishWebRecording();
        }, DRILL_SECONDS * 1000);
        return;
      } catch (err: any) {
        console.error('[DecibelBreaker] Web record error:', err);
        Alert.alert('Mic Error', err?.message ?? 'Unable to access the browser microphone.');
        return;
      }
    }

    try {
      const Audio = await loadAudioModule();
      if (!Audio) {
        throw new Error('expo-audio is unavailable in this runtime.');
      }

      const { granted } = await Audio.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Mic Permission Needed', 'Allow microphone access in Settings.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      const RecorderClass = getExpoAudioRecorderClass(Audio);
      if (typeof RecorderClass !== 'function') {
        throw new Error('expo-audio recorder API is missing from this runtime.');
      }

      const options = {
        ...Audio.RecordingPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      };
      const recorder = new RecorderClass(options);
      await recorder.prepareToRecordAsync();
      recorder.record();
      recorderRef.current = recorder;

      setStage('recording');
      startNativeMeteringLoop(recorder);
      stopTimeoutRef.current = setTimeout(() => {
        void finishNativeRecording();
      }, DRILL_SECONDS * 1000);
    } catch (err: any) {
      console.error('[DecibelBreaker] Native record error:', err);
      Alert.alert('Mic Error', err?.message ?? 'Unable to start microphone metering.');
    }
  };

  const handleComplete = async () => {
    try {
      const resultDb = averageDb;
      const { label, xp } = getDbQuality(resultDb);
      await completeDrill(xp);
      Alert.alert(
        'VOLUME PROJECTED',
        `Live mic input tracked. Avg ${Math.round(resultDb)} dB, peak ${Math.round(peakDb)} dB. ${label}. +${xp} XP awarded.`,
        [
          { text: 'FINISH SESSION', onPress: () => router.replace('/') },
          {
            text: 'NEXT REP',
            onPress: () => {
              resetRunState();
              setStage('ready');
              setPassageIdx(Math.floor(Math.random() * TEXT_PASSAGES.length));
            },
          },
        ]
      );
    } catch (err) {
      console.error('Drill completion error:', err);
    }
  };

  const handleNextRep = () => {
    resetRunState();
    setStage('ready');
    setPassageIdx(Math.floor(Math.random() * TEXT_PASSAGES.length));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={Colors.gradientDark} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Text style={styles.backText}>← EXIT</Text>
        </Pressable>
        <Text style={[styles.title, { color: systemColor }]}>DECIBEL BREAKER</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.infoCard}>
          <Text style={styles.infoLabel}>THE PROBLEM:</Text>
          <Text style={styles.infoText}>
            Your voice gets soft. You mumble. People ask you to repeat yourself. Time to project from the diaphragm like your life depends on it.
          </Text>
        </GlassCard>

        {stage === 'ready' && (
          <>
            <GlassCard style={[styles.passageCard, { borderColor: systemColor + '44' }]}>
              <Text style={styles.passageLabel}>READ THIS ALOUD (LOUD):</Text>
              <Text style={[styles.passageText, { color: '#FFFFFF' }]}>
                {currentPassage}
              </Text>
            </GlassCard>

            <GlassCard style={styles.rulesCard}>
              <Text style={styles.rulesLabel}>RULES:</Text>
              <Text style={styles.rulesText}>
                • Speak from your diaphragm, not your throat{'\n'}
                • Project like you're talking to the back of a theater{'\n'}
                • No mumbling. Every word crisp and strong.{'\n'}
                • Uses live mic metering. Numbers are device-estimated, not lab-calibrated SPL.
              </Text>
            </GlassCard>

            <GlassButton
              label="START RECORDING"
              onPress={handleStartRecording}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        {stage === 'recording' && (
          <>
            <GlassCard style={[styles.passageCard, { borderColor: systemColor + '44', backgroundColor: 'rgba(113, 195, 247, 0.03)' }]}>
              <Text style={styles.passageLabel}>READ ALOUD:</Text>
              <Text style={[styles.passageText, { color: '#FFFFFF' }]}>
                {currentPassage}
              </Text>
            </GlassCard>

            <GlassCard style={styles.recordingCard}>
              <Text style={[styles.recordingText, { color: '#FF4444' }]}>● RECORDING</Text>
              <Text style={styles.recordingDesc}>Speak clearly. Project from diaphragm. {Math.min(DRILL_SECONDS, Math.floor(recordingTime))}s / {DRILL_SECONDS}s</Text>
            </GlassCard>

            <GlassCard style={styles.meterCard}>
              <Text style={styles.meterLabel}>LIVE INPUT LEVEL</Text>
              <Text style={styles.dbValue}>{Math.round(currentDb)} dB</Text>
              <View style={styles.meterBar}>
                <View
                  style={[
                    styles.meterFill,
                    {
                      width: `${clamp(meterPercent, 0, 100)}%`,
                      backgroundColor: currentDb > 72 ? '#00FF00' : currentDb > 64 ? '#FFD700' : '#FF6B6B',
                    },
                  ]}
                />
              </View>
              <View style={styles.meterLabels}>
                <Text style={styles.meterMin}>40 dB</Text>
                <Text style={styles.meterMid}>65 dB TARGET</Text>
                <Text style={styles.meterMax}>95 dB</Text>
              </View>
              <Text style={styles.liveStats}>Peak {Math.round(peakDb)} dB</Text>
            </GlassCard>
          </>
        )}

        {stage === 'complete' && (
          <>
            <GlassCard style={styles.completeCard}>
              <Text style={styles.completeTitle}>VOLUME LOCKED ✓</Text>
              <Text style={styles.dbDisplay}>{Math.round(averageDb)} dB</Text>
              <Text style={styles.completeSub}>PEAK {Math.round(peakDb)} dB</Text>
              <Text style={styles.completeText}>
                {performanceSummary}
              </Text>
            </GlassCard>

            <GlassButton
              label="SAVE REP"
              onPress={handleComplete}
              tint="blue"
              size="lg"
              glow
              style={{ width: '100%' }}
            />

            <GlassButton
              label="NEXT REP"
              onPress={handleNextRep}
              tint="dark"
              size="md"
              glow
              style={{ width: '100%' }}
            />
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 44,
    marginBottom: 4,
  },
  backBtn: { padding: 8, minWidth: 60 },
  backText: { color: '#FFFFFF', fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1 },
  title: { flex: 1, fontFamily: Fonts.heading, fontSize: 16, letterSpacing: 3, textAlign: 'center' },

  scrollContent: { padding: Spacing.md, alignItems: 'center', gap: 12, paddingBottom: 10 },

  infoCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  infoLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6 },
  infoText: { fontFamily: Fonts.nunito, fontSize: 13, color: '#FFFFFF', lineHeight: 20 },

  passageCard: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1 },
  passageLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 10 },
  passageText: { fontFamily: Fonts.nunito, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  rulesCard: { width: '100%', padding: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  rulesLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  rulesText: { fontFamily: Fonts.nunito, fontSize: 12, color: '#FFFFFF', lineHeight: 18 },

  recordingCard: { width: '100%', padding: 20, alignItems: 'center', backgroundColor: 'rgba(255, 68, 68, 0.05)', borderColor: 'rgba(255, 68, 68, 0.2)', borderWidth: 1 },
  recordingText: { fontFamily: Fonts.heading, fontSize: 24, marginBottom: 8 },
  recordingDesc: { fontFamily: Fonts.nunito, fontSize: 13, color: '#FFFFFF', textAlign: 'center' },

  meterCard: { width: '100%', padding: 16, backgroundColor: 'rgba(255,255,255,0.02)' },
  meterLabel: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 8 },
  dbValue: { fontFamily: Fonts.heading, fontSize: 28, color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  meterBar: { width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  meterFill: { height: '100%', borderRadius: 6 },
  meterLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  meterMin: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)' },
  meterMid: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)' },
  meterMax: { fontFamily: Fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.3)' },
  liveStats: { fontFamily: Fonts.nunitoSemi, fontSize: 12, color: '#FFFFFF', textAlign: 'center', marginTop: 12 },

  completeCard: { width: '100%', padding: 20, backgroundColor: 'rgba(0, 245, 255, 0.05)', borderColor: 'rgba(0, 245, 255, 0.2)', borderWidth: 1 },
  completeTitle: { fontFamily: Fonts.heading, fontSize: 18, color: Colors.accentCyan, marginBottom: 12, textAlign: 'center' },
  dbDisplay: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.accentCyan, marginBottom: 6, textAlign: 'center' },
  completeSub: { fontFamily: Fonts.monoBold, fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  completeText: { fontFamily: Fonts.nunito, fontSize: 13, color: '#FFFFFF', lineHeight: 20, textAlign: 'center' },
});
