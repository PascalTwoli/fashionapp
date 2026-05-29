-- Fix order_items.variant_id FK so deleting a product (which cascades to its variants)
-- does not block on order_items that referenced those variants.

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;

ALTER TABLE order_items ALTER COLUMN variant_id DROP NOT NULL;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
