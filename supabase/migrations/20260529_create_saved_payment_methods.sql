-- Saved payment methods for users.
-- Supports 'mpesa' and 'card' types (more can be added as admin settings evolve).
-- See docs/admin-settings-payment-methods.md for the roadmap.

CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'mpesa',       -- 'mpesa' | 'card'
  label TEXT NOT NULL,                       -- user-defined name e.g. "My M-Pesa", "Visa ****4242"
  -- M-Pesa fields
  phone TEXT,
  -- Card fields (never store full card number — last 4 + expiry only)
  card_last4 TEXT,
  card_holder TEXT,
  card_expiry TEXT,                          -- MM/YY
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);

-- Only one default per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_payment_methods_one_default
  ON saved_payment_methods(user_id) WHERE is_default = TRUE;

ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own payment methods" ON saved_payment_methods
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
