import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import { useProduct } from '@/hooks/catalog/use-products';
import { useAdjustStock, useUpdateProduct } from '@/hooks/admin/use-admin-products';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

import { ProductForm } from './product-form';

export function EditProductScreen({ productId }: { productId: string }) {
  const theme = useAppTheme();
  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const adjustStock = useAdjustStock();

  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockSuccess, setStockSuccess] = useState(false);

  if (isLoading || !product) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  async function handleAdjustStock() {
    setStockError(null);
    setStockSuccess(false);
    const value = parseInt(newStock, 10);
    if (!Number.isFinite(value) || value < 0) {
      setStockError('Enter a valid stock quantity.');
      return;
    }
    if (!reason.trim()) {
      setStockError('A reason is required (e.g. "new delivery" or "stock count correction").');
      return;
    }
    try {
      await adjustStock.mutateAsync({ id: productId, newStockWeightG: value, reason: reason.trim() });
      setNewStock('');
      setReason('');
      setStockSuccess(true);
    } catch (adjustError) {
      setStockError(adjustError instanceof Error ? adjustError.message : 'Could not adjust stock.');
    }
  }

  return (
    <ProductForm
      initial={product}
      submitLabel="Save Changes"
      isSubmitting={updateProduct.isPending}
      onSubmit={async (values) => {
        await updateProduct.mutateAsync({ id: productId, values });
      }}
      footer={
        <View style={{ gap: spacing.sm, borderTopWidth: 1, borderColor: theme.border, paddingTop: spacing.md }}>
          <Text style={[typography.h2, { color: theme.textPrimary }]}>Adjust Stock</Text>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>
            Current stock: {product.stock_weight_g}g
          </Text>
          <FormTextInput
            label="New stock (g)"
            value={newStock}
            onChangeText={setNewStock}
            keyboardType="number-pad"
          />
          <FormTextInput label="Reason" value={reason} onChangeText={setReason} />
          {stockError ? <Text style={{ color: theme.danger }}>{stockError}</Text> : null}
          {stockSuccess ? <Text style={{ color: theme.textSecondary }}>Stock updated.</Text> : null}
          <PrimaryButton
            title="Adjust Stock"
            variant="secondary"
            loading={adjustStock.isPending}
            onPress={handleAdjustStock}
          />
        </View>
      }
    />
  );
}
