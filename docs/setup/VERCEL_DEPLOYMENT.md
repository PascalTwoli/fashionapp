# Vercel Deployment Guide

## Prerequisites
- Vercel account (✅ You have this)
- Vercel CLI installed (`npm i -g vercel`)
- Git repository (your app can be deployed from a repo)

## Step-by-Step Deployment

### 1. Prepare Environment Variables
Before deploying, gather these values from Supabase:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `zowhukdggzyncpqghrav`
3. Navigate to **Settings > API**
4. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

5. For Google Drive integration:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Get your OAuth 2.0 Client ID → `VITE_GOOGLE_CLIENT_ID`

6. Update `.env.local` with your actual values

### 2. Install Vercel CLI
```bash
npm i -g vercel
```

### 3. Deploy to Vercel
```bash
# Login to Vercel (first time only)
vercel login

# Deploy to production
vercel --prod
```

Vercel CLI will:
- Ask for project name (use: `fashionapp`)
- Ask if it's a new project (yes)
- Ask for build command (auto-detected: `npm run build`)
- Ask for output directory (auto-detected: `dist`)
- Ask for install command (auto-detected: `npm install`)

### 4. Configure Environment Variables in Vercel Dashboard

After deployment, set environment variables in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Settings > Environment Variables**
4. Add these variables:

| Key | Value | Environments |
|-----|-------|--------------|
| `VITE_SUPABASE_URL` | `https://zowhukdggzyncpqghrav.supabase.co` | All |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | All |
| `VITE_GOOGLE_CLIENT_ID` | Your Google Client ID | All |
| `VITE_ADMIN_EMAILS` | `your-email@example.com` | All |
| `VITE_APP_NAME` | `FashionUp` | All |
| `VITE_APP_URL` | Your Vercel domain | All |
| `VITE_API_TIMEOUT` | `30000` | All |

5. Click **Save** and redeploy

### 5. Verify Deployment

1. After deployment completes, Vercel gives you a URL: `https://your-project.vercel.app`
2. Visit the URL and test:
   - Homepage loads
   - Products display
   - Navigation works
   - Authentication works (with your Supabase)
   - Admin functions work

### 6. Connect Custom Domain (Optional)

1. In Vercel Dashboard, go to **Settings > Domains**
2. Add your custom domain
3. Follow DNS instructions for your domain registrar

## Redeploy After Changes

To redeploy after making code changes:

```bash
# Just push to git and Vercel auto-deploys, OR
vercel --prod
```

## Troubleshooting

### Build fails
- Check Node version: `node --version` (should be 16+)
- Clear cache: `vercel env pull` then `npm install`

### Environment variables not loading
- Make sure variables are set in Vercel dashboard
- Prefix all client-side vars with `VITE_`
- Redeploy after adding variables

### Images not loading
- Check Supabase bucket is public
- Verify bucket name in code matches Supabase

### Supabase connection fails
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project is active
- Test in browser console: `fetch('SUPABASE_URL/rest/v1/')`

## CI/CD with GitHub

For automatic deployments on every push:

1. Push code to GitHub
2. Go to Vercel Dashboard > **Settings > Git**
3. Connect your GitHub repository
4. Select main branch for production
5. Vercel auto-deploys on every push

## Monitoring

Monitor your deployment:
- **Vercel Dashboard**: View build logs, runtime logs
- **Supabase Dashboard**: Check database, API usage
- **Browser DevTools**: Check for errors, network requests

---

**Your Project Details:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite + React + TypeScript
- Backend: Supabase
