# Supabase Storage Setup Guide

## Storage Bucket Configuration

Your fashion app uses a "products" bucket for storing product images. Follow these steps to ensure it's properly configured:

### 1. Create the Storage Bucket (if not already created)

In your Supabase dashboard:

1. Go to **Storage** → **Buckets**
2. Click **New Bucket**
3. Name it: `products`
4. Check **Public bucket** (to allow unauthenticated reads)
5. Click **Create bucket**

### 2. Set Up Storage Policies

After creating the bucket, configure access policies:

**In Supabase Dashboard:**

1. Go to **Storage** → **Buckets** → **products**
2. Click the **Policies** tab
3. Create these policies:

#### Policy 1: Public Read (Everyone can view)

```
Name: Public read access
Definition: (bucket_id = 'products'::text)
Allowed operations: SELECT
Role: anon (Public)
```

#### Policy 2: Authenticated Upload (Only authenticated users)

```
Name: Authenticated upload access
Definition: (bucket_id = 'products'::text) AND (auth.role() = 'authenticated'::text)
Allowed operations: INSERT, UPDATE
Role: authenticated
```

#### Policy 3: Admin Full Access

```
Name: Admin full access
Definition: (bucket_id = 'products'::text) AND (auth.uid() IN (SELECT id FROM auth.users WHERE (raw_user_meta_data->>'role') = 'admin'))
Allowed operations: SELECT, INSERT, UPDATE, DELETE
Role: authenticated
```

### 3. Verify CORS Settings

Make sure CORS is configured to allow requests from your frontend:

1. In Supabase dashboard, go to **Storage** → **Settings**
2. Under **CORS configuration**, add your domain:
   ```
   http://localhost:5173  (for local development)
   https://yourdomain.com (for production)
   ```

### 4. Image Upload URL Structure

Images are stored in the `products` bucket with filenames like:

- `1778115031290-a9hi0q-photo.jpg`

Public URLs are generated as:

- `https://<project-id>.supabase.co/storage/v1/object/public/products/1778115031290-a9hi0q-photo.jpg`

### 5. Troubleshooting

If you get 522 errors:

1. Check that the bucket is set to **Public**
2. Verify CORS settings include your frontend URL
3. Ensure storage policies are correctly configured
4. Check file size limits (default is usually 100MB)
5. Verify the bucket name is exactly `products` (case-sensitive)

If uploads work but files aren't accessible:

1. Check that the bucket is public
2. Verify the public URL is correct
3. Clear browser cache and try again

### 6. Testing Storage Access

After configuration, test with:

```javascript
// Test upload
const { data, error } = await supabase.storage
	.from("products")
	.upload("test.txt", new File(["test"], "test.txt"));

// Test read
const { data: publicUrl } = supabase.storage
	.from("products")
	.getPublicUrl("test.txt");
```
