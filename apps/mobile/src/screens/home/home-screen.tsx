import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { HomeHero } from '@/components/home-hero';
import { HomeOfferCard } from '@/components/home-offer-card';
import { TopPickCard } from '@/components/top-pick-card';
import { type FilterGroup, TypeFilterChips } from '@/components/type-filter-chips';
import { useCategories } from '@/hooks/catalog/use-categories';
import { useProducts } from '@/hooks/catalog/use-products';
import { palette } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

// Which category slug belongs to which quick-filter chip. Categories not
// listed here (none currently) would only show under "All".
const GROUP_BY_SLUG: Record<string, FilterGroup> = {
  'almonds-badam': 'nuts',
  'cashews-kaju': 'nuts',
  'pistachios-pista': 'nuts',
  'walnuts-akhrot': 'nuts',
  seeds: 'seeds',
  'raisins-kishmish': 'dried-fruits',
  'dates-khajoor': 'dried-fruits',
  'figs-anjeer': 'dried-fruits',
  'dried-apricots': 'dried-fruits',
  'mixed-dry-fruits': 'mixes',
};

export function HomeScreen() {
  const theme = useAppTheme();
  const [group, setGroup] = useState<FilterGroup>('all');
  const categories = useCategories();
  const featured = useProducts({ featuredOnly: true });

  const categoryIdToGroup = new Map(
    categories.data?.map((category) => [category.id, GROUP_BY_SLUG[category.slug]]),
  );
  const visibleFeatured = featured.data?.filter(
    (product) => group === 'all' || categoryIdToGroup.get(product.category_id) === group,
  );

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
        <Ionicons name="options-outline" size={18} color={theme.textSecondary} />
      </Pressable>

      <TypeFilterChips value={group} onChange={setGroup} />

      <Section title="Top Picks For You" onViewAll={() => router.push('/search')}>
        {featured.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <View style={styles.grid}>
            {visibleFeatured?.map((product) => (
              <TopPickCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
              />
            ))}
            {/* space-between spreads an incomplete last row edge-to-edge,
                leaving a big gap in the middle — pad it with invisible
                spacers so the cards stay left-aligned at their normal size. */}
            {Array.from({
              length: (3 - ((visibleFeatured?.length ?? 0) % 3)) % 3,
            }).map((_, index) => (
              <View key={`spacer-${index}`} style={styles.gridSpacer} />
            ))}
          </View>
        )}
      </Section>

      <HomeOfferCard />
    </ScrollView>
  );
}

function Section({
  title,
  children,
  onViewAll,
}: {
  title: string;
  children: React.ReactNode;
  onViewAll?: () => void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        ) : null}
      </View>
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
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.h2,
  },
  viewAll: {
    ...typography.caption,
    fontWeight: '700',
    color: palette.gold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  gridSpacer: {
    width: '31%',
  },
});
