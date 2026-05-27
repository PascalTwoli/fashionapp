-- Create settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  category VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.admin_settings;

-- Policy: Only admins can read
CREATE POLICY "Admins can read settings"
  ON public.admin_settings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

-- Policy: Only admins can insert
CREATE POLICY "Admins can insert settings"
  ON public.admin_settings
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

-- Policy: Only admins can update
CREATE POLICY "Admins can update settings"
  ON public.admin_settings
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

-- Insert default settings
INSERT INTO public.admin_settings (key, value, description, category) VALUES
  ('bg_removal_enabled', 'true'::jsonb, 'Enable automatic background removal for white background images', 'image_processing'),
  ('bg_removal_method', '"removebg"'::jsonb, 'Primary background removal method: removebg, edge_function, client_side', 'image_processing'),
  ('removebg_api_key', 'null'::jsonb, 'API key for remove.bg service', 'image_processing'),
  ('bg_removal_fallback_order', '["removebg", "edge_function", "client_side"]'::jsonb, 'Order of methods to try if primary fails', 'image_processing'),
  ('bg_removal_quality', '"high"'::jsonb, 'Quality setting for background removal: high, medium, low', 'image_processing'),
  ('require_white_bg_for_recommendations', 'true'::jsonb, 'Require products to have white background images to appear in recommendations', 'recommendations')
ON CONFLICT (key) DO NOTHING;

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);
