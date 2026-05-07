-- Enhance products table with additional columns for better product management

-- Basic Improvements
ALTER TABLE public.products
ADD COLUMN slug TEXT UNIQUE,
ADD COLUMN brand TEXT,
ADD COLUMN gender TEXT CHECK (gender IN ('men', 'women', 'unisex'));

-- Pricing
ALTER TABLE public.products
ADD COLUMN discount_price NUMERIC(10,2),
ADD COLUMN currency TEXT DEFAULT 'KES';

-- Product Details
ALTER TABLE public.products
ADD COLUMN sizes TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g., ['S', 'M', 'L', 'XL']
ADD COLUMN colors TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g., ['Red', 'Black', 'White']
ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[]; -- e.g., ['summer', 'casual', 'trending']

-- Media
ALTER TABLE public.products
ADD COLUMN images TEXT[] DEFAULT ARRAY[]::TEXT[]; -- multiple product images

-- Status & Visibility
ALTER TABLE public.products
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
ADD COLUMN is_featured BOOLEAN DEFAULT false;

-- SEO
ALTER TABLE public.products
ADD COLUMN meta_title TEXT,
ADD COLUMN meta_description TEXT;

-- Create function to auto-generate slug from product name
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate slug from product name if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug); -- Remove leading/trailing dashes
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug
DROP TRIGGER IF EXISTS set_product_slug ON public.products;
CREATE TRIGGER set_product_slug
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.generate_product_slug();

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Create index on gender for filtering
CREATE INDEX IF NOT EXISTS idx_products_gender ON public.products(gender);

-- Create index on is_featured for featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

-- Create index on brand for filtering
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
