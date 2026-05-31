-- ============================================================
-- PAYMENT SYSTEM MIGRATION
-- platform_settings, payment_providers, Daraja order fields
-- ============================================================

-- Add 'cancelled' to payment_status enum (safe – idempotent in PG 14+)
DO $$ BEGIN
  ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION WHEN others THEN null;
END $$;

-- ============================================================
-- PLATFORM SETTINGS
-- Non-sensitive, publicly readable configuration.
-- Checkout reads enabled_payment_methods from here.
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL UNIQUE,
  value       JSONB       NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Checkout (anonymous + authenticated) needs to read this
DROP POLICY IF EXISTS "Public read platform settings" ON platform_settings;
CREATE POLICY "Public read platform settings" ON platform_settings
  FOR SELECT USING (true);

-- Only admins can write
DROP POLICY IF EXISTS "Admins manage platform settings" ON platform_settings;
CREATE POLICY "Admins manage platform settings" ON platform_settings
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

INSERT INTO platform_settings (key, value, description) VALUES
  ('enabled_payment_methods',  '["mpesa","cash_on_delivery"]', 'Ordered list of enabled payment method codes shown in checkout'),
  ('payment_collection_mode',  '"platform"',                   'platform = FashionUp collects; direct_to_seller = future marketplace routing'),
  ('default_currency',         '"KES"',                        'ISO 4217 currency code'),
  ('commission_type',          'null',                         'Future: percentage | flat | hybrid (null = not configured)'),
  ('commission_value',         'null',                         'Future: numeric commission amount or rate'),
  ('settlement_frequency',     '"weekly"',                     'Future: instant | daily | weekly | monthly'),
  ('automatic_settlements',    'false',                        'Future: auto-trigger seller settlements')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PAYMENT PROVIDERS
-- Registry of every gateway the platform may support.
-- enabled=true providers are shown in checkout.
-- configuration holds public, non-secret metadata only.
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_providers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT        NOT NULL UNIQUE,
  provider_name TEXT        NOT NULL,
  provider_type TEXT        NOT NULL,   -- mobile_money | card | digital_wallet | cash
  enabled       BOOLEAN     NOT NULL DEFAULT false,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  configuration JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read payment providers" ON payment_providers;
CREATE POLICY "Public read payment providers" ON payment_providers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage payment providers" ON payment_providers;
CREATE POLICY "Admins manage payment providers" ON payment_providers
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE OR REPLACE FUNCTION update_payment_provider_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_payment_provider_updated_at ON payment_providers;
CREATE TRIGGER trg_payment_provider_updated_at
  BEFORE UPDATE ON payment_providers
  FOR EACH ROW EXECUTE FUNCTION update_payment_provider_updated_at();

INSERT INTO payment_providers (provider_code, provider_name, provider_type, enabled, sort_order, configuration) VALUES
  ('mpesa',             'M-Pesa',            'mobile_money',  true,  1, '{"description":"Pay via STK Push (Safaricom)","countries":["KE"]}'),
  ('cash_on_delivery',  'Cash on Delivery',  'cash',          true,  2, '{"description":"Pay when your order arrives"}'),
  ('card',              'Card',              'card',          false, 3, '{"description":"Visa, Mastercard, Amex","note":"Coming soon"}'),
  ('paypal',            'PayPal',            'digital_wallet',false, 4, '{"description":"Pay with PayPal","note":"Coming soon"}')
ON CONFLICT (provider_code) DO NOTHING;

-- ============================================================
-- DARAJA / M-PESA FIELDS ON ORDERS
-- mpesa_checkout_request_id: links STK Push to the callback
-- mpesa_transaction_id:       receipt number from Safaricom
-- ============================================================

DO $$ BEGIN ALTER TABLE orders ADD COLUMN mpesa_checkout_request_id TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN mpesa_transaction_id      TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_orders_mpesa_checkout_req
  ON orders(mpesa_checkout_request_id)
  WHERE mpesa_checkout_request_id IS NOT NULL;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
