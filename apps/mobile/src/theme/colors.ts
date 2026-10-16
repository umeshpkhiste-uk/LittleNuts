// Dark glassmorphism theme — the app's one and only look (no light mode).
// `background` is intentionally transparent: the actual dark/navy surface
// comes from <AppBackground /> (mounted once, in src/app/_layout.tsx),
// so every screen that paints itself with `theme.background` reveals that
// shared glow instead of a flat color, which is what makes translucent
// glass panels in front of it actually read as glass.
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

export const darkTheme = {
  mode: 'dark' as const,
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
};

// Kept only so any stray `lightTheme` import doesn't crash the build —
// the app never selects it. Remove once nothing references it.
export const lightTheme = darkTheme;

export type AppTheme = typeof darkTheme;
