-- Migration: Clear all transfer order and related data for fresh testing
-- This will delete all TOs, TO lines, pallet assignments, and pallet labels

-- 1. Delete all pallet assignments (must be first due to foreign keys)
DELETE FROM pallet_assignments;

-- 2. Delete all pallet labels
DELETE FROM pallet_labels;

-- 3. Delete all transfer order lines
DELETE FROM transfer_order_lines;

-- 4. Delete all transfer orders
DELETE FROM transfer_orders;

-- 5. Optionally clear SKU attributes (uncomment if you want to clear this too)
-- DELETE FROM sku_attributes;

-- Note: This keeps eligible_merchants and settings intact

