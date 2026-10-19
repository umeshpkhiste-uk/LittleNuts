import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassTabBarBackground() {
  return (
    <BlurView intensity={50} tint="light" style={[StyleSheet.absoluteFill, styles.overlay]} />
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(248,243,234,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(28,42,30,0.08)',
  },
});
