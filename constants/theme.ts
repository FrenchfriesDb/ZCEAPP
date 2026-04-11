/**
 * ZCE: The Charisma Engine — Monochrome Glass Theme
 * Pure black, white, grey. Glass effect. 4K premium.
 */

// ── Color Palette ──────────────────────────────────────────────
const rawPalette = {
  // Core backgrounds — pure black
  bgPrimary: '#000000',
  bgSecondary: '#0A0A0A',
  bgCard: 'rgba(255, 255, 255, 0.04)',
  bgCardSolid: '#111111',
  bgElevated: 'rgba(255, 255, 255, 0.06)',

  // Legacy/Core Aliases (for Themed components)
  text: '#E8E8E8',
  background: '#000000',
  tint: '#00F5FF',
  icon: '#888888',
  tabIconDefault: '#888888',
  tabIconSelected: '#00F5FF',

  // Accent colors
  accentPrimary: '#FFFFFF',
  accentSecondary: '#888888',
  accentCyan: '#00F5FF',
  accentGold: '#D4D4D4',
  accentSilver: '#999999',
  accentBronze: '#777777',
  accentDanger: '#FF4444',
  accentIce: '#AAAAAA',

  // Text
  textPrimary: '#E8E8E8',
  textSecondary: 'rgba(255, 255, 255, 0.45)',
  textTertiary: 'rgba(255, 255, 255, 0.22)',
  textAccent: '#FFFFFF',

  // Borders
  borderGlass: 'rgba(255, 255, 255, 0.08)',
  borderGlassStrong: 'rgba(255, 255, 255, 0.16)',
  borderAccent: 'rgba(255, 255, 255, 0.12)',
  borderDanger: 'rgba(255, 68, 68, 0.3)',

  // Status
  success: '#00F5FF',
  warning: '#D4D4D4',
  danger: '#FF4444',
  info: '#00F5FF',
};

const gradients = {
  gradientDark: ['#000000', '#050505', '#0A0A0A'] as const,
  gradientCard: ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)'] as const,
  gradientAccent: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'] as const,
  gradientXP: ['#FFFFFF', '#00F5FF'] as const,
  gradientDanger: ['#FF4444', '#CC0000'] as const,
  gradientGold: ['#D4D4D4', '#999999'] as const,
  gradientButton: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)'] as const,
};

const glows = {
  glowBlue: 'rgba(0, 245, 255, 0.25)',
  glowBlueStrong: 'rgba(0, 245, 255, 0.45)',
  glowPurple: 'rgba(126, 48, 225, 0.25)',
  glowRed: 'rgba(255, 78, 80, 0.25)',
  glowOrange: 'rgba(255, 140, 0, 0.25)',
  glowWhite: 'rgba(255, 255, 255, 0.08)',
};

// ── Time-Based Accents ──────────────────────────────────────────
export const TimeColors = {
  // 4 AM — deep navy pre-dawn
  preDawn: ['#000328', '#00458E'],
  // 5 AM — steel blue dawn
  earlierDawn: ['#243748', '#4B749F'],
  // 6:00–7:09 AM — cool morning fade
  morning: ['#E4E7E4', '#0A1647'],
  // 8:30 AM – 4 PM — Cloud Drift (Vibrant Sky)
  day: ['#2C6CBC', '#71C3F7', '#F6F6F6'],
  // 5 PM — warm golden hour
  goldenHour: ['#FFA585', '#FFEDA0'],
  // 5:30–6:00 PM — Sunberry Twist
  sunberryTwist: ['#F86CA7', '#F4D444'],
  // 6:00–6:30 PM — Coral Spark
  sunsetPop: ['#F9C823', '#FC506E'],
  // 6:30–7:00 PM — fiery sunset
  sunset: ['#FF0F7B', '#F89B29'],
  // 7:00–7:30 PM — neon pink-cyan
  twilight: ['#FF1B6B', '#45CAFF'],
  // 7:30–8 PM — Battle glory (gold → red → deep blue)
  battleGlory: ['#FC9F32', '#AE1B1E', '#1A2766'],
  // 8 PM — Mars Echo
  marsEcho: ['#EF745C', '#34073D'],
  // 8:30 PM — Plum Glow
  plumGlow: ['#3E196E', '#D46C76', '#FFC07C'],
  // 9 PM — Moon Dust
  nightDive: ['#22052D', '#CCB3D1'],
  // 10 PM — Void Spark
  voidSpark: ['#000328', '#00458E'],
  // 11 PM — Midnight Mist
  midnightMist: ['#211F2F', '#918CA9'],
  // 12 AM – 4 AM — Deep Abyss
  deepAbyss: ['#0E1C26', '#2A454B', '#294861'],
  // 7:10 AM – 7:30 AM — Citrus Sunrise
  // Sunset Flame (warm cream → hot pink)
  sunriseCitrus: ['#F5E6AD', '#F13C77'],
  // 7:30 AM – 7:40 AM — Sunrise Pastel Cloud
  sunrisePastel: ['#F6CFBE', '#B9DCF2'],
  // 7:40 AM – 8:00 AM — Blush Sky
  blushSky: ['#DD83AD', '#C3E1FC'],
  // Cloud Drift Alias for clarity
  cloudDrift: ['#2C6CBC', '#71C3F7', '#F6F6F6'],
  // 4:00 PM – 5:00 PM — Vibrant Sky
  vibrantSky: ['#9FCCFA', '#0974F1'],
  // 6:00 PM – 6:30 PM — Sunset Candy
  sunsetCandy: ['#FF0F7B', '#F89B29'],
};

export type TimeThemeInfo = {
  key: keyof typeof TimeColors;
  label: string;
  range: string;
  palette: string[];
};

export const getTimeThemeInfo = (hour: number, minute: number): TimeThemeInfo => {
  const totalMinutes = hour * 60 + minute;
  if (totalMinutes < 240) return { key: 'deepAbyss', label: 'Deep Abyss', range: '12:00 AM–3:59 AM', palette: TimeColors.deepAbyss };
  if (totalMinutes < 300) return { key: 'preDawn', label: 'Pre Dawn', range: '4:00 AM–4:59 AM', palette: TimeColors.preDawn };
  if (totalMinutes < 360) return { key: 'earlierDawn', label: 'Earlier Dawn', range: '5:00 AM–5:59 AM', palette: TimeColors.earlierDawn };
  if (totalMinutes < 430) return { key: 'morning', label: 'Morning Ice Night', range: '6:00 AM–7:09 AM', palette: TimeColors.morning };
  if (totalMinutes < 450) return { key: 'sunriseCitrus', label: 'Sunset Flame', range: '7:10 AM–7:29 AM', palette: TimeColors.sunriseCitrus };
  if (totalMinutes < 460) return { key: 'sunrisePastel', label: 'Sunrise Pastel', range: '7:30 AM–7:39 AM', palette: TimeColors.sunrisePastel };
  if (totalMinutes < 480) return { key: 'blushSky', label: 'Blush Sky', range: '7:40 AM–7:59 AM', palette: TimeColors.blushSky };
  if (totalMinutes < 960) return { key: 'cloudDrift', label: 'Cloud Drift', range: '8:00 AM–3:59 PM', palette: TimeColors.cloudDrift };
  if (totalMinutes < 1020) return { key: 'vibrantSky', label: 'Vibrant Sky', range: '4:00 PM–4:59 PM', palette: TimeColors.vibrantSky };
  if (totalMinutes < 1050) return { key: 'goldenHour', label: 'Golden Hour', range: '5:00 PM–5:29 PM', palette: TimeColors.goldenHour };
  if (totalMinutes < 1080) return { key: 'sunberryTwist', label: 'Sunberry Twist', range: '5:30 PM–5:59 PM', palette: TimeColors.sunberryTwist };
  if (totalMinutes < 1110) return { key: 'sunsetPop', label: 'Coral Spark', range: '6:00 PM–6:29 PM', palette: TimeColors.sunsetPop };
  if (totalMinutes < 1140) return { key: 'sunsetCandy', label: 'Sunset Candy', range: '6:30 PM–6:59 PM', palette: TimeColors.sunsetCandy };
  if (totalMinutes < 1170) return { key: 'twilight', label: 'Twilight', range: '7:00 PM–7:29 PM', palette: TimeColors.twilight };
  if (totalMinutes < 1200) return { key: 'battleGlory', label: 'Battle Glory', range: '7:30 PM–7:59 PM', palette: TimeColors.battleGlory };
  if (totalMinutes < 1230) return { key: 'marsEcho', label: 'Mars Echo', range: '8:00 PM–8:29 PM', palette: TimeColors.marsEcho };
  if (totalMinutes < 1260) return { key: 'plumGlow', label: 'Plum Glow', range: '8:30 PM–8:59 PM', palette: TimeColors.plumGlow };
  if (totalMinutes < 1320) return { key: 'nightDive', label: 'Night Dive', range: '9:00 PM–9:59 PM', palette: TimeColors.nightDive };
  if (totalMinutes < 1380) return { key: 'voidSpark', label: 'Void Spark', range: '10:00 PM–10:59 PM', palette: TimeColors.voidSpark };
  return { key: 'midnightMist', label: 'Midnight Mist', range: '11:00 PM–11:59 PM', palette: TimeColors.midnightMist };
};

// Helper: derive the dominant accent color (first stop) for any single-color usage
export const getTimeAccent = (palette: string[]) => palette[0];

export const getTimePalette = (hour: number, minute: number): string[] => {
  return getTimeThemeInfo(hour, minute).palette;
};

// Dynamic text colors that match each theme's gradient colors
export const getDynamicColors = (hour: number, minute: number) => {
  const totalMinutes = hour * 60 + minute;
  const palette = getTimePalette(hour, minute);
  const textPrimaryColor = palette[0] || '#E8E8E8';
  const textSecondaryColor = palette[palette.length - 1] || textPrimaryColor;

  // 6:00–7:09 AM — Morning: both primary and secondary should be #E4E7E4
  if (totalMinutes >= 360 && totalMinutes < 430) {
    return {
      textPrimary: '#E4E7E4',
      textSecondary: '#E4E7E4',
      textTertiary: '#E4E7E4AA',
    };
  }

  if (totalMinutes >= 1170 && totalMinutes < 1200) {
    return {
      textPrimary: '#FF3B30',
      textSecondary: '#FF8C00',
      textTertiary: '#45CAFF',
    };
  }

  if (totalMinutes >= 288 && totalMinutes < 300) {
    return {
      textPrimary: '#A8D5FF',
      textSecondary: '#D4E8FF',
      textTertiary: '#B8E0FF',
    };
  }

  // 5:00–5:59 AM — Earlier Dawn readability boost
  if (totalMinutes >= 300 && totalMinutes < 360) {
    return {
      textPrimary: '#FFFFFF',
      textSecondary: '#DCE9FF',
      textTertiary: '#BFD6FF',
    };
  }

  // 7:10–7:30 AM — Sunset Flame
  if (totalMinutes >= 430 && totalMinutes < 450) {
    return {
      textPrimary: '#F13C77',
      textSecondary: '#F5E6AD',
      textTertiary: '#F7B6CA',
    };
  }

  // 7:30–7:40 AM — Sunrise Pastel Cloud
  if (totalMinutes >= 450 && totalMinutes < 460) {
    return {
      textPrimary: '#B9DCF2',
      textSecondary: '#F6CFBE',
      textTertiary: '#E7D8CC',
    };
  }

  // 7:40–8:00 AM — Blush Sky
  if (totalMinutes >= 460 && totalMinutes < 480) {
    return {
      textPrimary: '#DD83AD',
      textSecondary: '#C3E1FC',
      textTertiary: '#E0A9BB',
    };
  }

  // 4:00–5:00 PM — Vibrant Sky
  if (totalMinutes >= 960 && totalMinutes < 1020) {
    return {
      textPrimary: '#9FCCFA',
      textSecondary: '#0974F1',
      textTertiary: '#CFE5FF',
    };
  }

  // 5:30–5:59 PM — Sunberry Twist
  if (totalMinutes >= 1050 && totalMinutes < 1080) {
    return {
      textPrimary: '#F86CA7',
      textSecondary: '#F4D444',
      textTertiary: '#F5A2C8',
    };
  }

  // 6:00–6:29 PM — Coral Spark
  if (totalMinutes >= 1080 && totalMinutes < 1110) {
    return {
      textPrimary: '#FC506E',
      textSecondary: '#F9C823',
      textTertiary: '#FCAF95',
    };
  }

  // 6:30–6:59 PM — Sunset Candy
  if (totalMinutes >= 1110 && totalMinutes < 1140) {
    return {
      textPrimary: '#FC506E',
      textSecondary: '#F89B29',
      textTertiary: '#FF919C',
    };
  }

  // 7:00–7:29 PM — Twilight
  if (totalMinutes >= 1140 && totalMinutes < 1170) {
    return {
      textPrimary: '#FF1B6B',
      textSecondary: '#45CAFF',
      textTertiary: '#D397FA',
    };
  }

  // 8:00–8:29 PM — Mars Echo
  if (totalMinutes >= 1200 && totalMinutes < 1230) {
    return {
      textPrimary: '#EF745C',
      textSecondary: '#B0485B',
      textTertiary: '#B0485B88',
    };
  }

  if (totalMinutes >= 1230 && totalMinutes < 1260) {
    return {
      textPrimary: '#FFC07C',
      textSecondary: '#B95E82',
      textTertiary: `${textSecondaryColor}88`,
    };
  }

  if (totalMinutes >= 1260 && totalMinutes < 1320) {
    return {
      textPrimary: '#CCB3D1',
      textSecondary: '#FFFFFF',
      textTertiary: '#E5D5EE',
    };
  }

  if (totalMinutes >= 1320 && totalMinutes < 1380) {
    return {
      textPrimary: '#71C3F7',
      textSecondary: '#FFFFFF',
      textTertiary: '#CFEFFF',
    };
  }

  if (totalMinutes >= 480 && totalMinutes < 1020) {
    return {
      textPrimary: '#71C3F7',
      textSecondary: '#F6F6F6',
      textTertiary: '#DFF3FF',
    };
  }

  return {
    textPrimary: textPrimaryColor,
    textSecondary: textSecondaryColor,
    textTertiary: `${textSecondaryColor}88`,
  };
};

export const Colors = {
  ...rawPalette,
  ...gradients,
  ...glows,
  light: rawPalette, // Only strings for themed components
  dark: rawPalette,
  // Default colors - will be overridden by getDynamicColors
  textPrimary: '#E8E8E8',
  textSecondary: 'rgba(255, 255, 255, 0.45)',
  textTertiary: 'rgba(255, 255, 255, 0.22)',
};


// ── Typography ─────────────────────────────────────────────────
export const Fonts = {
  heading: 'Poppins_700Bold',
  headingSemi: 'Poppins_600SemiBold',
  headingMedium: 'Poppins_500Medium',
  analysis: 'Montserrat_ExtraBold',
  body: 'Inter_400Regular',
  bodySemi: 'Inter_600SemiBold',
  bodyMedium: 'Inter_500Medium',
  nunito: 'NunitoSans_Variable',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  h3: 24,
  h2: 28,
  h1: 34,
  hero: 48,
};

// ── Spacing ────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

// ── Border Radius — Sharp High-Status Edges ───────────────────
export const Radius = {
  xs: 3,
  sm: 6,
  md: 8,
  lg: 12,    // Standard rounded cards
  xl: 18,    // Container corners
  pill: 40,  // Full pill rounding
};

// ── Glassmorphism ──────────────────────────────────────────────
export const Glass = {
  blurIntensity: 22,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.09)',   // White glow border
  backgroundColor: 'rgba(255, 255, 255, 0.045)',
};

// ── XP / Level System ──────────────────────────────────────────
// 1,000 levels. User's `xp` in Firestore = cumulative total (never resets on level-up).

const LEVEL_COUNT = 1000;

const _xpPerLevel = (n: number): number => Math.round(500 + (n - 1) * 4.5);

const _cumThresholds: number[] = [0, 0];
let _runningTotal = 0;
for (let i = 1; i <= LEVEL_COUNT; i++) {
  _runningTotal += _xpPerLevel(i);
  _cumThresholds.push(_runningTotal);
}

const TITLE_TIERS = [
  { minLevel: 1, title: 'NPC' },
  { minLevel: 10, title: 'Aura: Ghost' },
  { minLevel: 50, title: 'Aura: Spectre' },
  { minLevel: 100, title: 'Shadow Architect' },
  { minLevel: 250, title: 'Influence Engine' },
  { minLevel: 500, title: 'Charisma Lord' },
  { minLevel: 750, title: 'Shadow King' },
  { minLevel: 900, title: 'Dark CEO' },
  { minLevel: 950, title: 'Supreme Alpha' },
  { minLevel: 1000, title: 'ZANE' },
];

const _getTitleForLevel = (lvl: number): string => {
  let title = TITLE_TIERS[0].title;
  for (const tier of TITLE_TIERS) {
    if (lvl >= tier.minLevel) title = tier.title;
  }
  return title;
};

export const XPConfig = {
  maxLevel: LEVEL_COUNT,

  getLevel: (totalXP: number) => {
    let lvl = 1;
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      if (totalXP >= _cumThresholds[i] && (i === LEVEL_COUNT || totalXP < _cumThresholds[i + 1])) {
        lvl = i;
        break;
      }
      if (i === LEVEL_COUNT) lvl = LEVEL_COUNT;
    }
    return {
      level: lvl,
      title: _getTitleForLevel(lvl),
      xpRequired: _cumThresholds[lvl],
      xpToComplete: _xpPerLevel(lvl),
    };
  },

  getXpInCurrentLevel: (totalXP: number): number => {
    const current = XPConfig.getLevel(totalXP);
    return Math.max(0, totalXP - current.xpRequired);
  },

  getProgress: (totalXP: number): number => {
    const current = XPConfig.getLevel(totalXP);
    if (current.level >= LEVEL_COUNT) return 1;
    const inLevel = Math.max(0, totalXP - current.xpRequired);
    return Math.min(inLevel / current.xpToComplete, 1);
  },
};
