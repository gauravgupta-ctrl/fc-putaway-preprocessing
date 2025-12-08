# Staging Environment Setup Guide

> 📖 **For detailed setup instructions**, see: [`docs/STAGING_ENVIRONMENT_SETUP.md`](./docs/STAGING_ENVIRONMENT_SETUP.md)

## Overview
This project uses a **staging branch** workflow to test changes before deploying to production.

**Quick Setup**: If you want separate Supabase and Vercel projects (recommended), follow the [detailed guide](./docs/STAGING_ENVIRONMENT_SETUP.md).

## Branch Strategy

- **`main`** → Production environment (deploys to production URL)
- **`staging`** → Staging environment (deploys to staging URL for testing)

## Initial Setup

### 1. Push the staging branch to GitHub
```bash
git push -u origin staging
```

### 2. Configure Vercel

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Git**
3. Under **Production Branch**, ensure `main` is selected
4. Under **Preview Deployments**, you can configure which branches create previews
5. For staging, you have two options:

   **Option 1: Separate Vercel Project (Best for isolation)**
   - Create a new Vercel project linked to the same GitHub repo
   - Set it to deploy from the `staging` branch
   - This gives you a completely separate URL (e.g., `your-app-staging.vercel.app`)
   - Separate environment variables and settings

   **Option 2: Branch-based Deployments (Simpler)**
   - Keep one Vercel project
   - `main` branch → Production deployment
   - `staging` branch → Preview deployment with a consistent URL
   - You can promote staging to production when ready

#### Option B: Using Vercel CLI
```bash
# Link staging branch to a separate project
vercel --prod=false --branch=staging
```

### 3. Environment Variables

If you need different environment variables for staging:
- In Vercel Dashboard → **Settings** → **Environment Variables**
- Add variables and select which environments they apply to:
  - **Production** (main branch)
  - **Preview** (staging branch and PRs)
  - **Development** (local)

## Workflow

### Testing Changes in Staging

1. **Create a feature branch from staging:**
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. **Push to staging:**
   ```bash
   git push origin feature/your-feature-name
   # Or merge to staging:
   git checkout staging
   git merge feature/your-feature-name
   git push origin staging
   ```

4. **Test on staging URL** (Vercel will auto-deploy)

5. **When satisfied, merge to production:**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

### Quick Testing Workflow

For quick iterations:
```bash
# Work on staging
git checkout staging
# Make changes
git add .
git commit -m "Test changes"
git push origin staging

# Test on staging URL

# If good, merge to main
git checkout main
git merge staging
git push origin main
```

## Vercel Configuration

### Recommended: Separate Staging Project

1. Create a new Vercel project:
   - Project name: `putaway-preprocess-staging`
   - Link to same GitHub repo
   - Set **Production Branch** to `staging`
   - This gives you: `putaway-preprocess-staging.vercel.app`

2. Configure environment variables separately for staging

3. When ready for production:
   - Merge `staging` → `main`
   - Production project auto-deploys

### Alternative: Branch-based (Single Project)

- `main` branch → Production deployment
- `staging` branch → Preview deployment
- You can manually promote previews to production in Vercel dashboard

## Database Considerations

⚠️ **Important**: Decide if staging should use:
- **Separate database** (recommended for true isolation)
- **Same database** (simpler, but staging changes affect production data)

If using separate database:
- Create a new Supabase project for staging
- Update staging environment variables with staging database credentials

## Best Practices

1. ✅ Always test in staging before merging to main
2. ✅ Keep staging branch up-to-date with main periodically
3. ✅ Use descriptive commit messages
4. ✅ Test thoroughly in staging before production deployment
5. ✅ Consider using separate databases for staging/production

## Troubleshooting

### Staging not deploying?
- Check Vercel project settings
- Ensure branch is pushed to GitHub
- Check Vercel deployment logs

### Need to reset staging?
```bash
git checkout staging
git reset --hard main
git push origin staging --force
```

### Merge staging to main
```bash
git checkout main
git pull origin main
git merge staging
git push origin main
```

