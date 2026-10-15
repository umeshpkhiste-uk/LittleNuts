import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  WEIGHT_PRESETS_G,
  clampToIncrement,
  formatWeight,
  isValidQuantity,
  itemSubtotalPaise,
  paiseToRupeesLabel,
} from '@littlenuts/shared';

import { PrimaryButton } from '@/components/primary-button';
import { useProduct } from '@/hooks/catalog/use-products';
import { useAddToCart } from '@/hooks/cart/use-cart';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function ProductDetailsScreen({ productId }: { productId: string }) {
  const theme = useAppTheme();
  const { data: product, isLoading } = useProduct(productId);
  const session = useAuthStore((state) => state.session);
  const addToCart = useAddToCart();

  const [customWeight, setCustomWeight] = useState<string | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const presets = useMemo(() => {
    if (!product) return [];
    return WEIGHT_PRESETS_G.filter(
      (g) =>
        g >= product.min_order_weight_g &&
        (product.max_order_weight_g === null || g <= product.max_order_weight_g) &&
        (g - product.min_order_weight_g) % product.weight_increment_g === 0,
    );
  }, [product]);

  if (isLoading || !product) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  // Rebind to a non-optional const: TS can't carry the `!product` narrowing
  // above into the nested function declarations below (they could in
  // principle be invoked later), but a const typed as `Product` (not
  // `Product | undefined`) stays narrowed inside any closure that reads it.
  const activeProduct = product;

  const activeWeight = selectedWeight ?? presets[0] ?? activeProduct.min_order_weight_g;
  const subtotal = itemSubtotalPaise(activeProduct.price_per_kg_paise, activeWeight);
  const valid = isValidQuantity(
    activeWeight,
    activeProduct.min_order_weight_g,
    activeProduct.max_order_weight_g,
    activeProduct.weight_increment_g,
  );
  const outOfStock = activeProduct.stock_weight_g < activeWeight;

  function selectPreset(weight: number) {
    setSelectedWeight(weight);
    setCustomWeight(null);
  }

  function onCustomWeightChange(text: string) {
    setCustomWeight(text);
    const parsed = Number(text);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setSelectedWeight(clampToIncrement(parsed, activeProduct.weight_increment_g));
    }
  }

  async function handleAddToCart() {
    setFeedback(null);
    if (!session) {
      router.push('/auth/login');
      return;
    }
    try {
      await addToCart.mutateAsync({ productId: activeProduct.id, quantityG: activeWeight });
      setFeedback('Added to cart.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not add to cart.');
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <View style={[styles.imageWrap, { backgroundColor: theme.surface }]}>
        {product.image_urls[0] ? (
          <Image
            source={{ uri: product.image_urls[0] }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="nutrition-outline" size={64} color={theme.textSecondary} />
        )}
      </View>

      <Text style={[styles.name, { color: theme.textPrimary }]}>{product.name}</Text>
      {product.short_description ? (
        <Text style={[styles.shortDescription, { color: theme.textSecondary }]}>
          {product.short_description}
        </Text>
      ) : null}

      <Text style={[styles.price, { color: theme.primary }]}>
        {paiseToRupeesLabel(subtotal)}{' '}
        <Text style={[styles.priceUnit, { color: theme.textSecondary }]}>
          / {formatWeight(activeWeight)}
        </Text>
      </Text>

      <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Select Quantity</Text>
      <View style={styles.presetsRow}>
        {presets.map((g) => (
          <Text
            key={g}
            onPress={() => selectPreset(g)}
            style={[
              styles.presetChip,
              {
                backgroundColor: activeWeight === g && !customWeight ? theme.primary : theme.surface,
                color: activeWeight === g && !customWeight ? theme.primaryText : theme.textPrimary,
                borderColor: theme.border,
              },
            ]}
          >
            {formatWeight(g)}
          </Text>
        ))}
      </View>

      <View style={styles.customRow}>
        <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Custom (grams)</Text>
        <TextInput
          value={customWeight ?? ''}
          onChangeText={onCustomWeightChange}
          keyboardType="number-pad"
          placeholder={`e.g. ${product.min_order_weight_g}`}
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.customInput,
            { borderColor: theme.border, color: theme.textPrimary, backgroundColor: theme.surface },
          ]}
        />
      </View>

      {!valid ? (
        <Text style={[styles.warning, { color: theme.danger }]}>
          Quantity must be between {formatWeight(product.min_order_weight_g)} and{' '}
          {product.max_order_weight_g ? formatWeight(product.max_order_weight_g) : 'no limit'}, in
          steps of {product.weight_increment_g} g.
        </Text>
      ) : null}

      {outOfStock ? (
        <Text style={[styles.warning, { color: theme.danger }]}>
          Not enough stock available for this quantity.
        </Text>
      ) : null}

      {feedback ? (
        <Text style={[styles.feedback, { color: theme.textSecondary }]}>{feedback}</Text>
      ) : null}

      <PrimaryButton
        title={session ? 'Add to Cart' : 'Log In to Add to Cart'}
        loading={addToCart.isPending}
        disabled={!valid || outOfStock}
        onPress={handleAddToCart}
      />

      {product.description ? (
        <>
          <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Description</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {product.description}
          </Text>
        </>
      ) : null}
    </ScrollView>
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
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    ...typography.h1,
  },
  shortDescription: {
    ...typography.body,
  },
  price: {
    ...typography.display,
    marginTop: spacing.xs,
  },
  priceUnit: {
    ...typography.body,
  },
  sectionLabel: {
    ...typography.bodyStrong,
    marginTop: spacing.md,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodyStrong,
    overflow: 'hidden',
  },
  customRow: {
    gap: spacing.xs,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  warning: {
    ...typography.caption,
  },
  feedback: {
    ...typography.caption,
  },
  description: {
    ...typography.body,
  },
});
