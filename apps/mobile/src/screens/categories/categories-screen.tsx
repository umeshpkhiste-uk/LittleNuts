import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  formatWeight,
  itemSubtotalPaise,
  paiseToRupeesLabel,
  type Category,
  type Product,
} from '@littlenuts/shared';

import { useAddToCart, useCart, useSetCartItemQuantity } from '@/hooks/cart/use-cart';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useProducts } from '@/hooks/catalog/use-products';
import { FavoriteButton } from '@/components/favorite-button';
import type { AppTheme } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

// Redesigned to match the brand mockup (categories/catalog grid screen) —
// same light cream-and-forest-green look as Home (see
// src/theme/colors.ts). Uses the real catalog and the same
// product photos as Home, not fictional mockup placeholders. No star
// rating (no backing field); heart/favorite is a non-persisted UI stub
// like on Home; the +/- quantity control is real, backed by the same
// cart used on Cart/Checkout.

const TAG_PALETTE = [
  { bg: '#E7ECDD', text: '#3F4B35' },
  { bg: '#F3E0C7', text: '#8A5A2A' },
  { bg: '#F6D9D3', text: '#B4432E' },
  { bg: '#DCEAF0', text: '#2E6B82' },
  { bg: '#F0E3F6', text: '#6B3F82' },
  { bg: '#FBE8B8', text: '#8A6A1A' },
] as const;

function shortCategoryLabel(name: string): string {
  return name.split('/')[0].trim();
}

export function CategoriesScreen() {
  const COLORS = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [categoryId, setCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const categories = useCategories();
  const products = useProducts({});
  const cart = useCart();

  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category])),
    [categories.data],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      (products.data ?? []).filter((product) => {
        if (categoryId !== 'all' && product.category_id !== categoryId) return false;
        if (normalizedQuery && !product.name.toLowerCase().includes(normalizedQuery)) return false;
        return true;
      }),
    [products.data, categoryId, normalizedQuery],
  );

  const activeCategory = categoryId === 'all' ? undefined : categoryById.get(categoryId);
  const sectionTitle = activeCategory ? shortCategoryLabel(activeCategory.name) : 'Daily Essentials';
  const sectionSubtitle = normalizedQuery
    ? `Results for "${searchQuery.trim()}"`
    : (activeCategory?.description ?? 'Handpicked whole harvest for today');

  const cartCount = cart.data?.items.length ?? 0;
  const isLoading = products.isLoading || categories.isLoading;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: COLORS.background }]}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Categories</Text>
        <Pressable onPress={() => router.push('/cart')} hitSlop={8} style={styles.cartButton}>
          <Ionicons name="cart-outline" size={18} color={COLORS.heading} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.subtitle} />
        <TextInput
          ref={searchInputRef}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text) setCategoryId('all');
          }}
          placeholder="Search walnuts, dates, raw seeds..."
          placeholderTextColor={COLORS.subtitle}
          style={styles.searchInput}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.subtitle} />
          </Pressable>
        ) : (
          <Pressable hitSlop={8}>
            <Ionicons name="mic-outline" size={18} color={COLORS.subtitle} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        <Pressable
          onPress={() => {
            setCategoryId('all');
            setSearchQuery('');
          }}
          style={[styles.pill, categoryId === 'all' ? styles.pillActive : styles.pillInactive]}
        >
          <Text style={[styles.pillLabel, { color: categoryId === 'all' ? COLORS.primaryText : COLORS.heading }]}>
            All
          </Text>
        </Pressable>
        {categories.data?.map((category) => {
          const active = categoryId === category.id;
          return (
            <Pressable
              key={category.id}
              onPress={() => {
                setCategoryId(category.id);
                setSearchQuery('');
              }}
              style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
            >
              <Text style={[styles.pillLabel, { color: active ? COLORS.primaryText : COLORS.heading }]}>
                {shortCategoryLabel(category.name)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <Text numberOfLines={1} style={styles.sectionSubtitle}>
          {sectionSubtitle}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.button} style={styles.loading} />
      ) : filtered.length ? (
        <View style={styles.grid}>
          {filtered.map((product, index) => (
            <CategoryProductCard
              key={product.id}
              product={product}
              category={categoryById.get(product.category_id)}
              tagColor={TAG_PALETTE[index % TAG_PALETTE.length]}
              onPress={() => router.push(`/product/${product.id}`)}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No products match your search.</Text>
      )}
    </ScrollView>
  );
}

function CategoryProductCard({
  product,
  category,
  tagColor,
  onPress,
}: {
  product: Product;
  category: Category | undefined;
  tagColor: (typeof TAG_PALETTE)[number];
  onPress: () => void;
}) {
  const COLORS = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const cart = useCart();
  const addToCart = useAddToCart();
  const setQuantity = useSetCartItemQuantity();

  const cartItem = cart.data?.items.find((item) => item.product_id === product.id);
  const displayWeight = cartItem?.quantity_g ?? product.min_order_weight_g;
  const price = itemSubtotalPaise(product.price_per_kg_paise, displayWeight);
  const imageUri = product.image_urls[0];
  const outOfStock = product.stock_weight_g < product.min_order_weight_g;
  const step = product.weight_increment_g;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardImageWrap}>
        {imageUri ? (
          <ExpoImage source={{ uri: imageUri }} style={styles.cardImage} contentFit="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="nutrition-outline" size={32} color={COLORS.subtitle} />
          </View>
        )}
        {category ? (
          <View style={[styles.cardTag, { backgroundColor: tagColor.bg }]}>
            <Text style={[styles.cardTagText, { color: tagColor.text }]} numberOfLines={1}>
              {shortCategoryLabel(category.name)}
            </Text>
          </View>
        ) : null}
        <FavoriteButton
          productId={product.id}
          activeColor={tagColor.text}
          inactiveColor={COLORS.subtitle}
          style={styles.cardHeart}
        />
        {outOfStock ? (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of stock</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={styles.cardName}>
          {product.name}
        </Text>
        <Text style={styles.cardPack}>{formatWeight(product.min_order_weight_g)} pack</Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardPrice}>{paiseToRupeesLabel(price)}</Text>

          {outOfStock ? (
            <View style={[styles.cardAddButton, styles.cardAddButtonDisabled]}>
              <Ionicons name="add" size={18} color={COLORS.primaryText} />
            </View>
          ) : cartItem ? (
            <View style={styles.stepper}>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setQuantity.mutate({
                    cartItemId: cartItem.id,
                    quantityG: Math.max(0, cartItem.quantity_g - step),
                  });
                }}
                hitSlop={6}
                style={styles.stepperButton}
              >
                <Ionicons name="remove" size={14} color={COLORS.heading} />
              </Pressable>
              <Text numberOfLines={1} style={styles.stepperValue}>
                {formatWeight(cartItem.quantity_g)}
              </Text>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setQuantity.mutate({
                    cartItemId: cartItem.id,
                    quantityG: cartItem.quantity_g + step,
                  });
                }}
                hitSlop={6}
                style={[styles.stepperButton, styles.stepperButtonPrimary]}
              >
                <Ionicons name="add" size={14} color={COLORS.primaryText} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                addToCart.mutate({ productId: product.id, quantityG: product.min_order_weight_g });
              }}
              disabled={addToCart.isPending}
              hitSlop={8}
              style={styles.cardAddButton}
            >
              <Ionicons name="add" size={18} color={COLORS.primaryText} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (COLORS: AppTheme) =>
  StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h1,
    color: COLORS.heading,
  },
  cartButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: COLORS.forgot,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryText,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    backgroundColor: COLORS.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: COLORS.heading,
    paddingVertical: 0,
  },
  pillRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
  },
  pillInactive: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  pillLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    ...typography.h1,
    color: COLORS.heading,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: COLORS.subtitle,
  },
  loading: {
    marginTop: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: COLORS.subtitle,
    textAlign: 'center',
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
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  cardTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    maxWidth: '70%',
  },
  cardTagText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  cardHeart: {
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
  outOfStockBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    borderRadius: radius.sm,
    paddingVertical: 3,
    alignItems: 'center',
    backgroundColor: COLORS.forgot,
  },
  outOfStockText: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.primaryText,
  },
  cardBody: {
    padding: spacing.sm,
    gap: 2,
  },
  cardName: {
    ...typography.bodyStrong,
    color: COLORS.heading,
  },
  cardPack: {
    ...typography.caption,
    color: COLORS.subtitle,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: spacing.xs,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPrice: {
    ...typography.bodyStrong,
    color: COLORS.heading,
  },
  cardAddButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: COLORS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAddButtonDisabled: {
    opacity: 0.4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPrimary: {
    backgroundColor: COLORS.button,
  },
  stepperValue: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.heading,
    minWidth: 40,
    textAlign: 'center',
  },
});
