-- More diverse test data with mixed scenarios

-- =====================================================
-- MORE SKU ATTRIBUTES (Mix of high and low DOS)
-- =====================================================
INSERT INTO sku_attributes (sku, description, barcode, daily_units_sold, units_pickface, units_reserve) VALUES
-- High DOS items (> 30 days)
('SKU-81', 'STOCKKEEPINGUNIT81', '123456860', 5, 200, 0),    -- 40 days DOS
('SKU-82', 'STOCKKEEPINGUNIT82', '123456861', 4, 180, 0),    -- 45 days DOS
('SKU-83', 'STOCKKEEPINGUNIT83', '123456862', 3, 120, 0),    -- 40 days DOS
('SKU-84', 'STOCKKEEPINGUNIT84', '123456863', 2, 100, 0),    -- 50 days DOS
('SKU-85', 'STOCKKEEPINGUNIT85', '123456864', 6, 240, 0),    -- 40 days DOS

-- Low DOS items (< 30 days)
('SKU-86', 'STOCKKEEPINGUNIT86', '123456865', 50, 400, 0),   -- 8 days DOS
('SKU-87', 'STOCKKEEPINGUNIT87', '123456866', 30, 300, 0),   -- 10 days DOS
('SKU-88', 'STOCKKEEPINGUNIT88', '123456867', 40, 600, 0),   -- 15 days DOS
('SKU-89', 'STOCKKEEPINGUNIT89', '123456868', 25, 500, 0),   -- 20 days DOS

-- More varied items
('SKU-91', 'STOCKKEEPINGUNIT91', '123456870', 10, 350, 0),   -- 35 days DOS (high)
('SKU-92', 'STOCKKEEPINGUNIT92', '123456871', 20, 500, 0),   -- 25 days DOS (low)
('SKU-93', 'STOCKKEEPINGUNIT93', '123456872', 8, 320, 0),    -- 40 days DOS (high)
('SKU-94', 'STOCKKEEPINGUNIT94', '123456873', 15, 300, 0),   -- 20 days DOS (low)
('SKU-95', 'STOCKKEEPINGUNIT95', '123456874', 7, 280, 0),    -- 40 days DOS (high)
('SKU-96', 'STOCKKEEPINGUNIT96', '123456875', 35, 700, 0),   -- 20 days DOS (low)
('SKU-97', 'STOCKKEEPINGUNIT97', '123456876', 12, 480, 0),   -- 40 days DOS (high)
('SKU-98', 'STOCKKEEPINGUNIT98', '123456877', 18, 360, 0),   -- 20 days DOS (low)
('SKU-99', 'STOCKKEEPINGUNIT99', '123456878', 5, 200, 0);    -- 40 days DOS (high)

-- =====================================================
-- MORE TRANSFER ORDERS (All BABYBOO FASHION - eligible)
-- =====================================================
INSERT INTO transfer_orders (transfer_number, merchant, transfer_status, estimated_arrival, receipt_time, destination) VALUES
('#T0501', 'BABYBOO FASHION', 'Shipped', '2025-11-10', NULL, '46 - 62 Maddox Street'),
('#T0502', 'BABYBOO FASHION', 'Shipped', '2025-11-11', NULL, '46 - 62 Maddox Street'),
('#T0503', 'BABYBOO FASHION', 'Shipped', '2025-11-12', NULL, '46 - 62 Maddox Street'),
('#T0504', 'BABYBOO FASHION', 'Shipped', '2025-11-13', NULL, '46 - 62 Maddox Street'),
('#T0505', 'BABYBOO FASHION', 'Shipped', '2025-11-14', NULL, '46 - 62 Maddox Street');

-- =====================================================
-- TRANSFER ORDER LINES - MIXED SCENARIOS
-- =====================================================

-- #T0501 - Mixed: 3 high DOS, 2 low DOS (5 items total)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0501', 'SKU-81', 150, 0 FROM transfer_orders WHERE transfer_number = '#T0501'
UNION ALL
SELECT id, '#T0501', 'SKU-82', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0501'
UNION ALL
SELECT id, '#T0501', 'SKU-83', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0501'
UNION ALL
SELECT id, '#T0501', 'SKU-86', 120, 0 FROM transfer_orders WHERE transfer_number = '#T0501'
UNION ALL
SELECT id, '#T0501', 'SKU-87', 180, 0 FROM transfer_orders WHERE transfer_number = '#T0501';

-- High DOS items set to "in review"
UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0501' AND sku IN ('SKU-81', 'SKU-82', 'SKU-83');

-- #T0502 - Mixed: 2 high DOS, 3 low DOS (5 items total)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0502', 'SKU-84', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0502'
UNION ALL
SELECT id, '#T0502', 'SKU-85', 150, 0 FROM transfer_orders WHERE transfer_number = '#T0502'
UNION ALL
SELECT id, '#T0502', 'SKU-88', 300, 0 FROM transfer_orders WHERE transfer_number = '#T0502'
UNION ALL
SELECT id, '#T0502', 'SKU-89', 250, 0 FROM transfer_orders WHERE transfer_number = '#T0502'
UNION ALL
SELECT id, '#T0502', 'SKU-11', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0502';

UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0502' AND sku IN ('SKU-84', 'SKU-85');

-- #T0503 - Alternating: 4 high, 4 low (8 items total)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0503', 'SKU-91', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0503'
UNION ALL
SELECT id, '#T0503', 'SKU-92', 150, 0 FROM transfer_orders WHERE transfer_number = '#T0503'
UNION ALL
SELECT id, '#T0503', 'SKU-93', 120, 0 FROM transfer_orders WHERE transfer_number = '#T0503'
UNION ALL
SELECT id, '#T0503', 'SKU-94', 180, 0 FROM transfer_orders WHERE transfer_number = '#T0503'
UNION ALL
SELECT id, '#T0503', 'SKU-95', 140, 0 FROM transfer_orders WHERE transfer_number = '#T0503'
UNION ALL
SELECT id, '#T0503', 'SKU-96', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0503'
UNION ALL
SELECT id, '#T0503', 'SKU-97', 160, 0 FROM transfer_orders WHERE transfer_number = '#T0503'
UNION ALL
SELECT id, '#T0503', 'SKU-98', 190, 0 FROM transfer_orders WHERE transfer_number = '#T0503';

UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0503' AND sku IN ('SKU-91', 'SKU-93', 'SKU-95', 'SKU-97');

-- #T0504 - Mostly high DOS: 5 high, 1 low (6 items total)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0504', 'SKU-81', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0504'
UNION ALL
SELECT id, '#T0504', 'SKU-82', 180, 0 FROM transfer_orders WHERE transfer_number = '#T0504'
UNION ALL
SELECT id, '#T0504', 'SKU-83', 150, 0 FROM transfer_orders WHERE transfer_number = '#T0504'
UNION ALL
SELECT id, '#T0504', 'SKU-84', 220, 0 FROM transfer_orders WHERE transfer_number = '#T0504'
UNION ALL
SELECT id, '#T0504', 'SKU-85', 160, 0 FROM transfer_orders WHERE transfer_number = '#T0504'
UNION ALL
SELECT id, '#T0504', 'SKU-86', 100, 0 FROM transfer_orders WHERE transfer_number = '#T0504';

UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0504' AND sku IN ('SKU-81', 'SKU-82', 'SKU-83', 'SKU-84', 'SKU-85');

-- #T0505 - Mostly low DOS: 1 high, 5 low (6 items total)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received)
SELECT id, '#T0505', 'SKU-99', 130, 0 FROM transfer_orders WHERE transfer_number = '#T0505'
UNION ALL
SELECT id, '#T0505', 'SKU-86', 200, 0 FROM transfer_orders WHERE transfer_number = '#T0505'
UNION ALL
SELECT id, '#T0505', 'SKU-87', 150, 0 FROM transfer_orders WHERE transfer_number = '#T0505'
UNION ALL
SELECT id, '#T0505', 'SKU-88', 180, 0 FROM transfer_orders WHERE transfer_number = '#T0505'
UNION ALL
SELECT id, '#T0505', 'SKU-89', 220, 0 FROM transfer_orders WHERE transfer_number = '#T0505'
UNION ALL
SELECT id, '#T0505', 'SKU-92', 170, 0 FROM transfer_orders WHERE transfer_number = '#T0505';

UPDATE transfer_order_lines
SET preprocessing_status = 'in review'
WHERE transfer_number = '#T0505' AND sku = 'SKU-99';

-- =====================================================
-- SUMMARY OF NEW DATA
-- =====================================================
-- New SKUs: 18 (mix of high and low DOS)
-- New TOs: 5 (#T0501 - #T0505)
-- Total items: 30 items across the 5 TOs

-- Breakdown:
-- #T0501: 5 items (3 high DOS, 2 low DOS) - Barcodes: 860, 861, 862, 865, 866
-- #T0502: 5 items (2 high DOS, 3 low DOS) - Barcodes: 863, 864, 867, 868, 789
-- #T0503: 8 items (4 high DOS, 4 low DOS) - Barcodes: 870, 871, 872, 873, 874, 875, 876, 877, 878
-- #T0504: 6 items (5 high DOS, 1 low DOS) - Barcodes: 860, 861, 862, 863, 864, 865
-- #T0505: 6 items (1 high DOS, 5 low DOS) - Barcodes: 878, 865, 866, 867, 868, 871

-- To test:
-- 1. Admin: Request preprocessing on "in review" items
-- 2. Operator: Scan these TOs and process mixed batches
-- 3. Practice switching between SHELF (red) and PICK FACE (green) actions

