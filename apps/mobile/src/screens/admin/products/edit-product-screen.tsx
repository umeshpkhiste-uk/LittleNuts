import { ActivityIndicator, View } from 'react-native';

import { useProduct } from '@/hooks/catalog/use-products';
import { useUpdateProduct } from '@/hooks/admin/use-admin-products';
import { useAppTheme } from '@/theme/theme-provider';

import { ProductForm } from './product-form';

export function EditProductScreen({ productId }: { productId: string }) {
  const theme = useAppTheme();
  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();

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

  return (
    <ProductForm
      initial={product}
      submitLabel="Save Changes"
      isSubmitting={updateProduct.isPending}
      onSubmit={async (values) => {
        await updateProduct.mutateAsync({ id: productId, values });
      }}
    />
  );
}
