# Auto-Request Feature

## Overview

The system now automatically requests pre-processing for items that exceed the days of stock threshold, while allowing admins to override these decisions.

## How It Works

### Automatic Behavior

**On Refresh/Threshold Change:**
- Items with DOS > threshold are **automatically set to "requested"** status
- Items with DOS ≤ threshold are set to "not needed" status
- Only affects items from eligible merchants

### Admin Control

**Admin Can:**
- ✅ **Cancel** auto-requested items → Sets `manually_cancelled = true`
- ✅ **Request** items below threshold → Manual override
- ✅ Decisions persist across refreshes

**Cancel Button:**
- Status: `requested` → `not needed`
- Sets: `manually_cancelled = true`
- Result: Item stays "not needed" even if DOS > threshold on next refresh

**Request Button:**
- Status: `not needed` → `requested`
- Sets: `manually_cancelled = false`, `auto_requested = false`
- Result: Manual request (not auto-requested)

## Status Meanings

| Status | Meaning | Auto-Requested? | Admin Action |
|--------|---------|-----------------|--------------|
| `not needed` | Below threshold OR admin cancelled | No | Can manually request |
| `requested` | Above threshold (auto) OR manual request | Maybe | Can cancel |
| `in-progress` | Operator processing | N/A | None |
| `completed` | Operator completed | N/A | None |

## Database Fields

### `transfer_order_lines` Table

**New Fields:**
- `auto_requested` (boolean) - True if system auto-requested
- `manually_cancelled` (boolean) - True if admin explicitly cancelled

**Logic:**
```sql
IF manually_cancelled = true THEN
  -- Stay as "not needed" regardless of DOS
  
ELSIF DOS > threshold AND merchant is eligible THEN
  -- Auto-request
  preprocessing_status = 'requested'
  auto_requested = true
  
ELSE
  -- Not needed
  preprocessing_status = 'not needed'
  auto_requested = false
```

## Admin UI Changes

### Transfer Orders Dashboard

**Removed:**
- ❌ "Request All above Threshold" button (no longer needed)

**Kept:**
- ✅ "Cancel All Requests" button
- ✅ Individual "Request" buttons (for manual override)
- ✅ Individual "Cancel" buttons

**Updated Description:**
"Items above the {threshold}-day threshold are automatically requested for pre-processing. Review and cancel individual items if needed, or manually request items below the threshold."

### Workflow

1. **Admin sets threshold** (e.g., 30 days)
2. **Admin clicks "Refresh"**
3. **System auto-requests** items with DOS > 30
4. **Admin reviews**:
   - Cancel specific items if needed
   - Manually request items below threshold
5. **Operator processes** requested items

## Operator UI

**No changes** - Operator workflow remains the same:
- `requested` items → RED "TO RESERVE" → Confirm Action
- `not needed` items → GREEN "TO PICK FACE" → Proceed

## Benefits

✅ **Less manual work** - System auto-requests high DOS items  
✅ **Admin retains control** - Can cancel specific items  
✅ **Decisions persist** - Cancelled items stay cancelled  
✅ **Clear audit trail** - Track auto vs manual requests  
✅ **Flexible** - Admin can request items below threshold

## Testing

### Test Scenario 1: Auto-Request

1. Set threshold to 30 days
2. Click Refresh
3. Items with DOS > 30 automatically become "requested"
4. Verify blue "requested" badge

### Test Scenario 2: Admin Cancel

1. Find auto-requested item
2. Click "Cancel"
3. Status → "not needed"
4. Click "Refresh" again
5. Item stays "not needed" (not auto-requested again)

### Test Scenario 3: Manual Request

1. Find item with DOS < threshold (status: "not needed")
2. Click "Request"
3. Status → "requested"
4. Item is now manually requested

### Test Scenario 4: Threshold Change

1. Set threshold to 20 days
2. Click Refresh
3. Items with 20-30 days DOS auto-request
4. Items previously cancelled stay cancelled

## Migration

Run `supabase/migrations/010_auto_request_logic.sql` to:
- Add `auto_requested` and `manually_cancelled` columns
- Rename `no instruction` → `not needed`
- Update trigger functions
- Migrate existing data

