-- ============================================================
-- DARAJA CREDENTIALS IN ADMIN SETTINGS
-- Allows the admin to configure M-Pesa API credentials via
-- the Settings UI instead of the Supabase CLI/dashboard.
-- Edge functions read these at runtime using the service role.
-- ============================================================

INSERT INTO public.admin_settings (key, value, description, category) VALUES
  ('mpesa_consumer_key',    'null'::jsonb, 'Daraja API consumer key from developer.safaricom.co.ke',       'payments'),
  ('mpesa_consumer_secret', 'null'::jsonb, 'Daraja API consumer secret',                                   'payments'),
  ('mpesa_shortcode',       'null'::jsonb, 'M-Pesa business short code (e.g. 174379 for sandbox)',         'payments'),
  ('mpesa_passkey',         'null'::jsonb, 'Lipa Na M-Pesa online passkey from Daraja portal',             'payments'),
  ('mpesa_callback_url',    'null'::jsonb, 'Publicly accessible URL for Safaricom to POST payment results','payments'),
  ('mpesa_env',             '"sandbox"'::jsonb, 'sandbox | production',                                    'payments')
ON CONFLICT (key) DO NOTHING;
