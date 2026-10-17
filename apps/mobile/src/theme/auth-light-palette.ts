// Shared palette for the auth screens' light, cream-and-forest-green look
// (Welcome, Sign In, Register) — matches the brand mockups in
// design-assets/App Design/stitch_littlenuts_dryfruit_shopping_app/.
// A deliberate departure from the app's usual dark glass theme (see
// src/theme/colors.ts), used only by this one screen family.
export const AUTH_LIGHT_COLORS = {
  background: '#F8F3EA',
  card: '#FFFFFF',
  border: '#E8E1D2',
  badgeBg: '#EDE6D6',
  badgeText: '#2B2B22',
  badgeDot: '#5B7B4A',
  heading: '#1C2A1E',
  subtitle: '#8B8A80',
  button: '#17241B',
  accent: '#5B8A4A',
  forgot: '#C1502E',
} as const;
