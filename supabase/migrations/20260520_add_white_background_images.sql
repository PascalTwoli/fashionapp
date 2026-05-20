-- Add white background image tracking for recommendation sections
-- Stores indices of images in the images array that have white backgrounds

ALTER TABLE public.products
ADD COLUMN white_background_indices INT[] DEFAULT ARRAY[]::INT[];

-- Create index for faster filtering in recommendation queries
CREATE INDEX IF NOT EXISTS idx_products_white_background ON public.products 
USING GIN (white_background_indices);

-- Add comment to explain the column
COMMENT ON COLUMN public.products.white_background_indices IS 
'Array of indices (0-based) indicating which images in the images array have white backgrounds. 
Used for filtering products in recommendation sections. Example: {0,2,5} means images at indices 0, 2, and 5 have white backgrounds.';
