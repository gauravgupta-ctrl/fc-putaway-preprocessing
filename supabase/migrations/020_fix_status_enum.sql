-- Migration: Fix preprocessing_status enum to include all required values
-- Add 'partially completed' and 'in-progress' to the enum

-- Step 1: Add new enum values if they don't exist
DO $$ 
BEGIN
    -- Add 'partially completed' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'partially completed' 
        AND enumtypid = 'preprocessing_status'::regtype
    ) THEN
        ALTER TYPE preprocessing_status ADD VALUE 'partially completed';
    END IF;

    -- Add 'in-progress' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'in-progress' 
        AND enumtypid = 'preprocessing_status'::regtype
    ) THEN
        ALTER TYPE preprocessing_status ADD VALUE 'in-progress';
    END IF;
END $$;

-- Step 2: Update comments
COMMENT ON TYPE preprocessing_status IS 'Status values: not needed, requested, partially completed, not completed, completed, in-progress';

COMMENT ON COLUMN transfer_order_lines.preprocessing_status IS 
'Item status: not needed (no preprocessing), requested (requested but no qty assigned), partially completed (some qty assigned), not completed (TO completed but 0 qty), completed (all qty assigned)';

COMMENT ON COLUMN transfer_orders.preprocessing_status IS 
'TO status: not needed (all items not needed), requested (at least 1 requested), in-progress (at least 1 partially/completed), completed (operator marked complete)';

