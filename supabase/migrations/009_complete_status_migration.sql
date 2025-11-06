-- Complete migration: Remove old triggers, update enum, restore triggers

-- Step 1: Drop all triggers that use the preprocessing_status type
DROP TRIGGER IF EXISTS update_to_status_on_item_change ON transfer_order_lines;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS update_to_preprocessing_status() CASCADE;

-- Step 3: Add temporary columns
ALTER TABLE transfer_order_lines ADD COLUMN preprocessing_status_temp TEXT;
ALTER TABLE transfer_orders ADD COLUMN preprocessing_status_temp TEXT;

-- Step, 4: Copy and transform existing values
UPDATE transfer_order_lines
SET preprocessing_status_temp = CASE preprocessing_status::TEXT
  WHEN 'not required' THEN 'no instruction'
  WHEN 'in review' THEN 'no instruction'
  WHEN 'requested' THEN 'requested'
  WHEN 'in-progress' THEN 'in-progress'
  WHEN 'completed' THEN 'completed'
  ELSE 'no instruction'
END;

UPDATE transfer_orders
SET preprocessing_status_temp = CASE preprocessing_status::TEXT
  WHEN 'not required' THEN 'no instruction'
  WHEN 'in review' THEN 'no instruction'
  WHEN 'requested' THEN 'requested'
  WHEN 'in-progress' THEN 'in-progress'
  WHEN 'completed' THEN 'completed'
  ELSE 'no instruction'
END;

-- Step 5: Drop old columns
ALTER TABLE transfer_order_lines DROP COLUMN preprocessing_status;
ALTER TABLE transfer_orders DROP COLUMN preprocessing_status;

-- Step 6: Drop and recreate enum type
DROP TYPE IF EXISTS preprocessing_status CASCADE;

CREATE TYPE preprocessing_status AS ENUM (
  'no instruction',
  'requested',
  'in-progress',
  'completed'
);

-- Step 7: Add new columns with new enum type
ALTER TABLE transfer_order_lines 
  ADD COLUMN preprocessing_status preprocessing_status 
  NOT NULL DEFAULT 'no instruction'::preprocessing_status;

ALTER TABLE transfer_orders 
  ADD COLUMN preprocessing_status preprocessing_status 
  NOT NULL DEFAULT 'no instruction'::preprocessing_status;

-- Step 8: Copy values from temp columns
UPDATE transfer_order_lines
SET preprocessing_status = preprocessing_status_temp::preprocessing_status;

UPDATE transfer_orders
SET preprocessing_status = preprocessing_status_temp::preprocessing_status;

-- Step 9: Drop temporary columns
ALTER TABLE transfer_order_lines DROP COLUMN preprocessing_status_temp;
ALTER TABLE transfer_orders DROP COLUMN preprocessing_status_temp;

-- Step 10: Recreate the TO status calculation function with new logic
CREATE OR REPLACE FUNCTION update_to_preprocessing_status()
RETURNS TRIGGER AS $$
DECLARE
  to_id UUID;
  has_requested BOOLEAN;
  has_in_progress BOOLEAN;
  has_completed BOOLEAN;
  total_items INTEGER;
  requested_items INTEGER;
  completed_items INTEGER;
  new_status preprocessing_status;
BEGIN
  -- Get the TO ID
  to_id := COALESCE(NEW.transfer_order_id, OLD.transfer_order_id);
  
  -- Get counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE preprocessing_status = 'requested'::preprocessing_status),
    COUNT(*) FILTER (WHERE preprocessing_status = 'completed'::preprocessing_status),
    COUNT(*) FILTER (WHERE preprocessing_status = 'in-progress'::preprocessing_status) > 0
  INTO total_items, requested_items, completed_items, has_in_progress
  FROM transfer_order_lines
  WHERE transfer_order_id = to_id;
  
  -- Calculate TO status
  IF has_in_progress OR (completed_items > 0 AND requested_items > 0) THEN
    new_status := 'in-progress';
  ELSIF requested_items > 0 AND completed_items = 0 THEN
    new_status := 'requested';
  ELSIF completed_items > 0 AND requested_items = 0 AND NOT has_in_progress THEN
    new_status := 'completed';
  ELSE
    new_status := 'no instruction';
  END IF;
  
  -- Update TO status
  UPDATE transfer_orders
  SET preprocessing_status = new_status
  WHERE id = to_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Recreate trigger
CREATE TRIGGER update_to_status_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON transfer_order_lines
  FOR EACH ROW EXECUTE FUNCTION update_to_preprocessing_status();

-- Step 12: Manually update all TO statuses based on their items
UPDATE transfer_orders t
SET preprocessing_status = COALESCE(
  (SELECT 
    CASE
      WHEN COUNT(*) FILTER (WHERE tol.preprocessing_status = 'in-progress'::preprocessing_status) > 0 
           OR (COUNT(*) FILTER (WHERE tol.preprocessing_status = 'completed'::preprocessing_status) > 0 
               AND COUNT(*) FILTER (WHERE tol.preprocessing_status = 'requested'::preprocessing_status) > 0)
      THEN 'in-progress'::preprocessing_status
      
      WHEN COUNT(*) FILTER (WHERE tol.preprocessing_status = 'requested'::preprocessing_status) > 0 
           AND COUNT(*) FILTER (WHERE tol.preprocessing_status = 'completed'::preprocessing_status) = 0
      THEN 'requested'::preprocessing_status
      
      WHEN COUNT(*) FILTER (WHERE tol.preprocessing_status = 'completed'::preprocessing_status) > 0 
           AND COUNT(*) FILTER (WHERE tol.preprocessing_status = 'requested'::preprocessing_status) = 0
           AND COUNT(*) FILTER (WHERE tol.preprocessing_status = 'in-progress'::preprocessing_status) = 0
      THEN 'completed'::preprocessing_status
      
      ELSE 'no instruction'::preprocessing_status
    END
  FROM transfer_order_lines tol
  WHERE tol.transfer_order_id = t.id
  GROUP BY tol.transfer_order_id
  ),
  'no instruction'::preprocessing_status  -- Default for TOs with no items
);

-- Step 13: Verify results
SELECT 
  'transfer_order_lines' as table_name,
  preprocessing_status::TEXT as status,
  COUNT(*) as count
FROM transfer_order_lines
GROUP BY preprocessing_status::TEXT
UNION ALL
SELECT 
  'transfer_orders' as table_name,
  preprocessing_status::TEXT as status,
  COUNT(*) as count
FROM transfer_orders
GROUP BY preprocessing_status::TEXT
ORDER BY table_name, status;

