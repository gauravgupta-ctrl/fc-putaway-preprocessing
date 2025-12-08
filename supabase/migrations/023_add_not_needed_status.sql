-- Add missing enum value 'not needed' to preprocessing_status (safe if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'preprocessing_status' AND e.enumlabel = 'not needed'
  ) THEN
    ALTER TYPE preprocessing_status ADD VALUE 'not needed';
  END IF;
END $$;
