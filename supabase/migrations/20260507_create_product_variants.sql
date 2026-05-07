-- Create product_variants table for size/color-based inventory

CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    
    sku TEXT UNIQUE,
    price_override NUMERIC(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, size, color)
);

-- Create indexes for better query performance
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_size ON public.product_variants(size);
CREATE INDEX idx_product_variants_color ON public.product_variants(color);
CREATE INDEX idx_product_variants_stock ON public.product_variants(stock_quantity);

-- Enable Row Level Security
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view variants
CREATE POLICY "Anyone can view variants"
ON public.product_variants
FOR SELECT
USING (true);

-- Policy: Admins can manage variants
CREATE POLICY "Admins can manage variants"
ON public.product_variants
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_product_variants_timestamp
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_product_variants_updated_at();
