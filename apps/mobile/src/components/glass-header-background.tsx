import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassHeaderBackground() {
  return (
    <BlurView intensity={50} tint="light" style={[StyleSheet.absoluteFill, styles.overlay]} />
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(248,243,234,0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28,42,30,0.08)',
  },
});
