# Deployment Guide

This guide covers how to deploy your Putaway Preprocess application to production.

## Overview

Since we're using managed services, deployment is straightforward:
- **Frontend**: Deploy to Vercel (recommended), Netlify, or any Node.js host
- **Backend/Database**: Already handled by Supabase
- **Email**: Already handled by Resend

---

## Option 1: Vercel (Recommended) ✨

Vercel is made by the creators of Next.js and offers the easiest deployment experience.

### Prerequisites
- GitHub account (free)
- Vercel account (free tier available)

### Deployment Steps

1. **Push your code to GitHub:**
   ```bash
   # Create a repository on GitHub first
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Sign up for Vercel:**
   - Visit: https://vercel.com
   - Click "Sign Up" and use your GitHub account

3. **Import your project:**
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

4. **Configure environment variables:**
   - In Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables"
   - Add these variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://ascuejemeuxubjbdskvl.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     RESEND_API_KEY=your-resend-key-here
     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
     ```
   - Click "Deploy"

5. **Update Supabase settings (if needed):**
   - Go to Supabase Dashboard > Project Settings > API
   - Add your Vercel domain to allowed URLs if using authentication

### Benefits
- ✅ Automatic HTTPS
- ✅ Free SSL certificate
- ✅ Auto-deploys on Git push
- ✅ Global CDN
- ✅ Custom domains supported
- ✅ Free tier: Generous limits

---

## Option 2: Netlify

Alternative to Vercel with similar features.

### Steps

1. **Sign up:** https://netlify.com
2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Add environment variables** (same as Vercel)
4. **Deploy**

---

## Option 3: Self-Hosted (Advanced)

If you need more control or have specific infrastructure requirements.

### Railway
1. Sign up: https://railway.app
2. Deploy from GitHub
3. Add environment variables
4. One-click deployment

### Render
1. Sign up: https://render.com
2. Connect GitHub repository
3. Select "Web Service"
4. Build command: `npm run build`
5. Start command: `npm start`

### AWS/GCP/Azure
- Requires more setup
- Use container-based deployment (Docker)
- Recommended only if you have cloud infrastructure experience

---

## Environment Variables

Regardless of deployment platform, you need these environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ascuejemeuxubjbdskvl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Resend (when ready)
RESEND_API_KEY=your-resend-key

# App URL (update with your actual domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**⚠️ Important:** Never commit `.env.local` to Git. Only use environment variables in your deployment platform.

---

## Post-Deployment Checklist

- [ ] Verify app loads at production URL
- [ ] Test authentication (once implemented)
- [ ] Check Supabase connection
- [ ] Test mobile responsiveness
- [ ] Set up custom domain (optional)
- [ ] Configure backups for Supabase database
- [ ] Set up monitoring (optional)

---

## Production Best Practices

1. **Security:**
   - Always use HTTPS
   - Keep environment variables secret
   - Enable Supabase Row Level Security (RLS)

2. **Performance:**
   - Enable Supabase connection pooling
   - Use Vercel's edge caching
   - Optimize images

3. **Monitoring:**
   - Set up error tracking (Sentry)
   - Monitor application performance
   - Track user analytics

4. **Backup:**
   - Enable Supabase daily backups
   - Keep database backups off-site
   - Version control all code

---

## Quick Deploy Commands

### Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment

---

**Recommended for your project:** Start with Vercel for the simplest setup!

