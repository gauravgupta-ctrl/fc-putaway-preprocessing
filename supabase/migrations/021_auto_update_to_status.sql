-- Migration: Auto-update TO status based on item statuses
-- Create a trigger to automatically update transfer_orders.preprocessing_status
-- whenever transfer_order_lines.preprocessing_status changes

-- Function to calculate and update TO status
CREATE OR REPLACE FUNCTION update_to_preprocessing_status()
RETURNS TRIGGER AS $$
DECLARE
  to_id UUID;
  has_requested BOOLEAN;
  has_partial_or_completed BOOLEAN;
  all_not_needed BOOLEAN;
  new_status preprocessing_status;
BEGIN
  -- Get the transfer_order_id (works for both INSERT, UPDATE, DELETE)
  IF TG_OP = 'DELETE' THEN
    to_id := OLD.transfer_order_id;
  ELSE
    to_id := NEW.transfer_order_id;
  END IF;

  -- Check item statuses for this TO
  SELECT 
    COUNT(*) FILTER (WHERE preprocessing_status = 'requested') > 0,
    COUNT(*) FILTER (WHERE preprocessing_status IN ('partially completed', 'completed')) > 0,
    COUNT(*) FILTER (WHERE preprocessing_status != 'not needed') = 0
  INTO has_requested, has_partial_or_completed, all_not_needed
  FROM transfer_order_lines
  WHERE transfer_order_id = to_id;

  -- Determine new status based on logic:
  -- - not needed: all items are "not needed"
  -- - requested: at least 1 item requested, none partial/completed
  -- - in-progress: at least 1 item partial/completed
  -- - completed: stays as completed (operator marks it, not auto-updated)
  
  -- First check if TO is already marked as completed by operator
  SELECT preprocessing_status INTO new_status
  FROM transfer_orders
  WHERE id = to_id;

  -- Only update if not already completed
  IF new_status != 'completed' THEN
    IF all_not_needed THEN
      new_status := 'not needed';
    ELSIF has_partial_or_completed THEN
      new_status := 'in-progress';
    ELSIF has_requested THEN
      new_status := 'requested';
    ELSE
      new_status := 'not needed';
    END IF;

    -- Update the TO status
    UPDATE transfer_orders
    SET preprocessing_status = new_status
    WHERE id = to_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_to_status ON transfer_order_lines;

-- Create trigger on transfer_order_lines
CREATE TRIGGER trigger_update_to_status
  AFTER INSERT OR UPDATE OR DELETE ON transfer_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_to_preprocessing_status();

-- Update all existing TOs to correct status
DO $$
DECLARE
  to_record RECORD;
  has_requested BOOLEAN;
  has_partial_or_completed BOOLEAN;
  all_not_needed BOOLEAN;
  new_status preprocessing_status;
BEGIN
  FOR to_record IN SELECT id, preprocessing_status FROM transfer_orders LOOP
    -- Only update if not already marked as completed
    IF to_record.preprocessing_status != 'completed' THEN
      SELECT 
        COUNT(*) FILTER (WHERE preprocessing_status = 'requested') > 0,
        COUNT(*) FILTER (WHERE preprocessing_status IN ('partially completed', 'completed')) > 0,
        COUNT(*) FILTER (WHERE preprocessing_status != 'not needed') = 0
      INTO has_requested, has_partial_or_completed, all_not_needed
      FROM transfer_order_lines
      WHERE transfer_order_id = to_record.id;

      IF all_not_needed THEN
        new_status := 'not needed';
      ELSIF has_partial_or_completed THEN
        new_status := 'in-progress';
      ELSIF has_requested THEN
        new_status := 'requested';
      ELSE
        new_status := 'not needed';
      END IF;

      UPDATE transfer_orders
      SET preprocessing_status = new_status
      WHERE id = to_record.id;
    END IF;
  END LOOP;
END $$;

