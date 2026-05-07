# Supabase Setup & Configuration Guide

## Quick Start (Choose One Method)

### 🚀 **Method 1: Using Supabase CLI (Recommended)**

#### Prerequisites

- Node.js v18+ installed
- Supabase account with active project

#### Step-by-Step

1. **Install Supabase CLI**

   ```bash
   # macOS (Homebrew)
   brew install supabase/tap/supabase

   # Verify installation
   supabase --version
   ```

2. **Login to Supabase**

   ```bash
   supabase login

   # This opens your browser for authentication
   # Follow the prompts and authorize the CLI
   ```

3. **Link to Your Project**

   ```bash
   cd /Users/theboys/dev/fashionapp

   supabase link --project-ref liifbjpwbhsnoxzcthqv

   # The CLI will:
   # ✅ Auto-generate .env.local with credentials
   # ✅ Set up local development environment
   # ✅ Configure project defaults
   ```

4. **Verify Setup**

   ```bash
   # Check if .env.local was created
   cat .env.local

   # Should show:
   # VITE_SUPABASE_URL=https://liifbjpwbhsnoxzcthqv.supabase.co
   # VITE_SUPABASE_ANON_KEY=<your-key>
   ```

5. **Start Local Development (Optional)**

   ```bash
   # This requires Docker to be running
   supabase start

   # Pulls your database schema locally
   # Creates local Postgres instance for testing
   ```

---

### 📋 **Method 2: Manual Setup (No CLI)**

1. **Get Your Credentials from Supabase Dashboard**
   - Go to: https://app.supabase.com/project/liifbjpwbhsnoxzcthqv/settings/api
   - Copy the values shown below

2. **Update `.env.local` File**

   ```env
   VITE_SUPABASE_URL=https://liifbjpwbhsnoxzcthqv.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpaWZianB3Ymhzbm94emN0aHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NDU2NDMsImV4cCI6MjA2NzQyMTY0M30.YE9iQCRkC-4CmkhvIB4XgMNd5Wt1tZKc5h130nhHgQg

   VITE_APP_NAME=FashionUp
   VITE_APP_URL=http://localhost:5173
   VITE_API_TIMEOUT=30000
   ```

3. **Verify it Works**

   ```bash
   npm run dev

   # Open http://localhost:5173
   # Check browser console for any errors
   ```

---

## 📚 Environment Variables Explained

### Required Variables (Production)

| Variable                 | Purpose                         | Where to Get               |
| ------------------------ | ------------------------------- | -------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL       | Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Public API key (safe to expose) | Dashboard > Settings > API |

### Optional Variables (For Future Features)

```env
# Payment Processing (future)
VITE_STRIPE_PUBLIC_KEY=pk_live_...      # Stripe public key
STRIPE_SECRET_KEY=sk_live_...           # Server-side only!

# Email Service (future)
VITE_SENDGRID_API_KEY=SG.xxxxx          # SendGrid API key

# Analytics (future)
VITE_GA_MEASUREMENT_ID=G-xxxxxxxxxx     # Google Analytics ID

# App Configuration
VITE_APP_NAME=FashionUp                 # App name
VITE_APP_URL=http://localhost:5173      # App URL
VITE_API_TIMEOUT=30000                  # API timeout (ms)
```

---

## ⚠️ Security Best Practices

### DO ✅

- ✅ Add `.env.local` to `.gitignore` (already done)
- ✅ Use `VITE_` prefix for client-side variables
- ✅ Keep service role keys server-side only
- ✅ Rotate keys periodically
- ✅ Use different keys for dev/staging/production

### DON'T ❌

- ❌ Commit `.env.local` to Git
- ❌ Expose secret keys in client code
- ❌ Share credentials via email/chat
- ❌ Use production keys in development
- ❌ Log sensitive values to console

---

## 🧪 Testing Your Setup

### 1. Verify Environment Variables are Loaded

```typescript
// In browser console:
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### 2. Test Supabase Connection

```bash
# Create a test file: src/test-supabase.ts
import { supabase } from '@/integrations/supabase/client';

async function testConnection() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('❌ Connection failed:', error);
  } else {
    console.log('✅ Supabase connected!', data);
  }
}

testConnection();
```

### 3. Check Authentication

```bash
# Visit: http://localhost:5173/login
# Try signing up with a test account
# Check Supabase dashboard > Authentication > Users
```

---

## 🔑 Getting Your API Keys

### From Supabase Dashboard:

1. Go to: https://app.supabase.com
2. Select your project: `liifbjpwbhsnoxzcthqv`
3. Navigate to **Settings** → **API**
4. You'll see:
   - **Project URL** → Copy to `VITE_SUPABASE_URL`
   - **anon public** → Copy to `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** → Keep private (never share)

---

## 🚀 Development Workflow

### Local Development

```bash
# 1. Start dev server
npm run dev

# 2. Edit code (HMR works automatically)
# 3. Visit http://localhost:5173

# 4. Stop server
Ctrl + C
```

### Using Local Supabase (Advanced)

```bash
# Requires Docker to be running
supabase start

# Creates local PostgreSQL instance
# Access at: postgres://postgres:postgres@localhost:54322/postgres

# Stop local instance
supabase stop
```

---

## 🔄 Environment-Specific Configurations

### Development (.env.local)

```env
VITE_SUPABASE_URL=https://liifbjpwbhsnoxzcthqv.supabase.co
VITE_SUPABASE_ANON_KEY=<dev-key>
VITE_APP_URL=http://localhost:5173
```

### Staging (.env.staging)

```env
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-key>
VITE_APP_URL=https://staging.fashionup.app
```

### Production (.env.production)

```env
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=<prod-key>
VITE_APP_URL=https://fashionup.app
```

---

## 🐛 Troubleshooting

### "Missing VITE_SUPABASE_URL" Error

**Problem**: Environment variables not loading
**Solution**:

```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Verify it has content
cat .env.local

# 3. Restart dev server
npm run dev
```

### "Cannot read properties of undefined"

**Problem**: Supabase client not initialized
**Solution**:

```bash
# Check browser console for errors
# Verify .env.local has correct values
# Ensure VITE_ prefix is used (critical!)
```

### "Authentication failed"

**Problem**: Invalid API key
**Solution**:

```bash
# 1. Copy fresh key from Supabase dashboard
# 2. Update .env.local
# 3. Clear browser cache/localStorage
# 4. Restart dev server
```

### "CORS error in browser"

**Problem**: Supabase URL not matching
**Solution**:

```bash
# 1. Check Supabase project URL is correct
# 2. Verify it matches in .env.local
# 3. Check browser console for exact error
# 4. Update CORS settings in Supabase (if needed)
```

---

## 📝 Checklist

- [ ] Supabase account created and project active
- [ ] `.env.local` file created with credentials
- [ ] `.gitignore` updated to exclude `.env.local`
- [ ] `src/integrations/supabase/client.ts` updated to use env variables
- [ ] Dev server started (`npm run dev`)
- [ ] No errors in browser console
- [ ] Can view Supabase dashboard for your project
- [ ] Can see migrations applied in Supabase
- [ ] Can test authentication flow

---

## ✅ Next Steps

After setup is complete:

1. **Phase 1: Critical Fixes** (from engineering report)
   - [ ] Implement cart persistence
   - [ ] Implement wishlist persistence
   - [ ] Add payment processing
   - [ ] Implement order history
   - [ ] Connect products to Supabase

2. **Run Tests**

   ```bash
   # Test login
   npm run dev
   # Visit http://localhost:5173/login

   # Test database queries
   # Check Supabase dashboard for activity logs
   ```

3. **Commit Your Changes**
   ```bash
   git add .env.example .gitignore src/integrations/supabase/client.ts
   git commit -m "feat: configure Supabase with environment variables"
   git push
   ```

---

## 📞 Support

If you encounter issues:

1. Check Supabase documentation: https://supabase.com/docs
2. Review Supabase CLI docs: https://supabase.com/docs/guides/cli
3. Check project settings: https://app.supabase.com/project/liifbjpwbhsnoxzcthqv/settings/general

---

**Setup Date**: May 6, 2026  
**Last Updated**: May 6, 2026
