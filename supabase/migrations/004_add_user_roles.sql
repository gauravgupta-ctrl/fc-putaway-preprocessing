-- Add roles to users via metadata
-- This allows us to control access to admin vs operator pages

-- Set the admin user role (update email if different)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@test.com';

-- Example: Create an operator user (run this manually if needed)
-- First create the user in Supabase Dashboard, then run:
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "operator"}'::jsonb
-- WHERE email = 'operator@test.com';

-- Verify roles
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email IN ('admin@test.com', 'operator@test.com');

