import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { glassShadow, radius } from '@/theme/tokens';

type GlassSurfaceProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
  bordered?: boolean;
  glow?: boolean;
};

// The one frosted-glass panel several cards/headers/tab-bars in the app
// are built from — real backdrop blur (expo-blur) over <AppBackground />,
// a translucent cream tint, a hairline border, and an optional soft outer
// shadow for the "floating" look.
export function GlassSurface({
  children,
  style,
  intensity = 40,
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
      <BlurView intensity={intensity} tint="light" style={styles.blur}>
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
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  border: {
    borderWidth: 1,
    borderColor: 'rgba(28,42,30,0.1)',
  },
});
