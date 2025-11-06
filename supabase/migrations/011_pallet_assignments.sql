-- Create pallet_assignments table for tracking item-to-pallet allocations

CREATE TABLE pallet_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  transfer_order_line_id UUID NOT NULL REFERENCES transfer_order_lines(id) ON DELETE CASCADE,
  pallet_number INTEGER NOT NULL,
  sku TEXT NOT NULL REFERENCES sku_attributes(sku) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transfer_order_id, pallet_number, sku)
);

-- Indexes for performance
CREATE INDEX pallet_assignments_to_idx ON pallet_assignments(transfer_order_id);
CREATE INDEX pallet_assignments_line_idx ON pallet_assignments(transfer_order_line_id);
CREATE INDEX pallet_assignments_sku_idx ON pallet_assignments(sku);
CREATE INDEX pallet_assignments_pallet_idx ON pallet_assignments(transfer_order_id, pallet_number);

-- Enable RLS
ALTER TABLE pallet_assignments ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for development)
CREATE POLICY "Allow all operations" ON pallet_assignments
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_pallet_assignments_updated_at
  BEFORE UPDATE ON pallet_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update pallet_labels table to reference actual pallets with items
-- Add a reference to track which pallets have assignments
ALTER TABLE pallet_labels 
  ADD COLUMN has_items BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON TABLE pallet_assignments IS 'Tracks which items and quantities are assigned to which pallets during pre-processing';
COMMENT ON COLUMN pallet_assignments.pallet_number IS 'Sequential pallet number within the TO (1, 2, 3...)';
COMMENT ON COLUMN pallet_assignments.quantity IS 'Quantity of this SKU assigned to this pallet';

