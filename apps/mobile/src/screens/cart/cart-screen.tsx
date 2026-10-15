import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatWeight, itemSubtotalPaise, paiseToRupeesLabel, sumPaise } from '@littlenuts/shared';

import { PrimaryButton } from '@/components/primary-button';
import { useCart, useRemoveCartItem, useSetCartItemQuantity } from '@/hooks/cart/use-cart';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function CartScreen() {
  const theme = useAppTheme();
  const session = useAuthStore((state) => state.session);
  const cart = useCart();
  const setQuantity = useSetCartItemQuantity();
  const removeItem = useRemoveCartItem();

  if (!session) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Your cart is empty</Text>
        <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
          Log in to add items and build your cart.
        </Text>
        <PrimaryButton title="Log In" onPress={() => router.push('/auth/login')} />
      </View>
    );
  }

  if (cart.isLoading) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const items = cart.data?.items ?? [];

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Ionicons name="cart-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Your cart is empty</Text>
        <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
          Browse products and add something you love.
        </Text>
        <PrimaryButton title="Browse Products" onPress={() => router.push('/(customer)/(tabs)')} />
      </View>
    );
  }

  const subtotal = sumPaise(
    items.map((item) => itemSubtotalPaise(item.product.price_per_kg_paise, item.quantity_g)),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>My Cart</Text>
        {items.map((item) => {
          const lineTotal = itemSubtotalPaise(item.product.price_per_kg_paise, item.quantity_g);
          const step = item.product.weight_increment_g;

          return (
            <View
              key={item.id}
              style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.imageWrap, { backgroundColor: theme.surface }]}>
                {item.product.image_urls[0] ? (
                  <Image
                    source={{ uri: item.product.image_urls[0] }}
                    style={styles.image}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="nutrition-outline" size={24} color={theme.textSecondary} />
                )}
              </View>

              <View style={styles.rowBody}>
                <Text numberOfLines={1} style={[styles.itemName, { color: theme.textPrimary }]}>
                  {item.product.name}
                </Text>
                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {formatWeight(item.quantity_g)}
                </Text>

                <View style={styles.stepper}>
                  <StepperButton
                    icon="remove"
                    onPress={() =>
                      setQuantity.mutate({
                        cartItemId: item.id,
                        quantityG: Math.max(0, item.quantity_g - step),
                      })
                    }
                  />
                  <Text style={[styles.stepperValue, { color: theme.textPrimary }]}>
                    {item.quantity_g}g
                  </Text>
                  <StepperButton
                    icon="add"
                    onPress={() =>
                      setQuantity.mutate({ cartItemId: item.id, quantityG: item.quantity_g + step })
                    }
                  />
                  <Pressable
                    onPress={() => removeItem.mutate({ cartItemId: item.id })}
                    hitSlop={8}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  </Pressable>
                </View>
              </View>

              <Text style={[styles.lineTotal, { color: theme.primary }]}>
                {paiseToRupeesLabel(lineTotal)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Subtotal (delivery & taxes calculated at checkout)
          </Text>
          <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
            {paiseToRupeesLabel(subtotal)}
          </Text>
        </View>
        <PrimaryButton title="Proceed to Checkout" onPress={() => router.push('/checkout')} />
      </View>
    </View>
  );
}

function StepperButton({
  icon,
  onPress,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.stepperButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <Ionicons name={icon} size={16} color={theme.textPrimary} />
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
  emptyTitle: {
    ...typography.h1,
  },
  emptyBody: {
    ...typography.body,
    textAlign: 'center',
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    ...typography.h1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
  },
  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    ...typography.bodyStrong,
  },
  itemMeta: {
    ...typography.caption,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    ...typography.caption,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 'auto',
  },
  lineTotal: {
    ...typography.bodyStrong,
  },
  summary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryLabel: {
    ...typography.caption,
    flex: 1,
  },
  summaryValue: {
    ...typography.h2,
  },
});
