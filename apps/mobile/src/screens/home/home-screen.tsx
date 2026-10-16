import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { CategoryCard } from '@/components/category-card';
import { HomeHero } from '@/components/home-hero';
import { ProductCard } from '@/components/product-card';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useProducts } from '@/hooks/catalog/use-products';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function HomeScreen() {
  const theme = useAppTheme();
  const categories = useCategories();
  const featured = useProducts({ featuredOnly: true });

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <HomeHero />

      <Pressable
        onPress={() => router.push('/search')}
        style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <Text style={[styles.searchPlaceholder, { color: theme.textSecondary }]}>
          Search for dry fruits...
        </Text>
      </Pressable>

      <Section title="Categories">
        {categories.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {categories.data?.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => router.push(`/category/${category.id}`)}
              />
            ))}
          </ScrollView>
        )}
      </Section>

      <Section title="Top Picks For You">
        {featured.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <View style={styles.grid}>
            {featured.data?.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
              />
            ))}
          </View>
        )}
      </Section>
    </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  searchPlaceholder: {
    ...typography.body,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
  },
  row: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
