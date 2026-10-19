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

// 'System' is the platform's standard UI font (San Francisco on iOS,
// Roboto on Android) — a no-op on native, where Text already defaults to
// it. On web it matters: react-native-web's <Text> renders with no
// font-family of its own and silently falls back to the browser's
// default serif font unless one is set explicitly, while <input>
// elements (TextInput) already get a sans-serif default from the
// browser's own form-control styles — so without this, every text box
// looked like it was in a different, more "standard" font than the
// surrounding text. Naming it here makes both match everywhere.
const fontFamily = 'System';

export const typography = {
  display: { fontFamily, fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h1: { fontFamily, fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h2: { fontFamily, fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontFamily, fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyStrong: { fontFamily, fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  caption: { fontFamily, fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  price: { fontFamily, fontSize: 18, fontWeight: '700' as const, lineHeight: 22 },
} as const;
