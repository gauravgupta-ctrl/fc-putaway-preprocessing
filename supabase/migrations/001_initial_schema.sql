-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE preprocessing_status AS ENUM (
  'not required',
  'in review',
  'requested',
  'in-progress',
  'completed'
);

-- =====================================================
-- TABLE: settings
-- =====================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX settings_key_idx ON settings(key);

-- Insert default settings
INSERT INTO settings (key, value) VALUES ('dos_threshold', '30');

-- =====================================================
-- TABLE: eligible_merchants
-- =====================================================
CREATE TABLE eligible_merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX eligible_merchants_name_idx ON eligible_merchants(merchant_name);

-- =====================================================
-- TABLE: transfer_orders
-- =====================================================
CREATE TABLE transfer_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_number TEXT UNIQUE NOT NULL,
  merchant TEXT NOT NULL,
  transfer_status TEXT,
  estimated_arrival DATE,
  receipt_time TIMESTAMPTZ,
  destination TEXT,
  preprocessing_status preprocessing_status NOT NULL DEFAULT 'not required',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX transfer_orders_number_idx ON transfer_orders(transfer_number);
CREATE INDEX transfer_orders_merchant_idx ON transfer_orders(merchant);
CREATE INDEX transfer_orders_preprocessing_status_idx ON transfer_orders(preprocessing_status);

-- =====================================================
-- TABLE: sku_attributes
-- =====================================================
CREATE TABLE sku_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  description TEXT,
  barcode TEXT,
  daily_units_sold NUMERIC,
  units_pickface NUMERIC,
  units_reserve NUMERIC,
  days_of_stock_pickface NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN daily_units_sold > 0 THEN units_pickface / daily_units_sold
      ELSE 0
    END
  ) STORED,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX sku_attributes_sku_idx ON sku_attributes(sku);
CREATE INDEX sku_attributes_barcode_idx ON sku_attributes(barcode);

-- =====================================================
-- TABLE: transfer_order_lines
-- =====================================================
CREATE TABLE transfer_order_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  transfer_number TEXT NOT NULL,
  sku TEXT NOT NULL REFERENCES sku_attributes(sku) ON DELETE CASCADE,
  units_incoming NUMERIC,
  units_received NUMERIC,
  preprocessing_status preprocessing_status NOT NULL DEFAULT 'not required',
  requested_at TIMESTAMPTZ,
  requested_by UUID REFERENCES auth.users(id),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transfer_order_id, sku)
);

CREATE INDEX transfer_order_lines_to_idx ON transfer_order_lines(transfer_order_id);
CREATE INDEX transfer_order_lines_sku_idx ON transfer_order_lines(sku);
CREATE INDEX transfer_order_lines_status_idx ON transfer_order_lines(preprocessing_status);

-- =====================================================
-- TABLE: pallet_labels
-- =====================================================
CREATE TABLE pallet_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  label_number INTEGER NOT NULL,
  total_labels INTEGER NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  printed_at TIMESTAMPTZ,
  UNIQUE(transfer_order_id, label_number)
);

CREATE INDEX pallet_labels_to_idx ON pallet_labels(transfer_order_id);

-- =====================================================
-- TABLE: audit_log
-- =====================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX audit_log_user_idx ON audit_log(user_id);
CREATE INDEX audit_log_entity_idx ON audit_log(entity_type, entity_id);
CREATE INDEX audit_log_created_idx ON audit_log(created_at);

-- =====================================================
-- FUNCTION: update_updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_transfer_orders_updated_at
  BEFORE UPDATE ON transfer_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sku_attributes_updated_at
  BEFORE UPDATE ON sku_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_transfer_order_lines_updated_at
  BEFORE UPDATE ON transfer_order_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- FUNCTION: update_to_preprocessing_status
-- =====================================================
CREATE OR REPLACE FUNCTION update_to_preprocessing_status()
RETURNS TRIGGER AS $$
DECLARE
  to_id UUID;
  item_statuses TEXT[];
  new_status preprocessing_status;
BEGIN
  -- Get the TO ID
  to_id := COALESCE(NEW.transfer_order_id, OLD.transfer_order_id);
  
  -- Get all item statuses for this TO
  SELECT ARRAY_AGG(DISTINCT preprocessing_status::TEXT)
  INTO item_statuses
  FROM transfer_order_lines
  WHERE transfer_order_id = to_id;
  
  -- Calculate TO status based on item statuses
  IF 'completed' = ALL(item_statuses) THEN
    new_status := 'completed';
  ELSIF 'in-progress' = ANY(item_statuses) OR 
        ('completed' = ANY(item_statuses) AND 'requested' = ANY(item_statuses)) THEN
    new_status := 'in-progress';
  ELSIF 'requested' = ANY(item_statuses) THEN
    new_status := 'requested';
  ELSIF 'in review' = ANY(item_statuses) THEN
    new_status := 'in review';
  ELSE
    new_status := 'not required';
  END IF;
  
  -- Update TO status
  UPDATE transfer_orders
  SET preprocessing_status = new_status
  WHERE id = to_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update TO status when items change
CREATE TRIGGER update_to_status_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON transfer_order_lines
  FOR EACH ROW EXECUTE FUNCTION update_to_preprocessing_status();

-- =====================================================
-- FUNCTION: calculate_item_preprocessing_status
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_item_preprocessing_status(
  p_sku TEXT,
  p_merchant TEXT,
  p_threshold NUMERIC
)
RETURNS preprocessing_status AS $$
DECLARE
  v_days_of_stock NUMERIC;
  v_is_eligible BOOLEAN;
  v_status preprocessing_status;
BEGIN
  -- Check if merchant is eligible
  SELECT EXISTS(
    SELECT 1 FROM eligible_merchants WHERE merchant_name = p_merchant
  ) INTO v_is_eligible;
  
  -- Get days of stock for SKU
  SELECT days_of_stock_pickface
  INTO v_days_of_stock
  FROM sku_attributes
  WHERE sku = p_sku;
  
  -- Calculate status
  IF v_is_eligible AND v_days_of_stock > p_threshold THEN
    v_status := 'in review';
  ELSE
    v_status := 'not required';
  END IF;
  
  RETURN v_status;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligible_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (all have read access)
CREATE POLICY "Allow read access for authenticated users" ON settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON eligible_merchants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON transfer_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON sku_attributes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON transfer_order_lines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON pallet_labels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON audit_log
  FOR SELECT TO authenticated USING (true);

-- Policies for write access (authenticated users can write)
CREATE POLICY "Allow write access for authenticated users" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write access for authenticated users" ON eligible_merchants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write access for authenticated users" ON transfer_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write access for authenticated users" ON sku_attributes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write access for authenticated users" ON transfer_order_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write access for authenticated users" ON pallet_labels
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow write access for authenticated users" ON audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

