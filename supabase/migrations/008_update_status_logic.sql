-- Update status logic: rename 'in review' to 'no instruction', remove 'not required'

-- Drop existing enum and recreate
ALTER TABLE transfer_order_lines DROP CONSTRAINT IF EXISTS transfer_order_lines_preprocessing_status_check;
ALTER TABLE transfer_orders DROP CONSTRAINT IF EXISTS transfer_orders_preprocessing_status_check;

DROP TYPE IF EXISTS preprocessing_status CASCADE;

CREATE TYPE preprocessing_status AS ENUM (
  'no instruction',
  'requested',
  'in-progress',
  'completed'
);

-- Re-add the column type
ALTER TABLE transfer_order_lines 
  ALTER COLUMN preprocessing_status TYPE preprocessing_status 
  USING (
    CASE preprocessing_status::TEXT
      WHEN 'not required' THEN 'no instruction'::preprocessing_status
      WHEN 'in review' THEN 'no instruction'::preprocessing_status
      ELSE preprocessing_status::TEXT::preprocessing_status
    END
  );

ALTER TABLE transfer_orders 
  ALTER COLUMN preprocessing_status TYPE preprocessing_status 
  USING (
    CASE preprocessing_status::TEXT
      WHEN 'not required' THEN 'no instruction'::preprocessing_status
      WHEN 'in review' THEN 'no instruction'::preprocessing_status
      ELSE preprocessing_status::TEXT::preprocessing_status
    END
  );

-- Update default value
ALTER TABLE transfer_order_lines 
  ALTER COLUMN preprocessing_status SET DEFAULT 'no instruction'::preprocessing_status;

ALTER TABLE transfer_orders 
  ALTER COLUMN preprocessing_status SET DEFAULT 'no instruction'::preprocessing_status;

-- Update existing data: all 'not required' and 'in review' become 'no instruction'
UPDATE transfer_order_lines 
SET preprocessing_status = 'no instruction'::preprocessing_status
WHERE preprocessing_status IN ('no instruction'::preprocessing_status);

UPDATE transfer_orders 
SET preprocessing_status = 'no instruction'::preprocessing_status
WHERE preprocessing_status IN ('no instruction'::preprocessing_status);

-- Update the TO status calculation function
CREATE OR REPLACE FUNCTION update_to_preprocessing_status()
RETURNS TRIGGER AS $$
DECLARE
  to_id UUID;
  item_statuses TEXT[];
  new_status preprocessing_status;
  has_requested BOOLEAN;
  has_in_progress BOOLEAN;
  has_completed BOOLEAN;
  has_no_instruction BOOLEAN;
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

-- Recreate trigger
DROP TRIGGER IF EXISTS update_to_status_on_item_change ON transfer_order_lines;
CREATE TRIGGER update_to_status_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON transfer_order_lines
  FOR EACH ROW EXECUTE FUNCTION update_to_preprocessing_status();

