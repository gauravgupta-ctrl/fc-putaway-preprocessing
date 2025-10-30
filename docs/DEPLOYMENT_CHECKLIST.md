# Deployment Checklist

Quick reference for deploying your application.

## Pre-Deployment

- [ ] All tests passing
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables documented in `.env.example`
- [ ] `.env.local` not committed to Git
- [ ] Database schema finalized
- [ ] Authentication tested
- [ ] Mobile responsiveness verified

## Deployment Platform Setup

- [ ] Created account (Vercel/Netlify/etc.)
- [ ] Connected GitHub repository
- [ ] Configured build settings
- [ ] Added all environment variables
- [ ] Set up custom domain (optional)
- [ ] Enabled HTTPS/SSL

## Environment Variables

Ensure all these are set in deployment platform:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Post-Deployment

- [ ] App loads successfully
- [ ] Authentication works
- [ ] Database connections functional
- [ ] Email sending works (if applicable)
- [ ] Error tracking configured
- [ ] Analytics setup (optional)
- [ ] Performance monitoring active

## Database

- [ ] Supabase production database configured
- [ ] Backup strategy in place
- [ ] Row Level Security (RLS) enabled
- [ ] Connection pooling configured

## Monitoring & Maintenance

- [ ] Error alerts configured
- [ ] Uptime monitoring setup
- [ ] Performance monitoring active
- [ ] Log aggregation configured
- [ ] Backup verification scheduled

## Security

- [ ] Environment variables secured
- [ ] API keys rotated if needed
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Authentication security reviewed

## Documentation

- [ ] Deployment steps documented
- [ ] Environment variables documented
- [ ] Rollback procedure documented
- [ ] Support contacts listed

