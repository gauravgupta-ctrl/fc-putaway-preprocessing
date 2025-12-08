# Staging Environment Setup Guide

Complete guide for setting up separate Supabase and Vercel projects for staging/testing.

## Overview

This setup creates a **completely isolated staging environment** that mirrors production but uses separate infrastructure:

- **Production**: `main` branch → Production Vercel project → Production Supabase project
- **Staging**: `staging` branch → Staging Vercel project → Staging Supabase project

## Prerequisites

- GitHub repository access
- Vercel account
- Supabase account
- Admin access to both platforms

---

## Step 1: Create Staging Supabase Project

### 1.1 Create New Supabase Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Create New Project**
   - Click "New Project"
   - **Project Name**: `putaway-preprocess-staging` (or similar)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the same region as production (for consistency)
   - Click "Create new project"
   - Wait ~2 minutes for project initialization

3. **Get Staging Credentials**
   - Go to **Project Settings** → **API**
   - Copy these values (you'll need them later):
     - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
     - **anon/public key**: Long string starting with `eyJ...`
   - Save these in a secure location

### 1.2 Set Up Database Schema

You need to replicate your production database schema in staging:

#### Option A: Copy from Production (Recommended)

1. **Export Production Schema**
   ```bash
   # In production Supabase dashboard:
   # Go to SQL Editor → Create new query
   # Run: SELECT * FROM information_schema.tables WHERE table_schema = 'public';
   ```

2. **Run Migrations in Staging**
   - Go to staging Supabase project
   - Navigate to **SQL Editor**
   - Copy all migration files from `supabase/migrations/` directory
   - Run them in order (001, 002, 003, etc.)
   - Or use Supabase CLI if you have it set up

#### Option B: Manual Setup

1. Go to staging Supabase **SQL Editor**
2. Run each migration file from `supabase/migrations/` in order
3. Verify tables are created correctly

### 1.3 Set Up Authentication (if using)

1. Go to **Authentication** → **Providers**
2. Configure the same providers as production
3. Set up email templates if needed

### 1.4 Configure Row Level Security (RLS)

1. Go to **Authentication** → **Policies**
2. Replicate the same RLS policies from production
3. Or run the same policy creation SQL scripts

---

## Step 2: Create Staging Vercel Project

### 2.1 Create New Vercel Project

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in to your account

2. **Import Project**
   - Click "Add New Project"
   - Find your repository: `fc-putaway-preprocessing` (or your repo name)
   - Click "Import"

3. **Configure Project Settings**
   - **Project Name**: `putaway-preprocess-staging`
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

4. **Configure Git Settings**
   - **Production Branch**: Set to `staging` (important!)
   - This ensures only the `staging` branch deploys to this project

5. **Click "Deploy"**
   - Wait for initial deployment to complete
   - Note the staging URL (e.g., `putaway-preprocess-staging.vercel.app`)

### 2.2 Configure Environment Variables

1. **Go to Project Settings**
   - In your staging Vercel project
   - Click "Settings" → "Environment Variables"

2. **Add Staging Environment Variables**

   Add these variables and select **"Production, Preview, Development"** for each:

   | Variable Name | Value | Notes |
   |--------------|-------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your **staging** Supabase URL | From Step 1.1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your **staging** Supabase anon key | From Step 1.1 |
   | `NEXT_PUBLIC_APP_URL` | Your staging Vercel URL | e.g., `https://putaway-preprocess-staging.vercel.app` |
   | `RESEND_API_KEY` | (Same as production or separate) | Optional: use same or separate |
   | `GOOGLE_CLIENT_ID` | (Same as production or separate) | If using Google OAuth |
   | `GOOGLE_CLIENT_SECRET` | (Same as production or separate) | If using Google OAuth |

   ⚠️ **Important**: Make sure you're using **staging** Supabase credentials, not production!

3. **Save and Redeploy**
   - Click "Save" after adding each variable
   - Go to "Deployments" tab
   - Click the three dots on latest deployment → "Redeploy"

---

## Step 3: Push Staging Branch to GitHub

1. **Ensure staging branch exists locally**
   ```bash
   git checkout staging
   git status
   ```

2. **Push to GitHub**
   ```bash
   git push -u origin staging
   ```

   If you get authentication errors, you can:
   - Push through your IDE (VS Code, Cursor, etc.)
   - Or set up GitHub authentication

3. **Verify branch exists on GitHub**
   - Go to your GitHub repository
   - Check that `staging` branch appears in the branch list

---

## Step 4: Verify Staging Environment

### 4.1 Test Staging Deployment

1. **Check Vercel Deployment**
   - Go to staging Vercel project
   - Verify latest deployment succeeded
   - Visit the staging URL in browser
   - App should load (may show errors if database not fully set up)

2. **Test Database Connection**
   - Try logging in or accessing a page that queries the database
   - Check browser console for errors
   - Verify data is coming from staging database (not production)

### 4.2 Test Basic Functionality

- [ ] App loads without errors
- [ ] Database connection works
- [ ] Authentication works (if applicable)
- [ ] Can create test data
- [ ] Data appears only in staging database

---

## Step 5: Workflow Documentation

### Daily Development Workflow

#### Making Changes for Testing

1. **Work on staging branch:**
   ```bash
   git checkout staging
   git pull origin staging  # Get latest changes
   ```

2. **Create feature branch (optional):**
   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git add .
   git commit -m "Add new feature"
   ```

3. **Merge to staging:**
   ```bash
   git checkout staging
   git merge feature/my-feature
   git push origin staging
   ```

4. **Test on staging URL**
   - Vercel auto-deploys when you push to `staging`
   - Wait ~2-3 minutes for deployment
   - Test on staging URL

5. **When satisfied, deploy to production:**
   ```bash
   git checkout main
   git pull origin main
   git merge staging
   git push origin main
   ```

#### Quick Iteration Workflow

For quick testing:
```bash
# Make changes
git checkout staging
# Edit files
git add .
git commit -m "Test changes"
git push origin staging

# Test on staging URL
# If good:
git checkout main
git merge staging
git push origin main
```

---

## Step 6: Keep Staging in Sync

### Sync Staging with Production Periodically

To keep staging database schema up-to-date:

1. **When new migrations are added:**
   - Run them in staging Supabase SQL Editor
   - Or use Supabase CLI: `supabase db push --project-ref staging-project-ref`

2. **Sync code changes:**
   ```bash
   git checkout staging
   git merge main
   git push origin staging
   ```

### Reset Staging Database (Optional)

If you want to start fresh in staging:

1. **Backup first** (if needed)
2. **In Supabase SQL Editor**, run:
   ```sql
   -- Be careful! This deletes all data
   TRUNCATE TABLE table1, table2, table3 CASCADE;
   ```
3. **Or drop and recreate** (if you have migrations)

---

## Environment Variable Reference

### Required Variables

| Variable | Production | Staging | Notes |
|----------|-----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production URL | Staging URL | Different for each |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production key | Staging key | Different for each |
| `NEXT_PUBLIC_APP_URL` | Production URL | Staging URL | Different for each |

### Optional Variables

| Variable | Production | Staging | Notes |
|----------|-----------|---------|-------|
| `RESEND_API_KEY` | Production key | Same or separate | Email service |
| `GOOGLE_CLIENT_ID` | Production ID | Same or separate | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Production secret | Same or separate | Google OAuth |

---

## Troubleshooting

### Staging Not Deploying

**Problem**: Changes to `staging` branch don't trigger deployment

**Solutions**:
- Check Vercel project settings → Git → Production Branch is set to `staging`
- Verify branch is pushed to GitHub
- Check Vercel deployment logs for errors
- Manually trigger redeploy in Vercel dashboard

### Database Connection Errors

**Problem**: Staging app can't connect to staging database

**Solutions**:
- Verify environment variables are set correctly in Vercel
- Check that staging Supabase project is active
- Verify Supabase URL and anon key are correct
- Check browser console for specific error messages
- Ensure Supabase project hasn't been paused

### Wrong Database Being Used

**Problem**: Staging app is reading from production database

**Solutions**:
- Double-check `NEXT_PUBLIC_SUPABASE_URL` in Vercel staging project
- Verify you're using staging credentials, not production
- Clear browser cache and hard refresh
- Check Vercel environment variable settings

### Schema Mismatch

**Problem**: Staging database schema doesn't match production

**Solutions**:
- Run all migrations from `supabase/migrations/` in staging
- Check migration order (001, 002, 003, etc.)
- Verify all tables exist in staging
- Compare table structures between production and staging

---

## Security Best Practices

1. ✅ **Never commit environment variables** to Git
2. ✅ **Use different Supabase projects** for staging/production
3. ✅ **Limit access** to staging environment (don't share staging URL publicly)
4. ✅ **Use strong passwords** for staging database
5. ✅ **Regularly rotate** API keys if compromised
6. ✅ **Monitor staging** for unusual activity

---

## Cost Considerations

### Supabase
- **Free tier**: 500 MB database, 2 GB bandwidth
- **Staging**: Can use free tier for testing
- **Production**: May need paid plan as you scale

### Vercel
- **Free tier**: 100 GB bandwidth, unlimited deployments
- **Staging**: Uses same free tier allocation
- **Production**: Shares bandwidth with staging

**Total cost**: Usually $0 for small teams, scales as you grow

---

## Quick Reference

| Item | Production | Staging |
|------|-----------|---------|
| **Branch** | `main` | `staging` |
| **Vercel Project** | `putaway-preprocess` | `putaway-preprocess-staging` |
| **Vercel URL** | `putaway-preprocess.vercel.app` | `putaway-preprocess-staging.vercel.app` |
| **Supabase Project** | Production project | Staging project |
| **Database** | Production DB | Staging DB |

---

## Next Steps

1. ✅ Complete Step 1: Create staging Supabase project
2. ✅ Complete Step 2: Create staging Vercel project
3. ✅ Complete Step 3: Push staging branch
4. ✅ Complete Step 4: Verify everything works
5. ✅ Start using staging for testing!

---

## Support

If you encounter issues:
- Check Vercel deployment logs
- Check Supabase project logs
- Review browser console for errors
- Verify all environment variables are set correctly

