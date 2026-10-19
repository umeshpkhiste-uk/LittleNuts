import { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type AppTheme } from './colors';
import { useThemeModeStore, type ThemeMode } from './theme-store';

const ThemeContext = createContext<AppTheme>(darkTheme);

export function ThemeProvider({ children }: PropsWithChildren) {
  const mode = useThemeModeStore((state) => state.mode);
  const loadPersistedMode = useThemeModeStore((state) => state.loadPersistedMode);
  const systemScheme = useColorScheme();

  useEffect(() => {
    loadPersistedMode();
  }, [loadPersistedMode]);

  const effective = mode === 'auto' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;
  const theme = effective === 'light' ? lightTheme : darkTheme;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}

// For the Settings "Theme" picker: the user's chosen mode (which may be
// 'auto'), the mode it currently resolves to, and a setter. useAppTheme()
// above is for color values; this is for the picker UI itself.
export function useThemeMode(): {
  mode: ThemeMode;
  effective: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
} {
  const mode = useThemeModeStore((state) => state.mode);
  const setMode = useThemeModeStore((state) => state.setMode);
  const systemScheme = useColorScheme();
  const effective = mode === 'auto' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;
  return { mode, effective, setMode };
}
