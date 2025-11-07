-- Add inventory tracking fields to sku_attributes table

-- Add units_on_hand_pickface column
ALTER TABLE sku_attributes
ADD COLUMN IF NOT EXISTS units_on_hand_pickface DECIMAL(10, 2) DEFAULT 0;

-- Add average_daily_sales column
ALTER TABLE sku_attributes
ADD COLUMN IF NOT EXISTS average_daily_sales DECIMAL(10, 2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN sku_attributes.units_on_hand_pickface IS 'Current units available in pick face';
COMMENT ON COLUMN sku_attributes.average_daily_sales IS 'Average daily sales for calculating days of stock';

-- Update days_of_stock_pickface to be calculated from the new fields if needed
-- Note: days_of_stock_pickface = units_on_hand_pickface / average_daily_sales
-- This can be calculated on-the-fly or stored

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sku_attributes'
ORDER BY ordinal_position;

