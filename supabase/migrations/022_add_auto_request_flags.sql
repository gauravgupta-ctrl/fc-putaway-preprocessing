-- Add auto-request flags to transfer_order_lines if missing
ALTER TABLE transfer_order_lines
ADD COLUMN IF NOT EXISTS auto_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manually_cancelled BOOLEAN DEFAULT false;

-- Optional: backfill NULLs to false for safety
UPDATE transfer_order_lines
SET auto_requested = COALESCE(auto_requested, false),
    manually_cancelled = COALESCE(manually_cancelled, false);

COMMENT ON COLUMN transfer_order_lines.auto_requested IS 'True if system auto-requested preprocessing based on DOS/threshold';
COMMENT ON COLUMN transfer_order_lines.manually_cancelled IS 'True if admin explicitly cancelled auto request';
