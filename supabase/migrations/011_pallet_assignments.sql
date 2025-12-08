-- Migration: Create pallet_assignments table
-- This table tracks which items are assigned to which pallets during pre-processing

CREATE TABLE IF NOT EXISTS pallet_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  transfer_order_line_id UUID NOT NULL REFERENCES transfer_order_lines(id) ON DELETE CASCADE,
  pallet_number INTEGER NOT NULL,
  sku TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  carton_count INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: same SKU can't be on same pallet twice for same TO
  UNIQUE(transfer_order_id, pallet_number, sku)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS pallet_assignments_to_id_idx ON pallet_assignments(transfer_order_id);
CREATE INDEX IF NOT EXISTS pallet_assignments_line_id_idx ON pallet_assignments(transfer_order_line_id);
CREATE INDEX IF NOT EXISTS pallet_assignments_pallet_idx ON pallet_assignments(transfer_order_id, pallet_number);
CREATE INDEX IF NOT EXISTS pallet_assignments_sku_idx ON pallet_assignments(sku);

-- Add comments for documentation
COMMENT ON TABLE pallet_assignments IS 'Tracks item-to-pallet allocations during pre-processing';
COMMENT ON COLUMN pallet_assignments.transfer_order_id IS 'Reference to the transfer order';
COMMENT ON COLUMN pallet_assignments.transfer_order_line_id IS 'Reference to the specific item line';
COMMENT ON COLUMN pallet_assignments.pallet_number IS 'Pallet number (1, 2, 3, etc.)';
COMMENT ON COLUMN pallet_assignments.sku IS 'SKU of the item';
COMMENT ON COLUMN pallet_assignments.quantity IS 'Total quantity assigned to this pallet';
COMMENT ON COLUMN pallet_assignments.carton_count IS 'Number of cartons assigned to this pallet';
COMMENT ON COLUMN pallet_assignments.created_by IS 'Operator who created this assignment';

-- Enable RLS
ALTER TABLE pallet_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pallet_assignments
CREATE POLICY "Allow read access for authenticated users" ON pallet_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write access for authenticated users" ON pallet_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pallet_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER pallet_assignments_updated_at
  BEFORE UPDATE ON pallet_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_pallet_assignments_updated_at();
