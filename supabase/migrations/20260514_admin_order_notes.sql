-- ============================================================
-- ADMIN ORDER NOTES TABLE
-- For internal order communication and operational tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_admin_notes_order_id ON admin_order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_admin_id ON admin_order_notes(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_created_at ON admin_order_notes(created_at DESC);

-- Row Level Security
ALTER TABLE admin_order_notes ENABLE ROW LEVEL SECURITY;

-- Admins can view, create, update, delete notes for all orders
DROP POLICY IF EXISTS "Admins manage order notes" ON admin_order_notes;
CREATE POLICY "Admins manage order notes" ON admin_order_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_admin_notes_timestamp ON admin_order_notes;
CREATE TRIGGER update_admin_notes_timestamp
  BEFORE UPDATE ON admin_order_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
