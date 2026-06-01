-- ============================================================
-- PAYMENT IMPROVEMENTS
-- 1. payment_error column on orders (stores Daraja failure reason)
-- 2. Shipping settings in platform_settings (admin-configurable)
-- ============================================================

-- Store the human-readable reason when a payment fails
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN payment_error TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Shipping fee config (publicly readable so checkout can use it)
INSERT INTO platform_settings (key, value, description) VALUES
  ('shipping_fee',             '500',   'Standard shipping fee in KES (charged when order is below threshold)'),
  ('free_shipping_threshold',  '10000', 'Orders at or above this amount qualify for free shipping (set to 0 to always charge)')
ON CONFLICT (key) DO NOTHING;
