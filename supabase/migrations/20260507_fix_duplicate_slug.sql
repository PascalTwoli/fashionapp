-- Fix duplicate slug issue by making slugs unique with a suffix when needed

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS set_product_slug ON public.products;
DROP FUNCTION IF EXISTS public.generate_product_slug();

-- Create improved function that handles duplicate slugs
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 1;
BEGIN
  -- Generate base slug from product name if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(NEW.name, '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug); -- Remove leading/trailing dashes
    
    final_slug := base_slug;
    
    -- Check if slug already exists and append suffix if needed
    WHILE EXISTS(SELECT 1 FROM public.products WHERE slug = final_slug AND id != NEW.id) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER set_product_slug
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.generate_product_slug();
