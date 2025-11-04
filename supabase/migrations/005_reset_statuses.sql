-- Reset all TO and TO item statuses to clean slate
-- This will recalculate everything based on current data and threshold

-- Step 1: Reset all item statuses to "not required" and clear request data
UPDATE transfer_order_lines
SET 
  preprocessing_status = 'not required',
  requested_at = NULL,
  requested_by = NULL;

-- Step 2: Get the current threshold
DO $$
DECLARE
  current_threshold NUMERIC;
  line_record RECORD;
  sku_dos NUMERIC;
  is_merchant_eligible BOOLEAN;
BEGIN
  -- Get threshold
  SELECT value::NUMERIC INTO current_threshold
  FROM settings
  WHERE key = 'dos_threshold';
  
  -- Loop through each line item
  FOR line_record IN 
    SELECT 
      tol.id,
      tol.sku,
      tor.merchant,
      sa.days_of_stock_pickface
    FROM transfer_order_lines tol
    JOIN transfer_orders tor ON tol.transfer_order_id = tor.id
    JOIN sku_attributes sa ON tol.sku = sa.sku
  LOOP
    -- Check if merchant is eligible
    SELECT EXISTS(
      SELECT 1 FROM eligible_merchants 
      WHERE merchant_name = line_record.merchant
    ) INTO is_merchant_eligible;
    
    -- Get days of stock
    sku_dos := line_record.days_of_stock_pickface;
    
    -- Update status if criteria met
    IF is_merchant_eligible AND sku_dos > current_threshold THEN
      UPDATE transfer_order_lines
      SET preprocessing_status = 'in review'
      WHERE id = line_record.id;
    END IF;
  END LOOP;
END $$;

-- Step 3: Recalculate all TO statuses by triggering the function
DO $$
DECLARE
  to_record RECORD;
  line_id UUID;
BEGIN
  FOR to_record IN SELECT DISTINCT id FROM transfer_orders LOOP
    -- Get one line for this TO
    SELECT tol.id INTO line_id
    FROM transfer_order_lines tol
    WHERE tol.transfer_order_id = to_record.id
    LIMIT 1;
    
    -- Trigger status update
    IF line_id IS NOT NULL THEN
      UPDATE transfer_order_lines 
      SET updated_at = NOW() 
      WHERE id = line_id;
    END IF;
  END LOOP;
END $$;

-- Verify results
SELECT 
  'Transfer Orders' as table_name,
  preprocessing_status,
  COUNT(*) as count
FROM transfer_orders
GROUP BY preprocessing_status
UNION ALL
SELECT 
  'Transfer Order Lines' as table_name,
  preprocessing_status::TEXT,
  COUNT(*) as count
FROM transfer_order_lines
GROUP BY preprocessing_status
ORDER BY table_name, preprocessing_status;

