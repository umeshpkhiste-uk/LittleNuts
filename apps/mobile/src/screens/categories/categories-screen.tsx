import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Category } from '@littlenuts/shared';

import { CategoryPromoBanner } from '@/components/category-promo-banner';
import { GlassSurface } from '@/components/glass-surface';
import { useCart } from '@/hooks/cart/use-cart';
import { useCategoryProductCounts } from '@/hooks/catalog/use-category-counts';
import { useCategories } from '@/hooks/catalog/use-categories';
import { palette } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function CategoriesScreen() {
  const theme = useAppTheme();
  const categories = useCategories();
  const counts = useCategoryProductCounts();
  const cart = useCart();
  const cartCount = cart.data?.items.length ?? 0;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/'))}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Categories</Text>
        <Pressable onPress={() => router.push('/cart')} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="cart-outline" size={20} color={theme.textPrimary} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {categories.isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View style={styles.grid}>
          {categories.data?.map((category) => (
            <CategoryGridCard
              key={category.id}
              category={category}
              itemCount={counts.data?.[category.id] ?? 0}
              onPress={() => router.push(`/category/${category.id}`)}
            />
          ))}
          {/* Pad an incomplete last row so space-between doesn't spread
              1-2 leftover cards across the full row width. */}
          {Array.from({ length: (3 - ((categories.data?.length ?? 0) % 3)) % 3 }).map(
            (_, index) => (
              <View key={`spacer-${index}`} style={styles.cardPressable} />
            ),
          )}
        </View>
      )}

      <CategoryPromoBanner />
    </ScrollView>
  );
}

function CategoryGridCard({
  category,
  itemCount,
  onPress,
}: {
  category: Category;
  itemCount: number;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const displayName = category.name.split(' / ')[0];

  return (
    <Pressable onPress={onPress} style={styles.cardPressable}>
      <GlassSurface style={styles.card} radius={radius.lg}>
        <View style={styles.imageWrap}>
          {category.image_url ? (
            <Image source={{ uri: category.image_url }} style={styles.image} contentFit="cover" />
          ) : (
            <Ionicons name="leaf-outline" size={28} color={theme.primary} />
          )}
        </View>
        <Text numberOfLines={1} style={[styles.name, { color: theme.textPrimary }]}>
          {displayName}
        </Text>
        <Text style={[styles.count, { color: theme.textSecondary }]}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gold,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.navyBase,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  cardPressable: {
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
  name: {
    ...typography.bodyStrong,
    textAlign: 'center',
  },
  count: {
    ...typography.caption,
    textAlign: 'center',
  },
});
