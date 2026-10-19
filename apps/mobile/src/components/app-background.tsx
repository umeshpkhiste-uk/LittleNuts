import { StyleSheet, View } from 'react-native';

import { lightPalette } from '@/theme/colors';

// Mounted once at the root (src/app/_layout.tsx), behind the navigator —
// a flat cream fill so there's never a gap/flash between screens or during
// transitions, even though most screens also paint their own background.
export function AppBackground() {
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: lightPalette.cream }]}
      pointerEvents="none"
    />
  );
}
