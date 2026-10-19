import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ProductCard } from '@/components/product-card';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useProducts } from '@/hooks/catalog/use-products';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function SearchScreen() {
  const theme = useAppTheme();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const categories = useCategories();
  const products = useProducts({ search, categoryId });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search for dry fruits..."
        placeholderTextColor={theme.textSecondary}
        autoFocus
        style={[
          styles.input,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary },
        ]}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Chip
          label="All"
          active={!categoryId}
          onPress={() => setCategoryId(undefined)}
        />
        {categories.data?.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            active={categoryId === category.id}
            onPress={() => setCategoryId(category.id)}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.results}>
        {products.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : products.data?.length ? (
          <View style={styles.grid}>
            {products.data.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
              />
            ))}
          </View>
        ) : (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            No products match your search.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Text
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.primary : theme.surface,
          color: active ? theme.primaryText : theme.textSecondary,
          borderColor: theme.border,
        },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
  },
  chipRow: {
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...typography.caption,
    fontWeight: '600',
    overflow: 'hidden',
  },
  results: {
    paddingTop: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
