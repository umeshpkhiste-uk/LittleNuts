import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatWeight, itemSubtotalPaise, paiseToRupeesLabel, sumPaise } from '@littlenuts/shared';

import { FavoriteButton } from '@/components/favorite-button';
import { useAddresses } from '@/hooks/addresses/use-addresses';
import { useAddToCart } from '@/hooks/cart/use-cart';
import { useFavorites } from '@/hooks/favorites/use-favorites';
import { useProducts } from '@/hooks/catalog/use-products';
import { useMyOrders } from '@/hooks/orders/use-orders';
import { useProfile } from '@/hooks/profile/use-profile';
import { confirmAction } from '@/lib/confirm-action';
import { showAlert } from '@/lib/show-alert';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { AUTH_LIGHT_COLORS as COLORS } from '@/theme/auth-light-palette';
import { radius, spacing, typography } from '@/theme/tokens';

// Redesigned to match the brand "My Profile" mockup — same light
// cream-and-forest-green look as Home/Categories/Product Details/Cart.
// The mockup's "Wallet & Payment" and "Preferences & Habit Sync" sections
// are left out entirely (no payment-methods or preferences backend to back
// them), and the loyalty-points line under the name is dropped. Stats are
// real: order count and "Saved till Date" (sum of every order's
// discount_paise) come from the customer's own order history, and
// "Favorite Items" comes from the real favorites table (see
// src/hooks/favorites/use-favorites.ts) — not a placeholder.
export function AccountScreen() {
  const session = useAuthStore((state) => state.session);
  const profile = useProfile();
  const orders = useMyOrders();
  const favorites = useFavorites();
  const addresses = useAddresses();
  const products = useProducts({});
  const addToCart = useAddToCart();

  const favoriteProductIds = useMemo(
    () => new Set((favorites.data ?? []).map((favorite) => favorite.product_id)),
    [favorites.data],
  );
  const favoriteProducts = useMemo(
    () => (products.data ?? []).filter((product) => favoriteProductIds.has(product.id)),
    [products.data, favoriteProductIds],
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleDeleteAccount() {
    const confirmed = await confirmAction(
      'Delete your account?',
      'This permanently deletes your LittleNuts account and all its data. This can’t be undone.',
    );
    if (!confirmed) return;
    showAlert(
      'Not available yet',
      'Account deletion isn’t available in the app yet. Please contact support to delete your account.',
    );
  }

  if (!session) {
    return (
      <View style={[styles.empty, { backgroundColor: COLORS.background }]}>
        <Ionicons name="person-circle-outline" size={48} color={COLORS.subtitle} />
        <Text style={styles.emptyTitle}>Log in to LittleNuts</Text>
        <Text style={styles.emptyBody}>
          Log in to manage your addresses, place orders, and track deliveries.
        </Text>
        <Pressable style={styles.emptyButton} onPress={() => router.push('/auth/login')}>
          <Text style={styles.emptyButtonText}>Log In</Text>
        </Pressable>
      </View>
    );
  }

  const ordersCount = orders.data?.length ?? 0;
  const favoritesCount = favorites.data?.length ?? 0;
  const savedTillDate = sumPaise((orders.data ?? []).map((order) => order.discount_paise));

  const displayName = profile.data?.full_name?.trim() || session.user.email || 'LittleNuts Customer';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'L';

  const visibleAddresses = (addresses.data ?? []).slice(0, 2);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: COLORS.background }]}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.pageTitle}>My Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={styles.profileTextWrap}>
          <Text style={styles.profileName}>{displayName}</Text>
          {session.user.email ? (
            <View style={styles.profileMetaRow}>
              <Ionicons name="mail-outline" size={13} color={COLORS.subtitle} />
              <Text style={styles.profileMetaText}>{session.user.email}</Text>
            </View>
          ) : null}
          {profile.data?.phone_number ? (
            <View style={styles.profileMetaRow}>
              <Ionicons name="call-outline" size={13} color={COLORS.subtitle} />
              <Text style={styles.profileMetaText}>{profile.data.phone_number}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatBox value={String(ordersCount)} label="Orders Built" />
        <StatBox value={String(favoritesCount)} label="Favorite Items" />
        <StatBox value={paiseToRupeesLabel(savedTillDate)} label="Saved till Date" />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Delivery Locations</Text>
        <Pressable onPress={() => router.push('/addresses')} hitSlop={8}>
          <Text style={styles.sectionLink}>View All ({addresses.data?.length ?? 0})</Text>
        </Pressable>
      </View>
      {addresses.isLoading ? (
        <ActivityIndicator color={COLORS.button} />
      ) : visibleAddresses.length ? (
        visibleAddresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressIconWrap}>
              <Ionicons name="home" size={16} color={COLORS.accent} />
            </View>
            <View style={styles.addressTextWrap}>
              <View style={styles.addressTitleRow}>
                <Text style={styles.addressTitle}>{address.recipient_name}</Text>
                {address.is_default ? (
                  <View style={styles.defaultTag}>
                    <Text style={styles.defaultTagText}>Default</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={2} style={styles.addressBody}>
                {address.address_line_1}
                {address.address_line_2 ? `, ${address.address_line_2}` : ''}, {address.city}
              </Text>
            </View>
            <Pressable onPress={() => router.push('/addresses')} hitSlop={8} style={styles.addressEditButton}>
              <Ionicons name="pencil" size={14} color={COLORS.heading} />
            </Pressable>
          </View>
        ))
      ) : (
        <Text style={styles.emptySectionText}>No saved addresses yet.</Text>
      )}
      <Pressable style={styles.addAddressButton} onPress={() => router.push('/addresses/new')}>
        <Ionicons name="add" size={16} color={COLORS.heading} />
        <Text style={styles.addAddressButtonText}>Add New Harvest Address</Text>
      </Pressable>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Favorite Dry Fruits & Seeds</Text>
        <Pressable onPress={() => router.push('/(customer)/(tabs)')} hitSlop={8}>
          <Text style={styles.sectionLink}>Manage ({favoritesCount})</Text>
        </Pressable>
      </View>
      {favorites.isLoading || products.isLoading ? (
        <ActivityIndicator color={COLORS.button} />
      ) : favoriteProducts.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favoritesRow}>
          {favoriteProducts.map((product) => {
            const price = itemSubtotalPaise(product.price_per_kg_paise, product.min_order_weight_g);
            const outOfStock = product.stock_weight_g < product.min_order_weight_g;
            return (
              <Pressable
                key={product.id}
                onPress={() => router.push(`/product/${product.id}`)}
                style={styles.favoriteCard}
              >
                <View style={styles.favoriteImageWrap}>
                  {product.image_urls[0] ? (
                    <ExpoImage
                      source={{ uri: product.image_urls[0] }}
                      style={styles.favoriteImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.favoriteImage, styles.favoriteImagePlaceholder]}>
                      <Ionicons name="nutrition-outline" size={24} color={COLORS.subtitle} />
                    </View>
                  )}
                  <FavoriteButton
                    productId={product.id}
                    size={14}
                    activeColor={COLORS.forgot}
                    inactiveColor={COLORS.subtitle}
                    style={styles.favoriteHeart}
                  />
                </View>
                <Text numberOfLines={1} style={styles.favoriteName}>
                  {product.name}
                </Text>
                <View style={styles.favoriteBottomRow}>
                  <View>
                    <Text style={styles.favoriteWeight}>{formatWeight(product.min_order_weight_g)}</Text>
                    <Text style={styles.favoritePrice}>{paiseToRupeesLabel(price)}</Text>
                  </View>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      if (outOfStock) return;
                      addToCart.mutate({ productId: product.id, quantityG: product.min_order_weight_g });
                    }}
                    disabled={outOfStock}
                    hitSlop={8}
                    style={[styles.favoriteAddButton, outOfStock && styles.favoriteAddButtonDisabled]}
                  >
                    <Ionicons name="add" size={16} color={COLORS.card} />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.emptySectionText}>
          No favorites yet — tap the heart icon on any product to save it here.
        </Text>
      )}

      <Pressable onPress={() => router.push('/settings')} style={styles.linkRow}>
        <Ionicons name="help-circle-outline" size={18} color={COLORS.heading} />
        <Text style={styles.linkRowText}>Customer Concierge & FAQ</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.subtitle} />
      </Pressable>
      <Pressable onPress={() => router.push('/settings')} style={styles.linkRow}>
        <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.heading} />
        <Text style={styles.linkRowText}>Organic Harvest Guarantee & Privacy</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.subtitle} />
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={16} color={COLORS.forgot} />
        <Text style={styles.signOutText}>Sign Out of LittleNuts</Text>
      </Pressable>
      <Pressable onPress={handleDeleteAccount} hitSlop={8} style={styles.deleteAccountButton}>
        <Text style={styles.deleteAccountText}>Delete My Account</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/auth/admin-login')}
        hitSlop={8}
        style={styles.adminLink}
      >
        <Text style={styles.adminLinkText}>Store Admin</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: COLORS.card,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    ...typography.h1,
    color: COLORS.heading,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: COLORS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...typography.h2,
    color: COLORS.card,
  },
  profileTextWrap: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...typography.bodyStrong,
    fontSize: 17,
    color: COLORS.heading,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileMetaText: {
    ...typography.caption,
    color: COLORS.subtitle,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: spacing.sm + 2,
    gap: 2,
  },
  statValue: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: COLORS.heading,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    color: COLORS.subtitle,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: COLORS.heading,
  },
  sectionLink: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.accent,
  },
  emptySectionText: {
    ...typography.caption,
    color: COLORS.subtitle,
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
  addressEditButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
  },
  addAddressButtonText: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: COLORS.heading,
  },
  favoritesRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  favoriteCard: {
    width: 140,
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  favoriteImageWrap: {
    width: '100%',
    aspectRatio: 1,
  },
  favoriteImage: {
    width: '100%',
    height: '100%',
  },
  favoriteImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  favoriteHeart: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteName: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.heading,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  favoriteBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: spacing.sm,
    paddingTop: 2,
  },
  favoriteWeight: {
    ...typography.caption,
    fontSize: 10,
    color: COLORS.subtitle,
  },
  favoritePrice: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: COLORS.heading,
  },
  favoriteAddButton: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: COLORS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteAddButtonDisabled: {
    opacity: 0.4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: COLORS.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  linkRowText: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: COLORS.heading,
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: COLORS.forgot,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  signOutText: {
    ...typography.bodyStrong,
    color: COLORS.forgot,
  },
  deleteAccountButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  deleteAccountText: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.subtitle,
    textDecorationLine: 'underline',
  },
  adminLink: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  adminLinkText: {
    ...typography.caption,
    color: COLORS.subtitle,
  },
});
