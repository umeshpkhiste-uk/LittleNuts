import { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatWeight, itemSubtotalPaise, paiseToRupeesLabel, sumPaise } from '@littlenuts/shared';

import { useCart, useRemoveCartItem, useSetCartItemQuantity } from '@/hooks/cart/use-cart';
import { useAddresses } from '@/hooks/addresses/use-addresses';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useStoreSettings } from '@/hooks/checkout/use-store-settings';
import { useAuthStore } from '@/stores/auth-store';
import type { AppTheme } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

// Redesigned to match the brand mockup (harvest cart screen) — same light
// cream-and-forest-green look as Home/Categories/Product Details. The
// mockup's "Daily Life Subscription" and promo-code sections are
// intentionally left out (no subscription/promo backend exists). The bill
// summary is otherwise real: subtotal, delivery fee, and tax come from
// useStoreSettings, the same source checkout uses.

function shortCategoryLabel(name: string): string {
  return name.split('/')[0].trim();
}

export function CartScreen() {
  const COLORS = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const session = useAuthStore((state) => state.session);
  const cart = useCart();
  const categories = useCategories();
  const addresses = useAddresses();
  const settings = useStoreSettings();
  const setQuantity = useSetCartItemQuantity();
  const removeItem = useRemoveCartItem();

  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category])),
    [categories.data],
  );

  if (!session) {
    return (
      <View style={[styles.empty, { backgroundColor: COLORS.background }]}>
        <Ionicons name="bag-handle-outline" size={40} color={COLORS.subtitle} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyBody}>Log in to add items and build your cart.</Text>
        <Pressable style={styles.emptyButton} onPress={() => router.push('/auth/login')}>
          <Text style={styles.emptyButtonText}>Log In</Text>
        </Pressable>
      </View>
    );
  }

  if (cart.isLoading) {
    return (
      <View style={[styles.empty, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator color={COLORS.button} />
      </View>
    );
  }

  const items = cart.data?.items ?? [];

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: COLORS.background }]}>
        <Ionicons name="bag-handle-outline" size={40} color={COLORS.subtitle} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyBody}>Browse products and add something you love.</Text>
        <Pressable style={styles.emptyButton} onPress={() => router.push('/(customer)/(tabs)')}>
          <Text style={styles.emptyButtonText}>Browse Products</Text>
        </Pressable>
      </View>
    );
  }

  const subtotal = sumPaise(
    items.map((item) => itemSubtotalPaise(item.product.price_per_kg_paise, item.quantity_g)),
  );
  const deliveryFee = (() => {
    if (!settings.data) return 0;
    if (
      settings.data.free_delivery_min_order_paise !== null &&
      subtotal >= settings.data.free_delivery_min_order_paise
    ) {
      return 0;
    }
    return settings.data.delivery_fee_paise;
  })();
  const tax = settings.data ? Math.round((subtotal * settings.data.tax_rate_bps) / 10000) : 0;
  const total = subtotal + deliveryFee + tax;

  const defaultAddress = addresses.data?.find((a) => a.is_default) ?? addresses.data?.[0];

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="cover" />
          <View style={styles.headerText}>
            <Text style={styles.brand}>LittleNuts</Text>
            <View style={styles.deliveryRow}>
              <Ionicons name="location" size={12} color={COLORS.accent} />
              <Text style={styles.deliveryText}>Deliver to Home · 24 mins</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/(customer)/(tabs)')}
            hitSlop={8}
            style={styles.headerIcon}
          >
            <Ionicons name="search" size={18} color={COLORS.heading} />
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={18} color={COLORS.heading} />
          </Pressable>
          <Pressable onPress={() => router.push('/account')} hitSlop={8} style={styles.avatarButton}>
            <Ionicons name="person" size={16} color={COLORS.primaryText} />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleTextWrap}>
            <Text style={styles.title}>Your Harvest Cart</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          <View style={styles.organicPill}>
            <Ionicons name="leaf" size={12} color={COLORS.accent} />
            <Text style={styles.organicPillText}>100% Organic</Text>
          </View>
        </View>

        {items.map((item) => {
          const category = categoryById.get(item.product.category_id);
          const lineTotal = itemSubtotalPaise(item.product.price_per_kg_paise, item.quantity_g);
          const step = item.product.weight_increment_g;

          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemImageWrap}>
                {item.product.image_urls[0] ? (
                  <ExpoImage
                    source={{ uri: item.product.image_urls[0] }}
                    style={styles.itemImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Ionicons name="nutrition-outline" size={24} color={COLORS.subtitle} />
                  </View>
                )}
              </View>

              <View style={styles.itemBody}>
                <View style={styles.itemTagRow}>
                  <View style={styles.itemTag}>
                    <Text style={styles.itemTagText}>{formatWeight(item.quantity_g)}</Text>
                  </View>
                  {category ? (
                    <View style={styles.itemTag}>
                      <Text style={styles.itemTagText}>{shortCategoryLabel(category.name)}</Text>
                    </View>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={styles.itemName}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemPrice}>{paiseToRupeesLabel(lineTotal)}</Text>
              </View>

              <View style={styles.itemActions}>
                <Pressable
                  onPress={() => removeItem.mutate({ cartItemId: item.id })}
                  hitSlop={8}
                  style={styles.trashButton}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.subtitle} />
                </Pressable>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() =>
                      setQuantity.mutate({
                        cartItemId: item.id,
                        quantityG: Math.max(0, item.quantity_g - step),
                      })
                    }
                    hitSlop={6}
                    style={styles.stepperButton}
                  >
                    <Ionicons name="remove" size={14} color={COLORS.heading} />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setQuantity.mutate({ cartItemId: item.id, quantityG: item.quantity_g + step })
                    }
                    hitSlop={6}
                    style={[styles.stepperButton, styles.stepperButtonPrimary]}
                  >
                    <Ionicons name="add" size={14} color={COLORS.primaryText} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.addressCard}>
          <View style={styles.addressIconWrap}>
            <Ionicons name="location" size={18} color={COLORS.accent} />
          </View>
          <View style={styles.addressTextWrap}>
            <View style={styles.addressTitleRow}>
              <Text style={styles.addressTitle}>
                {defaultAddress ? 'Delivery Address' : 'No Address Yet'}
              </Text>
              {defaultAddress?.is_default ? (
                <View style={styles.defaultTag}>
                  <Text style={styles.defaultTagText}>Default</Text>
                </View>
              ) : null}
            </View>
            {defaultAddress ? (
              <Text numberOfLines={2} style={styles.addressBody}>
                {defaultAddress.address_line_1}
                {defaultAddress.address_line_2 ? `, ${defaultAddress.address_line_2}` : ''}, {defaultAddress.city}
              </Text>
            ) : (
              <Text style={styles.addressBody}>Add a delivery address at checkout.</Text>
            )}
            <Text style={styles.addressEta}>Estimated delivery within 24–48 hours</Text>
          </View>
          <Pressable onPress={() => router.push('/addresses')} hitSlop={8} style={styles.addressEditButton}>
            <Ionicons name="pencil" size={14} color={COLORS.heading} />
          </Pressable>
        </View>

        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Summary</Text>
          <BillRow label="Cart Subtotal" value={paiseToRupeesLabel(subtotal)} />
          <BillRow label="Freshness Nitrogen Packing" value="FREE" highlight />
          <BillRow
            label="Carbon-Neutral Delivery"
            value={deliveryFee === 0 ? 'FREE' : paiseToRupeesLabel(deliveryFee)}
            highlight={deliveryFee === 0}
          />
          {tax > 0 ? <BillRow label="Tax" value={paiseToRupeesLabel(tax)} /> : null}

          <View style={styles.billDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalHint}>Incl. all taxes and natural packaging</Text>
            </View>
            <Text style={styles.totalValue}>{paiseToRupeesLabel(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.checkoutButton} onPress={() => router.push('/checkout')}>
          <Ionicons name="lock-closed" size={16} color={COLORS.primaryText} />
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutButtonPrice}>{paiseToRupeesLabel(total)}</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primaryText} />
        </Pressable>
        <Text style={styles.footerNote}>
          Safe 256-bit encrypted checkout with 100% crisp guarantee
        </Text>
      </View>
    </View>
  );
}

function BillRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const COLORS = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.billRow}>
      <Text style={styles.billLabel}>{label}</Text>
      <Text style={[styles.billValue, highlight && styles.billValueHighlight]}>{value}</Text>
    </View>
  );
}

const createStyles = (COLORS: AppTheme) =>
  StyleSheet.create({
  screen: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h1,
    color: COLORS.heading,
  },
  emptyBody: {
    ...typography.body,
    color: COLORS.subtitle,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: COLORS.button,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  emptyButtonText: {
    ...typography.bodyStrong,
    color: COLORS.primaryText,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleTextWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: COLORS.heading,
  },
  countPill: {
    backgroundColor: COLORS.badgeBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  countPillText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.badgeText,
  },
  organicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E7ECDD',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  organicPillText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#3F4B35',
  },
  itemCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  itemImageWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemTagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  itemTag: {
    backgroundColor: COLORS.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  itemTagText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.subtitle,
  },
  itemName: {
    ...typography.bodyStrong,
    color: COLORS.heading,
  },
  itemPrice: {
    ...typography.bodyStrong,
    color: COLORS.heading,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  trashButton: {
    padding: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperButton: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonPrimary: {
    backgroundColor: COLORS.button,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: spacing.md,
  },
  addressIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextWrap: {
    flex: 1,
    gap: 2,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addressTitle: {
    ...typography.bodyStrong,
    color: COLORS.heading,
  },
  defaultTag: {
    backgroundColor: COLORS.badgeBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  defaultTagText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.badgeText,
  },
  addressBody: {
    ...typography.caption,
    color: COLORS.subtitle,
  },
  addressEta: {
    ...typography.caption,
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  addressEditButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billCard: {
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  billTitle: {
    ...typography.bodyStrong,
    color: COLORS.heading,
    marginBottom: spacing.xs,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billLabel: {
    ...typography.caption,
    color: COLORS.subtitle,
  },
  billValue: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.heading,
  },
  billValueHighlight: {
    color: COLORS.accent,
  },
  billDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: COLORS.heading,
  },
  totalHint: {
    ...typography.caption,
    fontSize: 11,
    color: COLORS.subtitle,
  },
  totalValue: {
    ...typography.display,
    color: COLORS.heading,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.button,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    gap: spacing.sm,
  },
  checkoutButtonText: {
    ...typography.bodyStrong,
    color: COLORS.primaryText,
    flex: 1,
  },
  checkoutButtonPrice: {
    ...typography.bodyStrong,
    color: COLORS.primaryText,
  },
  footerNote: {
    ...typography.caption,
    fontSize: 11,
    color: COLORS.subtitle,
    textAlign: 'center',
  },
});
