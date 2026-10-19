import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatWeight, itemSubtotalPaise, paiseToRupeesLabel } from '@littlenuts/shared';

import { FavoriteButton } from '@/components/favorite-button';
import { useAddToCart } from '@/hooks/cart/use-cart';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useProducts } from '@/hooks/catalog/use-products';
import { useFavorites } from '@/hooks/favorites/use-favorites';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

function shortCategoryLabel(name: string): string {
  return name.split('/')[0].trim();
}

// Full list of every product the customer has favorited — linked from
// Profile's "Favorite" menu item. No star rating (no backing field),
// consistent with the rest of the catalog UI.
export function FavoritesScreen() {
  const theme = useAppTheme();
  const favorites = useFavorites();
  const products = useProducts({});
  const categories = useCategories();
  const addToCart = useAddToCart();

  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category])),
    [categories.data],
  );
  const favoriteProductIds = useMemo(
    () => new Set((favorites.data ?? []).map((favorite) => favorite.product_id)),
    [favorites.data],
  );
  const favoriteProducts = useMemo(
    () => (products.data ?? []).filter((product) => favoriteProductIds.has(product.id)),
    [products.data, favoriteProductIds],
  );

  const isLoading = favorites.isLoading || products.isLoading;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.count, { color: theme.textSecondary }]}>
        {favoriteProducts.length} {favoriteProducts.length === 1 ? 'item' : 'items'}
      </Text>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={styles.loading} />
      ) : favoriteProducts.length ? (
        <View style={styles.grid}>
          {favoriteProducts.map((product) => {
            const category = categoryById.get(product.category_id);
            const price = itemSubtotalPaise(product.price_per_kg_paise, product.min_order_weight_g);
            const outOfStock = product.stock_weight_g < product.min_order_weight_g;
            return (
              <Pressable
                key={product.id}
                onPress={() => router.push(`/product/${product.id}`)}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.imageWrap}>
                  {product.image_urls[0] ? (
                    <ExpoImage source={{ uri: product.image_urls[0] }} style={styles.image} contentFit="cover" />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: theme.background }]}>
                      <Ionicons name="nutrition-outline" size={28} color={theme.textSecondary} />
                    </View>
                  )}
                  {category ? (
                    <View style={[styles.tag, { backgroundColor: theme.badgeBg }]}>
                      <Text numberOfLines={1} style={[styles.tagText, { color: theme.badgeText }]}>
                        {shortCategoryLabel(category.name)}
                      </Text>
                    </View>
                  ) : null}
                  <FavoriteButton
                    productId={product.id}
                    size={16}
                    activeColor={theme.forgot}
                    inactiveColor={theme.textSecondary}
                    style={styles.heart}
                  />
                </View>
                <Text numberOfLines={1} style={[styles.name, { color: theme.textPrimary }]}>
                  {product.name}
                </Text>
                <View style={styles.bottomRow}>
                  <View>
                    <Text style={[styles.weight, { color: theme.textSecondary }]}>
                      {formatWeight(product.min_order_weight_g)}
                    </Text>
                    <Text style={[styles.price, { color: theme.textPrimary }]}>
                      {paiseToRupeesLabel(price)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      if (outOfStock) return;
                      addToCart.mutate({ productId: product.id, quantityG: product.min_order_weight_g });
                    }}
                    disabled={outOfStock}
                    hitSlop={8}
                    style={[styles.addButton, { backgroundColor: theme.primary }, outOfStock && styles.addButtonDisabled]}
                  >
                    <Ionicons name="add" size={16} color={theme.primaryText} />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={40} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No favorites yet</Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
            Tap the heart icon on any product to save it here.
          </Text>
          <Pressable style={[styles.browseButton, { backgroundColor: theme.primary }]} onPress={() => router.push('/(customer)/(tabs)')}>
            <Text style={[styles.browseButtonText, { color: theme.primaryText }]}>Browse Products</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  count: {
    ...typography.caption,
  },
  loading: {
    marginTop: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  card: {
    width: '48%',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    maxWidth: '70%',
  },
  tagText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  heart: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.bodyStrong,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: spacing.sm,
    paddingTop: 2,
  },
  weight: {
    ...typography.caption,
  },
  price: {
    ...typography.bodyStrong,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h2,
  },
  emptyBody: {
    ...typography.body,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  browseButtonText: {
    ...typography.bodyStrong,
  },
});
