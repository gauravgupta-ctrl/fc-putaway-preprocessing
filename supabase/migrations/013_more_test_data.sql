-- Add more diverse test data for testing
-- This migration adds transfer orders with various scenarios

-- Insert more SKU attributes
-- Note: days_of_stock_pickface is a calculated field and will be computed automatically
INSERT INTO sku_attributes (sku, description, barcode, inventory_on_hand, average_daily_sales) VALUES
('SKU-101', 'Premium Wireless Headphones', 'BAR101', 450, 10),    -- ~45 days
('SKU-102', 'USB-C Charging Cable 2m', 'BAR102', 80, 10),         -- ~8 days
('SKU-103', 'Bluetooth Speaker Portable', 'BAR103', 520, 10),     -- ~52 days
('SKU-104', 'Phone Case Clear', 'BAR104', 120, 10),               -- ~12 days
('SKU-105', 'Screen Protector Tempered Glass', 'BAR105', 650, 10), -- ~65 days
('SKU-106', 'Power Bank 20000mAh', 'BAR106', 50, 10),             -- ~5 days
('SKU-107', 'Laptop Stand Aluminum', 'BAR107', 380, 10),          -- ~38 days
('SKU-108', 'Wireless Mouse Ergonomic', 'BAR108', 220, 10),       -- ~22 days
('SKU-109', 'Mechanical Keyboard RGB', 'BAR109', 480, 10),        -- ~48 days
('SKU-110', 'Webcam HD 1080p', 'BAR110', 150, 10),                -- ~15 days
('SKU-111', 'Monitor 27 inch 4K', 'BAR111', 720, 10),             -- ~72 days
('SKU-112', 'HDMI Cable 3m', 'BAR112', 30, 10),                   -- ~3 days
('SKU-113', 'Desk Lamp LED Adjustable', 'BAR113', 280, 10),       -- ~28 days
('SKU-114', 'Gaming Chair Ergonomic', 'BAR114', 550, 10),         -- ~55 days
('SKU-115', 'External SSD 1TB', 'BAR115', 180, 10),               -- ~18 days
('SKU-116', 'Microphone USB Condenser', 'BAR116', 420, 10),       -- ~42 days
('SKU-117', 'Tablet Stand Adjustable', 'BAR117', 90, 10),         -- ~9 days
('SKU-118', 'Cable Organizer Set', 'BAR118', 60, 10),             -- ~6 days
('SKU-119', 'Laptop Sleeve 15 inch', 'BAR119', 330, 10),          -- ~33 days
('SKU-120', 'Wireless Earbuds Pro', 'BAR120', 610, 10);           -- ~61 days

-- Insert more Transfer Orders with different scenarios
INSERT INTO transfer_orders (transfer_number, merchant, transfer_status, estimated_arrival, destination) VALUES
-- TechZone orders (eligible merchant) - mix of items above/below threshold
('T0505', 'TechZone', 'In Transit', '2025-11-10', 'Warehouse A'),
('T0506', 'TechZone', 'Confirmed', '2025-11-12', 'Warehouse A'),
('T0507', 'TechZone', 'In Transit', '2025-11-15', 'Warehouse B'),

-- ElectroMart orders (eligible merchant) - various quantities
('T0508', 'ElectroMart', 'Confirmed', '2025-11-11', 'Warehouse A'),
('T0509', 'ElectroMart', 'In Transit', '2025-11-13', 'Warehouse C'),

-- GadgetWorld orders (eligible merchant) - large quantities
('T0510', 'GadgetWorld', 'In Transit', '2025-11-14', 'Warehouse B'),

-- SmartTech orders (NOT eligible - not in whitelist) - should all be "not needed"
('T0511', 'SmartTech', 'Confirmed', '2025-11-16', 'Warehouse A'),
('T0512', 'SmartTech', 'In Transit', '2025-11-18', 'Warehouse C');

-- Get the IDs of the newly created transfer orders
DO $$
DECLARE
  to_505_id uuid;
  to_506_id uuid;
  to_507_id uuid;
  to_508_id uuid;
  to_509_id uuid;
  to_510_id uuid;
  to_511_id uuid;
  to_512_id uuid;
BEGIN
  SELECT id INTO to_505_id FROM transfer_orders WHERE transfer_number = 'T0505';
  SELECT id INTO to_506_id FROM transfer_orders WHERE transfer_number = 'T0506';
  SELECT id INTO to_507_id FROM transfer_orders WHERE transfer_number = 'T0507';
  SELECT id INTO to_508_id FROM transfer_orders WHERE transfer_number = 'T0508';
  SELECT id INTO to_509_id FROM transfer_orders WHERE transfer_number = 'T0509';
  SELECT id INTO to_510_id FROM transfer_orders WHERE transfer_number = 'T0510';
  SELECT id INTO to_511_id FROM transfer_orders WHERE transfer_number = 'T0511';
  SELECT id INTO to_512_id FROM transfer_orders WHERE transfer_number = 'T0512';

  -- T0505: TechZone - Mix of above and below threshold
  INSERT INTO transfer_order_lines (transfer_order_id, sku, units_incoming) VALUES
  (to_505_id, 'SKU-101', 150),  -- 45 days - above threshold
  (to_505_id, 'SKU-102', 80),   -- 8 days - below threshold
  (to_505_id, 'SKU-103', 200),  -- 52 days - above threshold
  (to_505_id, 'SKU-104', 100),  -- 12 days - below threshold
  (to_505_id, 'SKU-105', 250);  -- 65 days - above threshold

  -- T0506: TechZone - Mostly above threshold
  INSERT INTO transfer_order_lines (transfer_order_id, sku, units_incoming) VALUES
  (to_506_id, 'SKU-106', 50),   -- 5 days - below threshold
  (to_506_id, 'SKU-107', 120),  -- 38 days - above threshold
  (to_506_id, 'SKU-109', 180),  -- 48 days - above threshold
  (to_506_id, 'SKU-111', 300);  -- 72 days - above threshold

  -- T0507: TechZone - All below threshold
  INSERT INTO transfer_order_lines (transfer_order_id, sku, units_incoming) VALUES
  (to_507_id, 'SKU-102', 60),   -- 8 days - below threshold
  (to_507_id, 'SKU-106', 40),   -- 5 days - below threshold
  (to_507_id, 'SKU-112', 30),   -- 3 days - below threshold
  (to_507_id, 'SKU-118', 25);   -- 6 days - below threshold

  -- T0508: ElectroMart - Large quantities, mixed
  INSERT INTO transfer_order_lines (transfer_order_id, sku, units_incoming) VALUES
  (to_508_id, 'SKU-108', 200),  -- 22 days - below threshold
  (to_508_id, 'SKU-110', 150),  -- 15 days - below threshold
  (to_508_id, 'SKU-114', 400),  -- 55 days - above threshold
  (to_508_id, 'SKU-116', 300),  -- 42 days - above threshold
  (to_508_id, 'SKU-120', 500);  -- 61 days - above threshold

  -- T0509: ElectroMart - Small quantities
  INSERT INTO transfer_order_lines (transfer_order_id, sku, units_incoming) VALUES
  (to_509_id, 'SKU-113', 80),   -- 28 days - below threshold
  (to_509_id, 'SKU-115', 60),   -- 18 days - below threshold
  (to_509_id, 'SKU-117', 40);   -- 9 days - below threshold

  -- T0510: GadgetWorld - All above threshold, large quantities
  INSERT INTO transfer_order_lines (transfer_order_id, sku, units_incoming) VALUES
  (to_510_id, 'SKU-101', 500),  -- 45 days - above threshold
  (to_510_id, 'SKU-103', 600),  -- 52 days - above threshold
  (to_510_id, 'SKU-105', 800),  -- 65 days - above threshold
  (to_510_id, 'SKU-111', 1000), -- 72 days - above threshold
  (to_510_id, 'SKU-114', 700),  -- 55 days - above threshold
  (to_510_id, 'SKU-120', 900);  -- 61 days - above threshold

  -- T0511: SmartTech (NOT eligible) - Should all be "not needed"
  INSERT INTO transfer_order_lines (transfer_order_id, sku, units_incoming) VALUES
  (to_511_id, 'SKU-101', 200),  -- 45 days but merchant not eligible
  (to_511_id, 'SKU-103', 250),  -- 52 days but merchant not eligible
  (to_511_id, 'SKU-105', 300);  -- 65 days but merchant not eligible

  -- T0512: SmartTech (NOT eligible) - Mix of DOS
  INSERT INTO transfer_order_lines (transfer_order_id, sku, units_incoming) VALUES
  (to_512_id, 'SKU-102', 100),  -- 8 days - merchant not eligible
  (to_512_id, 'SKU-108', 150),  -- 22 days - merchant not eligible
  (to_512_id, 'SKU-111', 400),  -- 72 days - merchant not eligible
  (to_512_id, 'SKU-120', 350);  -- 61 days - merchant not eligible

END $$;

-- Note: Preprocessing status will be automatically calculated by triggers
-- based on merchant eligibility and days of stock threshold

