-- Add admin_reviewed flag to transfer_orders table
ALTER TABLE transfer_orders
ADD COLUMN IF NOT EXISTS admin_reviewed BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_transfer_orders_admin_reviewed 
ON transfer_orders(admin_reviewed);

