import { createContext, useContext, type PropsWithChildren } from 'react';

import { darkTheme, type AppTheme } from './colors';

const ThemeContext = createContext<AppTheme>(darkTheme);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={darkTheme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}
