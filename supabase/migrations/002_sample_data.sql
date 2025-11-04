-- Sample data from Google Sheets for testing
-- This data is based on: https://docs.google.com/spreadsheets/d/1wCPtQV6hQxZtKn-yRkncLnLnJdN5zU3mcRSfHNiHuH0/edit

-- =====================================================
-- SKU ATTRIBUTES (from skuAttributes tab)
-- =====================================================
INSERT INTO sku_attributes (sku, description, barcode, daily_units_sold, units_pickface, units_reserve) VALUES
('SKU-11', 'STOCKKEEPINGUNIT11', '123456789', 45, 267, 0),
('SKU-12', 'STOCKKEEPINGUNIT12', '123456790', 25, 260, 0),
('SKU-13', 'STOCKKEEPINGUNIT13', '123456791', 35, 220, 0),
('SKU-14', 'STOCKKEEPINGUNIT14', '123456792', 90, 164, 0),
('SKU-15', 'STOCKKEEPINGUNIT15', '123456793', 2, 290, 100),
('SKU-16', 'STOCKKEEPINGUNIT16', '123456794', 84, 172, 5),
('SKU-21', 'STOCKKEEPINGUNIT21', '123456800', 45, 267, 0),
('SKU-22', 'STOCKKEEPINGUNIT22', '123456801', 25, 260, 0),
('SKU-23', 'STOCKKEEPINGUNIT23', '123456802', 35, 220, 0),
('SKU-24', 'STOCKKEEPINGUNIT24', '123456803', 90, 164, 0),
('SKU-25', 'STOCKKEEPINGUNIT25', '123456804', 2, 290, 0),
('SKU-31', 'STOCKKEEPINGUNIT31', '123456810', 2, 164, 200),
('SKU-32', 'STOCKKEEPINGUNIT32', '123456811', 25, 260, 100),
('SKU-33', 'STOCKKEEPINGUNIT33', '123456812', 35, 220, 150),
('SKU-34', 'STOCKKEEPINGUNIT34', '123456813', 90, 164, 0),
('SKU-35', 'STOCKKEEPINGUNIT35', '123456814', 2, 290, 0),
('SKU-36', 'STOCKKEEPINGUNIT36', '123456815', 84, 172, 0),
('SKU-37', 'STOCKKEEPINGUNIT37', '123456816', 45, 267, 0),
('SKU-41', 'STOCKKEEPINGUNIT41', '123456820', 45, 267, 0),
('SKU-42', 'STOCKKEEPINGUNIT42', '123456821', 25, 260, 0),
('SKU-43', 'STOCKKEEPINGUNIT43', '123456822', 35, 220, 0),
('SKU-44', 'STOCKKEEPINGUNIT44', '123456823', 90, 164, 0),
('SKU-45', 'STOCKKEEPINGUNIT45', '123456824', 2, 290, 0),
('SKU-46', 'STOCKKEEPINGUNIT46', '123456825', 84, 172, 0);

-- =====================================================
-- TRANSFER ORDERS (from transferOrders tab)
-- =====================================================
INSERT INTO transfer_orders (transfer_number, merchant, transfer_status, estimated_arrival, receipt_time, destination) VALUES
('#T0303', 'BABYBOO FASHION', 'Complete', '2025-09-16', '2025-09-16 10:00:00+00', '46 - 62 Maddox Street'),
('#T0312', 'BABYBOO FASHION', 'Shipped', '2025-10-17', NULL, '46 - 62 Maddox Street'),
('#T0311', 'BABYBOO FASHION', 'Putaway in progress', '2025-10-14', '2025-10-14 09:30:00+00', '46 - 62 Maddox Street'),
('#T0209', 'WATERDROP ANZ', 'Shipped', '2025-09-17', NULL, '46 - 62 Maddox Street'),
('#T1234', 'SOME RANDOM MERCHANT', 'Shipped', '2025-09-17', NULL, 'Melbourne NDC');

-- =====================================================
-- TRANSFER ORDER LINES (from transferOrderLines tab)
-- =====================================================
-- #T0303 lines (BABYBOO FASHION - Complete)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0303', 'SKU-11', 100, 100 FROM transfer_orders WHERE transfer_number = '#T0303'
UNION ALL
SELECT id, '#T0303', 'SKU-12', 200, 200 FROM transfer_orders WHERE transfer_number = '#T0303';

-- #T0312 lines (BABYBOO FASHION - Shipped, not received yet)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0312', 'SKU-21', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0312'
UNION ALL
SELECT id, '#T0312', 'SKU-22', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0312'
UNION ALL
SELECT id, '#T0312', 'SKU-23', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0312'
UNION ALL
SELECT id, '#T0312', 'SKU-24', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0312'
UNION ALL
SELECT id, '#T0312', 'SKU-25', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0312';

-- #T0311 lines (BABYBOO FASHION - Putaway in progress, partially received)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0311', 'SKU-31', 100, 100 FROM transfer_orders WHERE transfer_number = '#T0311'
UNION ALL
SELECT id, '#T0311', 'SKU-32', 200, 200 FROM transfer_orders WHERE transfer_number = '#T0311'
UNION ALL
SELECT id, '#T0311', 'SKU-33', 100, 100 FROM transfer_orders WHERE transfer_number = '#T0311'
UNION ALL
SELECT id, '#T0311', 'SKU-34', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0311'
UNION ALL
SELECT id, '#T0311', 'SKU-35', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0311'
UNION ALL
SELECT id, '#T0311', 'SKU-36', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0311'
UNION ALL
SELECT id, '#T0311', 'SKU-37', 200, 100 FROM transfer_orders WHERE transfer_number = '#T0311';

-- #T0209 lines (WATERDROP ANZ - Shipped, not received yet)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0209', 'SKU-41', 100, 100 FROM transfer_orders WHERE transfer_number = '#T0209'
UNION ALL
SELECT id, '#T0209', 'SKU-42', 200, 200 FROM transfer_orders WHERE transfer_number = '#T0209';

-- =====================================================
-- ELIGIBLE MERCHANTS (for testing)
-- =====================================================
-- Add BABYBOO FASHION as eligible for pre-processing
INSERT INTO eligible_merchants (merchant_name) VALUES ('BABYBOO FASHION');

-- Note: WATERDROP ANZ and SOME RANDOM MERCHANT are NOT added to eligible_merchants
-- This means they will always go to ASRS (not subject to pre-processing)

-- =====================================================
-- Update preprocessing statuses based on threshold
-- =====================================================
-- This will be calculated automatically by the trigger when we sync,
-- but for sample data, let's manually set some statuses

-- Calculate which items should be "in review" based on:
-- - Merchant is eligible (BABYBOO FASHION)
-- - Days of stock > threshold (30 days)

-- For #T0303 (Complete - these are already received, so status stays "not required")
-- No updates needed

-- For #T0312 (BABYBOO FASHION - Shipped)
-- SKU-21: 267/45 = 5.9 days -> not required
-- SKU-22: 260/25 = 10.4 days -> not required  
-- SKU-23: 220/35 = 6.3 days -> not required
-- SKU-24: 164/90 = 1.8 days -> not required
-- SKU-25: 290/2 = 145 days -> in review (eligible merchant + high DOS)

UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0312' AND sku = 'SKU-25';

-- For #T0311 (BABYBOO FASHION - Putaway in progress)
-- SKU-31: 164/2 = 82 days -> in review
-- SKU-32: 260/25 = 10.4 days -> not required
-- SKU-33: 220/35 = 6.3 days -> not required
-- SKU-34: 164/90 = 1.8 days -> not required
-- SKU-35: 290/2 = 145 days -> in review
-- SKU-36: 172/84 = 2.0 days -> not required
-- SKU-37: 267/45 = 5.9 days -> not required

UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0311' AND sku IN ('SKU-31', 'SKU-35');

-- =====================================================
-- Verify data
-- =====================================================
-- Run these queries to check the data:

-- SELECT * FROM sku_attributes ORDER BY sku;
-- SELECT * FROM transfer_orders ORDER BY estimated_arrival DESC;
-- SELECT * FROM transfer_order_lines ORDER BY transfer_number, sku;
-- SELECT * FROM eligible_merchants;

-- Check days of stock calculations:
-- SELECT sku, daily_units_sold, units_pickface, days_of_stock_pickface 
-- FROM sku_attributes 
-- ORDER BY days_of_stock_pickface DESC;

