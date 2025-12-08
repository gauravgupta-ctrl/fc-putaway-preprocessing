-- Ensure pallet_assignments.sku has a FK to sku_attributes.sku
-- This is needed for Supabase joins (pallet_assignments -> sku_attributes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'pallet_assignments'
      AND c.conname = 'pallet_assignments_sku_fkey'
  ) THEN
    ALTER TABLE pallet_assignments
    ADD CONSTRAINT pallet_assignments_sku_fkey
    FOREIGN KEY (sku) REFERENCES sku_attributes(sku) ON DELETE CASCADE;
  END IF;
END $$;

