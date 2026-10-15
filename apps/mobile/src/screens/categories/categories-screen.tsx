import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { CategoryCard } from '@/components/category-card';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

export function CategoriesScreen() {
  const theme = useAppTheme();
  const categories = useCategories();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>Categories</Text>

      {categories.isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View style={styles.grid}>
          {categories.data?.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => router.push(`/category/${category.id}`)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    ...typography.h1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
