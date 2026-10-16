import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { formatWeight, itemSubtotalPaise, paiseToRupeesLabel, type Product } from '@littlenuts/shared';

import { GlassSurface } from '@/components/glass-surface';
import { useAddToCart } from '@/hooks/cart/use-cart';
import { palette } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

// Compact 3-up card for the home screen's "Top Picks For You" row — same
// building blocks as ProductCard (GlassSurface, product photo, price-per-
// weight) but narrower, and with a quick "add at the default weight" cart
// button so a pick can be bought without opening the product page.
export function TopPickCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const theme = useAppTheme();
  const addToCart = useAddToCart();
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
            <Ionicons name="nutrition-outline" size={28} color={theme.textSecondary} />
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
        <View style={styles.priceRow}>
          <Text numberOfLines={1} style={[styles.price, { color: theme.primary }]}>
            {paiseToRupeesLabel(price)}/{formatWeight(displayWeight)}
          </Text>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              if (!outOfStock) {
                addToCart.mutate({ productId: product.id, quantityG: displayWeight });
              }
            }}
            disabled={outOfStock || addToCart.isPending}
            hitSlop={8}
            style={[styles.cartButton, outOfStock && styles.cartButtonDisabled]}
          >
            <Ionicons name="cart" size={13} color={palette.navyBase} />
          </Pressable>
        </View>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '31%',
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
    ...typography.caption,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  price: {
    ...typography.caption,
    fontWeight: '700',
    flexShrink: 1,
  },
  cartButton: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gold,
  },
  cartButtonDisabled: {
    opacity: 0.4,
  },
});
