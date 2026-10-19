import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

import { useAppTheme } from '@/theme/theme-provider';

export function GlassHeaderBackground() {
  const theme = useAppTheme();
  const isLight = theme.mode === 'light';
  return (
    <BlurView
      intensity={50}
      tint={isLight ? 'light' : 'dark'}
      style={[StyleSheet.absoluteFill, isLight ? styles.overlayLight : styles.overlay]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(10,14,23,0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  overlayLight: {
    backgroundColor: 'rgba(248,243,234,0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28,42,30,0.08)',
  },
});
