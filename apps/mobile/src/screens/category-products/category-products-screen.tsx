import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ProductCard } from '@/components/product-card';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useProducts } from '@/hooks/catalog/use-products';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

export function CategoryProductsScreen({ categoryId }: { categoryId: string }) {
  const theme = useAppTheme();
  const categories = useCategories();
  const products = useProducts({ categoryId });
  const category = categories.data?.find((c) => c.id === categoryId);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {category?.name ?? 'Products'}
      </Text>
      {category?.description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {category.description}
        </Text>
      ) : null}

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
          No products in this category yet.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  description: {
    ...typography.body,
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
