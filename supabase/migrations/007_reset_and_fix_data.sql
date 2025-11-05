-- Reset all data and reload with proper status calculation

-- Delete existing data (in reverse order of dependencies)
DELETE FROM audit_log;
DELETE FROM pallet_labels;
DELETE FROM transfer_order_lines;
DELETE FROM transfer_orders;
DELETE FROM sku_attributes;
DELETE FROM eligible_merchants;

-- Re-insert eligible merchants
INSERT INTO eligible_merchants (merchant_name) VALUES ('BABYBOO FASHION');

-- Get current threshold
DO $$
DECLARE
  current_threshold NUMERIC;
BEGIN
  SELECT value::NUMERIC INTO current_threshold FROM settings WHERE key = 'dos_threshold';
  RAISE NOTICE 'Current threshold: %', current_threshold;
END $$;

-- Re-insert SKU attributes with correct calculations
INSERT INTO sku_attributes (sku, description, barcode, daily_units_sold, units_pickface, units_reserve) VALUES
-- Low DOS items (< 30 days) - Will NOT need pre-processing
('SKU-11', 'STOCKKEEPINGUNIT11', '123456789', 45, 267, 0),   -- 5.9 days
('SKU-12', 'STOCKKEEPINGUNIT12', '123456790', 25, 260, 0),   -- 10.4 days
('SKU-13', 'STOCKKEEPINGUNIT13', '123456791', 35, 220, 0),   -- 6.3 days
('SKU-14', 'STOCKKEEPINGUNIT14', '123456792', 90, 164, 0),   -- 1.8 days
('SKU-16', 'STOCKKEEPINGUNIT16', '123456794', 84, 172, 5),   -- 2.0 days
('SKU-21', 'STOCKKEEPINGUNIT21', '123456800', 45, 267, 0),   -- 5.9 days
('SKU-22', 'STOCKKEEPINGUNIT22', '123456801', 25, 260, 0),   -- 10.4 days
('SKU-23', 'STOCKKEEPINGUNIT23', '123456802', 35, 220, 0),   -- 6.3 days
('SKU-24', 'STOCKKEEPINGUNIT24', '123456803', 90, 164, 0),   -- 1.8 days
('SKU-32', 'STOCKKEEPINGUNIT32', '123456811', 25, 260, 100), -- 10.4 days
('SKU-33', 'STOCKKEEPINGUNIT33', '123456812', 35, 220, 150), -- 6.3 days
('SKU-34', 'STOCKKEEPINGUNIT34', '123456813', 90, 164, 0),   -- 1.8 days
('SKU-36', 'STOCKKEEPINGUNIT36', '123456815', 84, 172, 0),   -- 2.0 days
('SKU-37', 'STOCKKEEPINGUNIT37', '123456816', 45, 267, 0),   -- 5.9 days
('SKU-41', 'STOCKKEEPINGUNIT41', '123456820', 45, 267, 0),   -- 5.9 days
('SKU-42', 'STOCKKEEPINGUNIT42', '123456821', 25, 260, 0),   -- 10.4 days
('SKU-43', 'STOCKKEEPINGUNIT43', '123456822', 35, 220, 0),   -- 6.3 days
('SKU-44', 'STOCKKEEPINGUNIT44', '123456823', 90, 164, 0),   -- 1.8 days
('SKU-46', 'STOCKKEEPINGUNIT46', '123456825', 84, 172, 0),   -- 2.0 days

-- High DOS items (> 30 days) - WILL need pre-processing
('SKU-15', 'STOCKKEEPINGUNIT15', '123456793', 2, 290, 100),  -- 145 days
('SKU-25', 'STOCKKEEPINGUNIT25', '123456804', 2, 290, 0),    -- 145 days
('SKU-31', 'STOCKKEEPINGUNIT31', '123456810', 2, 164, 200),  -- 82 days
('SKU-35', 'STOCKKEEPINGUNIT35', '123456814', 2, 290, 0),    -- 145 days
('SKU-45', 'STOCKKEEPINGUNIT45', '123456824', 2, 290, 0),    -- 145 days

-- New mixed items for testing
('SKU-81', 'STOCKKEEPINGUNIT81', '123456860', 5, 200, 0),    -- 40 days HIGH
('SKU-82', 'STOCKKEEPINGUNIT82', '123456861', 4, 180, 0),    -- 45 days HIGH
('SKU-83', 'STOCKKEEPINGUNIT83', '123456862', 3, 120, 0),    -- 40 days HIGH
('SKU-84', 'STOCKKEEPINGUNIT84', '123456863', 2, 100, 0),    -- 50 days HIGH
('SKU-85', 'STOCKKEEPINGUNIT85', '123456864', 6, 240, 0),    -- 40 days HIGH
('SKU-86', 'STOCKKEEPINGUNIT86', '123456865', 50, 400, 0),   -- 8 days LOW
('SKU-87', 'STOCKKEEPINGUNIT87', '123456866', 30, 300, 0),   -- 10 days LOW
('SKU-88', 'STOCKKEEPINGUNIT88', '123456867', 40, 600, 0),   -- 15 days LOW
('SKU-89', 'STOCKKEEPINGUNIT89', '123456868', 25, 500, 0),   -- 20 days LOW
('SKU-91', 'STOCKKEEPINGUNIT91', '123456870', 10, 350, 0),   -- 35 days HIGH
('SKU-92', 'STOCKKEEPINGUNIT92', '123456871', 20, 500, 0),   -- 25 days LOW
('SKU-93', 'STOCKKEEPINGUNIT93', '123456872', 8, 320, 0),    -- 40 days HIGH
('SKU-94', 'STOCKKEEPINGUNIT94', '123456873', 15, 300, 0),   -- 20 days LOW
('SKU-95', 'STOCKKEEPINGUNIT95', '123456874', 7, 280, 0),    -- 40 days HIGH
('SKU-96', 'STOCKKEEPINGUNIT96', '123456875', 35, 700, 0),   -- 20 days LOW
('SKU-97', 'STOCKKEEPINGUNIT97', '123456876', 12, 480, 0),   -- 40 days HIGH
('SKU-98', 'STOCKKEEPINGUNIT98', '123456877', 18, 360, 0),   -- 20 days LOW
('SKU-99', 'STOCKKEEPINGUNIT99', '123456878', 5, 200, 0);    -- 40 days HIGH

-- Re-insert Transfer Orders
INSERT INTO transfer_orders (transfer_number, merchant, transfer_status, estimated_arrival, receipt_time, destination) VALUES
('#T0303', 'BABYBOO FASHION', 'Complete', '2025-09-16', '2025-09-16 10:00:00+00', '46 - 62 Maddox Street'),
('#T0312', 'BABYBOO FASHION', 'Shipped', '2025-10-17', NULL, '46 - 62 Maddox Street'),
('#T0311', 'BABYBOO FASHION', 'Putaway in progress', '2025-10-14', '2025-10-14 09:30:00+00', '46 - 62 Maddox Street'),
('#T0209', 'WATERDROP ANZ', 'Shipped', '2025-09-17', NULL, '46 - 62 Maddox Street'),
('#T1234', 'SOME RANDOM MERCHANT', 'Shipped', '2025-09-17', NULL, 'Melbourne NDC'),
('#T0501', 'BABYBOO FASHION', 'Shipped', '2025-11-10', NULL, '46 - 62 Maddox Street'),
('#T0502', 'BABYBOO FASHION', 'Shipped', '2025-11-11', NULL, '46 - 62 Maddox Street'),
('#T0503', 'BABYBOO FASHION', 'Shipped', '2025-11-12', NULL, '46 - 62 Maddox Street'),
('#T0504', 'BABYBOO FASHION', 'Shipped', '2025-11-13', NULL, '46 - 62 Maddox Street'),
('#T0505', 'BABYBOO FASHION', 'Shipped', '2025-11-14', NULL, '46 - 62 Maddox Street');

-- Helper function to calculate preprocessing status
CREATE OR REPLACE FUNCTION get_preprocessing_status(
  p_sku TEXT,
  p_merchant TEXT,
  p_threshold NUMERIC DEFAULT 30
) RETURNS preprocessing_status AS $$
DECLARE
  v_is_eligible BOOLEAN;
  v_days_of_stock NUMERIC;
BEGIN
  -- Check if merchant is eligible
  SELECT EXISTS(SELECT 1 FROM eligible_merchants WHERE merchant_name = p_merchant) INTO v_is_eligible;
  
  -- Get days of stock
  SELECT days_of_stock_pickface INTO v_days_of_stock FROM sku_attributes WHERE sku = p_sku;
  
  -- Return status based on criteria
  IF v_is_eligible AND v_days_of_stock > p_threshold THEN
    RETURN 'in review'::preprocessing_status;
  ELSE
    RETURN 'not required'::preprocessing_status;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Re-insert transfer order lines with auto-calculated status
-- #T0303 (Complete)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received, preprocessing_status)
SELECT to_id, '#T0303', sku_code, incoming, received, 
       get_preprocessing_status(sku_code, 'BABYBOO FASHION', 30)
FROM (
  SELECT id as to_id FROM transfer_orders WHERE transfer_number = '#T0303'
) t
CROSS JOIN (VALUES
  ('SKU-11', 100, 100),
  ('SKU-12', 200, 200)
) AS items(sku_code, incoming, received);

-- #T0312 (Shipped) - Has SKU-25 with high DOS
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received, preprocessing_status)
SELECT to_id, '#T0312', sku_code, incoming, received,
       get_preprocessing_status(sku_code, 'BABYBOO FASHION', 30)
FROM (
  SELECT id as to_id FROM transfer_orders WHERE transfer_number = '#T0312'
) t
CROSS JOIN (VALUES
  ('SKU-21', 100, 0),
  ('SKU-22', 200, 0),
  ('SKU-23', 100, 0),
  ('SKU-24', 200, 0),
  ('SKU-25', 100, 0)
) AS items(sku_code, incoming, received);

-- #T0311 (Putaway in progress) - Has SKU-31, SKU-35 with high DOS
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received, preprocessing_status)
SELECT to_id, '#T0311', sku_code, incoming, received,
       get_preprocessing_status(sku_code, 'BABYBOO FASHION', 30)
FROM (
  SELECT id as to_id FROM transfer_orders WHERE transfer_number = '#T0311'
) t
CROSS JOIN (VALUES
  ('SKU-31', 100, 100),
  ('SKU-32', 200, 200),
  ('SKU-33', 100, 100),
  ('SKU-34', 200, 0),
  ('SKU-35', 100, 0),
  ('SKU-36', 200, 0),
  ('SKU-37', 200, 100)
) AS items(sku_code, incoming, received);

-- #T0209 (WATERDROP ANZ - not eligible)
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received, preprocessing_status)
SELECT to_id, '#T0209', sku_code, incoming, received,
       get_preprocessing_status(sku_code, 'WATERDROP ANZ', 30)
FROM (
  SELECT id as to_id FROM transfer_orders WHERE transfer_number = '#T0209'
) t
CROSS JOIN (VALUES
  ('SKU-41', 100, 100),
  ('SKU-42', 200, 200)
) AS items(sku_code, incoming, received);

-- #T0501 - MIXED: 3 high, 2 low
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received, preprocessing_status)
SELECT to_id, '#T0501', sku_code, incoming, received,
       get_preprocessing_status(sku_code, 'BABYBOO FASHION', 30)
FROM (
  SELECT id as to_id FROM transfer_orders WHERE transfer_number = '#T0501'
) t
CROSS JOIN (VALUES
  ('SKU-81', 150, 0),
  ('SKU-82', 200, 0),
  ('SKU-83', 100, 0),
  ('SKU-86', 120, 0),
  ('SKU-87', 180, 0)
) AS items(sku_code, incoming, received);

-- #T0502 - MIXED: 2 high, 3 low
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received, preprocessing_status)
SELECT to_id, '#T0502', sku_code, incoming, received,
       get_preprocessing_status(sku_code, 'BABYBOO FASHION', 30)
FROM (
  SELECT id as to_id FROM transfer_orders WHERE transfer_number = '#T0502'
) t
CROSS JOIN (VALUES
  ('SKU-84', 200, 0),
  ('SKU-85', 150, 0),
  ('SKU-88', 300, 0),
  ('SKU-89', 250, 0),
  ('SKU-11', 100, 0)
) AS items(sku_code, incoming, received);

-- #T0503 - MIXED: 4 high, 4 low
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received, preprocessing_status)
SELECT to_id, '#T0503', sku_code, incoming, received,
       get_preprocessing_status(sku_code, 'BABYBOO FASHION', 30)
FROM (
  SELECT id as to_id FROM transfer_orders WHERE transfer_number = '#T0503'
) t
CROSS JOIN (VALUES
  ('SKU-91', 100, 0),
  ('SKU-92', 150, 0),
  ('SKU-93', 120, 0),
  ('SKU-94', 180, 0),
  ('SKU-95', 140, 0),
  ('SKU-96', 200, 0),
  ('SKU-97', 160, 0),
  ('SKU-98', 190, 0)
) AS items(sku_code, incoming, received);

-- #T0504 - Mostly high: 5 high, 1 low
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received, preprocessing_status)
SELECT to_id, '#T0504', sku_code, incoming, received,
       get_preprocessing_status(sku_code, 'BABYBOO FASHION', 30)
FROM (
  SELECT id as to_id FROM transfer_orders WHERE transfer_number = '#T0504'
) t
CROSS JOIN (VALUES
  ('SKU-81', 200, 0),
  ('SKU-82', 180, 0),
  ('SKU-83', 150, 0),
  ('SKU-84', 220, 0),
  ('SKU-85', 160, 0),
  ('SKU-86', 100, 0)
) AS items(sku_code, incoming, received);

-- #T0505 - Mostly low: 1 high, 5 low
INSERT INTO transfer_order_lines (transfer_order_id, transfer_number, sku, units_incoming, units_received, preprocessing_status)
SELECT to_id, '#T0505', sku_code, incoming, received,
       get_preprocessing_status(sku_code, 'BABYBOO FASHION', 30)
FROM (
  SELECT id as to_id FROM transfer_orders WHERE transfer_number = '#T0505'
) t
CROSS JOIN (VALUES
  ('SKU-99', 130, 0),
  ('SKU-86', 200, 0),
  ('SKU-87', 150, 0),
  ('SKU-88', 180, 0),
  ('SKU-89', 220, 0),
  ('SKU-92', 170, 0)
) AS items(sku_code, incoming, received);

-- Drop the helper function
DROP FUNCTION IF EXISTS get_preprocessing_status(TEXT, TEXT, NUMERIC);

-- Verify results
SELECT 
  t.transfer_number,
  tol.sku,
  sa.days_of_stock_pickface as dos,
  tol.preprocessing_status,
  CASE 
    WHEN sa.days_of_stock_pickface > 30 THEN 'Should be in review'
    ELSE 'Should be not required'
  END as expected_status
FROM transfer_order_lines tol
JOIN transfer_orders t ON tol.transfer_order_id = t.id
JOIN sku_attributes sa ON tol.sku = sa.sku
WHERE t.merchant = 'BABYBOO FASHION'
ORDER BY t.transfer_number, sa.days_of_stock_pickface DESC;

