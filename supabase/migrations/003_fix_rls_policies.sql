-- Fix RLS policies to allow operations without authentication (for development)
-- This allows the app to work without full auth setup

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON settings;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON settings;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON eligible_merchants;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON eligible_merchants;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON transfer_orders;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON transfer_orders;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON sku_attributes;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON sku_attributes;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON transfer_order_lines;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON transfer_order_lines;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON pallet_labels;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON pallet_labels;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON audit_log;
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON audit_log;

-- Create new policies that allow all operations (for development)
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

-- Verify policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

