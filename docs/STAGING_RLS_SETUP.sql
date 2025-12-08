-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP FOR STAGING
-- =====================================================
-- This script configures RLS policies for all tables
-- Run this after running all migrations
-- =====================================================

-- =====================================================
-- STEP 1: Enable RLS on all tables
-- =====================================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligible_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop existing policies (if any)
-- =====================================================
-- This ensures a clean setup if running multiple times

DROP POLICY IF EXISTS "Allow all operations" ON settings;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON settings;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON settings;

DROP POLICY IF EXISTS "Allow all operations" ON eligible_merchants;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON eligible_merchants;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON eligible_merchants;

DROP POLICY IF EXISTS "Allow all operations" ON transfer_orders;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON transfer_orders;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON transfer_orders;

DROP POLICY IF EXISTS "Allow all operations" ON sku_attributes;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON sku_attributes;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON sku_attributes;

DROP POLICY IF EXISTS "Allow all operations" ON transfer_order_lines;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON transfer_order_lines;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON transfer_order_lines;

DROP POLICY IF EXISTS "Allow all operations" ON pallet_labels;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON pallet_labels;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON pallet_labels;

DROP POLICY IF EXISTS "Allow all operations" ON audit_log;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON audit_log;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON audit_log;

DROP POLICY IF EXISTS "Allow all operations" ON user_profiles;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON user_profiles;

DROP POLICY IF EXISTS "Allow all operations" ON pallet_assignments;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON pallet_assignments;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON pallet_assignments;

-- =====================================================
-- STEP 3: Create "Allow all operations" policies
-- =====================================================
-- These policies allow all operations for development/staging
-- For production, you may want more restrictive policies

-- Settings
CREATE POLICY "Allow all operations" ON settings
  FOR ALL USING (true) WITH CHECK (true);

-- Eligible Merchants
CREATE POLICY "Allow all operations" ON eligible_merchants
  FOR ALL USING (true) WITH CHECK (true);

-- Transfer Orders
CREATE POLICY "Allow all operations" ON transfer_orders
  FOR ALL USING (true) WITH CHECK (true);

-- SKU Attributes
CREATE POLICY "Allow all operations" ON sku_attributes
  FOR ALL USING (true) WITH CHECK (true);

-- Transfer Order Lines
CREATE POLICY "Allow all operations" ON transfer_order_lines
  FOR ALL USING (true) WITH CHECK (true);

-- Pallet Labels
CREATE POLICY "Allow all operations" ON pallet_labels
  FOR ALL USING (true) WITH CHECK (true);

-- Audit Log
CREATE POLICY "Allow all operations" ON audit_log
  FOR ALL USING (true) WITH CHECK (true);

-- User Profiles
CREATE POLICY "Allow all operations" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Pallet Assignments
CREATE POLICY "Allow all operations" ON pallet_assignments
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 4: Verify RLS Setup
-- =====================================================
-- This query shows all tables with RLS enabled and their policies

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- =====================================================
-- ALTERNATIVE: More Restrictive Policies (Optional)
-- =====================================================
-- If you want more security for staging, uncomment and use these instead:
-- 
-- -- Read access for authenticated users
-- CREATE POLICY "Allow read access for authenticated users" ON settings
--   FOR SELECT TO authenticated USING (true);
-- 
-- -- Write access for authenticated users
-- CREATE POLICY "Allow write access for authenticated users" ON settings
--   FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 
-- (Repeat for each table...)

-- =====================================================
-- NOTES
-- =====================================================
-- 1. The "Allow all operations" policies are permissive for staging/testing
-- 2. For production, consider more restrictive policies based on user roles
-- 3. The policies above allow operations without authentication checks
-- 4. If you need authentication-based access, use the alternative policies above
-- 5. Always test your RLS policies after setup

