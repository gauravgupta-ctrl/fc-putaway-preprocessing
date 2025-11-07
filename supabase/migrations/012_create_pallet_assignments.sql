-- Create pallet_assignments table
CREATE TABLE pallet_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  transfer_order_line_id UUID NOT NULL REFERENCES transfer_order_lines(id) ON DELETE CASCADE,
  pallet_number INTEGER NOT NULL,
  sku VARCHAR(100) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one entry per TO + pallet + SKU combination
  CONSTRAINT unique_to_pallet_sku UNIQUE (transfer_order_id, pallet_number, sku)
);

-- Create indexes
CREATE INDEX pallet_assignments_to_idx ON pallet_assignments(transfer_order_id);
CREATE INDEX pallet_assignments_sku_idx ON pallet_assignments(sku);
CREATE INDEX pallet_assignments_pallet_idx ON pallet_assignments(pallet_number);

-- Enable RLS
ALTER TABLE pallet_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access for authenticated users" ON pallet_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow write access for authenticated users" ON pallet_assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add foreign key to sku_attributes for the join
ALTER TABLE pallet_assignments
  ADD CONSTRAINT fk_pallet_assignments_sku
  FOREIGN KEY (sku)
  REFERENCES sku_attributes(sku)
  ON DELETE CASCADE;

