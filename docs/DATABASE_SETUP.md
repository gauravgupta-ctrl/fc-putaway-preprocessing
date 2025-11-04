# Database Setup Guide

This guide explains how to set up the Supabase database for the Putaway Preprocess application.

## Option 1: Run SQL Directly in Supabase Dashboard (Recommended for now)

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: "Putaway Preprocess"

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Migration SQL**
   - Open the file: `supabase/migrations/001_initial_schema.sql`
   - Copy all contents
   - Paste into the SQL editor

4. **Run the Migration**
   - Click "Run" or press `Cmd/Ctrl + Enter`
   - Wait for completion
   - Check for any errors

5. **Verify Tables Created**
   - Click "Table Editor" in the left sidebar
   - You should see all tables:
     - `settings`
     - `eligible_merchants`
     - `transfer_orders`
     - `sku_attributes`
     - `transfer_order_lines`
     - `pallet_labels`
     - `audit_log`

## Option 2: Using Supabase CLI (Advanced)

### Prerequisites:
```bash
npm install -g supabase
```

### Steps:

1. **Initialize Supabase in project** (if not already done)
   ```bash
   supabase init
   ```

2. **Link to your Supabase project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Run migrations**
   ```bash
   supabase db push
   ```

## Verify Installation

Run this query in SQL Editor to verify:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check settings table has default threshold
SELECT * FROM settings WHERE key = 'dos_threshold';

-- Check enum types
SELECT * FROM pg_type WHERE typname = 'preprocessing_status';
```

Expected results:
- 7 tables
- 1 row in settings (dos_threshold = 30)
- 1 enum type

## Initial Data

The migration automatically creates:
- Default setting: `dos_threshold = 30`

You'll need to add:
- **Eligible merchants** (via the Settings page in the app)
- **User accounts** (via Supabase Auth)

## Row Level Security (RLS)

RLS is enabled on all tables with the following policies:
- **Authenticated users**: Can read all data
- **Authenticated users**: Can write to all tables (v1 - no role-based restrictions yet)

### Future: Role-Based Access

In future versions, we'll add role-based policies:
- **Admin**: Full access
- **Operator**: Read TOs/items, write pallet labels only

## Database Functions

The migration creates these functions:

1. **update_updated_at()**: Auto-update timestamps
2. **update_to_preprocessing_status()**: Auto-calculate TO status from items
3. **calculate_item_preprocessing_status()**: Calculate item pre-processing status

## Triggers

Automatic triggers:
- Update `updated_at` on all table modifications
- Update TO status when items change

## Troubleshooting

**Error: relation already exists**
- Tables already created
- Drop tables manually or use `DROP TABLE IF EXISTS` before re-running

**Error: must be owner of extension uuid-ossp**
- Extension already enabled
- Safe to ignore

**Error: type "preprocessing_status" already exists**
- Enum already created
- Drop enum: `DROP TYPE IF EXISTS preprocessing_status CASCADE;`

## Next Steps

After database setup:
1. Create user accounts in Supabase Auth
2. Add eligible merchants via Settings page
3. Sync data from Google Sheets

## Backup

Supabase automatically backs up your database. To manually export:

1. Go to Database → Backups
2. Click "Download" on any backup
3. Or use `pg_dump`:
   ```bash
   supabase db dump -f backup.sql
   ```

## Reset Database (Development Only)

**⚠️ WARNING: This deletes all data**

```sql
-- Drop all tables
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS pallet_labels CASCADE;
DROP TABLE IF EXISTS transfer_order_lines CASCADE;
DROP TABLE IF EXISTS transfer_orders CASCADE;
DROP TABLE IF EXISTS sku_attributes CASCADE;
DROP TABLE IF EXISTS eligible_merchants CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TYPE IF EXISTS preprocessing_status CASCADE;

-- Then re-run the migration
```

## Resources

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

