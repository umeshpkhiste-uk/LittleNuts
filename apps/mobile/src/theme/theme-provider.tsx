import type { PropsWithChildren } from 'react';

import { lightTheme, type AppTheme } from './colors';

// A single light cream theme throughout the app — see colors.ts. This used
// to also support a dark glass theme with a Light/Dark/Auto switch; both
// were removed in favor of one consistent look, so this is now just a
// pass-through (kept as a hook/provider pair so call sites don't change).
export function ThemeProvider({ children }: PropsWithChildren) {
  return children;
}

export function useAppTheme(): AppTheme {
  return lightTheme;
}
