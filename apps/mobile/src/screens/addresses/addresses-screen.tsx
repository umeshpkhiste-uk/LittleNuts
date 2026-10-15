import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { PrimaryButton } from '@/components/primary-button';
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/hooks/addresses/use-addresses';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

type AddressesScreenProps = {
  selectMode?: boolean;
  onSelect?: (addressId: string) => void;
};

export function AddressesScreen({ selectMode, onSelect }: AddressesScreenProps) {
  const theme = useAppTheme();
  const addresses = useAddresses();
  const setDefault = useSetDefaultAddress();
  const deleteAddress = useDeleteAddress();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {addresses.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : addresses.data?.length ? (
          addresses.data.map((address) => (
            <Pressable
              key={address.id}
              onPress={selectMode ? () => onSelect?.(address.id) : undefined}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.name, { color: theme.textPrimary }]}>
                  {address.recipient_name}
                </Text>
                {address.is_default ? (
                  <Text style={[styles.defaultBadge, { color: theme.primary }]}>Default</Text>
                ) : null}
              </View>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {address.address_line_1}
                {address.address_line_2 ? `, ${address.address_line_2}` : ''}
                {address.area ? `, ${address.area}` : ''}
              </Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {address.city}, {address.state} {address.postal_code}
              </Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {address.phone_number}
              </Text>

              {!selectMode ? (
                <View style={styles.actions}>
                  {!address.is_default ? (
                    <Pressable onPress={() => setDefault.mutate(address.id)}>
                      <Text style={[styles.actionText, { color: theme.primary }]}>
                        Set as default
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => deleteAddress.mutate(address.id)}>
                    <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  </Pressable>
                </View>
              ) : null}
            </Pressable>
          ))
        ) : (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            You haven&apos;t added any addresses yet.
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Add New Address" onPress={() => router.push('/addresses/new')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.bodyStrong,
  },
  defaultBadge: {
    ...typography.caption,
    fontWeight: '700',
  },
  body: {
    ...typography.caption,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  actionText: {
    ...typography.caption,
    fontWeight: '700',
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    padding: spacing.lg,
  },
});
