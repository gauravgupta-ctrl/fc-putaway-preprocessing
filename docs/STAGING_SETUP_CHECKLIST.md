# Staging Environment Setup Checklist

Use this checklist to set up your staging environment step-by-step.

## Prerequisites
- [ ] GitHub repository access
- [ ] Vercel account created
- [ ] Supabase account created
- [ ] Admin access to both platforms

---

## Step 1: Create Staging Supabase Project

### Create Project
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Project Name: `putaway-preprocess-staging`
- [ ] Set strong database password (save it!)
- [ ] Select region (same as production recommended)
- [ ] Click "Create new project"
- [ ] Wait ~2 minutes for initialization

### Get Credentials
- [ ] Go to Project Settings → API
- [ ] Copy **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
- [ ] Copy **anon/public key**: `eyJ...` (long string)
- [ ] Save both securely (you'll need them for Vercel)

### Set Up Database Schema
- [ ] Go to SQL Editor in staging Supabase
- [ ] Run migration files in order from `supabase/migrations/`:
  - [ ] `001_initial_schema.sql`
  - [ ] `002_sample_data.sql` (optional - skip if you don't want test data)
  - [ ] `003_fix_rls_policies.sql`
  - [ ] `004_add_user_roles.sql`
  - [ ] Continue with remaining migrations in numerical order
- [ ] Verify tables are created (check Database → Tables)

### Configure Authentication (if using)
- [ ] Go to Authentication → Providers
- [ ] Configure same providers as production
- [ ] Set up email templates if needed

### Set Up Row Level Security
- [ ] Go to Authentication → Policies
- [ ] Replicate RLS policies from production
- [ ] Or run policy creation SQL scripts

---

## Step 2: Create Staging Vercel Project

### Create Project
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New Project"
- [ ] Find repository: `fc-putaway-preprocessing` (or your repo name)
- [ ] Click "Import"

### Configure Settings
- [ ] Project Name: `putaway-preprocess-staging`
- [ ] Framework: Next.js (auto-detected)
- [ ] Root Directory: `./`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm install`

### Configure Git
- [ ] Go to Settings → Git
- [ ] **Production Branch**: Set to `staging` ⚠️ (Important!)
- [ ] This ensures only `staging` branch deploys here

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note staging URL: `putaway-preprocess-staging.vercel.app`

### Add Environment Variables
- [ ] Go to Settings → Environment Variables
- [ ] Add each variable below, selecting **"Production, Preview, Development"**:

#### Required Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = Your **staging** Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your **staging** Supabase anon key
- [ ] `NEXT_PUBLIC_APP_URL` = Your staging Vercel URL

#### Optional Variables (if using)
- [ ] `RESEND_API_KEY` = (Same as production or separate)
- [ ] `GOOGLE_CLIENT_ID` = (Same as production or separate)
- [ ] `GOOGLE_CLIENT_SECRET` = (Same as production or separate)

⚠️ **Double-check**: You're using **staging** Supabase credentials, not production!

### Redeploy
- [ ] After adding variables, go to Deployments
- [ ] Click three dots on latest deployment → "Redeploy"
- [ ] Wait for redeployment

---

## Step 3: Push Staging Branch

### Verify Branch Exists
- [ ] Run: `git checkout staging`
- [ ] Run: `git status` (should show you're on staging branch)

### Push to GitHub
- [ ] Run: `git push -u origin staging`
- [ ] Or push through your IDE if authentication fails
- [ ] Verify branch appears on GitHub

---

## Step 4: Verify Everything Works

### Test Vercel Deployment
- [ ] Go to staging Vercel project dashboard
- [ ] Verify latest deployment shows "Ready" status
- [ ] Visit staging URL in browser
- [ ] App should load (may show errors if DB not fully set up)

### Test Database Connection
- [ ] Try accessing a page that queries the database
- [ ] Check browser console (F12) for errors
- [ ] Verify data is coming from staging (not production)
- [ ] Create test data and verify it appears only in staging

### Test Basic Functionality
- [ ] App loads without errors
- [ ] Database queries work
- [ ] Authentication works (if applicable)
- [ ] Can create/read/update data
- [ ] Data isolation verified (staging ≠ production)

---

## Step 5: Document Your Setup

### Save Your Credentials
- [ ] Staging Supabase URL: `___________________________`
- [ ] Staging Supabase Anon Key: `___________________________`
- [ ] Staging Vercel URL: `___________________________`
- [ ] Staging Vercel Project Name: `___________________________`

### Update Team Documentation
- [ ] Share staging URL with team (if needed)
- [ ] Document workflow in team wiki/docs
- [ ] Set up access controls if needed

---

## Quick Reference After Setup

| Item | Value |
|------|-------|
| **Staging Branch** | `staging` |
| **Staging Vercel URL** | `https://putaway-preprocess-staging.vercel.app` |
| **Staging Supabase URL** | `https://xxxxxxxxxxxxx.supabase.co` |
| **Production Branch** | `main` |
| **Production Vercel URL** | `https://putaway-preprocess.vercel.app` |

---

## Common Issues Checklist

If something doesn't work:

- [ ] Verified environment variables are set correctly in Vercel
- [ ] Confirmed using staging Supabase credentials (not production)
- [ ] Checked Vercel deployment logs for errors
- [ ] Verified staging Supabase project is active (not paused)
- [ ] Confirmed all migrations ran successfully in staging
- [ ] Checked browser console for specific error messages
- [ ] Verified Vercel project is set to deploy from `staging` branch
- [ ] Cleared browser cache and hard refreshed

---

## Next Steps

Once everything is set up:

1. ✅ Start making changes on `staging` branch
2. ✅ Test on staging URL
3. ✅ When satisfied, merge `staging` → `main`
4. ✅ Production auto-deploys

---

## Need Help?

- 📖 See detailed guide: [`STAGING_ENVIRONMENT_SETUP.md`](./STAGING_ENVIRONMENT_SETUP.md)
- 🔍 Check Vercel deployment logs
- 🔍 Check Supabase project logs
- 🔍 Review browser console errors

