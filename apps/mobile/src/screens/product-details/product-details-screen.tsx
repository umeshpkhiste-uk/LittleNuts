import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  WEIGHT_PRESETS_G,
  clampToIncrement,
  formatWeight,
  isValidQuantity,
  itemSubtotalPaise,
  paiseToRupeesLabel,
} from '@littlenuts/shared';

import { useAddToCart } from '@/hooks/cart/use-cart';
import { useProduct } from '@/hooks/catalog/use-products';
import { FavoriteButton } from '@/components/favorite-button';
import { goBack } from '@/lib/go-back';
import { useAuthStore } from '@/stores/auth-store';
import { getProductDetailContent, VITALITY_ICON_STYLE } from '@/data/product-detail-content';
import type { AppTheme } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

// Redesigned to match the brand mockup at
// design-assets/App Design/stitch_littlenuts_dryfruit_shopping_app/
// littlenuts_product_detail/screen.png — replaces the old generic
// dark-themed layout entirely. "Preparation & Roast" from the mockup is
// intentionally dropped (no backing data for it). "Daily Vitality
// Impact" and the tasting tip are real, product-specific nutrition
// facts (see src/data/product-detail-content.ts) — fixed editorial
// content sourced once from general nutrition knowledge, not fabricated
// per product at render time.

export function ProductDetailsScreen({ productId }: { productId: string }) {
  const COLORS = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { data: product, isLoading } = useProduct(productId);
  const session = useAuthStore((state) => state.session);
  const addToCart = useAddToCart();

  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [quantityCount, setQuantityCount] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  const presets = useMemo(() => {
    if (!product) return [];
    const matches = WEIGHT_PRESETS_G.filter(
      (g) =>
        g >= product.min_order_weight_g &&
        (product.max_order_weight_g === null || g <= product.max_order_weight_g) &&
        (g - product.min_order_weight_g) % product.weight_increment_g === 0,
    );
    if (matches.length > 0) return matches;
    return [clampToIncrement(product.min_order_weight_g, product.weight_increment_g)];
  }, [product]);

  if (isLoading || !product) {
    return (
      <View style={[styles.loading, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator color={COLORS.button} />
      </View>
    );
  }

  const activeProduct = product;
  const content = getProductDetailContent(activeProduct.slug);

  const portionWeight = selectedWeight ?? presets[0] ?? activeProduct.min_order_weight_g;
  const totalWeight = portionWeight * quantityCount;
  const totalPrice = itemSubtotalPaise(activeProduct.price_per_kg_paise, totalWeight);
  const valid = isValidQuantity(
    portionWeight,
    activeProduct.min_order_weight_g,
    activeProduct.max_order_weight_g,
    activeProduct.weight_increment_g,
  );
  const outOfStock = activeProduct.stock_weight_g < totalWeight;

  async function handleAddToCart() {
    setFeedback(null);
    if (!session) {
      router.push('/auth/login');
      return;
    }
    try {
      await addToCart.mutateAsync({ productId: activeProduct.id, quantityG: totalWeight });
      setFeedback('Added to basket.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not add to basket.');
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => goBack('/(customer)/(tabs)')} hitSlop={8} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={20} color={COLORS.heading} />
          </Pressable>
          <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="cover" />
          <Text style={styles.headerTitle}>Product Details</Text>
          <Pressable onPress={() => router.push('/account')} hitSlop={8} style={styles.avatarButton}>
            <Ionicons name="person" size={16} color={COLORS.primaryText} />
          </Pressable>
        </View>

        <View style={styles.imageCard}>
          <View style={styles.imageWrap}>
            {activeProduct.image_urls[0] ? (
              <ExpoImage
                source={{ uri: activeProduct.image_urls[0] }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Ionicons name="nutrition-outline" size={48} color={COLORS.subtitle} />
              </View>
            )}
            <View style={styles.freshnessTag}>
              <Ionicons name="leaf" size={12} color={COLORS.accent} />
              <Text style={styles.freshnessTagText}>Freshly Handpicked</Text>
            </View>
            <FavoriteButton
              productId={activeProduct.id}
              size={20}
              activeColor={COLORS.forgot}
              inactiveColor={COLORS.forgot}
              style={styles.imageHeartButton}
            />
          </View>
          <Text style={styles.originTag}>{content.originTag}</Text>
        </View>

        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{content.badge}</Text>
        </View>
        <Text style={styles.title}>{activeProduct.name}</Text>
        <Text style={styles.description}>
          {activeProduct.description ?? activeProduct.short_description}
        </Text>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Portion Size</Text>
          <Text style={styles.sectionHint}>FRESH BATCH SEAL</Text>
        </View>
        <View style={styles.presetsRow}>
          {presets.map((g) => {
            const active = portionWeight === g;
            const price = itemSubtotalPaise(activeProduct.price_per_kg_paise, g);
            return (
              <Pressable
                key={g}
                onPress={() => setSelectedWeight(g)}
                style={[styles.presetChip, active ? styles.presetChipActive : styles.presetChipInactive]}
              >
                <Text style={[styles.presetWeight, { color: active ? COLORS.primaryText : COLORS.heading }]}>
                  {formatWeight(g)}
                </Text>
                <Text style={[styles.presetPrice, { color: active ? 'rgba(255,255,255,0.8)' : COLORS.subtitle }]}>
                  {paiseToRupeesLabel(price)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Daily Vitality Impact</Text>
        <View style={styles.vitalityGrid}>
          {content.facts.map((fact) => {
            const style = VITALITY_ICON_STYLE[fact.icon];
            return (
              <View key={fact.title} style={styles.vitalityCard}>
                <View style={[styles.vitalityIconWrap, { backgroundColor: style.bg }]}>
                  <Ionicons name={style.icon} size={18} color={style.text} />
                </View>
                <View style={styles.vitalityTextWrap}>
                  <Text numberOfLines={1} style={styles.vitalityTitle}>
                    {fact.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.vitalitySubtitle}>
                    {fact.subtitle}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={18} color={COLORS.heading} />
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Tasting Tip</Text>
            <Text style={styles.tipBody}>{content.tastingTip}</Text>
          </View>
        </View>

        {!valid ? (
          <Text style={styles.warning}>
            Quantity must be between {formatWeight(activeProduct.min_order_weight_g)} and{' '}
            {activeProduct.max_order_weight_g ? formatWeight(activeProduct.max_order_weight_g) : 'no limit'}.
          </Text>
        ) : null}
        {outOfStock ? (
          <Text style={styles.warning}>Not enough stock available for this quantity.</Text>
        ) : null}
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>TOTAL</Text>
          <Text style={styles.footerTotal}>{paiseToRupeesLabel(totalPrice)}</Text>
        </View>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setQuantityCount((n) => Math.max(1, n - 1))}
            hitSlop={6}
            style={styles.stepperButton}
          >
            <Ionicons name="remove" size={16} color={COLORS.heading} />
          </Pressable>
          <Text style={styles.stepperValue}>{quantityCount}</Text>
          <Pressable
            onPress={() => setQuantityCount((n) => n + 1)}
            hitSlop={6}
            style={[styles.stepperButton, styles.stepperButtonPrimary]}
          >
            <Ionicons name="add" size={16} color={COLORS.primaryText} />
          </Pressable>
        </View>
        <Pressable
          onPress={handleAddToCart}
          disabled={!valid || outOfStock || addToCart.isPending}
          style={[styles.addButton, (!valid || outOfStock) && styles.addButtonDisabled]}
        >
          <Ionicons name="bag-handle-outline" size={16} color={COLORS.primaryText} />
          <Text style={styles.addButtonText}>
            {session ? 'Add to Basket' : 'Log In to Add'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (COLORS: AppTheme) =>
  StyleSheet.create({
  screen: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl * 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
  },
  headerTitle: {
    ...typography.bodyStrong,
    flex: 1,
    color: COLORS.heading,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: COLORS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCard: {
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  freshnessTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  freshnessTagText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.heading,
  },
  imageHeartButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originTag: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    color: COLORS.subtitle,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E0C7',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgePillText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#8A5A2A',
  },
  title: {
    ...typography.display,
    color: COLORS.heading,
  },
  description: {
    ...typography.body,
    color: COLORS.subtitle,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: 17,
    color: COLORS.heading,
    marginTop: spacing.md,
  },
  sectionHint: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#8A5A2A',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetChip: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 2,
  },
  presetChipActive: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
  },
  presetChipInactive: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  presetWeight: {
    ...typography.bodyStrong,
  },
  presetPrice: {
    ...typography.caption,
    fontSize: 12,
  },
  vitalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  vitalityCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: COLORS.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: spacing.sm,
  },
  vitalityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalityTextWrap: {
    flex: 1,
  },
  vitalityTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.heading,
  },
  vitalitySubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: COLORS.subtitle,
  },
  tipCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextWrap: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    ...typography.bodyStrong,
    color: COLORS.heading,
  },
  tipBody: {
    ...typography.caption,
    color: COLORS.subtitle,
    lineHeight: 18,
  },
  warning: {
    ...typography.caption,
    color: COLORS.forgot,
    marginTop: spacing.sm,
  },
  feedback: {
    ...typography.caption,
    color: COLORS.accent,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: spacing.md,
  },
  footerLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.subtitle,
  },
  footerTotal: {
    ...typography.bodyStrong,
    fontSize: 18,
    color: COLORS.heading,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: COLORS.background,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPrimary: {
    backgroundColor: COLORS.button,
  },
  stepperValue: {
    ...typography.bodyStrong,
    minWidth: 20,
    textAlign: 'center',
    color: COLORS.heading,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: COLORS.button,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...typography.bodyStrong,
    color: COLORS.primaryText,
  },
});
