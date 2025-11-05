-- Add auto-request logic with manually_cancelled and auto_requested flags
-- Rename 'no instruction' to 'not needed'

-- Step 1: Add new tracking columns
ALTER TABLE transfer_order_lines 
  ADD COLUMN auto_requested BOOLEAN DEFAULT false,
  ADD COLUMN manually_cancelled BOOLEAN DEFAULT false;

-- Step 2: Drop existing trigger
DROP TRIGGER IF EXISTS update_to_status_on_item_change ON transfer_order_lines;
DROP FUNCTION IF EXISTS update_to_preprocessing_status() CASCADE;

-- Step 3: Add temporary column for migration
ALTER TABLE transfer_order_lines ADD COLUMN status_temp TEXT;
ALTER TABLE transfer_orders ADD COLUMN status_temp TEXT;

-- Step 4: Copy current values
UPDATE transfer_order_lines
SET status_temp = CASE preprocessing_status::TEXT
  WHEN 'no instruction' THEN 'not needed'
  WHEN 'requested' THEN 'requested'
  WHEN 'in-progress' THEN 'in-progress'
  WHEN 'completed' THEN 'completed'
  ELSE 'not needed'
END;

UPDATE transfer_orders
SET status_temp = CASE preprocessing_status::TEXT
  WHEN 'no instruction' THEN 'not needed'
  WHEN 'requested' THEN 'requested'
  WHEN 'in-progress' THEN 'in-progress'
  WHEN 'completed' THEN 'completed'
  ELSE 'not needed'
END;

-- Step 5: Drop old columns
ALTER TABLE transfer_order_lines DROP COLUMN preprocessing_status;
ALTER TABLE transfer_orders DROP COLUMN preprocessing_status;

-- Step 6: Drop and recreate enum
DROP TYPE IF EXISTS preprocessing_status CASCADE;

CREATE TYPE preprocessing_status AS ENUM (
  'not needed',
  'requested',
  'in-progress',
  'completed'
);

-- Step 7: Add new columns with new enum
ALTER TABLE transfer_order_lines 
  ADD COLUMN preprocessing_status preprocessing_status 
  NOT NULL DEFAULT 'not needed'::preprocessing_status;

ALTER TABLE transfer_orders 
  ADD COLUMN preprocessing_status preprocessing_status 
  NOT NULL DEFAULT 'not needed'::preprocessing_status;

-- Step 8: Copy from temp columns
UPDATE transfer_order_lines
SET preprocessing_status = status_temp::preprocessing_status;

UPDATE transfer_orders
SET preprocessing_status = status_temp::preprocessing_status;

-- Step 9: Drop temp columns
ALTER TABLE transfer_order_lines DROP COLUMN status_temp;
ALTER TABLE transfer_orders DROP COLUMN status_temp;

-- Step 10: Create updated TO status rollup function
CREATE OR REPLACE FUNCTION update_to_preprocessing_status()
RETURNS TRIGGER AS $$
DECLARE
  to_id UUID;
  has_requested BOOLEAN;
  has_in_progress BOOLEAN;
  has_completed BOOLEAN;
  requested_items INTEGER;
  completed_items INTEGER;
  new_status preprocessing_status;
BEGIN
  to_id := COALESCE(NEW.transfer_order_id, OLD.transfer_order_id);
  
  SELECT 
    COUNT(*) FILTER (WHERE preprocessing_status = 'requested'::preprocessing_status),
    COUNT(*) FILTER (WHERE preprocessing_status = 'completed'::preprocessing_status),
    COUNT(*) FILTER (WHERE preprocessing_status = 'in-progress'::preprocessing_status) > 0
  INTO requested_items, completed_items, has_in_progress
  FROM transfer_order_lines
  WHERE transfer_order_id = to_id;
  
  IF has_in_progress OR (completed_items > 0 AND requested_items > 0) THEN
    new_status := 'in-progress';
  ELSIF requested_items > 0 AND completed_items = 0 THEN
    new_status := 'requested';
  ELSIF completed_items > 0 AND requested_items = 0 AND NOT has_in_progress THEN
    new_status := 'completed';
  ELSE
    new_status := 'not needed';
  END IF;
  
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

-- Step 12: Update all TO statuses
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
      
      ELSE 'not needed'::preprocessing_status
    END
  FROM transfer_order_lines tol
  WHERE tol.transfer_order_id = t.id
  GROUP BY tol.transfer_order_id
  ),
  'not needed'::preprocessing_status
);

-- Step 13: Create indexes on new columns for performance
CREATE INDEX transfer_order_lines_auto_requested_idx ON transfer_order_lines(auto_requested);
CREATE INDEX transfer_order_lines_manually_cancelled_idx ON transfer_order_lines(manually_cancelled);

-- Verify migration
SELECT 
  'transfer_order_lines' as table_name,
  preprocessing_status::TEXT as status,
  COUNT(*) as count
FROM transfer_order_lines
GROUP BY preprocessing_status::TEXT
ORDER BY status;

