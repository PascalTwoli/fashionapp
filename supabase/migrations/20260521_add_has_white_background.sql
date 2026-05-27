-- Add has_white_background boolean column for faster filtering
-- This is a helper column that's true if white_background_indices is not empty

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS has_white_background BOOLEAN DEFAULT false;

-- Update existing products based on white_background_indices
UPDATE public.products
SET has_white_background = CASE 
  WHEN white_background_indices IS NOT NULL AND array_length(white_background_indices, 1) > 0 
  THEN true 
  ELSE false 
END;

-- Create index for faster filtering in recommendation queries
CREATE INDEX IF NOT EXISTS idx_products_has_white_background ON public.products(has_white_background) 
WHERE has_white_background = true;

-- Add comment to explain the column
COMMENT ON COLUMN public.products.has_white_background IS 
'Boolean helper column indicating if the product has at least one image with white background. 
Set to true automatically based on white_background_indices array. Used for faster filtering in recommendation sections.';
