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
  glowPurple: 'rgba(255, 255, 255, 0.08)',
  glowRed: 'rgba(255, 68, 68, 0.35)',
  glowWhite: 'rgba(255, 255, 255, 0.08)',
};

export const Colors = {
  ...rawPalette,
  ...gradients,
  ...glows,
  light: rawPalette, // Only strings for themed components
  dark: rawPalette,
};


// ── Typography ─────────────────────────────────────────────────
export const Fonts = {
  heading: 'Poppins_700Bold',
  headingSemi: 'Poppins_600SemiBold',
  headingMedium: 'Poppins_500Medium',
  body: 'Inter_400Regular',
  bodySemi: 'Inter_600SemiBold',
  bodyMedium: 'Inter_500Medium',
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
