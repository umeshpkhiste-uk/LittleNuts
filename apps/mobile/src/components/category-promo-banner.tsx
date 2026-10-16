import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

import { palette } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { glassShadow, radius, spacing, typography } from '@/theme/tokens';

const PROMO_IMAGE_URL =
  'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/mixes.jpg';

// Same safe layout as HomeOfferCard: blur/tint as absolute-fill siblings
// behind a normal-flow row, not nested inside GlassSurface's flex:1 blur
// chain (which clips a fixed-size image next to flex:1 text on web).
export function CategoryPromoBanner() {
  const theme = useAppTheme();

  return (
    <Pressable onPress={() => router.push('/search')}>
      <View style={[styles.card, { borderColor: theme.border }, glassShadow]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.tintOverlay]} />

        <View style={styles.row}>
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Buy More, Save More!</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Flat 10% off on orders above ₹1,499
            </Text>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>Shop Now</Text>
            </View>
          </View>
          <Image source={{ uri: PROMO_IMAGE_URL }} style={styles.image} contentFit="cover" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tintOverlay: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  textCol: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.body,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: palette.gold,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  ctaText: {
    ...typography.bodyStrong,
    color: palette.navyBase,
  },
  image: {
    width: 104,
    height: 104,
    borderRadius: radius.lg,
  },
});
