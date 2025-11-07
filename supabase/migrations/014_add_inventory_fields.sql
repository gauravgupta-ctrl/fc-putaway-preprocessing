-- Update sku_attributes table to use consistent column names
-- The original schema has: daily_units_sold, units_pickface, units_reserve
-- We need to rename to: average_daily_sales, units_on_hand_pickface

-- First, drop the generated column temporarily
ALTER TABLE sku_attributes DROP COLUMN IF EXISTS days_of_stock_pickface;

-- Rename columns only if they exist with old names
DO $$
BEGIN
  -- Rename units_pickface to units_on_hand_pickface if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sku_attributes' AND column_name = 'units_pickface'
  ) THEN
    ALTER TABLE sku_attributes RENAME COLUMN units_pickface TO units_on_hand_pickface;
  END IF;

  -- Rename daily_units_sold to average_daily_sales if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sku_attributes' AND column_name = 'daily_units_sold'
  ) THEN
    ALTER TABLE sku_attributes RENAME COLUMN daily_units_sold TO average_daily_sales;
  END IF;

  -- Add units_on_hand_pickface if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sku_attributes' AND column_name = 'units_on_hand_pickface'
  ) THEN
    ALTER TABLE sku_attributes ADD COLUMN units_on_hand_pickface NUMERIC DEFAULT 0;
  END IF;

  -- Add average_daily_sales if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sku_attributes' AND column_name = 'average_daily_sales'
  ) THEN
    ALTER TABLE sku_attributes ADD COLUMN average_daily_sales NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Recreate the generated column with the new column names
ALTER TABLE sku_attributes ADD COLUMN days_of_stock_pickface NUMERIC GENERATED ALWAYS AS (
  CASE 
    WHEN average_daily_sales > 0 THEN units_on_hand_pickface / average_daily_sales
    ELSE 0
  END
) STORED;

-- Add comments for documentation
COMMENT ON COLUMN sku_attributes.units_on_hand_pickface IS 'Current units available in pick face';
COMMENT ON COLUMN sku_attributes.average_daily_sales IS 'Average daily sales for calculating days of stock';
COMMENT ON COLUMN sku_attributes.days_of_stock_pickface IS 'Calculated: units_on_hand_pickface / average_daily_sales';

-- Verify the changes
SELECT column_name, data_type, is_nullable, is_generated
FROM information_schema.columns
WHERE table_name = 'sku_attributes'
ORDER BY ordinal_position;
