import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { glassShadow, radius, spacing, typography } from '@/theme/tokens';
import { palette } from '@/theme/colors';

// Top-of-home banner: the mixed dry-fruit photo with a dark-to-transparent
// gradient so the headline stays legible over the busier right side of
// the image (same treatment as the reference mockup).
export function HomeHero() {
  return (
    <View style={[styles.wrap, glassShadow]}>
      <ImageBackground
        source={require('../../assets/home-hero.jpg')}
        style={styles.image}
        imageStyle={styles.imageRadius}
      >
        <LinearGradient
          colors={['rgba(5,7,12,0.92)', 'rgba(5,7,12,0.55)', 'rgba(5,7,12,0.05)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          <Text style={styles.headline}>
            Goodness in{'\n'}
            <Text style={styles.headlineAccent}>Every Bite</Text>
          </Text>
          <Text style={styles.subtext}>Premium Dry Fruits, 100% Natural & Healthy.</Text>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 11,
    justifyContent: 'flex-end',
  },
  imageRadius: {
    borderRadius: radius.lg,
  },
  gradient: {
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
