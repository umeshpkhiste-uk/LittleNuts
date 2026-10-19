import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { paiseToRupeesLabel, sumPaise } from '@littlenuts/shared';

import { useAddresses } from '@/hooks/addresses/use-addresses';
import { useFavorites } from '@/hooks/favorites/use-favorites';
import { useMyOrders } from '@/hooks/orders/use-orders';
import { useProfile } from '@/hooks/profile/use-profile';
import { confirmAction } from '@/lib/confirm-action';
import { showAlert } from '@/lib/show-alert';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

// Profile hub: a profile card + real stats, then a menu into the bigger
// sub-areas (My Orders, Address, Favorite, Settings) rather than cramming
// everything onto one page — see src/screens/addresses, src/screens/
// favorites, and src/screens/settings for what each of those now look
// like. Themed from the active app theme (see src/theme/theme-provider.tsx)
// so it follows the Light/Dark/Auto switch under Settings -> Theme.
export function AccountScreen() {
  const theme = useAppTheme();
  const session = useAuthStore((state) => state.session);
  const profile = useProfile();
  const orders = useMyOrders();
  const favorites = useFavorites();
  const addresses = useAddresses();

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
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Image source={require('../../../assets/icon.png')} style={styles.emptyLogo} resizeMode="cover" />
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Log in to LittleNuts</Text>
        <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
          Log in to manage your addresses, place orders, and track deliveries.
        </Text>
        <Pressable style={[styles.emptyButton, { backgroundColor: theme.primary }]} onPress={() => router.push('/auth/login')}>
          <Text style={[styles.emptyButtonText, { color: theme.primaryText }]}>Log In</Text>
        </Pressable>
      </View>
    );
  }

  const ordersCount = orders.data?.length ?? 0;
  const favoritesCount = favorites.data?.length ?? 0;
  const savedTillDate = sumPaise((orders.data ?? []).map((order) => order.discount_paise));
  const addressesCount = addresses.data?.length ?? 0;

  const displayName = profile.data?.full_name?.trim() || session.user.email || 'LittleNuts Customer';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'L';

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroBannerWrap}>
          {/* The logo banner is fixed branding behind every customer's
              avatar — it is not a user-uploaded cover photo and never
              changes per account. */}
          <Image source={require('../../../assets/icon.png')} style={styles.heroBanner} resizeMode="cover" />
        </View>
        <View
          style={[
            styles.avatarCircle,
            styles.heroAvatar,
            { backgroundColor: theme.primary, borderColor: theme.background },
          ]}
        >
          <Text style={[styles.avatarInitials, { color: theme.primaryText }]}>{initials}</Text>
        </View>
      </View>

      <View style={styles.heroTextWrap}>
        <Text style={[styles.profileName, { color: theme.textPrimary }]}>{displayName}</Text>
        <Text style={[styles.profileRole, { color: theme.accent }]}>Customer</Text>
        {session.user.email ? (
          <View style={styles.profileMetaRow}>
            <Ionicons name="mail-outline" size={13} color={theme.textSecondary} />
            <Text style={[styles.profileMetaText, { color: theme.textSecondary }]}>{session.user.email}</Text>
          </View>
        ) : null}
        {profile.data?.phone_number ? (
          <View style={styles.profileMetaRow}>
            <Ionicons name="call-outline" size={13} color={theme.textSecondary} />
            <Text style={[styles.profileMetaText, { color: theme.textSecondary }]}>
              {profile.data.phone_number}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <StatBox value={String(ordersCount)} label="Orders Built" />
          <StatBox value={String(favoritesCount)} label="Favorite Items" />
          <StatBox value={paiseToRupeesLabel(savedTillDate)} label="Saved till Date" />
        </View>

        <View style={styles.menu}>
          <MenuRow
            icon="receipt-outline"
            label="My Orders"
            hint={`${ordersCount} ${ordersCount === 1 ? 'order' : 'orders'}`}
            onPress={() => router.push('/(customer)/(tabs)/orders')}
          />
          <MenuRow
            icon="location-outline"
            label="Address"
            hint={`${addressesCount} saved`}
            onPress={() => router.push('/addresses')}
          />
          <MenuRow
            icon="heart-outline"
            label="Favorite"
            hint={`${favoritesCount} ${favoritesCount === 1 ? 'item' : 'items'}`}
            onPress={() => router.push('/favorites')}
          />
          <MenuRow icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
        </View>

        <Pressable
          style={[styles.signOutButton, { borderColor: theme.danger }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={16} color={theme.danger} />
          <Text style={[styles.signOutText, { color: theme.danger }]}>Sign Out of LittleNuts</Text>
        </Pressable>
        <Pressable
          style={[styles.deleteAccountButton, { borderColor: theme.border }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.deleteAccountText, { color: theme.textSecondary }]}>Delete My Account</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/auth/admin-login')} hitSlop={8} style={styles.adminLink}>
          <Text style={[styles.adminLinkText, { color: theme.textSecondary }]}>Store Admin</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text numberOfLines={1} style={[styles.statValue, { color: theme.textPrimary }]}>
        {value}
      </Text>
      <Text numberOfLines={1} style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.menuRow, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={[styles.menuIconWrap, { backgroundColor: theme.badgeBg }]}>
        <Ionicons name={icon} size={18} color={theme.textPrimary} />
      </View>
      <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>{label}</Text>
      {hint ? <Text style={[styles.menuHint, { color: theme.textSecondary }]}>{hint}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyLogo: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...typography.h1,
  },
  emptyBody: {
    ...typography.body,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  emptyButtonText: {
    ...typography.bodyStrong,
  },
  container: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    alignItems: 'center',
  },
  heroBannerWrap: {
    width: '100%',
    height: 150,
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroBanner: {
    width: '100%',
    height: '100%',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatar: {
    width: 96,
    height: 96,
    marginTop: -48,
    borderWidth: 4,
  },
  avatarInitials: {
    ...typography.h2,
  },
  heroTextWrap: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.lg,
  },
  profileName: {
    ...typography.h1,
  },
  profileRole: {
    ...typography.bodyStrong,
    marginBottom: 2,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileMetaText: {
    ...typography.caption,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm + 2,
    gap: 2,
  },
  statValue: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    textAlign: 'center',
  },
  menu: {
    gap: spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...typography.bodyStrong,
    fontSize: 14,
    flex: 1,
  },
  menuHint: {
    ...typography.caption,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  signOutText: {
    ...typography.bodyStrong,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  deleteAccountText: {
    ...typography.bodyStrong,
  },
  adminLink: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  adminLinkText: {
    ...typography.caption,
  },
});
