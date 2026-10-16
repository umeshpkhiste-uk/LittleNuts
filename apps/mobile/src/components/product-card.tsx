import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { formatWeight, itemSubtotalPaise, paiseToRupeesLabel, type Product } from '@littlenuts/shared';

import { GlassSurface } from '@/components/glass-surface';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const theme = useAppTheme();
  const displayWeight = product.min_order_weight_g;
  const price = itemSubtotalPaise(product.price_per_kg_paise, displayWeight);
  const imageUri = product.image_urls[0];
  const outOfStock = product.stock_weight_g < product.min_order_weight_g;

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <GlassSurface style={styles.card} radius={radius.lg}>
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
          ) : (
            <Ionicons name="nutrition-outline" size={32} color={theme.textSecondary} />
          )}
          {outOfStock ? (
            <View style={[styles.badge, { backgroundColor: theme.danger }]}>
              <Text style={styles.badgeText}>Out of stock</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={[styles.name, { color: theme.textPrimary }]}>
          {product.name}
        </Text>
        <Text style={[styles.price, { color: theme.primary }]}>
          {paiseToRupeesLabel(price)} / {formatWeight(displayWeight)}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 150,
  },
  card: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    right: spacing.xs,
    borderRadius: radius.sm,
    paddingVertical: 2,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    ...typography.caption,
    fontWeight: '700',
  },
  name: {
    ...typography.bodyStrong,
  },
  price: {
    ...typography.caption,
    fontWeight: '700',
  },
});
