-- Add reserve_destination column to eligible_merchants table

ALTER TABLE eligible_merchants
ADD COLUMN IF NOT EXISTS reserve_destination TEXT;

-- Add comment for documentation
COMMENT ON COLUMN eligible_merchants.reserve_destination IS 'Storage destination for pre-processed inventory of this merchant';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'eligible_merchants'
ORDER BY ordinal_position;

