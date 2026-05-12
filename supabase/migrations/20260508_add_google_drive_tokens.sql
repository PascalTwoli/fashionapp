-- Add Google Drive OAuth token storage to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_drive_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_drive_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_drive_token_expires_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN profiles.google_drive_access_token IS 'OAuth 2.0 access token for Google Drive API access';
COMMENT ON COLUMN profiles.google_drive_refresh_token IS 'OAuth 2.0 refresh token to obtain new access tokens';
COMMENT ON COLUMN profiles.google_drive_token_expires_at IS 'Timestamp when the access token expires';
