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

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_dispatch'
  | 'out_for_delivery'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export type PaymentMethod = 'razorpay' | 'cod';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded'
  | 'partially_refunded';

export type AddressSnapshot = {
  id: string;
  recipient_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2: string | null;
  area: string | null;
  city: string;
  state: string;
  postal_code: string;
  delivery_instructions: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  address_snapshot: AddressSnapshot;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal_paise: number;
  tax_paise: number;
  delivery_fee_paise: number;
  discount_paise: number;
  total_paise: number;
  idempotency_key: string;
  customer_notes: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  cod_collected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryMovement = {
  id: string;
  product_id: string;
  order_id: string | null;
  change_g: number;
  reason: string;
  created_by: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_per_kg_paise: number;
  quantity_g: number;
  subtotal_paise: number;
  created_at: string;
};
