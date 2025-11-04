-- Fix the TO status calculation trigger
-- The issue: it's checking ALL items instead of only items that needed pre-processing

DROP TRIGGER IF EXISTS update_to_status_on_item_change ON transfer_order_lines;
DROP FUNCTION IF EXISTS update_to_preprocessing_status();

-- =====================================================
-- FUNCTION: update_to_preprocessing_status (FIXED)
-- =====================================================
CREATE OR REPLACE FUNCTION update_to_preprocessing_status()
RETURNS TRIGGER AS $$
DECLARE
  to_id UUID;
  total_items_count INTEGER;
  not_required_count INTEGER;
  in_review_count INTEGER;
  requested_count INTEGER;
  completed_count INTEGER;
  new_status preprocessing_status;
BEGIN
  -- Get the TO ID
  to_id := COALESCE(NEW.transfer_order_id, OLD.transfer_order_id);
  
  -- Count items by status
  SELECT 
    COUNT(*) FILTER (WHERE preprocessing_status = 'not required'),
    COUNT(*) FILTER (WHERE preprocessing_status = 'in review'),
    COUNT(*) FILTER (WHERE preprocessing_status = 'requested'),
    COUNT(*) FILTER (WHERE preprocessing_status = 'completed'),
    COUNT(*)
  INTO 
    not_required_count,
    in_review_count,
    requested_count,
    completed_count,
    total_items_count
  FROM transfer_order_lines
  WHERE transfer_order_id = to_id;
  
  -- Calculate TO status based on item statuses
  -- Logic: If all items that needed pre-processing (requested) are now completed, TO is completed
  IF total_items_count = not_required_count THEN
    -- All items are "not required"
    new_status := 'not required';
  ELSIF requested_count = 0 AND completed_count > 0 THEN
    -- All previously requested items are now completed
    new_status := 'completed';
  ELSIF completed_count > 0 AND requested_count > 0 THEN
    -- Some completed, some still requested
    new_status := 'in-progress';
  ELSIF requested_count > 0 THEN
    -- Items are requested but none completed yet
    new_status := 'requested';
  ELSIF in_review_count > 0 THEN
    -- Items are in review but not requested
    new_status := 'in review';
  ELSE
    new_status := 'not required';
  END IF;
  
  -- Update TO status
  UPDATE transfer_orders
  SET preprocessing_status = new_status
  WHERE id = to_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER update_to_status_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON transfer_order_lines
  FOR EACH ROW EXECUTE FUNCTION update_to_preprocessing_status();

-- Test the fix by recalculating all TO statuses
-- This will update all existing TOs based on their current item statuses
DO $$
DECLARE
  to_record RECORD;
  line_id UUID;
BEGIN
  FOR to_record IN SELECT DISTINCT transfer_order_id FROM transfer_order_lines LOOP
    -- Get one line ID for this TO
    SELECT id INTO line_id 
    FROM transfer_order_lines 
    WHERE transfer_order_id = to_record.transfer_order_id 
    LIMIT 1;
    
    -- Trigger the update by updating this line
    UPDATE transfer_order_lines 
    SET updated_at = NOW() 
    WHERE id = line_id;
  END LOOP;
END $$;

