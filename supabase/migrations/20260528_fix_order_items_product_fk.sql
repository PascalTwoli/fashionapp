-- Fix order_items.product_id FK to allow product deletion while preserving order history.
-- Products store snapshot columns (product_name, product_image, price) so order history
-- remains readable even after the product is deleted.

-- Drop the existing RESTRICT FK
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Allow NULL so deleted products don't orphan the row
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;

-- Re-add FK: when a product is deleted, product_id becomes NULL but the order row survives
ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
