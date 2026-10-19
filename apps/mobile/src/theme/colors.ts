// Light cream-and-forest-green theme — the app's one and only look. (A
// dark glassmorphism theme existed earlier and briefly had a working
// Light/Dark/Auto switch; both were removed in favor of a single
// consistent light theme throughout the app.) `ThemeColors` carries two
// naming conventions for the same values (textPrimary/surface/... from
// the original screens, heading/subtitle/card/... from the newer ones)
// so every screen can keep using whichever it already had, all reading
// from this one object via useAppTheme().
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
  mode: 'light';
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
  heading: string;
  subtitle: string;
  button: string;
  badgeBg: string;
  badgeText: string;
  badgeDot: string;
  forgot: string;
};

export const lightTheme: ThemeColors = {
  mode: 'light',
  background: lightPalette.cream,
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
