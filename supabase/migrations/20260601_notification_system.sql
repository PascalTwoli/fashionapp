-- ============================================================
-- NOTIFICATION SYSTEM
-- notification_settings: per-event toggles (customer / admin)
-- notifications:         delivery log
-- SMTP config lives in admin_settings (existing key-value table)
-- ============================================================

-- 1. Per-event notification toggles
CREATE TABLE IF NOT EXISTS notification_settings (
  key         TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  label       TEXT    NOT NULL,
  description TEXT,
  category    TEXT    NOT NULL,  -- 'customer' | 'admin'
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO notification_settings (key, enabled, label, description, category) VALUES
  ('customer_order_placed',     true, 'Order Placed',     'Sent when customer places a new order',             'customer'),
  ('customer_payment_received', true, 'Payment Received', 'Sent when M-Pesa payment is confirmed',             'customer'),
  ('customer_payment_failed',   true, 'Payment Failed',   'Sent when M-Pesa payment fails',                   'customer'),
  ('customer_order_confirmed',  true, 'Order Confirmed',  'Sent when order is confirmed (e.g. COD approval)',  'customer'),
  ('customer_order_processing', true, 'Processing',       'Sent when order enters processing',                 'customer'),
  ('customer_order_shipped',    true, 'Shipped',          'Sent when order ships',                             'customer'),
  ('customer_order_delivered',  true, 'Delivered',        'Sent when order is delivered',                      'customer'),
  ('customer_order_cancelled',  true, 'Cancelled',        'Sent when order is cancelled',                      'customer'),
  ('admin_new_order',           true, 'New Order',        'Sent to admin(s) when a new order is placed',       'admin'),
  ('admin_payment_received',    true, 'Payment Received', 'Sent to admin(s) when payment is confirmed',        'admin'),
  ('admin_payment_failed',      true, 'Payment Failed',   'Sent to admin(s) when payment fails',               'admin'),
  ('admin_order_cancelled',     true, 'Order Cancelled',  'Sent to admin(s) when order is cancelled',          'admin')
ON CONFLICT (key) DO NOTHING;

-- 2. Notification delivery log
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  event      TEXT    NOT NULL,
  order_id   UUID    REFERENCES orders(id) ON DELETE SET NULL,
  recipient  TEXT    NOT NULL,
  channel    TEXT    NOT NULL DEFAULT 'email',
  audience   TEXT    NOT NULL,  -- 'customer' | 'admin'
  status     TEXT    NOT NULL DEFAULT 'pending',  -- 'sent' | 'failed' | 'skipped'
  error      TEXT,
  metadata   JSONB   NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_order_id   ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event      ON notifications(event);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;

-- notification_settings: admins can read/update; edge functions use service role (bypasses RLS)
DROP POLICY IF EXISTS "Admins manage notification settings" ON notification_settings;
CREATE POLICY "Admins manage notification settings" ON notification_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- notifications log: admins can read; service role inserts from edge fn
DROP POLICY IF EXISTS "Admins view notifications" ON notifications;
CREATE POLICY "Admins view notifications" ON notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 3. SMTP / email sender config — stored in existing admin_settings table
INSERT INTO admin_settings (key, value, description, category) VALUES
  ('smtp_host',              'null'::jsonb,         'SMTP hostname (e.g. smtp.gmail.com)',                          'notifications'),
  ('smtp_port',              '587'::jsonb,           'SMTP port — 587 for STARTTLS, 465 for SSL',                   'notifications'),
  ('smtp_secure',            'false'::jsonb,         'true = SSL/TLS on port 465; false = STARTTLS on port 587',    'notifications'),
  ('smtp_username',          'null'::jsonb,          'SMTP login username (usually the sender email)',               'notifications'),
  ('smtp_password',          'null'::jsonb,          'SMTP password or app-specific password',                      'notifications'),
  ('smtp_sender_name',       '"FashionUp"'::jsonb,   'Display name on outgoing emails',                             'notifications'),
  ('smtp_sender_email',      'null'::jsonb,          'From: email address',                                         'notifications'),
  ('smtp_reply_to',          'null'::jsonb,          'Reply-To address (optional, leave null to omit)',             'notifications'),
  ('admin_email_recipients', '[]'::jsonb,            'JSON array of admin email addresses for order notifications', 'notifications')
ON CONFLICT (key) DO NOTHING;
