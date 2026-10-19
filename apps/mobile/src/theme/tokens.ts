export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

// Soft outer glow used behind cards/buttons to sell the floating-glass
// feel. iOS/Android/Web all honor shadow* via react-native-web's shadow
// mapping; kept as a plain object (not a StyleSheet.create entry) so it
// can be spread directly into a component's own styles.
export const glassShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.35,
  shadowRadius: 24,
  elevation: 10,
} as const;

export const goldGlowShadow = {
  shadowColor: '#E8A33D',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.45,
  shadowRadius: 16,
  elevation: 8,
} as const;

// Subtle lift for cards/pills sitting on the light cream background — far
// softer than glassShadow, which was tuned for the dark theme's heavier
// drop shadows and reads as a smudge on white/cream surfaces.
export const cardShadow = {
  shadowColor: '#1C2A1E',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 3,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h1: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  price: { fontSize: 18, fontWeight: '700' as const, lineHeight: 22 },
} as const;
