# Google Drive Integration for Product Image Uploads

## ✅ Implementation Complete

Google Drive integration has been successfully added to the ProductForm component for admin users to upload product images directly from their Google Drive.

---

## 📋 What Was Added

### 1. **New Files Created**
- `src/lib/googleDriveIntegration.ts` - Google Drive API integration utilities
- `src/components/GoogleDrivePicker.tsx` - Image picker modal component
- `supabase/migrations/20260508_add_google_drive_tokens.sql` - Database schema update

### 2. **Modified Files**
- `src/components/admin/ProductForm.tsx` - Added Google Drive upload button
- `.env` - Added `VITE_GOOGLE_CLIENT_ID` configuration
- `.env.example` - Updated with Google Drive setup instructions

---

## 🔧 Setup Instructions

### Step 1: Set Up Google OAuth 2.0

Follow these steps to get your Google Client ID:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the **Google Drive API** (search in "APIs & Services")
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web Application**
6. Add Authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
7. Add Authorized redirect URIs:
   - `http://localhost:5173/auth/google-callback` (development)
   - `https://yourdomain.com/auth/google-callback` (production)
8. Copy the **Client ID** and paste it in your `.env` file:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Step 2: Run Database Migration

The migration adds three new columns to the `profiles` table to store Google tokens:

```bash
# Using Supabase CLI
supabase migration up

# Or apply manually in Supabase SQL Editor:
supabase/migrations/20260508_add_google_drive_tokens.sql
```

**Columns added to `profiles` table:**
- `google_drive_access_token` (TEXT) - OAuth access token
- `google_drive_refresh_token` (TEXT) - OAuth refresh token
- `google_drive_token_expires_at` (TIMESTAMP) - Token expiration time

### Step 3: Restart Your Dev Server

After updating `.env` and running the migration:

```bash
npm run dev
# or
bun run dev
```

---

## 🎯 Feature Overview

### How It Works

1. **Admin-Only Access**: Only users with admin role can see the "Upload from Google Drive" button
2. **OAuth Authentication**: First-time users will be prompted to log in with their Google account
3. **Token Storage**: Access tokens are stored securely in the database for future use
4. **Automatic Refresh**: Expired tokens trigger re-authentication
5. **Image Selection**: Users can browse and select images from their Google Drive
6. **Automatic Upload**: Selected images are downloaded and uploaded to Supabase storage

### User Flow

```
1. Admin clicks "Upload from Google Drive" button
   ↓
2. Opens Google Drive picker modal
   ↓
3. If not authenticated:
   - Shows "Connect Google Drive" button
   - Opens OAuth popup
   - User logs in with their Google account
   ↓
4. Loads images from user's Google Drive
   ↓
5. User selects one or more images
   ↓
6. Clicks "Download" button
   ↓
7. Images are downloaded from Drive and uploaded to Supabase
   ↓
8. Image previews appear in the product form
   ↓
9. User completes product creation/editing normally
```

### Technical Details

- **OAuth Scope**: `https://www.googleapis.com/auth/drive.readonly` (read-only access to Drive files)
- **Image Formats**: PNG, JPG, GIF, WEBP (automatically filtered from Google Drive)
- **Max File Size**: No limit (handled by Supabase separately)
- **Token Refresh**: Handled gracefully with re-authentication prompts
- **Security**: Tokens stored securely in Supabase with user isolation

---

## 🔐 Security Considerations

1. **Credentials Storage**: OAuth tokens are stored in the `profiles` table with the user's account
2. **Scope Limitation**: Only read access to Drive files is requested
3. **Token Expiration**: Tokens expire in 1-2 hours; refresh tokens are stored for automatic renewal
4. **User Isolation**: Each user only accesses their own Drive files
5. **HTTPS Required**: OAuth tokens must be transmitted over HTTPS in production

---

## 🐛 Troubleshooting

### Issue: "Failed to open authentication popup"
- **Cause**: Browser popup blocker
- **Solution**: Disable popup blocker for your dev domain

### Issue: "No images found in Google Drive"
- **Cause**: No image files in the connected Google Drive
- **Solution**: Upload some images to Google Drive or check permissions

### Issue: "Token expired" after some time
- **Cause**: Access token expired naturally (1-2 hours)
- **Solution**: Click Google Drive button again to re-authenticate

### Issue: Column 'google_drive_access_token' does not exist
- **Cause**: Migration not run yet
- **Solution**: Run `supabase migration up` from your terminal

### Issue: VITE_GOOGLE_CLIENT_ID undefined
- **Cause**: Not set in `.env` file
- **Solution**: Copy-paste your Google Client ID from Google Cloud Console

---

## 📦 Dependencies

The implementation uses only existing dependencies:
- `@supabase/supabase-js` - Already installed
- React built-ins (`FileReader`, `fetch` API)
- Existing shadcn/ui components (Dialog, Button, Checkbox)

---

## 🚀 Future Enhancements

Potential improvements for later:

1. **Batch Operations**: Upload multiple product images in one go
2. **Folder Browsing**: Navigate Google Drive folders directly
3. **Image Preview**: Show thumbnail previews from Drive API
4. **Auto Token Refresh**: Background refresh before expiration
5. **Multiple Drive Accounts**: Switch between different Google accounts
6. **Drive Sync**: Auto-sync specific folders to product gallery

---

## 📝 Notes

- This integration is admin-only by design (product creation feature)
- Each admin user has their own Google Drive connection
- Admins can disconnect their Google Drive at any time
- Images are downloaded to Supabase storage, not linked from Drive
- Disconnect button clears all stored Google tokens

---

## ✨ Files Reference

- **Integration Logic**: `src/lib/googleDriveIntegration.ts`
- **UI Component**: `src/components/GoogleDrivePicker.tsx`
- **Form Integration**: `src/components/admin/ProductForm.tsx` (lines ~680-695)
- **Database Schema**: `supabase/migrations/20260508_add_google_drive_tokens.sql`
