-- Clean up all existing data from tables
-- Run this to start fresh before CSV upload

-- Delete in order to respect foreign key constraints

-- 1. Delete pallet assignments (references transfer_order_lines and transfer_orders)
DELETE FROM pallet_assignments;

-- 2. Delete transfer order lines (references transfer_orders and sku_attributes)
DELETE FROM transfer_order_lines;

-- 3. Delete transfer orders
DELETE FROM transfer_orders;

-- 4. Delete SKU attributes
DELETE FROM sku_attributes;

-- 5. Delete audit logs (optional - keeps history)
-- DELETE FROM audit_log;

-- Reset sequences (optional - if you want IDs to start from 1 again)
-- ALTER SEQUENCE transfer_orders_id_seq RESTART WITH 1;
-- ALTER SEQUENCE transfer_order_lines_id_seq RESTART WITH 1;
-- ALTER SEQUENCE pallet_assignments_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT 'transfer_orders' as table_name, COUNT(*) as row_count FROM transfer_orders
UNION ALL
SELECT 'transfer_order_lines', COUNT(*) FROM transfer_order_lines
UNION ALL
SELECT 'sku_attributes', COUNT(*) FROM sku_attributes
UNION ALL
SELECT 'pallet_assignments', COUNT(*) FROM pallet_assignments;

