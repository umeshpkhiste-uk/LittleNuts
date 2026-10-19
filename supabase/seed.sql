-- Starter catalog so Phase 3 has real data to browse/search/cart against.
-- This is NOT "hardcoding the catalog" (spec section 3) — every row here is
-- a normal row in categories/products, fully editable, deactivatable, and
-- deletable through the admin UI like any other. It's just a reasonable
-- starting point for a store that hasn't entered its own inventory yet.
-- Idempotent: safe to re-run.

insert into public.categories (name, slug, description, sort_order) values
  ('Almonds / Badam', 'almonds-badam', 'Premium California and Mamra almonds.', 1),
  ('Cashews / Kaju', 'cashews-kaju', 'Whole and broken cashews, roasted and raw.', 2),
  ('Pistachios / Pista', 'pistachios-pista', 'Roasted and salted pistachios.', 3),
  ('Walnuts / Akhrot', 'walnuts-akhrot', 'Kashmiri and Californian walnut kernels.', 4),
  ('Raisins / Kishmish', 'raisins-kishmish', 'Green and golden seedless raisins.', 5),
  ('Dates / Khajoor', 'dates-khajoor', 'Medjool, Ajwa, and Kimia dates.', 6),
  ('Figs / Anjeer', 'figs-anjeer', 'Sun-dried Afghani and Turkish figs.', 7),
  ('Dried Apricots', 'dried-apricots', 'Turkish and Afghani dried apricots.', 8),
  ('Mixed Dry Fruits', 'mixed-dry-fruits', 'Curated mixes for gifting and snacking.', 9),
  ('Seeds', 'seeds', 'Pumpkin, sunflower, chia, and flax seeds.', 10)
on conflict (slug) do nothing;

insert into public.products (
  category_id, name, slug, sku, short_description, description,
  price_per_kg_paise, min_order_weight_g, max_order_weight_g, weight_increment_g,
  stock_weight_g, reorder_threshold_g, is_featured
)
select c.id, p.name, p.slug, p.sku, p.short_description, p.description,
  p.price_per_kg_paise, p.min_order_weight_g, p.max_order_weight_g, p.weight_increment_g,
  p.stock_weight_g, p.reorder_threshold_g, p.is_featured
from (values
  ('almonds-badam', 'California Almonds', 'california-almonds', 'ALM-CA-001',
    'Rich in protein, fiber and vitamin E.', 'Premium California almonds, carefully sorted and cleaned.',
    69900, 100, 5000, 50, 20000, 2000, true),
  ('almonds-badam', 'Mamra Almonds', 'mamra-almonds', 'ALM-MA-001',
    'Premium Iranian Mamra almonds.', 'Smaller, denser, and more flavorful than regular almonds.',
    129900, 100, 3000, 50, 8000, 1000, false),
  ('cashews-kaju', 'Whole Cashews W240', 'whole-cashews-w240', 'CSH-W240-001',
    'Large, whole, premium grade cashews.', 'Grade W240 whole cashews, lightly processed.',
    64900, 100, 5000, 50, 15000, 1500, true),
  ('pistachios-pista', 'Roasted Salted Pistachios', 'roasted-salted-pistachios', 'PIS-RS-001',
    'Roasted in-shell pistachios with a light salt coating.', 'California pistachios, roasted and lightly salted.',
    79900, 100, 3000, 50, 10000, 1000, true),
  ('walnuts-akhrot', 'Kashmiri Walnut Kernels', 'kashmiri-walnut-kernels', 'WAL-KK-001',
    'Light-colored, premium walnut kernels.', 'Hand-shelled Kashmiri walnut kernels.',
    89900, 100, 3000, 50, 9000, 1000, false),
  ('raisins-kishmish', 'Green Seedless Raisins', 'green-seedless-raisins', 'RAI-GS-001',
    'Naturally sweet, seedless green raisins.', 'Sun-dried seedless green raisins.',
    24900, 100, 5000, 50, 25000, 2500, false),
  ('dates-khajoor', 'Medjool Dates', 'medjool-dates', 'DAT-MDJ-001',
    'Large, soft, caramel-like Medjool dates.', 'Premium Medjool dates, naturally sweet and soft.',
    89900, 250, 5000, 50, 12000, 1200, true),
  ('figs-anjeer', 'Afghani Dried Figs', 'afghani-dried-figs', 'FIG-AF-001',
    'Soft, naturally sweet dried figs.', 'Sun-dried Afghani figs, no added sugar.',
    79900, 100, 3000, 50, 8000, 800, false),
  ('dried-apricots', 'Turkish Dried Apricots', 'turkish-dried-apricots', 'APR-TR-001',
    'Soft and tangy sun-dried apricots.', 'Sulphur-free sun-dried Turkish apricots.',
    54900, 100, 3000, 50, 9000, 900, false),
  ('mixed-dry-fruits', 'Festive Mix', 'festive-mix', 'MIX-FEST-001',
    'A curated mix of almonds, cashews, pistachios, and raisins.', 'Our signature festive mix, great for gifting.',
    74900, 250, 5000, 50, 15000, 1500, true),
  ('seeds', 'Roasted Pumpkin Seeds', 'roasted-pumpkin-seeds', 'SEED-PMP-001',
    'Crunchy, protein-rich roasted pumpkin seeds.', 'Lightly roasted and salted pumpkin seeds.',
    34900, 100, 3000, 50, 10000, 1000, false)
) as p(category_slug, name, slug, sku, short_description, description,
       price_per_kg_paise, min_order_weight_g, max_order_weight_g, weight_increment_g,
       stock_weight_g, reorder_threshold_g, is_featured)
join public.categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

-- Real product/category photos (uploaded to the public product-images
-- bucket); keeps the seed in sync with the live DB.
update public.categories set image_url = 'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/almonds.jpg' where slug = 'almonds-badam';
update public.categories set image_url = 'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/cashews.jpg' where slug = 'cashews-kaju';
update public.categories set image_url = 'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/pistachios.jpg' where slug = 'pistachios-pista';
update public.categories set image_url = 'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/walnuts.jpg' where slug = 'walnuts-akhrot';
update public.categories set image_url = 'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/raisins.jpg' where slug = 'raisins-kishmish';
update public.categories set image_url = 'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/dates.jpg' where slug = 'dates-khajoor';
update public.categories set image_url = 'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/figs.jpg' where slug = 'figs-anjeer';
update public.categories set image_url = 'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/mixes.jpg' where slug = 'mixed-dry-fruits';
update public.categories set image_url = 'https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/seeds.jpg' where slug = 'seeds';

update public.products set image_urls = array['https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/almonds.jpg'] where slug = 'california-almonds';
-- Mamra almonds are visually distinct (smaller, denser) from the regular
-- California almonds sharing the category photo above — free-license photo
-- (Unsplash License: free for commercial use, no attribution required).
update public.products set image_urls = array['https://images.unsplash.com/photo-1508779018996-601e37fa274e?w=1200&q=80&auto=format&fit=crop'] where slug = 'mamra-almonds';
update public.products set image_urls = array['https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/cashews.jpg'] where slug = 'whole-cashews-w240';
update public.products set image_urls = array['https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/pistachios.jpg'] where slug = 'roasted-salted-pistachios';
update public.products set image_urls = array['https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/walnuts.jpg'] where slug = 'kashmiri-walnut-kernels';
update public.products set image_urls = array['https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/raisins.jpg'] where slug = 'green-seedless-raisins';
update public.products set image_urls = array['https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/dates.jpg'] where slug = 'medjool-dates';
update public.products set image_urls = array['https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/figs.jpg'] where slug = 'afghani-dried-figs';
update public.products set image_urls = array['https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/mixes.jpg'] where slug = 'festive-mix';
update public.products set image_urls = array['https://oaslejowibcvprddusbv.supabase.co/storage/v1/object/public/product-images/categories/seeds.jpg'] where slug = 'roasted-pumpkin-seeds';
-- Free-license photo (Pexels License: free for commercial use, no
-- attribution required).
update public.products set image_urls = array['https://images.pexels.com/photos/29060107/pexels-photo-29060107.jpeg?auto=compress&cs=tinysrgb&w=1200'] where slug = 'turkish-dried-apricots';
