import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useAppTheme } from '@/theme/theme-provider';
import { glassShadow, radius } from '@/theme/tokens';

type GlassSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'dark' | 'light';
  radius?: number;
  bordered?: boolean;
  glow?: boolean;
};

// The one frosted-glass panel every card/header/tab-bar in the app is
// built from — real backdrop blur (expo-blur) over <AppBackground />'s
// glow, a translucent tint, a hairline border, and an optional soft
// outer shadow for the "floating" look.
export function GlassSurface({
  children,
  style,
  intensity = 40,
  tint,
  radius: cornerRadius = radius.lg,
  bordered = true,
  glow = false,
}: GlassSurfaceProps) {
  const theme = useAppTheme();
  const isLight = theme.mode === 'light';
  const resolvedTint = tint ?? (isLight ? 'light' : 'dark');

  return (
    <View
      style={[
        { borderRadius: cornerRadius, overflow: 'hidden' },
        bordered && (isLight ? styles.borderLight : styles.border),
        glow && glassShadow,
        style,
      ]}
    >
      <BlurView intensity={intensity} tint={resolvedTint} style={styles.blur}>
        <View style={isLight ? styles.tintOverlayLight : styles.tintOverlay}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    flex: 1,
  },
  tintOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tintOverlayLight: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  border: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  borderLight: {
    borderWidth: 1,
    borderColor: 'rgba(28,42,30,0.1)',
  },
});
