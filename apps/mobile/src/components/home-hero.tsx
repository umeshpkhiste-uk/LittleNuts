import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { palette } from '@/theme/colors';
import { glassShadow, radius, spacing, typography } from '@/theme/tokens';

// Top-of-home banner: the mixed dry-fruit photo with a dark-to-transparent
// gradient so the headline stays legible over the busier right side of
// the image (same treatment as the reference mockup). Built from a plain
// Image + absolute-fill layers rather than ImageBackground — on web,
// ImageBackground doesn't reliably honor the aspectRatio/cover sizing
// here and ends up stretching the photo to fill an unbounded height.
export function HomeHero() {
  return (
    <View style={[styles.wrap, glassShadow]}>
      <Image
        source={require('../../assets/home-hero.jpg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(5,7,12,0.92)', 'rgba(5,7,12,0.55)', 'rgba(5,7,12,0.05)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerRow}>
        <Pressable onPress={() => router.push('/account')} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="menu" size={20} color={palette.textPrimary} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={20} color={palette.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.textBox}>
        <Text style={styles.headline}>
          Goodness in{'\n'}
          <Text style={styles.headlineAccent}>Every Bite</Text>
        </Text>
        <Text style={styles.subtext}>Premium Dry Fruits, 100% Natural & Healthy.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 11,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  headerRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,7,12,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  textBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  headline: {
    ...typography.display,
    color: palette.textPrimary,
  },
  headlineAccent: {
    color: palette.gold,
  },
  subtext: {
    ...typography.body,
    color: palette.textPrimary,
    maxWidth: '75%',
  },
});
