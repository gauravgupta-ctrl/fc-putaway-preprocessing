-- Add user roles and profiles

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'operator');

-- Create user profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'operator',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for development
CREATE POLICY "Allow all operations" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert profile for test user (if exists)
-- Run this after creating the user in Supabase Auth:
-- INSERT INTO user_profiles (id, role, full_name)
-- SELECT id, 'admin', 'Test Admin'
-- FROM auth.users
-- WHERE email = 'admin@test.com'
-- ON CONFLICT (id) DO NOTHING;

-- Create an operator test user profile manually:
-- First create user in Auth UI, then:
-- INSERT INTO user_profiles (id, role, full_name)
-- VALUES ('user-id-here', 'operator', 'Test Operator');

