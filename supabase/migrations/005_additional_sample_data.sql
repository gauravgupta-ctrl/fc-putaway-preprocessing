-- Additional sample data for testing pre-processing workflow

-- =====================================================
-- MORE SKU ATTRIBUTES
-- =====================================================
INSERT INTO sku_attributes (sku, description, barcode, daily_units_sold, units_pickface, units_reserve) VALUES
('SKU-51', 'STOCKKEEPINGUNIT51', '123456830', 5, 180, 0),    -- 36 days DOS
('SKU-52', 'STOCKKEEPINGUNIT52', '123456831', 3, 150, 50),   -- 50 days DOS
('SKU-53', 'STOCKKEEPINGUNIT53', '123456832', 10, 400, 0),   -- 40 days DOS
('SKU-54', 'STOCKKEEPINGUNIT54', '123456833', 8, 320, 100),  -- 40 days DOS
('SKU-55', 'STOCKKEEPINGUNIT55', '123456834', 2, 100, 0),    -- 50 days DOS
('SKU-56', 'STOCKKEEPINGUNIT56', '123456835', 15, 600, 200), -- 40 days DOS
('SKU-61', 'STOCKKEEPINGUNIT61', '123456840', 4, 200, 0),    -- 50 days DOS
('SKU-62', 'STOCKKEEPINGUNIT62', '123456841', 6, 210, 50),   -- 35 days DOS
('SKU-63', 'STOCKKEEPINGUNIT63', '123456842', 5, 250, 0),    -- 50 days DOS
('SKU-64', 'STOCKKEEPINGUNIT64', '123456843', 20, 800, 100), -- 40 days DOS
('SKU-71', 'STOCKKEEPINGUNIT71', '123456850', 3, 180, 0),    -- 60 days DOS
('SKU-72', 'STOCKKEEPINGUNIT72', '123456851', 8, 400, 0),    -- 50 days DOS
('SKU-73', 'STOCKKEEPINGUNIT73', '123456852', 4, 160, 50),   -- 40 days DOS
('SKU-74', 'STOCKKEEPINGUNIT74', '123456853', 10, 500, 0);   -- 50 days DOS

-- =====================================================
-- MORE TRANSFER ORDERS
-- =====================================================
INSERT INTO transfer_orders (transfer_number, merchant, transfer_status, estimated_arrival, receipt_time, destination) VALUES
('#T0401', 'BABYBOO FASHION', 'Shipped', '2025-11-05', NULL, '46 - 62 Maddox Street'),
('#T0402', 'BABYBOO FASHION', 'Shipped', '2025-11-06', NULL, '46 - 62 Maddox Street'),
('#T0403', 'BABYBOO FASHION', 'Shipped', '2025-11-07', NULL, '46 - 62 Maddox Street'),
('#T0404', 'BABYBOO FASHION', 'Shipped', '2025-11-08', NULL, '46 - 62 Maddox Street');

-- =====================================================
-- TRANSFER ORDER LINES FOR NEW TOs
-- =====================================================

-- #T0401 - Mix of high and low DOS items (4 items, 3 need pre-processing)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0401', 'SKU-51', 150, 0 FROM transfer_orders WHERE transfer_number = '#T0401'
UNION ALL
SELECT id, '#T0401', 'SKU-52', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0401'
UNION ALL
SELECT id, '#T0401', 'SKU-53', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0401'
UNION ALL
SELECT id, '#T0401', 'SKU-11', 50, 0 FROM transfer_orders WHERE transfer_number = '#T0401'; -- Low DOS, won't need pre-processing

-- Set items with high DOS to "in review"
UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0401' AND sku IN ('SKU-51', 'SKU-52', 'SKU-53');

-- #T0402 - All items need pre-processing (5 items)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0402', 'SKU-54', 120, 0 FROM transfer_orders WHERE transfer_number = '#T0402'
UNION ALL
SELECT id, '#T0402', 'SKU-55', 180, 0 FROM transfer_orders WHERE transfer_number = '#T0402'
UNION ALL
SELECT id, '#T0402', 'SKU-56', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0402'
UNION ALL
SELECT id, '#T0402', 'SKU-61', 150, 0 FROM transfer_orders WHERE transfer_number = '#T0402'
UNION ALL
SELECT id, '#T0402', 'SKU-62', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0402';

-- Set all to "in review"
UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0402';

-- #T0403 - 3 items, all need pre-processing
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0403', 'SKU-63', 250, 0 FROM transfer_orders WHERE transfer_number = '#T0403'
UNION ALL
SELECT id, '#T0403', 'SKU-64', 300, 0 FROM transfer_orders WHERE transfer_number = '#T0403'
UNION ALL
SELECT id, '#T0403', 'SKU-71', 175, 0 FROM transfer_orders WHERE transfer_number = '#T0403';

-- Set all to "in review"
UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0403';

-- #T0404 - Large order with 4 items needing pre-processing
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0404', 'SKU-72', 400, 0 FROM transfer_orders WHERE transfer_number = '#T0404'
UNION ALL
SELECT id, '#T0404', 'SKU-73', 350, 0 FROM transfer_orders WHERE transfer_number = '#T0404'
UNION ALL
SELECT id, '#T0404', 'SKU-74', 500, 0 FROM transfer_orders WHERE transfer_number = '#T0404'
UNION ALL
SELECT id, '#T0404', 'SKU-12', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0404'; -- Low DOS

-- Set high DOS items to "in review"
UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0404' AND sku IN ('SKU-72', 'SKU-73', 'SKU-74');

-- =====================================================
-- Summary of new data
-- =====================================================
-- New TOs added:
-- #T0401 - 4 items (3 need pre-processing: SKU-51, SKU-52, SKU-53)
-- #T0402 - 5 items (all need pre-processing)
-- #T0403 - 3 items (all need pre-processing)
-- #T0404 - 4 items (3 need pre-processing: SKU-72, SKU-73, SKU-74)

-- Total: 4 new TOs with 16 new items, 14 items flagged for pre-processing

-- To test:
-- 1. Go to Admin Dashboard
-- 2. Select these new TOs
-- 3. Click "Request All" on items in "in review" status
-- 4. Go to Operator Portal
-- 5. Scan TOs: T0401, T0402, T0403, T0404
-- 6. Scan item barcodes (see barcode column in SKU attributes above)

