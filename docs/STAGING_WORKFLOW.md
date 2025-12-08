# Staging to Production Workflow

## Current Setup ✅

You have:
- ✅ Separate **Staging Supabase** project
- ✅ Separate **Staging Vercel** project
- ✅ `staging` branch on GitHub
- ✅ `main` branch on GitHub (production)

## Recommended Workflow

### 1. Configure Your Projects

#### Staging Vercel Project
- **Project Name**: `putaway-preprocess-staging`
- **Environment Variables**: Use **staging** Supabase credentials
- **Deployment Source**: Deploy from `staging` branch (manually or auto)
- **URL**: `putaway-preprocess-staging.vercel.app` (stable URL)

#### Production Vercel Project  
- **Project Name**: `putaway-preprocess` (or your production name)
- **Environment Variables**: Use **production** Supabase credentials
- **Deployment Source**: Auto-deploy from `main` branch
- **URL**: `putaway-preprocess.vercel.app` (or your production domain)

### 2. Daily Development Workflow

```bash
# 1. Start working on staging
git checkout staging
git pull origin staging

# 2. Create feature branch (optional, for larger features)
git checkout -b feature/my-feature

# 3. Make your changes
# ... edit files ...

# 4. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/my-feature  # or push directly to staging

# 5. If using feature branch, merge to staging
git checkout staging
git merge feature/my-feature
git push origin staging
```

### 3. Deploy to Staging

**Option A: Automatic (Recommended)**
- Push to `staging` branch
- Go to your **Staging Vercel project** dashboard
- Vercel should automatically create a deployment
- If not, manually trigger: **Deployments** → **Create Deployment** → Select `staging` branch

**Option B: Manual Deployment**
- Go to **Staging Vercel project** → **Deployments**
- Click **"Create Deployment"** or **"..."** → **"Redeploy"**
- Select `staging` branch
- Click **"Deploy"**

### 4. Test in Staging

- Visit your staging URL: `putaway-preprocess-staging.vercel.app`
- Test all functionality thoroughly
- Verify data is coming from **staging** Supabase (not production)
- Check browser console for errors
- Test on different devices/browsers if needed

### 5. Deploy to Production (When Satisfied)

```bash
# 1. Ensure staging is up-to-date and tested
git checkout staging
git pull origin staging

# 2. Merge staging into main
git checkout main
git pull origin main
git merge staging
git push origin main
```

**What happens:**
- Production Vercel project detects push to `main`
- Automatically builds and deploys
- Uses **production** Supabase credentials
- Goes live at production URL

### 6. Keep Staging in Sync

Periodically sync staging with production to keep it up-to-date:

```bash
# Merge main back into staging to get production updates
git checkout staging
git merge main
git push origin staging
```

## Quick Reference

| Step | Branch | Vercel Project | Supabase | Action |
|------|-------|----------------|----------|--------|
| **Develop** | `staging` | Staging | Staging | Make changes |
| **Test** | `staging` | Staging | Staging | Deploy & test |
| **Deploy** | `main` | Production | Production | Merge & push |

## Environment Variables Setup

### Staging Vercel Project
```
NEXT_PUBLIC_SUPABASE_URL=<staging-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-supabase-key>
NEXT_PUBLIC_APP_URL=https://putaway-preprocess-staging.vercel.app
```

### Production Vercel Project
```
NEXT_PUBLIC_SUPABASE_URL=<production-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-supabase-key>
NEXT_PUBLIC_APP_URL=https://putaway-preprocess.vercel.app
```

## Important Notes

1. **Always test in staging first** before merging to `main`
2. **Double-check environment variables** - staging project should use staging Supabase
3. **Verify data isolation** - staging should never touch production data
4. **Keep branches in sync** - periodically merge `main` → `staging` to keep staging current
5. **Use descriptive commit messages** - helps track what's being deployed

## Troubleshooting

### Staging not deploying?
- Check that you're pushing to `staging` branch
- Verify staging Vercel project is connected to your repo
- Manually trigger deployment from Vercel dashboard

### Wrong database being used?
- Verify environment variables in Vercel project settings
- Check that staging project uses staging Supabase URL
- Clear browser cache and hard refresh

### Can't merge staging to main?
- Ensure `main` is up-to-date: `git pull origin main`
- Resolve any merge conflicts
- Test staging one more time before merging

## Best Practices

✅ **Do:**
- Test thoroughly in staging before production
- Use feature branches for larger changes
- Keep commit messages descriptive
- Verify environment variables are correct
- Test data isolation (staging ≠ production)

❌ **Don't:**
- Skip staging testing
- Deploy directly to production
- Mix staging and production credentials
- Forget to sync staging with production updates
- Commit sensitive data or credentials

