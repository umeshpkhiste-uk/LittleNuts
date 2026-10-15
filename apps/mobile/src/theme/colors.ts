export const palette = {
  cream: '#F7EFE4',
  warmWhite: '#FFFDF9',
  darkBrown: '#1C140D',
  mediumBrown: '#2A1F15',
  cardBrown: '#241A12',
  gold: '#C8841E',
  goldLight: '#E7A94B',
  green: '#4F7A4A',
  red: '#C9452F',
  textPrimaryDark: '#F5ECDD',
  textSecondaryDark: '#B8AA96',
  textPrimaryLight: '#2A1F15',
  textSecondaryLight: '#6D6256',
} as const;

export const lightTheme = {
  mode: 'light' as const,
  background: palette.cream,
  surface: palette.warmWhite,
  card: palette.warmWhite,
  border: '#E6DCC9',
  primary: palette.gold,
  primaryText: '#1C140D',
  accent: palette.green,
  danger: palette.red,
  textPrimary: palette.textPrimaryLight,
  textSecondary: palette.textSecondaryLight,
  tabBarBackground: palette.warmWhite,
  tabBarActive: palette.gold,
  tabBarInactive: palette.textSecondaryLight,
};

export const darkTheme = {
  mode: 'dark' as const,
  background: palette.darkBrown,
  surface: palette.mediumBrown,
  card: palette.cardBrown,
  border: '#3A2D1F',
  primary: palette.gold,
  primaryText: '#1C140D',
  accent: palette.green,
  danger: palette.red,
  textPrimary: palette.textPrimaryDark,
  textSecondary: palette.textSecondaryDark,
  tabBarBackground: palette.darkBrown,
  tabBarActive: palette.goldLight,
  tabBarInactive: palette.textSecondaryDark,
};

export type AppTheme = typeof darkTheme | typeof lightTheme;
