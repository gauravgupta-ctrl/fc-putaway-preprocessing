-- Reset all data to initial state (before any admin/operator actions)
-- This resets all pre-processing statuses and deletes generated labels

-- Delete all generated pallet labels
DELETE FROM pallet_labels;

-- Reset all transfer order line statuses to initial calculated state
-- Based on merchant eligibility and days of stock threshold

-- First, reset all to 'not required'
UPDATE transfer_order_lines
SET 
  preprocessing_status = 'not required',
  requested_at = NULL,
  requested_by = NULL;

-- Then set 'in review' for items that meet criteria:
-- 1. Merchant is in eligible_merchants
-- 2. Days of stock > 30 (threshold)

UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE id IN (
  SELECT tol.id
  FROM transfer_order_lines tol
  JOIN transfer_orders to_table ON tol.transfer_order_id = to_table.id
  JOIN sku_attributes sa ON sa.sku = tol.sku
  WHERE to_table.merchant IN (SELECT merchant_name FROM eligible_merchants)
    AND sa.days_of_stock_pickface > 30
);

-- Reset transfer order statuses (will be recalculated by trigger)
-- The trigger will update these based on item statuses
UPDATE transfer_orders SET preprocessing_status = 'not required';

-- Trigger the status recalculation for all TOs
-- This forces the trigger to run for each TO
UPDATE transfer_order_lines 
SET updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT tol.id
  FROM transfer_order_lines tol
  WHERE tol.preprocessing_status = 'in review'
  LIMIT 1
);

-- Clean up audit log entries related to preprocessing actions
-- (Optional - comment out if you want to keep audit history)
-- DELETE FROM audit_log 
-- WHERE action IN (
--   'request_preprocessing', 
--   'cancel_preprocessing', 
--   'start_preprocessing', 
--   'complete_preprocessing',
--   'generate_label'
-- );

-- Verify the reset
SELECT 
  'Transfer Orders' as table_name,
  preprocessing_status::text,
  COUNT(*) as count
FROM transfer_orders
GROUP BY preprocessing_status

UNION ALL

SELECT 
  'Transfer Order Lines' as table_name,
  preprocessing_status::text,
  COUNT(*) as count
FROM transfer_order_lines
GROUP BY preprocessing_status

UNION ALL

SELECT 
  'Pallet Labels' as table_name,
  'Total' as status,
  COUNT(*) as count
FROM pallet_labels;

