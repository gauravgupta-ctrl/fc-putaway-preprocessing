-- Add carton_count to pallet_assignments
ALTER TABLE pallet_assignments
ADD COLUMN IF NOT EXISTS carton_count INTEGER DEFAULT 1;

-- Update preprocessing status enum to include new statuses
-- First, we need to handle existing data
-- Note: This will work for existing 'requested' and 'completed' statuses
-- Existing statuses will remain valid

-- We can't directly alter an enum in PostgreSQL, so we'll add a check
-- The application will handle the new status values
-- ('not needed', 'requested', 'not completed', 'partially completed', 'completed')

COMMENT ON COLUMN transfer_order_lines.preprocessing_status IS 
'Valid values: not needed, requested, not completed, partially completed, completed';

