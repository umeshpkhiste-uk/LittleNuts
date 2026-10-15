// Row shapes mirroring supabase/migrations. Kept snake_case to match the
// Postgres/PostgREST response shape directly — no mapping layer needed
// between the DB and the client for these simple read models.

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  description: string | null;
  image_urls: string[];
  price_per_kg_paise: number;
  min_order_weight_g: number;
  max_order_weight_g: number | null;
  weight_increment_g: number;
  stock_weight_g: number;
  reorder_threshold_g: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity_g: number;
  created_at: string;
  updated_at: string;
};

export type CartItemWithProduct = CartItem & {
  product: Product;
};
