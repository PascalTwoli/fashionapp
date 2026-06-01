-- ============================================================
-- ADDRESS FIELD IMPROVEMENTS
-- Adds address_2 (apartment/suite), postcode, and email to
-- user_addresses and the corresponding shipping fields to orders.
-- ============================================================

DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN address_2 TEXT;         EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN postcode  TEXT;         EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE user_addresses ADD COLUMN email     TEXT;         EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN ALTER TABLE orders ADD COLUMN shipping_address_2 TEXT;        EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE orders ADD COLUMN shipping_postcode  TEXT;        EXCEPTION WHEN duplicate_column THEN null; END $$;
