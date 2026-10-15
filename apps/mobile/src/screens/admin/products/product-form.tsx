import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import type { Product } from '@littlenuts/shared';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import { useCategories } from '@/hooks/catalog/use-categories';
import { uploadProductImage } from '@/lib/storage/upload-product-image';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';
import type { ProductFormValues } from '@/hooks/admin/use-admin-products';

type ProductFormProps = {
  initial?: Product;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  footer?: React.ReactNode;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ProductForm({
  initial,
  submitLabel,
  isSubmitting,
  onSubmit,
  footer,
}: ProductFormProps) {
  const theme = useAppTheme();
  const categories = useCategories({ includeInactive: true });

  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [shortDescription, setShortDescription] = useState(initial?.short_description ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [pricePerKg, setPricePerKg] = useState(
    initial ? String(initial.price_per_kg_paise / 100) : '',
  );
  const [minOrderWeightG, setMinOrderWeightG] = useState(
    initial ? String(initial.min_order_weight_g) : '100',
  );
  const [maxOrderWeightG, setMaxOrderWeightG] = useState(
    initial?.max_order_weight_g ? String(initial.max_order_weight_g) : '',
  );
  const [weightIncrementG, setWeightIncrementG] = useState(
    initial ? String(initial.weight_increment_g) : '50',
  );
  const [stockWeightG, setStockWeightG] = useState(
    initial ? String(initial.stock_weight_g) : '0',
  );
  const [reorderThresholdG, setReorderThresholdG] = useState(
    initial ? String(initial.reorder_threshold_g) : '1000',
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.image_urls ?? []);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required to upload an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setError(null);
    setIsUploadingImage(true);
    try {
      const url = await uploadProductImage(
        result.assets[0].uri,
        initial?.id ?? (sku || 'new-product'),
      );
      setImageUrls([url]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSubmit(): Promise<boolean> {
    setError(null);

    const price = Math.round(parseFloat(pricePerKg) * 100);
    const minWeight = parseInt(minOrderWeightG, 10);
    const maxWeight = maxOrderWeightG.trim() ? parseInt(maxOrderWeightG, 10) : null;
    const increment = parseInt(weightIncrementG, 10);
    const stock = parseInt(stockWeightG, 10);
    const reorderThreshold = parseInt(reorderThresholdG, 10);

    function fail(message: string): false {
      setError(message);
      return false;
    }

    if (!categoryId) return fail('Select a category.');
    if (!name.trim()) return fail('Name is required.');
    if (!sku.trim()) return fail('SKU is required.');
    if (!Number.isFinite(price) || price <= 0) return fail('Enter a valid price per kg.');
    if (!Number.isFinite(minWeight) || minWeight <= 0) {
      return fail('Enter a valid minimum order weight.');
    }
    if (maxWeight !== null && (!Number.isFinite(maxWeight) || maxWeight < minWeight)) {
      return fail('Maximum weight must be greater than or equal to minimum weight.');
    }
    if (!Number.isFinite(increment) || increment <= 0) {
      return fail('Enter a valid weight increment.');
    }
    if (!Number.isFinite(stock) || stock < 0) return fail('Enter a valid stock quantity.');
    if (!Number.isFinite(reorderThreshold) || reorderThreshold < 0) {
      return fail('Enter a valid reorder threshold.');
    }

    try {
      await onSubmit({
        categoryId,
        name: name.trim(),
        slug: initial?.slug ?? slugify(name),
        sku: sku.trim(),
        shortDescription,
        description,
        pricePerKgPaise: price,
        minOrderWeightG: minWeight,
        maxOrderWeightG: maxWeight,
        weightIncrementG: increment,
        stockWeightG: stock,
        reorderThresholdG: reorderThreshold,
        isActive,
        isFeatured,
        imageUrls,
      });
      return true;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save product.');
      return false;
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Image</Text>
      <Pressable
        onPress={handlePickImage}
        style={[styles.imagePicker, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        {imageUrls[0] ? (
          <Image source={{ uri: imageUrls[0] }} style={styles.image} contentFit="cover" />
        ) : (
          <Text style={[styles.imagePlaceholder, { color: theme.textSecondary }]}>
            {isUploadingImage ? 'Uploading...' : 'Tap to upload image'}
          </Text>
        )}
      </Pressable>

      <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Category</Text>
      <View style={styles.chipRow}>
        {categories.data?.map((category) => (
          <Text
            key={category.id}
            onPress={() => setCategoryId(category.id)}
            style={[
              styles.chip,
              {
                backgroundColor: categoryId === category.id ? theme.primary : theme.surface,
                color: categoryId === category.id ? theme.primaryText : theme.textPrimary,
                borderColor: theme.border,
              },
            ]}
          >
            {category.name}
          </Text>
        ))}
      </View>

      <FormTextInput label="Name" value={name} onChangeText={setName} />
      <FormTextInput label="SKU" value={sku} onChangeText={setSku} autoCapitalize="characters" />
      <FormTextInput
        label="Short description"
        value={shortDescription}
        onChangeText={setShortDescription}
      />
      <FormTextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <FormTextInput
        label="Price per kg (₹)"
        value={pricePerKg}
        onChangeText={setPricePerKg}
        keyboardType="decimal-pad"
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormTextInput
            label="Min order (g)"
            value={minOrderWeightG}
            onChangeText={setMinOrderWeightG}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.rowItem}>
          <FormTextInput
            label="Max order (g, optional)"
            value={maxOrderWeightG}
            onChangeText={setMaxOrderWeightG}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormTextInput
            label="Increment (g)"
            value={weightIncrementG}
            onChangeText={setWeightIncrementG}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.rowItem}>
          <FormTextInput
            label="Reorder threshold (g)"
            value={reorderThresholdG}
            onChangeText={setReorderThresholdG}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {!initial ? (
        <FormTextInput
          label="Initial stock (g)"
          value={stockWeightG}
          onChangeText={setStockWeightG}
          keyboardType="number-pad"
        />
      ) : (
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Stock: {initial.stock_weight_g}g — use &quot;Adjust Stock&quot; below to change it (keeps a
          reasoned history and can&apos;t be edited here).
        </Text>
      )}

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>Active</Text>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>
      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>Featured</Text>
        <Switch value={isFeatured} onValueChange={setIsFeatured} />
      </View>

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      {footer}

      <PrimaryButton
        title={submitLabel}
        loading={isSubmitting}
        onPress={() => {
          void handleSubmit().then((success) => {
            if (success) router.back();
          });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    ...typography.bodyStrong,
  },
  imagePicker: {
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    ...typography.bodyStrong,
  },
  error: {
    ...typography.body,
  },
});
