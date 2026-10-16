import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassTabBarBackground() {
  return (
    <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFill, styles.overlay]} />
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(10,14,23,0.55)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});
