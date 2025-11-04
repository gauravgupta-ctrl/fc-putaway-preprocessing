# Troubleshooting Guide

## Login Issues

### "Login failed: Invalid login credentials"

**Cause:** User doesn't exist in Supabase

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Create user with:
   - Email: `admin@test.com`
   - Password: `test123456`
   - Auto Confirm User: ✅ (check this box)
4. Click "Create user"
5. Try logging in again

---

### Login succeeds but stays on login page

**Cause:** Session not persisting or role not set

**Solution 1 - Check browser console:**
1. Press F12 to open developer tools
2. Go to Console tab
3. Look for any errors
4. Share the errors for debugging

**Solution 2 - Verify user exists:**
In Supabase → Authentication → Users, verify `admin@test.com` exists

**Solution 3 - Check environment variables:**
```bash
cat .env.local
```
Verify Supabase URL and key are correct

**Solution 4 - Hard refresh:**
- Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Or open in Incognito/Private mode

---

### No data showing in Dashboard

**Cause:** Sample data not loaded

**Solution:**
Run this in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM transfer_orders;
SELECT COUNT(*) FROM sku_attributes;
SELECT COUNT(*) FROM transfer_order_lines;
```

Should return:
- 5 transfer orders
- 24 SKU attributes
- Multiple lines

If zero, run `supabase/migrations/002_sample_data.sql` again.

---

### "Access Denied" errors

**Cause:** RLS policies blocking access

**Solution:**
Run `supabase/migrations/003_fix_rls_policies.sql` in Supabase SQL Editor

---

### Buttons don't work (Settings, Dashboard)

**Possible causes:**
1. RLS policies not updated
2. No data in database
3. User not logged in

**Solutions:**
1. Run migration 003 (RLS fix)
2. Run migration 002 (sample data)
3. Login again
4. Check browser console for errors

---

## Database Issues

### Tables don't exist

**Solution:**
Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor

---

### Role errors

**Solution:**
Run this to add admin role:
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@test.com';
```

Verify:
```sql
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users;
```

---

## Development Server Issues

### Port 3000 already in use

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

### Changes not showing

**Solution:**
1. Stop server (Ctrl+C)
2. Delete `.next` folder: `rm -rf .next`
3. Restart: `npm run dev`

---

## Quick Diagnostic

Run this checklist:

```bash
# 1. Check Node.js
node --version  # Should be v18+

# 2. Check environment variables
cat .env.local  # Should have Supabase URL and key

# 3. Check if server is running
curl http://localhost:3000  # Should return HTML

# 4. Check dependencies
npm list | grep supabase  # Should show @supabase/supabase-js
```

In Supabase Dashboard:
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check data
SELECT COUNT(*) FROM transfer_orders;

-- Check auth
SELECT email FROM auth.users;

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## Getting Help

If issues persist:

1. **Check browser console** (F12 → Console tab)
2. **Check terminal** for server errors
3. **Check Supabase logs** (Dashboard → Logs)
4. **Share error messages** for debugging

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid login credentials" | User doesn't exist | Create user in Supabase |
| "Missing Supabase environment variables" | .env.local not configured | Add Supabase URL and key |
| "relation does not exist" | Tables not created | Run migration 001 |
| "Access denied" | RLS blocking | Run migration 003 |
| "Network error" | Server not running | Run `npm run dev` |

---

## Reset Everything (Last Resort)

**⚠️ WARNING: Deletes all data**

```sql
-- In Supabase SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then re-run:
-- 001_initial_schema.sql
-- 002_sample_data.sql
-- 003_fix_rls_policies.sql
-- 004_add_user_roles.sql
```

Then recreate user in Authentication → Users.

