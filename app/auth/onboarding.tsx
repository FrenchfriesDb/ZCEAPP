import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Pressable, Animated,
    Dimensions, ScrollView, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, G, Circle, Line, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { useUser } from '@/context/UserContext';

const { width: W, height: H } = Dimensions.get('window');
const CYAN = '#00E5FF';

// ─── Wireframe Head ───────────────────────────────────────────────────────────
function WireframeHead({ stage }: { stage: number }) {
    const pulse = useRef(new Animated.Value(1)).current;
    const scanY = useRef(new Animated.Value(0)).current;
    const circuitOp = useRef(new Animated.Value(0)).current;
    const eyeOp = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.05, duration: 1800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
            ])
        ).start();
        Animated.loop(
            Animated.timing(scanY, { toValue: 1, duration: 2400, useNativeDriver: false })
        ).start();
    }, []);

    useEffect(() => {
        if (stage >= 2) {
            Animated.timing(circuitOp, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        }
        if (stage >= 3) {
            Animated.timing(eyeOp, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }).start();
        }
    }, [stage]);

    const scanLineY = scanY.interpolate({ inputRange: [0, 1], outputRange: [40, 220] });
    const scanOp = scanY.interpolate({ inputRange: [0, 0.05, 0.95, 1], outputRange: [0, 0.8, 0.8, 0] });

    return (
        <Animated.View style={{ transform: [{ scale: pulse }], alignItems: 'center' }}>
            <Svg width={200} height={260} viewBox="0 0 200 260">
                <Defs>
                    <SvgGrad id="hg" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={Colors.accentPrimary} stopOpacity="0.9" />
                        <Stop offset="1" stopColor={CYAN} stopOpacity="0.4" />
                    </SvgGrad>
                </Defs>
                {/* Outer glow */}
                <Path d="M100,35 C145,35 175,70 175,125 C175,175 148,225 100,230 C52,225 25,175 25,125 C25,70 55,35 100,35 Z"
                    stroke={Colors.accentPrimary} strokeWidth="3" fill="none" strokeOpacity="0.06" />
                {/* Head outline */}
                <Path d="M100,40 C140,40 170,72 170,122 C170,172 142,220 100,224 C58,220 30,172 30,122 C30,72 60,40 100,40 Z"
                    stroke="url(#hg)" strokeWidth="1.2" fill="none" strokeOpacity="0.8" />
                {/* Grid */}
                {[80, 100, 120, 140, 160, 180, 200].map((y, i) => (
                    <Line key={`h${i}`} x1="30" y1={y} x2="170" y2={y} stroke={Colors.accentPrimary} strokeOpacity="0.06" strokeWidth="0.5" />
                ))}
                {[55, 75, 100, 125, 145].map((x, i) => (
                    <Line key={`v${i}`} x1={x} y1="42" x2={x} y2="222" stroke={Colors.accentPrimary} strokeOpacity="0.06" strokeWidth="0.5" />
                ))}
                {/* Jaw */}
                <Path d="M65,200 Q100,228 135,200" stroke={Colors.accentPrimary} strokeWidth="0.8" fill="none" strokeOpacity="0.5" />
                {/* Nose */}
                <Path d="M95,130 L90,155 L100,160 L110,155 L105,130" stroke={Colors.accentPrimary} strokeWidth="0.7" fill="none" strokeOpacity="0.4" />
                {/* Eyes */}
                <Path d="M62,108 C70,100 80,98 90,104 C80,112 70,112 62,108 Z" stroke={Colors.accentPrimary} strokeWidth="1" fill="none" strokeOpacity="0.85" />
                <Path d="M138,108 C130,100 120,98 110,104 C120,112 130,112 138,108 Z" stroke={Colors.accentPrimary} strokeWidth="1" fill="none" strokeOpacity="0.85" />
                <Circle cx="76" cy="105" r="2" stroke={Colors.accentPrimary} strokeWidth="0.8" fill="none" strokeOpacity="0.6" />
                <Circle cx="124" cy="105" r="2" stroke={Colors.accentPrimary} strokeWidth="0.8" fill="none" strokeOpacity="0.6" />
                {/* Mouth */}
                <Path d={stage >= 3 ? "M78,172 Q100,185 122,172" : "M80,172 Q100,180 120,172"}
                    stroke={stage >= 3 ? CYAN : Colors.accentPrimary}
                    strokeWidth={stage >= 3 ? "1.5" : "0.9"} fill="none" strokeOpacity="0.8" />
                {/* Circuits stage 2+ */}
                {stage >= 2 && (
                    <G opacity={1}>
                        <Path d="M100,40 L100,70 M76,105 L55,105 L55,88 M124,105 L145,105 L145,88"
                            stroke={CYAN} strokeWidth="0.8" fill="none" strokeOpacity="0.85" />
                        <Circle cx="100" cy="40" r="2" fill={CYAN} />
                        <Circle cx="55" cy="88" r="1.5" fill={CYAN} />
                        <Circle cx="145" cy="88" r="1.5" fill={CYAN} />
                    </G>
                )}
                {/* Glowing eyes stage 3 */}
                {stage >= 3 && (
                    <G>
                        <Circle cx="76" cy="105" r="5" fill={CYAN} fillOpacity="0.9" />
                        <Circle cx="124" cy="105" r="5" fill={CYAN} fillOpacity="0.9" />
                        <Circle cx="76" cy="105" r="10" fill={CYAN} fillOpacity="0.12" />
                        <Circle cx="124" cy="105" r="10" fill={CYAN} fillOpacity="0.12" />
                    </G>
                )}
            </Svg>
            {/* Animated scan line overlay — simple View, no SVG nesting */}
            <Animated.View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    { justifyContent: 'flex-start', overflow: 'hidden' },
                ]}
            >
                <Animated.View style={{
                    position: 'absolute',
                    left: 15, right: 15,
                    height: 1,
                    backgroundColor: CYAN,
                    opacity: scanOp,
                    transform: [{ translateY: scanLineY }],
                }} />
            </Animated.View>
        </Animated.View>
    );
}

// ─── Terminal Line ────────────────────────────────────────────────────────────
function TerminalLine({ text, delay, color }: { text: string; delay: number; color?: string }) {
    const op = useRef(new Animated.Value(0)).current;
    const ty = useRef(new Animated.Value(6)).current;
    useEffect(() => {
        const t = setTimeout(() => {
            Animated.parallel([
                Animated.timing(op, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.timing(ty, { toValue: 0, duration: 350, useNativeDriver: true }),
            ]).start();
        }, delay);
        return () => clearTimeout(t);
    }, []);
    return (
        <Animated.View style={{ opacity: op, transform: [{ translateY: ty }] }}>
            <Text style={[styles.termLine, color ? { color } : {}]}>{text}</Text>
        </Animated.View>
    );
}

// ─── Option Button ────────────────────────────────────────────────────────────
function OptionBtn({ label, icon, selected, onPress }: {
    label: string; icon: string; selected: boolean; onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={styles.optPressable}>
            <View style={[styles.optBtn, selected && styles.optBtnActive]}>
                <Text style={styles.optIcon}>{icon}</Text>
                <Text style={[styles.optText, selected && styles.optTextActive]} numberOfLines={2}>{label}</Text>
                {selected && <Text style={styles.optCheck}>◆</Text>}
            </View>
        </Pressable>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
    const { setOnboardingData, completeOnboarding } = useUser();
    const [stage, setStage] = useState(1);
    const [stageKey, setStageKey] = useState(0);
    const [mission, setMission] = useState({ level: '', goal: '', commitment: '' });

    const pageOp = useRef(new Animated.Value(1)).current;
    const pageTy = useRef(new Animated.Value(0)).current;
    const btnGlow = useRef(new Animated.Value(0.7)).current;
    const glowOp = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(btnGlow, { toValue: 1, duration: 1400, useNativeDriver: true }),
            Animated.timing(btnGlow, { toValue: 0.65, duration: 1400, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
            Animated.timing(glowOp, { toValue: 0.9, duration: 2400, useNativeDriver: true }),
            Animated.timing(glowOp, { toValue: 0.4, duration: 2400, useNativeDriver: true }),
        ])).start();
    }, []);

    const advance = () => {
        Animated.parallel([
            Animated.timing(pageOp, { toValue: 0, duration: 220, useNativeDriver: true }),
            Animated.timing(pageTy, { toValue: -24, duration: 220, useNativeDriver: true }),
        ]).start(() => {
            pageTy.setValue(24);
            setStage(s => s + 1);
            setStageKey(k => k + 1);
            Animated.parallel([
                Animated.timing(pageOp, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.timing(pageTy, { toValue: 0, duration: 280, useNativeDriver: true }),
            ]).start();
        });
    };

    const handleNext = async () => {
        if (stage === 2) setOnboardingData({ level: mission.level || 'NPC', goal: mission.goal || 'General' });
        if (stage < 3) { advance(); } else { await completeOnboarding(); router.replace('/auth/signup'); }
    };

    const handleSkip = async () => {
        setOnboardingData({ level: 'NPC', goal: 'General' });
        await completeOnboarding();
        router.replace('/auth/signup');
    };

    const canProceed = mission.level && mission.goal && mission.commitment;

    return (
        <View style={styles.root}>
            <LinearGradient colors={['#000005', '#04040E', '#080818']} style={StyleSheet.absoluteFill} />

            {/* Ambient glow blobs */}
            <Animated.View style={[styles.blob, { top: -100, left: -60, opacity: glowOp }]} />
            <Animated.View style={[styles.blob, { bottom: -80, right: -60, backgroundColor: 'rgba(0,229,255,0.07)', opacity: glowOp }]} />

            {/* Neon grid overlay */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <Line key={`gc${i}`} x1={i * (W / 8)} y1={0} x2={i * (W / 8)} y2={H}
                            stroke={Colors.accentPrimary} strokeOpacity="0.04" strokeWidth="1" />
                    ))}
                    {Array.from({ length: 16 }).map((_, i) => (
                        <Line key={`gr${i}`} x1={0} y1={i * 60} x2={W} y2={i * 60}
                            stroke={Colors.accentPrimary} strokeOpacity="0.04" strokeWidth="1" />
                    ))}
                    <Path d="M0,0 L50,0 M0,0 L0,50" stroke={CYAN} strokeOpacity="0.35" strokeWidth="1" />
                    <Path d={`M${W},0 L${W - 50},0 M${W},0 L${W},50`} stroke={CYAN} strokeOpacity="0.35" strokeWidth="1" />
                </Svg>
            </View>

            <SafeAreaView style={styles.safe}>
                {/* Top bar */}
                <View style={styles.topBar}>
                    <View style={styles.dotsRow}>
                        {[1, 2, 3].map(n => (
                            <View key={n} style={[styles.dot, stage === n && styles.dotActive]} />
                        ))}
                    </View>
                    <Pressable onPress={handleSkip} style={styles.skipBtn}>
                        <Text style={styles.skipText}>Skip → login</Text>
                    </Pressable>
                </View>

                {/* Head */}
                <View style={styles.headArea}>
                    <WireframeHead stage={stage} />
                    <View style={styles.scanBadge}>
                        <Text style={[styles.scanBadgeText, stage >= 3 && { color: CYAN }]}>
                            {stage === 1 ? 'SCANNING . . .' : stage === 2 ? 'CONFIRM MISSION' : 'UPGRADE COMPLETE'}
                        </Text>
                    </View>
                </View>

                {/* Stage content */}
                <Animated.View key={stageKey}
                    style={[styles.content, { opacity: pageOp, transform: [{ translateY: pageTy }] }]}>

                    {/* ── STAGE 1 ── */}
                    {stage === 1 && (
                        <View style={styles.stageBox}>
                            <View style={styles.termBlock}>
                                <TerminalLine text="> Scanning environment..." delay={0} color="rgba(74,158,255,0.45)" />
                                <TerminalLine text="> Frame detected." delay={700} />
                                <TerminalLine text="> Weakness: visible." delay={1400} />
                                <TerminalLine text="> You just plugged into the Z.A.N.E. Engine." delay={2100} color={CYAN} />
                                <TerminalLine text="> No excuses allowed after this point." delay={2800} color="#FF6B6B" />
                            </View>
                            <Text style={styles.versionTag}>ZCE — Confidence Engine v1.0  ·  FRAME INJECTION READY</Text>
                            <Animated.View style={{ width: '100%', opacity: btnGlow }}>
                                <Pressable onPress={handleNext} style={styles.ctaBtn}>
                                    <LinearGradient colors={[Colors.accentPrimary, CYAN]}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaInner}>
                                        <Text style={styles.ctaText}>INITIATE UPGRADE</Text>
                                        <Text style={styles.ctaArrow}>→</Text>
                                    </LinearGradient>
                                </Pressable>
                            </Animated.View>
                        </View>
                    )}

                    {/* ── STAGE 2 ── */}
                    {stage === 2 && (
                        <ScrollView style={styles.scrollFlex}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled">
                            <Text style={styles.intakeTitle}>BEFORE WE ARM YOU —</Text>
                            <Text style={styles.intakeSub}>Confirm your mission.</Text>

                            <View style={styles.qBlock}>
                                <Text style={styles.qLabel}>▸ CURRENT SOCIAL LEVEL?</Text>
                                {[
                                    { label: 'NPC  —  invisible, freeze often', icon: '👻' },
                                    { label: 'Side Character  —  okay but forgettable', icon: '🎭' },
                                    { label: 'Lead  —  already decent, want elite', icon: '⚡' },
                                ].map(o => (
                                    <OptionBtn key={o.label} label={o.label} icon={o.icon}
                                        selected={mission.level === o.label}
                                        onPress={() => setMission(m => ({ ...m, level: o.label }))} />
                                ))}
                            </View>

                            <View style={styles.qBlock}>
                                <Text style={styles.qLabel}>▸ PRIMARY MISSION?</Text>
                                {[
                                    { label: 'Kill social anxiety', icon: '🎯' },
                                    { label: 'Dating / attraction game', icon: '🔥' },
                                    { label: 'School / leadership presence', icon: '👑' },
                                    { label: 'Stop being average', icon: '⚔️' },
                                ].map(o => (
                                    <OptionBtn key={o.label} label={o.label} icon={o.icon}
                                        selected={mission.goal === o.label}
                                        onPress={() => setMission(m => ({ ...m, goal: o.label }))} />
                                ))}
                            </View>

                            <View style={styles.qBlock}>
                                <Text style={styles.qLabel}>▸ HOW LONG ARE YOU GOING ALL-IN?</Text>
                                {[
                                    { label: '30 days  —  prove it', icon: '⏱️' },
                                    { label: '90 days  —  I\'m serious', icon: '📅' },
                                    { label: 'Forever  —  done being soft', icon: '∞' },
                                ].map(o => (
                                    <OptionBtn key={o.label} label={o.label} icon={o.icon}
                                        selected={mission.commitment === o.label}
                                        onPress={() => setMission(m => ({ ...m, commitment: o.label }))} />
                                ))}
                            </View>

                            <Pressable onPress={handleNext}
                                style={[styles.ctaBtn, !canProceed && { opacity: 0.38 }]}
                                disabled={!canProceed}>
                                <LinearGradient colors={[Colors.accentPrimary, CYAN]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaInner}>
                                    <Text style={styles.ctaText}>LOCK MISSION</Text>
                                    <Text style={styles.ctaArrow}>→</Text>
                                </LinearGradient>
                            </Pressable>
                            <View style={{ height: 32 }} />
                        </ScrollView>
                    )}

                    {/* ── STAGE 3 ── */}
                    {stage === 3 && (
                        <View style={styles.stageBox}>
                            <View style={styles.frameBadge}>
                                <Text style={styles.frameBadgeText}>FRAME ACCEPTED</Text>
                            </View>
                            <View style={styles.termBlock}>
                                <TerminalLine text="> Mission locked." delay={100} color={CYAN} />
                                <TerminalLine text="> Daily reps required." delay={600} />
                                <TerminalLine text="> Miss a day = streak dies." delay={1100} color="#FF6B6B" />
                                <TerminalLine text="> No participation trophies." delay={1600} color="#FF6B6B" />
                                <TerminalLine text="> Welcome to the Engine." delay={2300} color={CYAN} />
                                <TerminalLine text="> You are no longer allowed to be average." delay={3000} />
                            </View>
                            <Pressable onPress={handleNext} style={styles.ctaBtn}>
                                <LinearGradient colors={[CYAN, Colors.accentPrimary]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaInner}>
                                    <Text style={styles.ctaText}>ENTER THE ENGINE</Text>
                                    <Text style={styles.ctaArrow}>→</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    )}
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.bgPrimary },
    safe: { flex: 1 },

    blob: {
        position: 'absolute', width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(96, 165, 250, 0.05)',
    },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
    },
    dotsRow: { flexDirection: 'row', gap: 10, flex: 1, justifyContent: 'center' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
    dotActive: { width: 22, borderRadius: 3, backgroundColor: Colors.accentPrimary },
    skipBtn: { position: 'absolute', right: 20, paddingVertical: 6, paddingHorizontal: 10 },
    skipText: { fontFamily: Fonts.mono, color: Colors.textTertiary, fontSize: 10, textDecorationLine: 'underline', letterSpacing: 1 },

    headArea: { alignItems: 'center', paddingVertical: 12 },
    scanBadge: {
        marginTop: 10, borderWidth: 1, borderColor: 'rgba(96, 165, 250, 0.2)',
        paddingHorizontal: 16, paddingVertical: 5, borderRadius: 8,
        backgroundColor: 'rgba(96, 165, 250, 0.04)',
    },
    scanBadgeText: { fontFamily: Fonts.monoBold, fontSize: 9, color: Colors.accentPrimary, letterSpacing: 3, fontWeight: '700' },

    content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

    stageBox: { gap: 24, paddingBottom: 40 },

    termBlock: { gap: 12, minHeight: 140 },
    termLine: { fontFamily: Fonts.mono, color: Colors.textSecondary, fontSize: 13, letterSpacing: 0.5, lineHeight: 22 },
    versionTag: { fontFamily: Fonts.mono, color: Colors.textTertiary, fontSize: 8, letterSpacing: 2, opacity: 0.6 },

    ctaBtn: {
        width: '100%', borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    ctaInner: {
        paddingVertical: 18, paddingHorizontal: 28,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    },
    ctaText: { fontFamily: Fonts.heading, color: '#fff', fontSize: 14, letterSpacing: 2.5, fontWeight: '800' },
    ctaArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '800' },

    scrollFlex: { flex: 1 },
    scrollContent: { gap: 24, paddingBottom: 40 },
    intakeTitle: { fontFamily: Fonts.heading, color: Colors.textPrimary, fontSize: 24, letterSpacing: 1, fontWeight: '800' },
    intakeSub: { fontFamily: Fonts.monoBold, color: Colors.accentPrimary, fontSize: 10, letterSpacing: 3, marginTop: -12, textTransform: 'uppercase' },

    qBlock: { gap: 10 },
    qLabel: { fontFamily: Fonts.mono, color: Colors.textTertiary, fontSize: 9, letterSpacing: 2, marginBottom: 4, fontWeight: '600' },
    optPressable: { width: '100%' },
    optBtn: {
        width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 16, borderRadius: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    optBtnActive: { borderColor: Colors.accentPrimary, backgroundColor: 'rgba(96, 165, 250, 0.08)' },
    optIcon: { fontSize: 18, opacity: 0.9 },
    optText: { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 14, flex: 1, fontWeight: '500' },
    optTextActive: { color: Colors.textPrimary, fontWeight: '700' },
    optCheck: { color: Colors.accentPrimary, fontSize: 12, fontWeight: '800' },

    frameBadge: {
        alignSelf: 'center', borderWidth: 1, borderColor: Colors.accentPrimary,
        paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8,
        backgroundColor: 'rgba(96, 165, 250, 0.06)',
        marginBottom: 10,
    },
    frameBadgeText: { fontFamily: Fonts.monoBold, color: Colors.accentPrimary, fontSize: 10, letterSpacing: 4, fontWeight: '800' },
});
