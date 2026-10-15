import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase/client';

// Uploads a locally-picked image into the (admin-write-only, publicly
// readable) `product-images` bucket — see
// supabase/migrations/20261015190150_catalog_and_cart.sql for the storage
// RLS policies. Returns the public URL to store in products.image_urls.
export async function uploadProductImage(localUri: string, productId: string): Promise<string> {
  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();
  const extension = (file.extension || '.jpg').replace('.', '');
  const path = `${productId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, arrayBuffer, { contentType: `image/${extension}`, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
