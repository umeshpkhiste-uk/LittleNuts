// Two real themes now: the original dark glassmorphism look, and a light
// cream-and-forest-green look (introduced screen-by-screen, now wired up as
// an actual switchable theme — see theme-provider.tsx / theme-store.ts).
// Both objects below implement the exact same `ThemeColors` shape so every
// screen can read whichever is active through the one `useAppTheme()` hook,
// regardless of which naming convention that screen happens to use
// (textPrimary/surface/... from the original dark screens, or
// heading/subtitle/card/... from the newer light-redesigned screens).
export const palette = {
  navyBase: '#0A0E17',
  navyDeep: '#05070C',
  glowGold: '#C8841E',
  glowAmber: '#8A5A2A',
  gold: '#E8A33D',
  goldLight: '#F4C066',
  goldDeep: '#B8781F',
  green: '#4ADE80',
  red: '#F2755A',
  textPrimary: '#F4F1EA',
  textSecondary: '#A9ADBE',
  textMuted: '#7B8094',
  glassWhite: 'rgba(255,255,255,0.06)',
  glassWhiteStrong: 'rgba(255,255,255,0.1)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassBorderStrong: 'rgba(255,255,255,0.2)',
} as const;

export const lightPalette = {
  cream: '#F8F3EA',
  card: '#FFFFFF',
  border: '#E8E1D2',
  borderStrong: '#D8CFBA',
  badgeBg: '#EDE6D6',
  badgeText: '#2B2B22',
  badgeDot: '#5B7B4A',
  heading: '#1C2A1E',
  subtitle: '#8B8A80',
  textMuted: '#A9A79C',
  button: '#17241B',
  buttonLight: '#2E3F27',
  accent: '#5B8A4A',
  forgot: '#C1502E',
} as const;

export type ThemeColors = {
  mode: 'dark' | 'light';
  // Original dark-glass naming.
  background: string;
  backgroundSolid: string;
  surface: string;
  card: string;
  cardStrong: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryLight: string;
  primaryText: string;
  accent: string;
  danger: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  // Newer light-screen naming (Home/Categories/Product Details/Cart/
  // Profile/onboarding/auth) — kept as aliases so those screens don't need
  // their JSX/styles rewritten, only their color *source* swapped.
  heading: string;
  subtitle: string;
  button: string;
  badgeBg: string;
  badgeText: string;
  badgeDot: string;
  forgot: string;
};

export const darkTheme: ThemeColors = {
  mode: 'dark',
  background: 'transparent',
  backgroundSolid: palette.navyBase,
  surface: palette.glassWhite,
  card: palette.glassWhite,
  cardStrong: palette.glassWhiteStrong,
  border: palette.glassBorder,
  borderStrong: palette.glassBorderStrong,
  primary: palette.gold,
  primaryLight: palette.goldLight,
  primaryText: '#1A1206',
  accent: palette.green,
  danger: palette.red,
  textPrimary: palette.textPrimary,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,
  tabBarBackground: 'rgba(10,14,23,0.72)',
  tabBarActive: palette.gold,
  tabBarInactive: palette.textMuted,
  heading: palette.textPrimary,
  subtitle: palette.textSecondary,
  button: palette.gold,
  badgeBg: 'rgba(255,255,255,0.08)',
  badgeText: palette.textPrimary,
  badgeDot: palette.green,
  forgot: palette.red,
};

export const lightTheme: ThemeColors = {
  mode: 'light',
  background: 'transparent',
  backgroundSolid: lightPalette.cream,
  surface: lightPalette.badgeBg,
  card: lightPalette.card,
  cardStrong: lightPalette.card,
  border: lightPalette.border,
  borderStrong: lightPalette.borderStrong,
  primary: lightPalette.button,
  primaryLight: lightPalette.buttonLight,
  primaryText: '#FFFFFF',
  accent: lightPalette.accent,
  danger: lightPalette.forgot,
  textPrimary: lightPalette.heading,
  textSecondary: lightPalette.subtitle,
  textMuted: lightPalette.textMuted,
  tabBarBackground: 'rgba(255,255,255,0.85)',
  tabBarActive: lightPalette.button,
  tabBarInactive: lightPalette.subtitle,
  heading: lightPalette.heading,
  subtitle: lightPalette.subtitle,
  button: lightPalette.button,
  badgeBg: lightPalette.badgeBg,
  badgeText: lightPalette.badgeText,
  badgeDot: lightPalette.badgeDot,
  forgot: lightPalette.forgot,
};

export type AppTheme = ThemeColors;
