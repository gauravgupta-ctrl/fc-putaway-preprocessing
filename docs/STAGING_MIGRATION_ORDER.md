# Migration Order for Staging Database Setup

When setting up your staging Supabase database, run these migrations in **exact order**:

## Migration Execution Order

Run these in the Supabase SQL Editor for your staging project:

1. ✅ `001_initial_schema.sql` - Creates all base tables
2. ⚠️ `002_sample_data.sql` - **SKIP** if you don't want test data in staging
3. ✅ `003_fix_rls_policies.sql` - Sets up Row Level Security
4. ✅ `004_add_user_roles.sql` - Adds user role functionality
5. ⚠️ `005_additional_sample_data.sql` - **SKIP** if you don't want test data
6. ⚠️ `006_more_test_data.sql` - **SKIP** if you don't want test data
7. ⚠️ `007_reset_and_fix_data.sql` - **SKIP** (data cleanup, not needed for fresh setup)
8. ⚠️ `008_update_status_logic.sql` - **SKIP** (duplicate, see next)
9. ✅ `008_update_status_logic_fixed.sql` - Updates status logic
10. ✅ `009_complete_status_migration.sql` - Completes status migration
11. ✅ `010_auto_request_logic.sql` - Adds auto-request functionality
12. ✅ `011_pallet_assignments.sql` - Creates pallet assignments table
13. ✅ `014_add_inventory_fields.sql` - Adds inventory fields
14. ✅ `015_add_reserve_destination.sql` - Adds reserve destination
15. ✅ `016_add_admin_reviewed_flag.sql` - Adds admin reviewed flag
16. ✅ `017_add_carton_tracking.sql` - Adds carton tracking
17. ⚠️ `019_clear_all_data.sql` - **SKIP** (data cleanup, not needed for fresh setup)
18. ✅ `020_fix_status_enum.sql` - Fixes status enum values
19. ✅ `021_auto_update_to_status.sql` - Adds auto-update trigger
20. ⚠️ `999_cleanup_all_data.sql` - **SKIP** (data cleanup, not needed for fresh setup)

## Quick Setup (No Test Data)

If you want a clean staging database without test data, run these in order:

1. `001_initial_schema.sql`
2. `003_fix_rls_policies.sql`
3. `004_add_user_roles.sql`
4. `008_update_status_logic_fixed.sql`
5. `009_complete_status_migration.sql`
6. `010_auto_request_logic.sql`
7. `011_pallet_assignments.sql`
8. `014_add_inventory_fields.sql`
9. `015_add_reserve_destination.sql`
10. `016_add_admin_reviewed_flag.sql`
11. `017_add_carton_tracking.sql`
12. `020_fix_status_enum.sql`
13. `021_auto_update_to_status.sql`

## How to Run Migrations

1. **Go to Supabase Dashboard** → Your staging project
2. **Navigate to SQL Editor**
3. **Click "New Query"**
4. **Copy the contents** of each migration file (from `supabase/migrations/`)
5. **Paste into SQL Editor**
6. **Click "Run"** (or press Cmd/Ctrl + Enter)
7. **Verify success** (check for green success message)
8. **Repeat for next migration**

## Verification

After running all migrations, verify:

- [ ] All tables exist (Database → Tables)
- [ ] RLS policies are active (Authentication → Policies)
- [ ] Functions exist (Database → Functions)
- [ ] Triggers exist (Database → Triggers)
- [ ] No errors in SQL Editor history

## Troubleshooting

**If a migration fails:**
- Check the error message
- Some migrations may depend on previous ones
- Verify you're running them in order
- Check if tables/functions already exist (may need to drop first)

**If you need to start over:**
- You can drop all tables and start fresh
- Or create a new Supabase project

