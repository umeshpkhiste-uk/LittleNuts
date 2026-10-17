import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import {
  formatWeight,
  itemSubtotalPaise,
  paiseToRupeesLabel,
  sumPaise,
  type PaymentMethod,
} from '@littlenuts/shared';

import { PrimaryButton } from '@/components/primary-button';
import { useAddresses } from '@/hooks/addresses/use-addresses';
import { useCart } from '@/hooks/cart/use-cart';
import { useCreateOrder } from '@/hooks/checkout/use-create-order';
import { useStoreSettings } from '@/hooks/checkout/use-store-settings';
import { getHasAccount } from '@/lib/account-history';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/lib/payments/razorpay-api';
import { openRazorpayCheckout } from '@/lib/payments/razorpay-checkout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function CheckoutScreen() {
  const theme = useAppTheme();
  const session = useAuthStore((state) => state.session);
  const cart = useCart();
  const addresses = useAddresses();
  const settings = useStoreSettings();
  const createOrder = useCreateOrder();

  // Both selections default from server data (default address, whichever
  // payment method is enabled) but can be overridden by the user — kept as
  // "explicit override, else derive" rather than syncing a default into
  // state via an effect, which would cause an extra render on every data
  // load and risks clobbering a user's in-progress choice.
  const [explicitAddressId, setExplicitAddressId] = useState<string | null>(null);
  const [explicitPaymentMethod, setExplicitPaymentMethod] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  // One idempotency key per visit to this screen — stable across retries
  // of the same checkout attempt, regenerated only if the user navigates
  // away and back (a genuinely new attempt).
  const [idempotencyKey] = useState(() => randomUUID());

  // No session: route to sign-up if this device has never had an account,
  // sign-in if it has (so a logged-out returning customer isn't asked to
  // register again). Done in an effect, not during render, since the check
  // is async.
  useEffect(() => {
    if (session) return;
    getHasAccount().then((hasAccount) => {
      router.replace(hasAccount ? '/auth/login' : '/auth/register');
    });
  }, [session]);

  const addressId =
    explicitAddressId ??
    addresses.data?.find((a) => a.is_default)?.id ??
    addresses.data?.[0]?.id ??
    null;

  // react-native-razorpay has no web implementation — the web build of
  // this app (Vercel) offers Cash on Delivery only, never defaults to or
  // offers the online option, so it can never attempt to open a checkout
  // that doesn't exist on this platform.
  const isWeb = Platform.OS === 'web';

  const paymentMethod: PaymentMethod =
    explicitPaymentMethod ??
    (!isWeb && settings.data && !settings.data.cod_enabled && settings.data.online_payment_enabled
      ? 'razorpay'
      : 'cod');

  const items = useMemo(() => cart.data?.items ?? [], [cart.data]);
  const subtotal = useMemo(
    () => sumPaise(items.map((item) => itemSubtotalPaise(item.product.price_per_kg_paise, item.quantity_g))),
    [items],
  );

  const deliveryFee = useMemo(() => {
    if (!settings.data) return 0;
    if (
      settings.data.free_delivery_min_order_paise !== null &&
      subtotal >= settings.data.free_delivery_min_order_paise
    ) {
      return 0;
    }
    return settings.data.delivery_fee_paise;
  }, [settings.data, subtotal]);

  const tax = useMemo(() => {
    if (!settings.data) return 0;
    return Math.round((subtotal * settings.data.tax_rate_bps) / 10000);
  }, [settings.data, subtotal]);

  const estimatedTotal = subtotal + deliveryFee + tax;

  async function handlePlaceOrder() {
    setError(null);
    if (!addressId) {
      setError('Please select a delivery address.');
      return;
    }
    setIsPlacing(true);
    try {
      const order = await createOrder.mutateAsync({ addressId, paymentMethod, idempotencyKey });

      if (paymentMethod === 'cod') {
        router.replace({ pathname: '/order/confirmation', params: { orderId: order.id } });
        return;
      }

      const razorpayOrder = await createRazorpayOrder(order.id);
      const result = await openRazorpayCheckout({
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amountPaise,
        currency: razorpayOrder.currency,
        name: 'LittleNuts',
        description: `Order ${razorpayOrder.orderNumber}`,
        order_id: razorpayOrder.razorpayOrderId,
        prefill: {
          email: session?.user.email ?? undefined,
          contact: session?.user.phone ?? undefined,
        },
        theme: { color: '#C8841E' },
      });

      const verification = await verifyRazorpayPayment({
        orderId: order.id,
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });

      if (!verification.verified) {
        throw new Error('Payment could not be verified.');
      }

      router.replace({ pathname: '/order/confirmation', params: { orderId: order.id } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not place order.');
    } finally {
      setIsPlacing(false);
    }
  }

  if (!session || cart.isLoading || addresses.isLoading || settings.isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Section title="Delivery Address">
          {addresses.data?.length ? (
            addresses.data.map((address) => (
              <Text
                key={address.id}
                onPress={() => setExplicitAddressId(address.id)}
                style={[
                  styles.addressCard,
                  {
                    backgroundColor: addressId === address.id ? theme.surface : theme.card,
                    borderColor: addressId === address.id ? theme.primary : theme.border,
                    color: theme.textPrimary,
                  },
                ]}
              >
                {address.recipient_name} — {address.address_line_1}, {address.city} {address.postal_code}
              </Text>
            ))
          ) : (
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              No saved addresses yet.
            </Text>
          )}
          <Text
            onPress={() => router.push('/addresses/new')}
            style={[styles.addLink, { color: theme.primary }]}
          >
            + Add new address
          </Text>
        </Section>

        <Section title="Payment Method">
          <View style={styles.paymentRow}>
            {settings.data?.cod_enabled ? (
              <PaymentOption
                label="Cash on Delivery"
                active={paymentMethod === 'cod'}
                onPress={() => setExplicitPaymentMethod('cod')}
              />
            ) : null}
            {!isWeb && settings.data?.online_payment_enabled ? (
              <PaymentOption
                label="Pay Online (UPI/Card)"
                active={paymentMethod === 'razorpay'}
                onPress={() => setExplicitPaymentMethod('razorpay')}
              />
            ) : null}
          </View>
          {isWeb ? (
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              Online payment is available in the Android app. The web version supports Cash on
              Delivery only.
            </Text>
          ) : null}
        </Section>

        <Section title="Order Summary">
          {items.map((item) => (
            <View key={item.id} style={styles.summaryItemRow}>
              <Text style={[styles.summaryItemName, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.product.name} ({formatWeight(item.quantity_g)})
              </Text>
              <Text style={[styles.summaryItemPrice, { color: theme.textSecondary }]}>
                {paiseToRupeesLabel(itemSubtotalPaise(item.product.price_per_kg_paise, item.quantity_g))}
              </Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <SummaryRow label="Subtotal" value={paiseToRupeesLabel(subtotal)} theme={theme} />
          <SummaryRow
            label="Delivery Fee"
            value={deliveryFee === 0 ? 'Free' : paiseToRupeesLabel(deliveryFee)}
            theme={theme}
          />
          {tax > 0 ? (
            <SummaryRow label="Tax" value={paiseToRupeesLabel(tax)} theme={theme} />
          ) : null}
          <SummaryRow
            label="Total (estimated)"
            value={paiseToRupeesLabel(estimatedTotal)}
            theme={theme}
            emphasis
          />
        </Section>

        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <PrimaryButton
          title={paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay & Place Order'}
          loading={isPlacing}
          disabled={!addressId || items.length === 0}
          onPress={handlePlaceOrder}
        />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

function PaymentOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Text
      onPress={onPress}
      style={[
        styles.paymentOption,
        {
          backgroundColor: active ? theme.primary : theme.surface,
          color: active ? theme.primaryText : theme.textPrimary,
          borderColor: theme.border,
        },
      ]}
    >
      {label}
    </Text>
  );
}

function SummaryRow({
  label,
  value,
  theme,
  emphasis,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={[emphasis ? styles.summaryTotalLabel : styles.summaryLabel, { color: theme.textPrimary }]}
      >
        {label}
      </Text>
      <Text
        style={[emphasis ? styles.summaryTotalValue : styles.summaryValue, { color: theme.textPrimary }]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
  },
  body: {
    ...typography.body,
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    overflow: 'hidden',
  },
  addLink: {
    ...typography.caption,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  paymentOption: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodyStrong,
    overflow: 'hidden',
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  summaryItemName: {
    ...typography.caption,
    flex: 1,
  },
  summaryItemPrice: {
    ...typography.caption,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...typography.caption,
  },
  summaryValue: {
    ...typography.caption,
  },
  summaryTotalLabel: {
    ...typography.bodyStrong,
  },
  summaryTotalValue: {
    ...typography.bodyStrong,
  },
  error: {
    ...typography.body,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});
