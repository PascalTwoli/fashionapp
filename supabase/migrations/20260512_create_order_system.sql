-- ============================================================
-- ORDER SYSTEM MIGRATION
-- Complete ecommerce order architecture for FashionUp
-- ============================================================

-- ============================================================
-- PART 1: ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'mpesa',
    'card',
    'cash_on_delivery'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- PART 2: ORDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL,
  
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  
  shipping_first_name TEXT NOT NULL,
  shipping_last_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_county TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'Kenya',
  
  delivery_instructions TEXT,
  
  payment_reference TEXT,
  
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT order_number_format CHECK (order_number ~ '^FUP-[0-9]{4}-[0-9]{6}$')
);

-- ============================================================
-- PART 2B: ADD MISSING COLUMNS (for partial migrations)
-- ============================================================

-- Add missing columns to orders table - wrapped with exception handling
DO $$ BEGIN ALTER TABLE orders ADD COLUMN order_number TEXT UNIQUE; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN status order_status DEFAULT 'pending'; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN payment_status payment_status DEFAULT 'pending'; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN payment_method payment_method DEFAULT 'mpesa'; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN subtotal NUMERIC(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN shipping_fee NUMERIC(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN total_amount NUMERIC(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN customer_email TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN customer_phone TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN shipping_first_name TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN shipping_last_name TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN shipping_address TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN shipping_city TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN shipping_county TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN shipping_country TEXT DEFAULT 'Kenya'; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN delivery_instructions TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN payment_reference TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN placed_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- ============================================================
-- PART 3: ORDER ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  
  -- Snapshot fields (DO NOT rely on live data)
  product_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_image TEXT NOT NULL,
  
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10, 2) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 3B: ADD MISSING COLUMNS TO ORDER ITEMS
-- ============================================================

DO $$ BEGIN ALTER TABLE order_items ADD COLUMN product_name TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_items ADD COLUMN product_slug TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_items ADD COLUMN product_image TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_items ADD COLUMN size TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_items ADD COLUMN color TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_items ADD COLUMN unit_price NUMERIC(10, 2); EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_items ADD COLUMN quantity INTEGER; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_items ADD COLUMN line_total NUMERIC(10, 2); EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_items ADD COLUMN variant_id UUID; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_items ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);

-- ============================================================
-- PART 4: ORDER TIMELINE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  status order_status NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 4B: ADD MISSING COLUMNS TO ORDER TIMELINE
-- ============================================================

DO $$ BEGIN ALTER TABLE order_timeline ADD COLUMN status order_status; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_timeline ADD COLUMN note TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_timeline ADD COLUMN created_by UUID; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE order_timeline ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Index for timeline queries
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id);

-- ============================================================
-- PART 5: USER SHIPPING ADDRESSES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Kenya',
  
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 5B: ADD MISSING COLUMNS TO USER ADDRESSES
-- ============================================================

DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN first_name TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN last_name TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN phone TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN address TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN city TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN county TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN country TEXT DEFAULT 'Kenya'; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN is_default BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_addresses_one_default 
  ON user_addresses(user_id) 
  WHERE is_default = TRUE;

-- ============================================================
-- PART 6: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORDERS RLS POLICIES
-- ============================================================

-- Users can view their own orders
DROP POLICY IF EXISTS "Users view own orders" ON orders;
CREATE POLICY "Users view own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Users can insert their own orders
DROP POLICY IF EXISTS "Users create own orders" ON orders;
CREATE POLICY "Users create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update orders
DROP POLICY IF EXISTS "Admins update all orders" ON orders;
CREATE POLICY "Admins update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================
-- ORDER ITEMS RLS POLICIES
-- ============================================================

-- Users can view items for their own orders
DROP POLICY IF EXISTS "Users view own order items" ON order_items;
CREATE POLICY "Users view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );

-- Users can insert items for their own orders (during order creation)
DROP POLICY IF EXISTS "Users create order items" ON order_items;
CREATE POLICY "Users create order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================================
-- ORDER TIMELINE RLS POLICIES
-- ============================================================

-- Users can view timeline for their own orders
DROP POLICY IF EXISTS "Users view own order timeline" ON order_timeline;
CREATE POLICY "Users view own order timeline" ON order_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_timeline.order_id 
      AND (
        orders.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );

-- Users and admins can create timeline entries for their own orders
DROP POLICY IF EXISTS "Admins create timeline entries" ON order_timeline;
DROP POLICY IF EXISTS "Users create timeline entries" ON order_timeline;
CREATE POLICY "Users create timeline entries" ON order_timeline
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_timeline.order_id 
      AND (
        orders.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() 
          AND role = 'admin'
        )
      )
    )
  );

-- ============================================================
-- USER ADDRESSES RLS POLICIES
-- ============================================================

-- Users can view their own addresses
DROP POLICY IF EXISTS "Users view own addresses" ON user_addresses;
CREATE POLICY "Users view own addresses" ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own addresses
DROP POLICY IF EXISTS "Users create own addresses" ON user_addresses;
CREATE POLICY "Users create own addresses" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
DROP POLICY IF EXISTS "Users update own addresses" ON user_addresses;
CREATE POLICY "Users update own addresses" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own addresses
DROP POLICY IF EXISTS "Users delete own addresses" ON user_addresses;
CREATE POLICY "Users delete own addresses" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update orders.updated_at on status change
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_updated_at ON orders;
CREATE TRIGGER trigger_update_order_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_updated_at();

-- Update user_addresses.updated_at on change
CREATE OR REPLACE FUNCTION update_user_address_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_address_updated_at ON user_addresses;
CREATE TRIGGER trigger_update_user_address_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_address_updated_at();

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
