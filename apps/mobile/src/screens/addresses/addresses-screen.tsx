import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { PrimaryButton } from '@/components/primary-button';
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
  type Address,
} from '@/hooks/addresses/use-addresses';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

type AddressesScreenProps = {
  selectMode?: boolean;
  onSelect?: (addressId: string) => void;
};

// Addresses are grouped by who they're for: "Own Address" (deliver to the
// customer themself) vs "Other's Address" (deliver to someone else) — see
// the recipient_type column (migration 20261020010000).
export function AddressesScreen({ selectMode, onSelect }: AddressesScreenProps) {
  const theme = useAppTheme();
  const addresses = useAddresses();
  const setDefault = useSetDefaultAddress();
  const deleteAddress = useDeleteAddress();

  const ownAddresses = useMemo(
    () => (addresses.data ?? []).filter((address) => address.recipient_type === 'own'),
    [addresses.data],
  );
  const otherAddresses = useMemo(
    () => (addresses.data ?? []).filter((address) => address.recipient_type === 'other'),
    [addresses.data],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {addresses.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : addresses.data?.length ? (
          <>
            <AddressGroup
              title="Own Address"
              addresses={ownAddresses}
              selectMode={selectMode}
              onSelect={onSelect}
              onSetDefault={(id) => setDefault.mutate(id)}
              onDelete={(id) => deleteAddress.mutate(id)}
              onAdd={() => router.push({ pathname: '/addresses/new', params: { type: 'own' } })}
            />
            <AddressGroup
              title="Other's Address"
              addresses={otherAddresses}
              selectMode={selectMode}
              onSelect={onSelect}
              onSetDefault={(id) => setDefault.mutate(id)}
              onDelete={(id) => deleteAddress.mutate(id)}
              onAdd={() => router.push({ pathname: '/addresses/new', params: { type: 'other' } })}
            />
          </>
        ) : (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            You haven&apos;t added any addresses yet.
          </Text>
        )}
      </ScrollView>

      {!addresses.data?.length ? (
        <View style={styles.footer}>
          <PrimaryButton title="Add New Address" onPress={() => router.push('/addresses/new')} />
        </View>
      ) : null}
    </View>
  );
}

function AddressGroup({
  title,
  addresses,
  selectMode,
  onSelect,
  onSetDefault,
  onDelete,
  onAdd,
}: {
  title: string;
  addresses: Address[];
  selectMode?: boolean;
  onSelect?: (addressId: string) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.textPrimary }]}>{title}</Text>
      {addresses.map((address) => (
        <Pressable
          key={address.id}
          onPress={selectMode ? () => onSelect?.(address.id) : undefined}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.name, { color: theme.textPrimary }]}>{address.recipient_name}</Text>
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
          <Text style={[styles.body, { color: theme.textSecondary }]}>{address.phone_number}</Text>

          {!selectMode ? (
            <View style={styles.actions}>
              {!address.is_default ? (
                <Pressable onPress={() => onSetDefault(address.id)}>
                  <Text style={[styles.actionText, { color: theme.primary }]}>Set as default</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => onDelete(address.id)}>
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      ))}
      <Pressable onPress={onAdd} style={[styles.addButton, { borderColor: theme.border }]}>
        <Ionicons name="add" size={16} color={theme.textPrimary} />
        <Text style={[styles.addButtonText, { color: theme.textPrimary }]}>Add {title}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    ...typography.h2,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
  },
  addButtonText: {
    ...typography.bodyStrong,
    fontSize: 13,
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
