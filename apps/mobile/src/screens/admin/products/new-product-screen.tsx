import { useCreateProduct } from '@/hooks/admin/use-admin-products';

import { ProductForm } from './product-form';

export function NewProductScreen() {
  const createProduct = useCreateProduct();

  return (
    <ProductForm
      submitLabel="Create Product"
      isSubmitting={createProduct.isPending}
      onSubmit={async (values) => {
        await createProduct.mutateAsync(values);
      }}
    />
  );
}
