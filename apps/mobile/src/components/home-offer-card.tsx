import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

import { palette } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { glassShadow, radius, spacing, typography } from '@/theme/tokens';

const OFFER_IMAGE_URL =
  'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/mixes.jpg';

// Built with the blur/tint as absolute-fill siblings behind a normal-flow
// row (not nested flex:1, like GlassSurface) — the same fix used for
// HomeHero: a row mixing a fixed-size image with flex:1 text inside
// GlassSurface's flex:1 blur chain was collapsing to the text's height
// and clipping the image on web.
export function HomeOfferCard() {
  const theme = useAppTheme();

  return (
    <Pressable onPress={() => router.push('/search')}>
      <View style={[styles.card, { borderColor: theme.border }, glassShadow]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.tintOverlay]} />

        <View style={styles.row}>
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Healthy Snacking{'\n'}Starts Here
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Up to 20% off on all products
            </Text>
          </View>
          <View style={styles.imageWrap}>
            <Image source={{ uri: OFFER_IMAGE_URL }} style={styles.image} contentFit="cover" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>20%{'\n'}OFF</Text>
            </View>
          </View>
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
  imageWrap: {
    width: 104,
    height: 104,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gold,
    borderWidth: 2,
    borderColor: palette.navyBase,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '800',
    color: palette.navyBase,
    textAlign: 'center',
    lineHeight: 12,
  },
});
