import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { palette } from '@/theme/colors';

// Mounted once at the root (src/app/_layout.tsx), behind the navigator.
// Every screen paints its own background as `theme.background`, which is
// `transparent` — so this is what they're all actually showing. Static
// (no animation) and absolutely positioned so it never participates in
// navigation transitions or scroll.
export function AppBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[palette.navyDeep, palette.navyBase, palette.navyDeep]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(232,163,61,0.22)', 'rgba(232,163,61,0)']}
        style={[styles.blob, styles.blobTopRight]}
      />
      <LinearGradient
        colors={['rgba(138,90,42,0.28)', 'rgba(138,90,42,0)']}
        style={[styles.blob, styles.blobBottomLeft]}
      />
      <LinearGradient
        colors={['rgba(232,163,61,0.12)', 'rgba(232,163,61,0)']}
        style={[styles.blob, styles.blobCenter]}
      />
    </View>
  );
}

const BLOB = 420;

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: BLOB,
    height: BLOB,
    borderRadius: BLOB / 2,
  },
  blobTopRight: {
    top: -BLOB * 0.45,
    right: -BLOB * 0.35,
  },
  blobBottomLeft: {
    bottom: -BLOB * 0.4,
    left: -BLOB * 0.45,
  },
  blobCenter: {
    top: '35%',
    left: '20%',
  },
});
