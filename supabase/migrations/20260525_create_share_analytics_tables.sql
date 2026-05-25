-- Share Events Tracking Table
-- Tracks all product sharing actions for analytics, referral, and viral metrics

CREATE TABLE share_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL, -- native, copy_link, whatsapp, facebook, twitter, telegram, pinterest, qr_code, email
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  referral_code TEXT UNIQUE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX idx_share_events_product ON share_events(product_id);
CREATE INDEX idx_share_events_platform ON share_events(platform);
CREATE INDEX idx_share_events_user ON share_events(user_id);
CREATE INDEX idx_share_events_referral ON share_events(referral_code);
CREATE INDEX idx_share_events_created ON share_events(created_at DESC);

-- Share Clicks/Conversions Tracking
-- Tracks when someone visits from a shared link
CREATE TABLE share_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT REFERENCES share_events(referral_code) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  visitor_session_id TEXT NOT NULL,
  visitor_ip_address INET,
  conversion_type VARCHAR(50), -- view, add_to_cart, purchase
  conversion_value DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for conversions
CREATE INDEX idx_conversions_referral ON share_conversions(referral_code);
CREATE INDEX idx_conversions_product ON share_conversions(product_id);
CREATE INDEX idx_conversions_created ON share_conversions(created_at DESC);

-- Product Share Metrics View
-- Aggregated sharing data for each product
CREATE VIEW product_share_metrics AS
SELECT
  se.product_id,
  COUNT(*) as total_shares,
  COUNT(DISTINCT se.platform) as platforms_used,
  COUNT(DISTINCT se.user_id) as unique_sharers,
  COUNT(DISTINCT se.session_id) as unique_sessions,
  MAX(se.created_at) as last_shared_at,
  COUNT(CASE WHEN se.platform = 'native' THEN 1 END) as native_shares,
  COUNT(CASE WHEN se.platform = 'whatsapp' THEN 1 END) as whatsapp_shares,
  COUNT(CASE WHEN se.platform = 'facebook' THEN 1 END) as facebook_shares,
  COUNT(CASE WHEN se.platform = 'twitter' THEN 1 END) as twitter_shares,
  COUNT(CASE WHEN se.platform = 'telegram' THEN 1 END) as telegram_shares,
  COUNT(CASE WHEN se.platform = 'pinterest' THEN 1 END) as pinterest_shares,
  COUNT(CASE WHEN se.platform = 'qr_code' THEN 1 END) as qr_code_shares,
  COUNT(CASE WHEN se.platform = 'copy_link' THEN 1 END) as copy_link_shares,
  COUNT(DISTINCT sc.visitor_session_id) as referral_clicks,
  ROUND(CAST(COUNT(DISTINCT sc.visitor_session_id) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 2) as referral_click_rate
FROM share_events se
LEFT JOIN share_conversions sc ON se.referral_code = sc.referral_code
GROUP BY se.product_id;

-- Enable RLS (Row Level Security)
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow anyone to create events (public app)
CREATE POLICY "Anyone can insert share events" ON share_events
  FOR INSERT WITH CHECK (true);

-- Allow users to view only their own share events
CREATE POLICY "Users can view their own share events" ON share_events
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to view all share events
CREATE POLICY "Admins can view all share events" ON share_events
  FOR SELECT USING (auth.jwt() ->> 'user_role' = 'admin');

-- Allow anyone to insert conversions
CREATE POLICY "Anyone can insert share conversions" ON share_conversions
  FOR INSERT WITH CHECK (true);

-- Track updated_at automatically
CREATE TRIGGER update_share_events_timestamp BEFORE UPDATE ON share_events
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
