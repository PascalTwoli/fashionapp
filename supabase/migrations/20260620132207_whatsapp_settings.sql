-- ============================================================
-- WhatsApp Integration Settings
-- ============================================================
-- Adds WhatsApp chat functionality configuration to admin_settings
-- Phase 1: Basic WhatsApp chat button with customizable settings
-- ============================================================

INSERT INTO public.admin_settings (key, value, description, category) VALUES
  ('whatsapp_enabled', 'false'::jsonb, 'Enable WhatsApp chat button across the platform', 'whatsapp'),
  ('whatsapp_number', '"254759981287"'::jsonb, 'WhatsApp Business number (include country code without +)', 'whatsapp'),
  ('whatsapp_button_text', '"Chat on WhatsApp"'::jsonb, 'Text displayed on WhatsApp button', 'whatsapp'),
  ('whatsapp_open_mode', '"new_tab"'::jsonb, 'How to open WhatsApp: new_tab or same_tab', 'whatsapp'),
  ('whatsapp_locations', '["product_page", "quick_view", "wishlist", "search"]'::jsonb, 'Where to show WhatsApp button', 'whatsapp'),
  ('whatsapp_message_template', '"Hello FashionUp! 👋\n\nI''m interested in this product:\n\n📦 Product: {{product_name}}\n💰 Price: {{price}}\n🎨 Color: {{color}}\n📏 Size: {{size}}\n\n🔗 View Product:\n{{product_link}}\n\nCan I get more details?"'::jsonb, 'Message template with variables: {{product_name}}, {{price}}, {{color}}, {{size}}, {{product_link}}', 'whatsapp')
ON CONFLICT (key) DO NOTHING;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON public.admin_settings(category);
