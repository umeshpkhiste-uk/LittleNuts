import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_MODE_KEY = 'littlenuts-theme-mode';

type ThemeModeState = {
  mode: ThemeMode;
  isLoaded: boolean;
  setMode: (mode: ThemeMode) => void;
  loadPersistedMode: () => Promise<void>;
};

// 'auto' is the default until a persisted choice loads, so the app follows
// the system appearance on first launch rather than defaulting to one look.
export const useThemeModeStore = create<ThemeModeState>((set) => ({
  mode: 'auto',
  isLoaded: false,
  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(THEME_MODE_KEY, mode).catch(() => {
      // Non-fatal — the choice just won't survive an app restart.
    });
  },
  loadPersistedMode: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_MODE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        set({ mode: stored });
      }
    } finally {
      set({ isLoaded: true });
    }
  },
}));
