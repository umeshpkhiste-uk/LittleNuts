import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  clampToIncrement,
  formatWeight,
  isValidQuantity,
  itemSubtotalPaise,
  paiseToRupeesLabel,
  type Category,
  type Product,
} from '@littlenuts/shared';

import { useAddToCart } from '@/hooks/cart/use-cart';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useProducts } from '@/hooks/catalog/use-products';
import { AUTH_LIGHT_COLORS as COLORS } from '@/theme/auth-light-palette';
import { radius, spacing, typography } from '@/theme/tokens';

// Logged-in landing page, redesigned to match the brand mockup at
// design-assets/App Design/stitch_littlenuts_dryfruit_shopping_app/
// 5. littlenuts_dry_fruits_seeds_catalog/screen.png — same light
// cream-and-forest-green look as the auth screens (see
// src/theme/auth-light-palette.ts), replacing the app's dark glass
// theme on this one screen. Shows the real catalog (all active
// products from Supabase), not the mockup's placeholder products —
// there's no rating/wishlist field on Product, so those bits of the
// mockup are either omitted (rating) or a non-persisted UI stub (heart).

type FilterGroup = 'all' | 'nuts' | 'seeds' | 'dried-fruits' | 'mixes';

const FILTERS: { key: FilterGroup; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'nuts', label: 'Nuts' },
  { key: 'seeds', label: 'Seeds' },
  { key: 'dried-fruits', label: 'Dried Fruits' },
  { key: 'mixes', label: 'Mixes' },
];

// Which category slug belongs to which quick-filter chip. Categories not
// listed here would only show under "All".
const GROUP_BY_SLUG: Record<string, FilterGroup> = {
  'almonds-badam': 'nuts',
  'cashews-kaju': 'nuts',
  'pistachios-pista': 'nuts',
  'walnuts-akhrot': 'nuts',
  seeds: 'seeds',
  'raisins-kishmish': 'dried-fruits',
  'dates-khajoor': 'dried-fruits',
  'figs-anjeer': 'dried-fruits',
  'dried-apricots': 'dried-fruits',
  'mixed-dry-fruits': 'mixes',
};

const WEIGHT_OPTIONS = [250, 500, 1000] as const;
type WeightOption = (typeof WEIGHT_OPTIONS)[number];

type SortMode = 'featured' | 'price-asc' | 'price-desc';
const SORT_ORDER: SortMode[] = ['featured', 'price-asc', 'price-desc'];
const SORT_LABELS: Record<SortMode, string> = {
  featured: 'Best Seller',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
};

const TAG_PALETTE = [
  { bg: '#E7ECDD', text: '#3F4B35' },
  { bg: '#F3E0C7', text: '#8A5A2A' },
  { bg: '#F6D9D3', text: '#B4432E' },
  { bg: '#DCEAF0', text: '#2E6B82' },
  { bg: '#F0E3F6', text: '#6B3F82' },
  { bg: '#FBE8B8', text: '#8A6A1A' },
] as const;

// Resolves the quick weight toggle (250g/500g/1kg) to the nearest weight
// this specific product can actually be ordered in, since presets aren't
// valid for every product's min/max/increment.
function resolveDisplayWeight(product: Product, preset: number): number {
  if (isValidQuantity(preset, product.min_order_weight_g, product.max_order_weight_g, product.weight_increment_g)) {
    return preset;
  }
  const clamped = clampToIncrement(Math.max(preset, product.min_order_weight_g), product.weight_increment_g);
  if (isValidQuantity(clamped, product.min_order_weight_g, product.max_order_weight_g, product.weight_increment_g)) {
    return clamped;
  }
  return product.min_order_weight_g;
}

function shortCategoryLabel(name: string): string {
  return name.split('/')[0].trim();
}

export function HomeScreen() {
  const [group, setGroup] = useState<FilterGroup>('all');
  const [weightPreset, setWeightPreset] = useState<WeightOption>(250);
  const [sortMode, setSortMode] = useState<SortMode>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  const categories = useCategories();
  const products = useProducts({});

  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category])),
    [categories.data],
  );
  const categoryIdToGroup = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, GROUP_BY_SLUG[category.slug]])),
    [categories.data],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      (products.data ?? []).filter((product) => {
        if (group !== 'all' && categoryIdToGroup.get(product.category_id) !== group) return false;
        if (normalizedQuery && !product.name.toLowerCase().includes(normalizedQuery)) return false;
        return true;
      }),
    [products.data, group, categoryIdToGroup, normalizedQuery],
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortMode === 'featured') {
      list.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      return list;
    }
    list.sort((a, b) => {
      const priceA = itemSubtotalPaise(a.price_per_kg_paise, resolveDisplayWeight(a, weightPreset));
      const priceB = itemSubtotalPaise(b.price_per_kg_paise, resolveDisplayWeight(b, weightPreset));
      return sortMode === 'price-asc' ? priceA - priceB : priceB - priceA;
    });
    return list;
  }, [filtered, sortMode, weightPreset]);

  const isLoading = products.isLoading || categories.isLoading;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: COLORS.background }]}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="cover" />
        <View style={styles.headerText}>
          <Text style={styles.brand}>LittleNuts</Text>
          <View style={styles.deliveryRow}>
            <Ionicons name="location" size={12} color={COLORS.accent} />
            <Text style={styles.deliveryText}>Deliver to Home · 24 mins</Text>
          </View>
        </View>
        <Pressable onPress={() => searchInputRef.current?.focus()} hitSlop={8} style={styles.headerIcon}>
          <Ionicons name="search" size={18} color={COLORS.heading} />
        </Pressable>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={18} color={COLORS.heading} />
        </Pressable>
        <Pressable onPress={() => router.push('/account')} hitSlop={8} style={styles.avatarButton}>
          <Ionicons name="person" size={16} color={COLORS.card} />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.subtitle} />
        <TextInput
          ref={searchInputRef}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search walnuts, dates, raw seeds..."
          placeholderTextColor={COLORS.subtitle}
          style={styles.searchInput}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.subtitle} />
          </Pressable>
        ) : (
          <Ionicons name="options-outline" size={18} color={COLORS.subtitle} />
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((filter) => {
          const active = filter.key === group;
          return (
            <Pressable
              key={filter.key}
              onPress={() => {
                setGroup(filter.key);
                setSearchQuery('');
              }}
              style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}
            >
              <Text style={[styles.filterLabel, { color: active ? COLORS.card : COLORS.heading }]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sortRow}>
        <Pressable
          onPress={() => setSortMode(SORT_ORDER[(SORT_ORDER.indexOf(sortMode) + 1) % SORT_ORDER.length])}
          style={styles.sortButton}
        >
          <Text style={styles.sortLabel}>Sort: {SORT_LABELS[sortMode]}</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.heading} />
        </Pressable>
        <View style={styles.weightRow}>
          {WEIGHT_OPTIONS.map((weight) => {
            const active = weight === weightPreset;
            return (
              <Pressable
                key={weight}
                onPress={() => setWeightPreset(weight)}
                style={[styles.weightPill, active ? styles.filterPillActive : styles.filterPillInactive]}
              >
                <Text style={[styles.weightLabel, { color: active ? COLORS.card : COLORS.heading }]}>
                  {formatWeight(weight)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.promoBanner}>
        <View style={styles.promoText}>
          <View style={styles.promoTag}>
            <Ionicons name="sparkles-outline" size={12} color={COLORS.badgeDot} />
            <Text style={styles.promoTagText}>HANDPICKED HARVEST</Text>
          </View>
          <Text style={styles.promoTitle}>Naturally Sun-Dried & Raw</Text>
          <Text style={styles.promoSubtitle}>Zero added sugar, 100% whole fruits & super seeds.</Text>
        </View>
        <View style={styles.promoIconWrap}>
          <Ionicons name="leaf-outline" size={28} color={COLORS.card} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Boutique Collection</Text>
          <Text style={styles.sectionCount}>{sorted.length} items</Text>
        </View>
        <Pressable
          onPress={() => setSortMode('featured')}
          hitSlop={8}
          style={styles.dailyPicksLink}
        >
          <Ionicons name="flash-outline" size={14} color={COLORS.accent} />
          <Text style={styles.dailyPicksText}>Daily Picks</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.button} style={styles.loading} />
      ) : sorted.length ? (
        <View style={styles.grid}>
          {sorted.map((product, index) => (
            <CatalogCard
              key={product.id}
              product={product}
              category={categoryById.get(product.category_id)}
              tagColor={TAG_PALETTE[index % TAG_PALETTE.length]}
              weightPreset={weightPreset}
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

function CatalogCard({
  product,
  category,
  tagColor,
  weightPreset,
  onPress,
}: {
  product: Product;
  category: Category | undefined;
  tagColor: (typeof TAG_PALETTE)[number];
  weightPreset: WeightOption;
  onPress: () => void;
}) {
  const addToCart = useAddToCart();
  const [liked, setLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const displayWeight = resolveDisplayWeight(product, weightPreset);
  const price = itemSubtotalPaise(product.price_per_kg_paise, displayWeight);
  const imageUri = product.image_urls[0];
  const outOfStock = product.stock_weight_g < product.min_order_weight_g;

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
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            setLiked((v) => !v);
          }}
          hitSlop={8}
          style={styles.cardHeart}
        >
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? tagColor.text : COLORS.subtitle} />
        </Pressable>
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
        {product.short_description ? (
          <Text numberOfLines={1} style={styles.cardSubtitle}>
            {product.short_description}
          </Text>
        ) : null}

        <View style={styles.cardDivider} />

        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.cardWeight}>{formatWeight(displayWeight)}</Text>
            <Text style={styles.cardPrice}>{paiseToRupeesLabel(price)}</Text>
          </View>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              if (outOfStock) return;
              addToCart.mutate({ productId: product.id, quantityG: displayWeight });
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1200);
            }}
            disabled={outOfStock || addToCart.isPending}
            hitSlop={8}
            style={[styles.cardAddButton, outOfStock && styles.cardAddButtonDisabled]}
          >
            <Ionicons name={justAdded ? 'checkmark' : 'add'} size={18} color={COLORS.card} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  brand: {
    ...typography.bodyStrong,
    color: COLORS.heading,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryText: {
    ...typography.caption,
    color: COLORS.subtitle,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: COLORS.button,
    alignItems: 'center',
    justifyContent: 'center',
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
  filterRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  filterPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
  },
  filterPillInactive: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  filterLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.heading,
  },
  weightRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  weightPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },
  weightLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: COLORS.button,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  promoText: {
    flex: 1,
    gap: spacing.xs,
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  promoTagText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: COLORS.badgeDot,
  },
  promoTitle: {
    ...typography.h1,
    color: COLORS.card,
  },
  promoSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.72)',
  },
  promoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h1,
    color: COLORS.heading,
  },
  sectionCount: {
    ...typography.caption,
    color: COLORS.subtitle,
  },
  dailyPicksLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dailyPicksText: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.accent,
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
    color: COLORS.card,
  },
  cardBody: {
    padding: spacing.sm,
    gap: 2,
  },
  cardName: {
    ...typography.bodyStrong,
    color: COLORS.heading,
  },
  cardSubtitle: {
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardWeight: {
    ...typography.caption,
    color: COLORS.subtitle,
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
});
