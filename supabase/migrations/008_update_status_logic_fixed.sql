-- Update status logic: rename 'in review' to 'no instruction', remove 'not required'

-- Step 1: Add temporary columns
ALTER TABLE transfer_order_lines ADD COLUMN preprocessing_status_new TEXT;
ALTER TABLE transfer_orders ADD COLUMN preprocessing_status_new TEXT;

-- Step 2: Copy and transform existing values
UPDATE transfer_order_lines
SET preprocessing_status_new = CASE preprocessing_status::TEXT
  WHEN 'not required' THEN 'no instruction'
  WHEN 'in review' THEN 'no instruction'
  WHEN 'requested' THEN 'requested'
  WHEN 'in-progress' THEN 'in-progress'
  WHEN 'completed' THEN 'completed'
  ELSE 'no instruction'
END;

UPDATE transfer_orders
SET preprocessing_status_new = CASE preprocessing_status::TEXT
  WHEN 'not required' THEN 'no instruction'
  WHEN 'in review' THEN 'no instruction'
  WHEN 'requested' THEN 'requested'
  WHEN 'in-progress' THEN 'in-progress'
  WHEN 'completed' THEN 'completed'
  ELSE 'no instruction'
END;

-- Step 3: Drop old columns
ALTER TABLE transfer_order_lines DROP COLUMN preprocessing_status;
ALTER TABLE transfer_orders DROP COLUMN preprocessing_status;

-- Step 4: Drop old enum type
DROP TYPE IF EXISTS preprocessing_status CASCADE;

-- Step 5: Create new enum type
CREATE TYPE preprocessing_status AS ENUM (
  'no instruction',
  'requested',
  'in-progress',
  'completed'
);

-- Step 6: Convert new columns to enum type
ALTER TABLE transfer_order_lines 
  ADD COLUMN preprocessing_status preprocessing_status 
  DEFAULT 'no instruction'::preprocessing_status;

ALTER TABLE transfer_orders 
  ADD COLUMN preprocessing_status preprocessing_status 
  DEFAULT 'no instruction'::preprocessing_status;

-- Step 7: Copy values from temp columns
UPDATE transfer_order_lines
SET preprocessing_status = preprocessing_status_new::preprocessing_status;

UPDATE transfer_orders
SET preprocessing_status = preprocessing_status_new::preprocessing_status;

-- Step 8: Drop temporary columns
ALTER TABLE transfer_order_lines DROP COLUMN preprocessing_status_new;
ALTER TABLE transfer_orders DROP COLUMN preprocessing_status_new;

-- Step 9: Set NOT NULL constraints
ALTER TABLE transfer_order_lines 
  ALTER COLUMN preprocessing_status SET NOT NULL;

ALTER TABLE transfer_orders 
  ALTER COLUMN preprocessing_status SET NOT NULL;

-- Step 10: Update the TO status calculation function
CREATE OR REPLACE FUNCTION update_to_preprocessing_status()
RETURNS TRIGGER AS $$
DECLARE
  to_id UUID;
  has_requested BOOLEAN;
  has_in_progress BOOLEAN;
  has_completed BOOLEAN;
  has_no_instruction BOOLEAN;
  new_status preprocessing_status;
BEGIN
  -- Get the TO ID
  to_id := COALESCE(NEW.transfer_order_id, OLD.transfer_order_id);
  
  -- Count statuses
  SELECT 
    'requested' = ANY(ARRAY_AGG(preprocessing_status::TEXT)),
    'in-progress' = ANY(ARRAY_AGG(preprocessing_status::TEXT)),
    'completed' = ANY(ARRAY_AGG(preprocessing_status::TEXT)),
    'no instruction' = ANY(ARRAY_AGG(preprocessing_status::TEXT))
  INTO has_requested, has_in_progress, has_completed, has_no_instruction
  FROM transfer_order_lines
  WHERE transfer_order_id = to_id;
  
  -- Calculate TO status based on item statuses
  IF has_in_progress OR (has_completed AND has_requested) THEN
    new_status := 'in-progress';
  ELSIF has_requested AND NOT has_completed THEN
    new_status := 'requested';
  ELSIF has_completed AND NOT has_requested AND NOT has_in_progress THEN
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
DROP TRIGGER IF EXISTS update_to_status_on_item_change ON transfer_order_lines;
CREATE TRIGGER update_to_status_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON transfer_order_lines
  FOR EACH ROW EXECUTE FUNCTION update_to_preprocessing_status();

-- Step 12: Verify the migration
SELECT 
  'transfer_order_lines' as table_name,
  preprocessing_status::TEXT,
  COUNT(*) as count
FROM transfer_order_lines
GROUP BY preprocessing_status::TEXT
UNION ALL
SELECT 
  'transfer_orders' as table_name,
  preprocessing_status::TEXT,
  COUNT(*) as count
FROM transfer_orders
GROUP BY preprocessing_status::TEXT
ORDER BY table_name, preprocessing_status;

