import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

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
  tint = 'dark',
  radius: cornerRadius = radius.lg,
  bordered = true,
  glow = false,
}: GlassSurfaceProps) {
  return (
    <View
      style={[
        { borderRadius: cornerRadius, overflow: 'hidden' },
        bordered && styles.border,
        glow && glassShadow,
        style,
      ]}
    >
      <BlurView intensity={intensity} tint={tint} style={styles.blur}>
        <View style={styles.tintOverlay}>{children}</View>
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
  border: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
