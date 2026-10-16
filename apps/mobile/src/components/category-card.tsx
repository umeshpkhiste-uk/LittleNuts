import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Category } from '@littlenuts/shared';

import { GlassSurface } from '@/components/glass-surface';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function CategoryCard({ category, onPress }: { category: Category; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <GlassSurface style={styles.card} radius={radius.lg}>
        <View style={styles.imageWrap}>
          {category.image_url ? (
            <Image source={{ uri: category.image_url }} style={styles.image} contentFit="cover" />
          ) : (
            <Ionicons name="leaf-outline" size={28} color={theme.primary} />
          )}
        </View>
        <Text numberOfLines={2} style={[styles.name, { color: theme.textPrimary }]}>
          {category.name}
        </Text>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 110,
  },
  card: {
    padding: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
  },
  imageWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(232,163,61,0.12)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
});
