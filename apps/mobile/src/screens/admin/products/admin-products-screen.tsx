import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatWeight, paiseToRupeesLabel } from '@littlenuts/shared';

import { useProducts } from '@/hooks/catalog/use-products';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function AdminProductsScreen() {
  const theme = useAppTheme();
  const [search, setSearch] = useState('');
  const products = useProducts({ includeInactive: true, search });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.header}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary },
          ]}
        />
        <Pressable
          onPress={() => router.push('/admin/product/new')}
          style={[styles.newButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={22} color={theme.primaryText} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {products.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          products.data?.map((product) => {
            const lowStock = product.stock_weight_g <= product.reorder_threshold_g;
            return (
              <Pressable
                key={product.id}
                onPress={() => router.push(`/admin/product/${product.id}`)}
                style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.rowBody}>
                  <Text style={[styles.name, { color: theme.textPrimary }]}>{product.name}</Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>
                    {product.sku} · {paiseToRupeesLabel(product.price_per_kg_paise)}/kg · Stock{' '}
                    {formatWeight(product.stock_weight_g)}
                  </Text>
                </View>
                <View style={styles.badges}>
                  {!product.is_active ? (
                    <Badge label="Inactive" color={theme.textSecondary} />
                  ) : null}
                  {lowStock ? <Badge label="Low stock" color={theme.danger} /> : null}
                  {product.is_featured ? <Badge label="Featured" color={theme.primary} /> : null}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  newButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowBody: {
    gap: spacing.xs,
  },
  name: {
    ...typography.bodyStrong,
  },
  meta: {
    ...typography.caption,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
