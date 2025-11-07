-- Update sku_attributes table to use consistent column names
-- The original schema has: daily_units_sold, units_pickface, units_reserve
-- We need to rename to: average_daily_sales, units_on_hand_pickface

-- First, drop the generated column temporarily
ALTER TABLE sku_attributes DROP COLUMN IF EXISTS days_of_stock_pickface;

-- Rename columns for clarity
ALTER TABLE sku_attributes RENAME COLUMN units_pickface TO units_on_hand_pickface;
ALTER TABLE sku_attributes RENAME COLUMN daily_units_sold TO average_daily_sales;

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
