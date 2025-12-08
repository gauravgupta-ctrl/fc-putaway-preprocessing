-- Migration: Auto-request logic
-- Note: Auto-request functionality is primarily handled in application code
-- This migration file is intentionally minimal as the logic lives in lib/database.ts
-- and app/api/recalculate-status/route.ts

-- The auto-request logic works as follows:
-- 1. Items with days_of_stock_pickface > threshold are auto-requested
-- 2. Items with manually_cancelled = true are never auto-requested
-- 3. The recalculation happens via API endpoint, not database triggers

-- No database changes needed for this feature as it's application-level logic
-- This file exists to maintain migration numbering consistency

