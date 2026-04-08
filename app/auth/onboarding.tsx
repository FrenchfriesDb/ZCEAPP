import FluentEmoji, { resolveFluentEmojiName, type FluentEmojiName } from '@/components/FluentEmoji';
import GlassButton from '@/components/GlassButton';
import { Fonts } from '@/constants/theme';
import { useSubscription } from '@/context/SubscriptionContext';
import { useUser } from '@/context/UserContext';
import { PaymentService } from '@/services/payments';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import RevenueCatUI from 'react-native-purchases-ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, Path, Stop, LinearGradient as SvgGrad } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const CYAN = '#333333';
const ACCENT = '#333333';
const PAYWALL_OFFERING_ID = 'ZCE PRO';
const ONBOARDING_PROGRESS_STEPS = [1, 2, 3, 4, 5, 6] as const;

// ─── Wireframe Head ───────────────────────────────────────────────────────────
function WireframeHead({ stage, compact = false }: { stage: number; compact?: boolean }) {
    const pulse = useRef(new Animated.Value(1)).current;
    const scanY = useRef(new Animated.Value(0)).current;
    const circuitOp = useRef(new Animated.Value(0)).current;
    const eyeOp = useRef(new Animated.Value(0)).current;
    const svgWidth = compact ? 156 : 200;
    const svgHeight = compact ? 200 : 260;
    const scanStart = compact ? 30 : 40;
    const scanEnd = compact ? 165 : 220;

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

    const scanLineY = scanY.interpolate({ inputRange: [0, 1], outputRange: [scanStart, scanEnd] });
    const scanOp = scanY.interpolate({ inputRange: [0, 0.05, 0.95, 1], outputRange: [0, 0.8, 0.8, 0] });

    return (
        <Animated.View style={{ transform: [{ scale: pulse }], alignItems: 'center' }}>
            <Svg width={svgWidth} height={svgHeight} viewBox="0 0 200 260">
                <Defs>
                    <SvgGrad id="hg" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
                        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.4" />
                    </SvgGrad>
                </Defs>
                {/* Outer glow */}
                <Path d="M100,35 C145,35 175,70 175,125 C175,175 148,225 100,230 C52,225 25,175 25,125 C25,70 55,35 100,35 Z"
                    stroke="#FFFFFF" strokeWidth="3" fill="none" strokeOpacity="0.08" />
                {/* Head outline */}
                <Path d="M100,40 C140,40 170,72 170,122 C170,172 142,220 100,224 C58,220 30,172 30,122 C30,72 60,40 100,40 Z"
                    stroke="url(#hg)" strokeWidth="1.2" fill="none" strokeOpacity="0.8" />
                {/* Grid */}
                {[80, 100, 120, 140, 160, 180, 200].map((y, i) => (
                    <Line key={`h${i}`} x1="30" y1={y} x2="170" y2={y} stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="0.5" />
                ))}
                {[55, 75, 100, 125, 145].map((x, i) => (
                    <Line key={`v${i}`} x1={x} y1="42" x2={x} y2="222" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="0.5" />
                ))}
                {/* Jaw */}
                <Path d="M65,200 Q100,228 135,200" stroke="#FFFFFF" strokeWidth="0.8" fill="none" strokeOpacity="0.5" />
                {/* Nose */}
                <Path d="M95,130 L90,155 L100,160 L110,155 L105,130" stroke="#FFFFFF" strokeWidth="0.7" fill="none" strokeOpacity="0.4" />
                {/* Eyes */}
                <Path d="M62,108 C70,100 80,98 90,104 C80,112 70,112 62,108 Z" stroke="#FFFFFF" strokeWidth="1" fill="none" strokeOpacity="0.85" />
                <Path d="M138,108 C130,100 120,98 110,104 C120,112 130,112 138,108 Z" stroke="#FFFFFF" strokeWidth="1" fill="none" strokeOpacity="0.85" />
                <Circle cx="76" cy="105" r="2" stroke="#FFFFFF" strokeWidth="0.8" fill="none" strokeOpacity="0.6" />
                <Circle cx="124" cy="105" r="2" stroke="#FFFFFF" strokeWidth="0.8" fill="none" strokeOpacity="0.6" />
                {/* Mouth */}
                <Path d={stage >= 3 ? "M78,172 Q100,185 122,172" : "M80,172 Q100,180 120,172"}
                    stroke={stage >= 3 ? "#FFFFFF" : "#FFFFFF"}
                    strokeWidth={stage >= 3 ? "1.5" : "0.9"} fill="none" strokeOpacity="0.8" />
                {/* Circuits stage 2+ */}
                {stage >= 2 && (
                    <G opacity={1}>
                        <Path d="M100,40 L100,70 M76,105 L55,105 L55,88 M124,105 L145,105 L145,88"
                            stroke="#FFFFFF" strokeWidth="0.8" fill="none" strokeOpacity="0.85" />
                        <Circle cx="100" cy="40" r="2" fill="#FFFFFF" />
                        <Circle cx="55" cy="88" r="1.5" fill="#FFFFFF" />
                        <Circle cx="145" cy="88" r="1.5" fill="#FFFFFF" />
                    </G>
                )}
                {/* Glowing eyes stage 3 */}
                {stage >= 3 && (
                    <G>
                        <Circle cx="76" cy="105" r="5" fill="#FFFFFF" fillOpacity="0.9" />
                        <Circle cx="124" cy="105" r="5" fill="#FFFFFF" fillOpacity="0.9" />
                        <Circle cx="76" cy="105" r="10" fill="#FFFFFF" fillOpacity="0.12" />
                        <Circle cx="124" cy="105" r="10" fill="#FFFFFF" fillOpacity="0.12" />
                    </G>
                )}
            </Svg>
            {/* Animated scan line overlay — constrained to head bounds */}
            <Animated.View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: svgHeight,
                    justifyContent: 'flex-start',
                    overflow: 'hidden',
                }}
            >
                <Animated.View style={{
                    position: 'absolute',
                    left: 15, right: 15,
                    height: 1,
                    backgroundColor: '#333333',
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
    const fluentName = resolveFluentEmojiName(icon);
    return (
        <Pressable onPress={onPress} style={styles.optPressable}>
            {({ pressed }) => (
                <View style={[styles.optBtn, selected && styles.optBtnActive, pressed && styles.optBtnPressed]}>
                    {fluentName ? (
                        <FluentEmoji name={fluentName} size={20} style={styles.optIconImage} />
                    ) : (
                        <Text style={[styles.optIcon]}>{icon}</Text>
                    )}
                    <Text style={[styles.optText, selected && styles.optTextActive]} numberOfLines={2}>{label}</Text>
                    {selected && <Text style={styles.optCheck}>◆</Text>}
                </View>
            )}
        </Pressable>
    );
}

function AnimatedEmojiRail({ stage, compact = false }: { stage: number; compact?: boolean }) {
    const STAGE_EMOJI_MAP: Record<number, FluentEmojiName[]> = {
        1: ['movieCamera', 'barChart', 'megaphone', 'eyes', 'brain', 'highVoltage'],
        2: ['ghost', 'performingArts', 'highVoltage', 'bullseye', 'speakingHead', 'catFace'],
        3: ['bullseye', 'fire', 'crown', 'crossedSwords', 'brain', 'gemStone'],
        4: ['stopwatch', 'calendar', 'infinity', 'warning', 'foldedHands', 'wing'],
        5: ['star', 'crown', 'highVoltage', 'gemStone', 'redHeart', 'dizzy'],
        6: ['idButton', 'locked', 'mirror', 'notebook', 'label', 'bustInSilhouette'],
        7: ['locked', 'warning', 'skullAndCrossbones', 'eyes', 'rightFacingFist', 'personInLotusPosition'],
    };
    const stageIcons = STAGE_EMOJI_MAP[stage] ?? STAGE_EMOJI_MAP[1];
    const icons = compact ? stageIcons.slice(0, 4) : stageIcons;

    const motions = useRef(Array.from({ length: 10 }, () => new Animated.Value(0))).current;

    useEffect(() => {
        const loops = motions.slice(0, icons.length).map((motion, idx) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(idx * 90),
                    Animated.timing(motion, { toValue: 1, duration: 1400, useNativeDriver: true }),
                    Animated.timing(motion, { toValue: 0, duration: 1400, useNativeDriver: true }),
                ])
            )
        );
        loops.forEach(loop => loop.start());
        return () => loops.forEach(loop => loop.stop());
    }, [motions, icons.length, stage]);

    return (
        <View style={[styles.emojiRail, compact && styles.emojiRailCompact]}>
            {icons.map((name, idx) => {
                const translateY = motions[idx].interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
                const scale = motions[idx].interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
                const opacity = motions[idx].interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
                return (
                    <Animated.View
                        key={`${name}-${idx}`}
                        style={[styles.emojiRailItem, { transform: [{ translateY }, { scale }], opacity }]}
                    >
                        <FluentEmoji name={name} size={compact ? 20 : 26} />
                    </Animated.View>
                );
            })}
        </View>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
    const { signUp, signIn, setOnboardingData, onboardingData, completeOnboarding, returnToOnboardingStage, setReturnToOnboardingStage } = useUser();
    const {
        isRevenueCatAvailable,
        isLoading: billingLoading,
        lastError: billingError,
        purchaseSubscription,
        restorePurchases,
        refreshEntitlements,
    } = useSubscription();
    const [stage, setStage] = useState(1);
    const [stageKey, setStageKey] = useState(1);

    // When user swipes back from login/signup, restore the auth stage (6 or 7) instead of showing stage 1
    useFocusEffect(
        React.useCallback(() => {
            if (returnToOnboardingStage === 6 || returnToOnboardingStage === 7) {
                setStage(returnToOnboardingStage);
                setStageKey(k => k + 1);
                setReturnToOnboardingStage(null);
            }
        }, [returnToOnboardingStage, setReturnToOnboardingStage])
    );
    const [mission, setMission] = useState({ level: '', goal: '', commitment: '' });
    const [pageOp] = useState(new Animated.Value(1));
    const [pageTy] = useState(new Animated.Value(0));
    const [gestureX] = useState(new Animated.Value(0));

    // Auth form states
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [selectionError, setSelectionError] = useState('');
    const [paywallSelectionError, setPaywallSelectionError] = useState('');
    const [selectedPaywallPlan, setSelectedPaywallPlan] = useState<'monthly' | 'yearly' | null>(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [paywallOffering, setPaywallOffering] = useState<any | null>(null);
    const { height: windowHeight } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const isPhysicalDevice = Constants.isDevice ?? true;
    const isPaywallStage = stage === 5;
    const progressStage = Math.min(stage, ONBOARDING_PROGRESS_STEPS.length);
    const hasNativeRevenueCatUi = PaymentService.isRevenueCatUiSupported();
    const compactLayout = windowHeight < 860;
    const compactAuthStage = windowHeight < 780;
    const veryCompactLayout = windowHeight < 740;
    const showHead = !isPaywallStage && stage < 6;
    const showEmojiRail = stage >= 1 && stage <= 4;

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

    useEffect(() => {
        let active = true;

        const loadOffering = async () => {
            if (!isRevenueCatAvailable || !hasNativeRevenueCatUi) {
                if (active) setPaywallOffering(null);
                return;
            }

            try {
                const offering =
                    (await PaymentService.getOfferingByIdentifier(PAYWALL_OFFERING_ID)) ||
                    (await PaymentService.getCurrentOffering());
                if (active) setPaywallOffering(offering);
            } catch {
                if (active) setPaywallOffering(null);
            }
        };

        void loadOffering();
        return () => {
            active = false;
        };
    }, [isRevenueCatAvailable, hasNativeRevenueCatUi]);
    const showNativePaywall = isPaywallStage && isPhysicalDevice && isRevenueCatAvailable && hasNativeRevenueCatUi && !!paywallOffering;

    const handleFallbackPaywallContinue = async () => {
        if (!selectedPaywallPlan) {
            setPaywallSelectionError('Select a plan or choose Continue Free.');
            return;
        }

        setPaywallSelectionError('');
        const upgraded = await purchaseSubscription(selectedPaywallPlan);
        await refreshEntitlements();
        if (upgraded) {
            Alert.alert('ZCE PRO ACTIVATED', 'Director access unlocked. Let\'s move.');
            setStage(6);
            setStageKey(k => k + 1);
        }
    };

    const handleFallbackRestore = async () => {
        setPaywallSelectionError('');
        const restored = await restorePurchases();
        await refreshEntitlements();
        if (restored) {
            Alert.alert('RESTORE COMPLETE', 'ZCE PRO restored on this account.');
            setStage(6);
            setStageKey(k => k + 1);
        } else {
            Alert.alert('Restore Complete', 'No active Pro entitlement was found for this account.');
        }
    };

    const advance = () => {
        if (isWeb) {
            setStage(s => s + 1);
            setStageKey(k => k + 1);
            return;
        }

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
        if (stage === 2 && !mission.level) {
            setSelectionError('Select a social level to continue.');
            return;
        }
        if (stage === 3 && !mission.goal) {
            setSelectionError('Select your primary objective to continue.');
            return;
        }
        if (stage === 4 && !mission.commitment) {
            setSelectionError('Select your commitment window to continue.');
            return;
        }
        setSelectionError('');

        if (stage === 7) {
            // Complete onboarding and go to main app
            setOnboardingData({ 
                level: mission.level || 'NPC', 
                goal: mission.goal || 'General',
                commitment: mission.commitment || '30 days'
            });
            await completeOnboarding();
            router.replace('/(tabs)');
        } else {
            advance();
        }
    };

    const handleSkip = async () => {
        setOnboardingData({ level: 'NPC', goal: 'General', commitment: '30 days' });
        setStage(5);
        setStageKey(k => k + 1);
    };

    const handleBack = () => {
        if (stage > 1) {
            if (isWeb) {
                setStage(s => s - 1);
                setStageKey(k => k + 1);
                return;
            }

            Animated.parallel([
                Animated.timing(pageOp, { toValue: 0, duration: 220, useNativeDriver: true }),
                Animated.timing(pageTy, { toValue: 24, duration: 220, useNativeDriver: true }),
            ]).start(() => {
                pageTy.setValue(-24);
                setStage(s => s - 1);
                setStageKey(k => k + 1);
                Animated.parallel([
                    Animated.timing(pageOp, { toValue: 1, duration: 280, useNativeDriver: true }),
                    Animated.timing(pageTy, { toValue: 0, duration: 280, useNativeDriver: true }),
                ]).start();
            });
        }
    };

    const canProceed = () => {
        if (stage === 2) return !!mission.level;
        if (stage === 3) return !!mission.goal;
        if (stage === 4) return !!mission.commitment;
        // Stages 5, 6, 7 can always proceed (they have their own navigation)
        return true;
    };

    useEffect(() => {
        if (stage !== 5 || showNativePaywall) return;

        const reason = !isPhysicalDevice
            ? 'Native RevenueCat checkout needs a physical iPhone, not Simulator.'
            : !isRevenueCatAvailable
                ? 'RevenueCat billing is not configured/available in this build.'
                : !hasNativeRevenueCatUi
                    ? 'RevenueCat native paywall module is missing in this build.'
                    : 'RevenueCat paywall is unavailable right now.';

        Alert.alert('Paywall Unavailable', `${reason} Continuing setup.`);
        setStage(6);
        setStageKey(k => k + 1);
    }, [stage, showNativePaywall, isPhysicalDevice, isRevenueCatAvailable, hasNativeRevenueCatUi]);

    const content = (
        <View style={styles.root}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />

            {/* Ambient glow blobs - white only */}
            <Animated.View style={[styles.blob, { top: -100, left: -60, opacity: glowOp }]} />
            <Animated.View style={[styles.blob, { bottom: -80, right: -60, backgroundColor: 'rgba(255,255,255,0.03)', opacity: glowOp }]} />

            {/* Grid overlay - white lines */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <Line key={`gc${i}`} x1={i * (W / 8)} y1={0} x2={i * (W / 8)} y2={H}
                            stroke="#FFFFFF" strokeOpacity="0.03" strokeWidth="1" />
                    ))}
                    {Array.from({ length: 16 }).map((_, i) => (
                        <Line key={`gr${i}`} x1={0} y1={i * 60} x2={W} y2={i * 60}
                            stroke="#FFFFFF" strokeOpacity="0.03" strokeWidth="1" />
                    ))}
                    <Path d="M0,0 L50,0 M0,0 L0,50" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />
                    <Path d={`M${W},0 L${W - 50},0 M${W},0 L${W},50`} stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />
                </Svg>
            </View>

            <SafeAreaView style={styles.safe}>
                {/* Top bar */}
                {!isPaywallStage && <View style={styles.topBar}>
                    <View style={styles.topSide}>
                        {stage > 1 ? (
                            <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
                                <Text style={styles.backText}>←</Text>
                            </Pressable>
                        ) : (
                            <View style={styles.sideSpacer} />
                        )}
                    </View>
                    <View style={styles.topCenter}>
                        {ONBOARDING_PROGRESS_STEPS.map(n => (
                            <View key={n} style={[styles.dot, progressStage === n && styles.dotActive]} />
                        ))}
                    </View>
                    <View style={[styles.topSide, { alignItems: 'flex-end' }]}>
                        {stage < 6 ? (
                            <Pressable onPress={handleSkip} style={({ pressed }) => [styles.skipBtn, pressed && styles.skipBtnPressed]}>
                                <Text style={styles.skipText}>SKIP →</Text>
                            </Pressable>
                        ) : (
                            <View style={styles.sideSpacer} />
                        )}
                    </View>
                </View>}

                {/* Head */}
                {showHead && <View style={[styles.headArea, compactLayout && styles.headAreaCompact, veryCompactLayout && styles.headAreaVeryCompact]}>
                    <WireframeHead stage={stage} compact={compactLayout} />
                    <View style={styles.scanBadge}>
                        <Text style={[styles.scanBadgeText, stage >= 5 && { color: CYAN }]}>
                            {stage === 1 ? 'SCANNING . . .' : 
                             stage === 5 ? 'ZCE PRO PLAN' : 
                             stage === 6 ? 'CREATE IDENTITY' :
                             stage === 7 ? 'ACCESS RESTRICTED' :
                             'CONFIRM MISSION'}
                        </Text>
                    </View>
                    {showEmojiRail && <AnimatedEmojiRail stage={stage} compact={veryCompactLayout} />}
                </View>}

                {/* Stage content - scrollable to prevent overlap and overflow */}
                <Animated.View key={stageKey}
                    style={[
                        styles.content,
                        isPaywallStage && styles.paywallFullContent,
                        veryCompactLayout && styles.contentVeryCompact,
                        isWeb
                            ? { opacity: 1, transform: [{ translateY: 0 }] }
                            : { opacity: pageOp, transform: [{ translateY: pageTy }] },
                    ]}> 

                    {/* ── STAGE 1 ── */}
                    {stage === 1 && (
                        <ScrollView
                            style={styles.scrollFlex}
                            contentContainerStyle={styles.scrollContentCentered}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled">
                        <View style={styles.stageBox}>
                            <View style={styles.termBlock}>
                                <TerminalLine text="> Scanning environment..." delay={0} color="rgba(255,255,255,0.5)" />
                                <TerminalLine text="> Frame detected." delay={700} />
                                <TerminalLine text="> Weakness: visible." delay={1400} />
                                <TerminalLine text="> You just plugged into the Z.A.N.E. Engine." delay={2100} color="#FFFFFF" />
                                <TerminalLine text="> No excuses allowed after this point." delay={2800} color="rgba(255,255,255,0.7)" />
                            </View>
                            <Text style={styles.versionTag}>ZCE — Confidence Engine v1.0  ·  FRAME INJECTION READY</Text>
                            <Animated.View style={{ width: '100%', opacity: btnGlow }}>
                                <Pressable onPress={handleNext} style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}>
                                    <View style={styles.ctaInner}>
                                        <Text style={styles.ctaText}>INITIATE UPGRADE</Text>
                                        <Text style={styles.ctaArrow}>→</Text>
                                    </View>
                                </Pressable>
                            </Animated.View>
                        </View>
                        </ScrollView>
                    )}

                    {/* ── STAGE 2: SOCIAL LEVEL ── */}
                    {stage === 2 && (
                        <ScrollView
                            style={styles.scrollFlex}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled">
                            <Text style={styles.intakeTitle}>BEFORE WE ARM YOU —</Text>
                            <Text style={styles.intakeSub}>Select your current social level.</Text>

                            <View style={styles.qBlock}>
                                <Text style={styles.qLabel}>▸ CURRENT SOCIAL LEVEL?</Text>
                                {[
                                    { label: 'NPC  —  invisible, freeze often', icon: '👻' },
                                    { label: 'Side Character  —  okay but forgettable', icon: '🎭' },
                                    { label: 'Lead  —  already decent, want elite', icon: '⚡' },
                                ].map(o => (
                                    <OptionBtn key={o.label} label={o.label} icon={o.icon}
                                        selected={mission.level === o.label}
                                        onPress={() => {
                                            setMission(m => ({ ...m, level: o.label }));
                                            setSelectionError('');
                                        }} />
                                ))}
                            </View>
                            {!!selectionError && (
                                <View style={styles.selectionErrorRow}>
                                    <FluentEmoji name="warning" size={14} />
                                    <Text style={styles.selectionErrorText}>{selectionError}</Text>
                                </View>
                            )}

                            <Pressable onPress={handleNext}
                                style={({ pressed }) => [styles.ctaBtn, !canProceed() && { opacity: 0.82 }, pressed && styles.ctaBtnPressed]}>
                                <View style={styles.ctaInner}>
                                    <Text style={styles.ctaText}>CONFIRM LEVEL</Text>
                                    <Text style={styles.ctaArrow}>→</Text>
                                </View>
                            </Pressable>
                        </ScrollView>
                    )}

                    {/* ── STAGE 3: PRIMARY MISSION ── */}
                    {stage === 3 && (
                        <ScrollView
                            style={styles.scrollFlex}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled">
                            <Text style={styles.intakeTitle}>PRIMARY MISSION —</Text>
                            <Text style={styles.intakeSub}>What are you here to fix?</Text>

                            <View style={styles.qBlock}>
                                <Text style={styles.qLabel}>▸ SELECT YOUR OBJECTIVE</Text>
                                {[
                                    { label: 'Kill social anxiety', icon: '🎯' },
                                    { label: 'Dating / attraction game', icon: '🔥' },
                                    { label: 'School / leadership presence', icon: '👑' },
                                    { label: 'Stop being average', icon: '⚔️' },
                                ].map(o => (
                                    <OptionBtn key={o.label} label={o.label} icon={o.icon}
                                        selected={mission.goal === o.label}
                                        onPress={() => {
                                            setMission(m => ({ ...m, goal: o.label }));
                                            setSelectionError('');
                                        }} />
                                ))}
                            </View>
                            {!!selectionError && (
                                <View style={styles.selectionErrorRow}>
                                    <FluentEmoji name="warning" size={14} />
                                    <Text style={styles.selectionErrorText}>{selectionError}</Text>
                                </View>
                            )}

                            <Pressable onPress={handleNext}
                                style={({ pressed }) => [styles.ctaBtn, !canProceed() && { opacity: 0.82 }, pressed && styles.ctaBtnPressed]}>
                                <View style={styles.ctaInner}>
                                    <Text style={styles.ctaText}>LOCK OBJECTIVE</Text>
                                    <Text style={styles.ctaArrow}>→</Text>
                                </View>
                            </Pressable>
                        </ScrollView>
                    )}

                    {/* ── STAGE 4: COMMITMENT DURATION ── */}
                    {stage === 4 && (
                        <ScrollView
                            style={styles.scrollFlex}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled">
                            <Text style={styles.intakeTitle}>HOW LONG ALL IN? —</Text>
                            <Text style={styles.intakeSub}>Commit to the grind.</Text>

                            <View style={styles.qBlock}>
                                <Text style={styles.qLabel}>▸ SELECT COMMITMENT</Text>
                                {[
                                    { label: '30 days  —  prove it', icon: '⏱️' },
                                    { label: '90 days  —  I\'m serious', icon: '📅' },
                                    { label: 'Forever  —  done being soft', icon: '∞' },
                                ].map(o => (
                                    <OptionBtn key={o.label} label={o.label} icon={o.icon}
                                        selected={mission.commitment === o.label}
                                        onPress={() => {
                                            setMission(m => ({ ...m, commitment: o.label }));
                                            setSelectionError('');
                                        }} />
                                ))}
                            </View>
                            {!!selectionError && (
                                <View style={styles.selectionErrorRow}>
                                    <FluentEmoji name="warning" size={14} />
                                    <Text style={styles.selectionErrorText}>{selectionError}</Text>
                                </View>
                            )}

                            <Pressable onPress={handleNext}
                                style={({ pressed }) => [styles.ctaBtn, !canProceed() && { opacity: 0.82 }, pressed && styles.ctaBtnPressed]}>
                                <View style={styles.ctaInner}>
                                    <Text style={styles.ctaText}>LOCK COMMITMENT</Text>
                                    <Text style={styles.ctaArrow}>→</Text>
                                </View>
                            </Pressable>
                        </ScrollView>
                    )}

                    {/* ── STAGE 5: ZCE PRO PAYWALL ── */}
                    {stage === 5 && (
                        <View style={styles.paywallStageWrap}>
                            {showNativePaywall && (
                                <View style={styles.nativePaywallStage}>
                                    <RevenueCatUI.Paywall
                                        options={{ offering: paywallOffering }}
                                        displayCloseButton
                                        onPurchaseCompleted={() => {
                                            Alert.alert('ZCE PRO ACTIVATED', 'Director access unlocked. Let\'s move.');
                                            void refreshEntitlements();
                                            setStage(6);
                                            setStageKey(k => k + 1);
                                        }}
                                        onDismiss={() => {
                                            setStage(6);
                                            setStageKey(k => k + 1);
                                            void refreshEntitlements();
                                        }}
                                    />
                                </View>
                            )}
                            {!showNativePaywall && (
                                <ScrollView
                                    style={styles.scrollFlex}
                                    contentContainerStyle={styles.webPaywallScrollContent}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <View style={styles.webPaywallWrap}>
                                        <Text style={styles.webPaywallEyebrow}>ZCE PRO UNLOCK</Text>
                                        <Text style={styles.webPaywallTitle}>CHOOSE YOUR PLAN</Text>
                                        <Text style={styles.webPaywallSubtitle}>
                                            Pick Monthly or Yearly. Or continue free and upgrade later from Settings.
                                        </Text>

                                        <View style={styles.webPlansRow}>
                                            <Pressable
                                                onPress={() => {
                                                    setSelectedPaywallPlan('monthly');
                                                    setPaywallSelectionError('');
                                                }}
                                                style={[
                                                    styles.webPlanCard,
                                                    selectedPaywallPlan === 'monthly' && styles.webPlanCardSelected,
                                                ]}
                                            >
                                                <Text style={styles.webPlanName}>MONTHLY</Text>
                                                <Text style={styles.webPlanPrice}>$9.99</Text>
                                                <Text style={styles.webPlanMeta}>Cancel anytime</Text>
                                                {selectedPaywallPlan === 'monthly' && (
                                                    <Text style={styles.webPlanSelectedTag}>SELECTED</Text>
                                                )}
                                            </Pressable>

                                            <Pressable
                                                onPress={() => {
                                                    setSelectedPaywallPlan('yearly');
                                                    setPaywallSelectionError('');
                                                }}
                                                style={[
                                                    styles.webPlanCard,
                                                    styles.webPlanCardFeatured,
                                                    selectedPaywallPlan === 'yearly' && styles.webPlanCardSelected,
                                                ]}
                                            >
                                                <Text style={styles.webPlanName}>YEARLY</Text>
                                                <Text style={styles.webPlanPrice}>$59.99</Text>
                                                <Text style={[styles.webPlanMeta, styles.webPlanFeaturedText]}>Best value</Text>
                                                {selectedPaywallPlan === 'yearly' && (
                                                    <Text style={styles.webPlanSelectedTag}>SELECTED</Text>
                                                )}
                                            </Pressable>
                                        </View>

                                        {!!paywallSelectionError && (
                                            <View style={styles.selectionErrorRow}>
                                                <FluentEmoji name="warning" size={14} />
                                                <Text style={styles.selectionErrorText}>{paywallSelectionError}</Text>
                                            </View>
                                        )}

                                        {!!billingError && (
                                            <View style={styles.selectionErrorRow}>
                                                <FluentEmoji name="warning" size={14} />
                                                <Text style={styles.selectionErrorText}>{billingError}</Text>
                                            </View>
                                        )}

                                        <GlassButton
                                            label={billingLoading ? 'PROCESSING...' : 'CONTINUE'}
                                            onPress={() => { void handleFallbackPaywallContinue(); }}
                                            look="glass"
                                            tint="dark"
                                            size="md"
                                            disabled={billingLoading}
                                            style={styles.paywallGlassButton}
                                        />

                                        <View style={styles.paywallCancelWrap}>
                                            <GlassButton
                                                label="RESTORE PURCHASES"
                                                onPress={() => { void handleFallbackRestore(); }}
                                                look="glass"
                                                tint="dark"
                                                size="sm"
                                                compact
                                                disabled={billingLoading}
                                            />
                                        </View>

                                        <View style={styles.paywallCancelWrap}>
                                            <GlassButton
                                                label="CONTINUE FREE"
                                                onPress={() => {
                                                    setPaywallSelectionError('');
                                                    setStage(6);
                                                    setStageKey(k => k + 1);
                                                }}
                                                look="glass"
                                                tint="dark"
                                                size="sm"
                                                compact
                                                disabled={billingLoading}
                                            />
                                        </View>
                                    </View>
                                </ScrollView>
                            )}
                        </View>
                    )}

                    {/* ── STAGE 6: SIGNUP ── */}
                    {stage === 6 && (
                        <ScrollView
                            style={styles.scrollFlex}
                            contentContainerStyle={[styles.scrollContentCenteredNoScroll, compactAuthStage && styles.scrollContentCenteredNoScrollCompact]}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                        <View style={[styles.stageBox, compactAuthStage && styles.stageBoxCompact]}>
                            <View style={[styles.termBlock, compactAuthStage && styles.termBlockCompact]}>
                                <TerminalLine text="> Creating identity..." delay={0} color="rgba(255,255,255,0.5)" />
                                <TerminalLine text="> Initialize neural signature..." delay={500} color="rgba(255,255,255,0.5)" />
                                <TerminalLine text="> Establish agent credentials..." delay={1000} color="rgba(255,255,255,0.5)" />
                            </View>
                            <View style={[styles.authPrompt, compactAuthStage && styles.authPromptCompact]}>
                                <Text style={[styles.authTitle, compactAuthStage && styles.authTitleCompact]}>CREATE YOUR IDENTITY</Text>
                                <Text style={[styles.authSubtitle, compactAuthStage && styles.authSubtitleCompact]}>Choose your path to enter the system</Text>
                                <Pressable onPress={async () => {
                                    setOnboardingData({
                                        level: mission.level || 'NPC',
                                        goal: mission.goal || 'General',
                                        commitment: mission.commitment || '30 days',
                                    });
                                    await completeOnboarding();
                                    setReturnToOnboardingStage(6);
                                    router.push('/auth/signup');
                                }} style={({ pressed }) => [styles.authBtn, compactAuthStage && styles.authBtnCompact, pressed && styles.authBtnPressed]}>
                                    <Text style={[styles.authBtnText, compactAuthStage && styles.authBtnTextCompact]}>CREATE NEW IDENTITY →</Text>
                                </Pressable>
                                <Pressable onPress={async () => {
                                    setOnboardingData({
                                        level: mission.level || 'NPC',
                                        goal: mission.goal || 'General',
                                        commitment: mission.commitment || '30 days',
                                    });
                                    await completeOnboarding();
                                    setReturnToOnboardingStage(7);
                                    router.push('/auth/login');
                                }} style={({ pressed }) => [styles.authLink, pressed && styles.authLinkPressed]}>
                                    <Text style={styles.authLinkText}>Already have access? Sign In</Text>
                                </Pressable>
                            </View>
                        </View>
                        </ScrollView>
                    )}

                    {/* ── STAGE 7: LOGIN ── */}
                    {stage === 7 && (
                        <ScrollView
                            style={styles.scrollFlex}
                            contentContainerStyle={[styles.scrollContentCenteredNoScroll, compactAuthStage && styles.scrollContentCenteredNoScrollCompact]}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                        <View style={[styles.stageBox, compactAuthStage && styles.stageBoxCompact]}>
                            <View style={[styles.termBlock, compactAuthStage && styles.termBlockCompact]}>
                                <TerminalLine text="> Authenticating agent..." delay={0} color="rgba(255,255,255,0.5)" />
                                <TerminalLine text="> Verifying credentials..." delay={500} color="rgba(255,255,255,0.5)" />
                                <TerminalLine text="> Granting system access..." delay={1000} color="rgba(255,255,255,0.5)" />
                            </View>
                            <View style={[styles.authPrompt, compactAuthStage && styles.authPromptCompact]}>
                                <Text style={[styles.authTitle, compactAuthStage && styles.authTitleCompact]}>ACCESS RESTRICTED</Text>
                                <Text style={[styles.authSubtitle, compactAuthStage && styles.authSubtitleCompact]}>Enter your credentials to proceed</Text>
                                <Pressable onPress={async () => {
                                        setOnboardingData({
                                            level: mission.level || 'NPC',
                                            goal: mission.goal || 'General',
                                            commitment: mission.commitment || '30 days',
                                        });
                                        await completeOnboarding();
                                        setReturnToOnboardingStage(7);
                                        router.push('/auth/login');
                                    }} style={({ pressed }) => [styles.authBtn, compactAuthStage && styles.authBtnCompact, pressed && styles.authBtnPressed]}>
                                    <Text style={[styles.authBtnText, compactAuthStage && styles.authBtnTextCompact]}>SIGN IN →</Text>
                                </Pressable>
                                <Pressable onPress={() => setStage(6)} style={({ pressed }) => [styles.authLink, pressed && styles.authLinkPressed]}>
                                    <Text style={styles.authLinkText}>← Back to Create Identity</Text>
                                </Pressable>
                            </View>
                        </View>
                        </ScrollView>
                    )}
                </Animated.View>
            
        </SafeAreaView>
        </View>
    );

    if (isWeb) {
        return content;
    }

    return (
        <PanGestureHandler
            onGestureEvent={Animated.event([{ nativeEvent: { translationX: gestureX } }], { useNativeDriver: false })}
            onHandlerStateChange={(event) => {
                if (event.nativeEvent.state === State.END) {
                    const { translationX } = event.nativeEvent;
                    // Swipe right (positive translationX) to go back
                    if (translationX > 50 && stage > 1) {
                        handleBack();
                    }
                }
            }}
        >
            <Animated.View style={{ flex: 1 }}>
                {content}
            </Animated.View>
        </PanGestureHandler>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000000' },
    safe: { flex: 1 },

    blob: {
        position: 'absolute', width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 4,
        gap: 10,
    },
    topSide: {
        width: 96,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    topCenter: {
        flexDirection: 'row',
        gap: 10,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sideSpacer: {
        width: 44,
        height: 40,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
    dotActive: { width: 22, borderRadius: 3, backgroundColor: '#FFFFFF' },
    skipBtn: {
        paddingVertical: 8, paddingHorizontal: 10,
        borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0, 212, 255, 0.4)',
        backgroundColor: 'rgba(0, 212, 255, 0.08)',
    },
    skipBtnPressed: { borderColor: 'rgba(0, 212, 255, 0.9)', transform: [{ scale: 0.97 }] },
    skipText: { fontFamily: Fonts.monoBold, color: '#FFFFFF', fontSize: 10, letterSpacing: 1.2, fontWeight: '800' },

    headArea: { alignItems: 'center', paddingVertical: 12, overflow: 'hidden' },
    headAreaCompact: { paddingVertical: 2 },
    headAreaVeryCompact: { paddingVertical: 0 },
    scanBadge: {
        marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 16, paddingVertical: 5, borderRadius: 0,
        backgroundColor: 'rgba(255,255,255,0.03)',
        maxWidth: '90%',
        alignItems: 'center',
    },
    scanBadgeText: { fontFamily: Fonts.monoBold, fontSize: 9, color: '#FFFFFF', letterSpacing: 3, fontWeight: '700', textAlign: 'center' },
    emojiRail: {
        marginTop: 10,
        width: '100%',
        maxWidth: 360,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 8,
    },
    emojiRailCompact: {
        maxWidth: 280,
        gap: 6,
        marginTop: 8,
    },
    emojiRailItem: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 6,
    },

    content: {
        flex: 1,
        minHeight: 0,
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center',
        paddingHorizontal: 24,
    },
    contentVeryCompact: {
        paddingHorizontal: 16,
    },
    paywallFullContent: {
        maxWidth: '100%',
        alignSelf: 'stretch',
        paddingHorizontal: 0,
    },
    scrollContentCentered: {
        flexGrow: 1,
        justifyContent: 'center',
        gap: 24,
        paddingVertical: 16,
        paddingBottom: 40,
    },

    stageBox: { gap: 24, paddingBottom: 40 },
    stageBoxCompact: { gap: 14, paddingBottom: 20 },

    termBlock: { gap: 12, minHeight: 140, width: '100%' },
    termBlockCompact: { minHeight: 96, gap: 8 },
    termLine: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: 0.5, lineHeight: 22, flexShrink: 1 },
    versionTag: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.35)', fontSize: 8, letterSpacing: 2, opacity: 0.6, flexShrink: 1 },

    ctaBtn: {
        width: '100%', borderRadius: 12, overflow: 'hidden',
        borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: 'rgba(255, 255, 255, 0.15)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
    },
    ctaBtnPressed: { borderColor: 'rgba(255, 255, 255, 0.9)', transform: [{ scale: 0.97 }] },
    ctaInner: {
        paddingVertical: 18, paddingHorizontal: 28,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
        backgroundColor: 'transparent',
    },
    ctaText: { fontFamily: Fonts.heading, color: '#FFFFFF', fontSize: 14, letterSpacing: 3, fontWeight: '800', textTransform: 'uppercase' },
    ctaArrow: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

    scrollFlex: { flex: 1 },
    scrollContent: { gap: 24, paddingBottom: 40 },
    scrollContentNoScroll: {
        flex: 1,
        gap: 18,
        justifyContent: 'center',
        paddingBottom: 20,
    },
    scrollContentCenteredNoScroll: {
        flex: 1,
        justifyContent: 'center',
        gap: 20,
        paddingBottom: 20,
    },
    scrollContentCenteredNoScrollCompact: {
        justifyContent: 'flex-start',
        paddingTop: 12,
        paddingBottom: 24,
    },
    intakeTitle: { fontFamily: Fonts.heading, color: '#FFFFFF', fontSize: 22, letterSpacing: 1, fontWeight: '800', flexShrink: 1 },
    intakeSub: { fontFamily: Fonts.monoBold, color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 3, marginTop: -12, textTransform: 'uppercase' },

    qBlock: { gap: 10 },
    qLabel: { fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 2, marginBottom: 4, fontWeight: '600' },
    optPressable: { width: '100%' },
    optBtn: {
        width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 16, borderRadius: 12,
        borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: 'rgba(255, 255, 255, 0.15)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 5,
    },
    optBtnActive: {
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        shadowOpacity: 1,
    },
    optBtnPressed: { borderColor: 'rgba(255, 255, 255, 0.9)', transform: [{ scale: 0.97 }] },
    optIcon: { fontSize: 18, opacity: 0.9, color: '#FFFFFF' },
    optIconImage: { opacity: 0.95 },
    optText: { fontFamily: Fonts.body, color: 'rgba(255,255,255,0.6)', fontSize: 14, flex: 1, flexShrink: 1, minWidth: 0, fontWeight: '500' },
    optTextActive: { color: '#FFFFFF', fontWeight: '700' },
    optCheck: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginLeft: 'auto' },
    selectionErrorRow: {
        marginTop: 2,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    selectionErrorText: {
        flex: 1,
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
        lineHeight: 16,
        color: 'rgba(255,255,255,0.9)',
    },

    frameBadge: {
        alignSelf: 'center', borderWidth: 1, borderColor: '#FFFFFF',
        paddingHorizontal: 20, paddingVertical: 8, borderRadius: 0,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 10,
    },
    frameBadgeText: { fontFamily: Fonts.monoBold, color: '#FFFFFF', fontSize: 10, letterSpacing: 4, fontWeight: '800' },

    paywallStageWrap: {
        flex: 1,
        width: '100%',
    },
    nativePaywallStage: {
        flex: 1,
        backgroundColor: '#000000',
    },
    paywallTopActions: {
        position: 'absolute',
        top: 8,
        right: 16,
        zIndex: 10,
    },
    paywallCancelButton: {
        minWidth: 110,
    },
    webPaywallWrap: {
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingTop: 72,
        paddingBottom: 40,
        gap: 12,
    },
    webPaywallScrollContent: {
        paddingBottom: 120,
    },
    webPaywallEyebrow: {
        fontFamily: Fonts.monoBold,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        letterSpacing: 3,
    },
    webPaywallTitle: {
        fontFamily: Fonts.heading,
        color: '#FFFFFF',
        fontSize: 34,
        lineHeight: 38,
        letterSpacing: 1,
        fontWeight: '800',
    },
    webPaywallSubtitle: {
        fontFamily: Fonts.body,
        color: 'rgba(255,255,255,0.75)',
        fontSize: 15,
        lineHeight: 22,
        maxWidth: 620,
    },
    webPlansRow: {
        flexDirection: 'column',
        gap: 10,
        marginTop: 6,
    },
    webPlanCard: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: 16,
        gap: 6,
    },
    webPlanCardSelected: {
        borderColor: 'rgba(255,255,255,0.85)',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    webPlanCardFeatured: {
        borderColor: 'rgba(255,255,255,0.55)',
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    webPlanName: {
        fontFamily: Fonts.monoBold,
        color: 'rgba(255,255,255,0.75)',
        fontSize: 12,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    webPlanPrice: {
        fontFamily: Fonts.heading,
        color: '#FFFFFF',
        fontSize: 28,
        lineHeight: 30,
        fontWeight: '800',
    },
    webPlanMeta: {
        fontFamily: Fonts.body,
        color: 'rgba(255,255,255,0.66)',
        fontSize: 13,
    },
    webPlanFeaturedText: {
        color: '#FFFFFF',
    },
    webPlanSelectedTag: {
        marginTop: 2,
        fontFamily: Fonts.monoBold,
        color: '#FFFFFF',
        fontSize: 10,
        letterSpacing: 2,
    },
    paywallFallbackCard: {
        marginTop: 4,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        gap: 14,
    },
    paywallFallbackTitle: {
        fontFamily: Fonts.heading,
        color: '#FFFFFF',
        fontSize: 18,
        letterSpacing: 2,
        fontWeight: '800',
    },
    paywallFallbackText: {
        fontFamily: Fonts.body,
        color: 'rgba(255,255,255,0.72)',
        fontSize: 13,
        lineHeight: 20,
    },
    paywallCancelWrap: {
        marginTop: 12,
        alignItems: 'center',
    },
    paywallBtnDisabled: {
        opacity: 0.5,
    },
    paywallGlassButton: {
        width: '100%',
        marginTop: 2,
    },
    paywallGlassButtonSelected: {
        borderColor: 'rgba(255,255,255,0.86)',
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.14)',
    },

    backBtn: {
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    backBtnPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
    backText: {
        fontFamily: Fonts.monoBold, color: '#FFFFFF',
        fontSize: 16, fontWeight: '800', letterSpacing: 2,
    },

    // Auth prompt styles for stages 6 & 7
    authPrompt: {
        alignItems: 'center', gap: 16, marginTop: 10,
        paddingHorizontal: 20,
    },
    authPromptCompact: {
        marginTop: 0,
        gap: 10,
        paddingHorizontal: 10,
    },
    authTitle: {
        fontFamily: Fonts.heading, color: '#FFFFFF', fontSize: 20,
        letterSpacing: 4, fontWeight: '800', textAlign: 'center',
        flexShrink: 1, paddingHorizontal: 8,
    },
    authTitleCompact: {
        fontSize: 16,
        letterSpacing: 2.5,
    },
    authSubtitle: {
        fontFamily: Fonts.mono, color: 'rgba(255,255,255,0.7)', fontSize: 12,
        textAlign: 'center', paddingHorizontal: 20, lineHeight: 18,
        flexShrink: 1,
    },
    authSubtitleCompact: {
        fontSize: 10,
        lineHeight: 14,
        paddingHorizontal: 10,
    },
    authBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
        shadowColor: 'rgba(255, 255, 255, 0.15)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 8,
    },
    authBtnCompact: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginTop: 4,
    },
    authBtnPressed: { borderColor: 'rgba(255, 255, 255, 0.9)', transform: [{ scale: 0.97 }] },
    authBtnText: {
        fontFamily: Fonts.monoBold,
        color: '#FFFFFF',
        fontSize: 14,
        letterSpacing: 3,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    authBtnTextCompact: {
        fontSize: 12,
        letterSpacing: 2,
    },
    authLink: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    authLinkPressed: { borderColor: 'rgba(255, 255, 255, 0.9)', transform: [{ scale: 0.97 }] },
    authLinkText: {
        fontFamily: Fonts.monoBold, color: '#FFFFFF', fontSize: 12,
        letterSpacing: 3, fontWeight: '800',
    },

    // Liquid glass input fields
    inputField: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.12)',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.12)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(0, 0, 0, 0.3)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: Fonts.body,
        marginBottom: 16,
    },
    inputFieldFocused: {
        borderTopColor: 'rgba(51, 51, 51, 0.5)',
        borderLeftColor: 'rgba(51, 51, 51, 0.5)',
        borderRightColor: 'rgba(51, 51, 51, 0.5)',
        borderBottomColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#333333',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    inputPlaceholder: {
        color: 'rgba(255, 255, 255, 0.3)',
    },
});
