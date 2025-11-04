-- Reset only user-influenced statuses (requested, in-progress, completed)
-- Keep auto-calculated statuses (not required, in review)

-- Step 1: Reset only requested and completed items back to "in review"
-- (These are items that were manually requested by admin or completed by operator)
UPDATE transfer_order_lines
SET 
  preprocessing_status = 'in review',
  requested_at = NULL,
  requested_by = NULL
WHERE preprocessing_status IN ('requested', 'completed');

-- Step 2: Recalculate TO statuses
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
  preprocessing_status::TEXT as status,
  COUNT(*) as count
FROM transfer_orders
GROUP BY preprocessing_status
UNION ALL
SELECT 
  'Transfer Order Lines' as table_name,
  preprocessing_status::TEXT as status,
  COUNT(*) as count
FROM transfer_order_lines
GROUP BY preprocessing_status
ORDER BY table_name, status;

