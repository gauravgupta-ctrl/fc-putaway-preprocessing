# Pallet Assignment Feature

## Overview

Operators can now assign specific quantities of items to specific pallets during pre-processing. This tracks which items go on which pallets for shelf storage.

## Database

### New Table: `pallet_assignments`

Tracks item-to-pallet allocations:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `transfer_order_id` | UUID | TO reference |
| `transfer_order_line_id` | UUID | Specific item reference |
| `pallet_number` | INTEGER | Pallet number (1, 2, 3...) |
| `sku` | TEXT | Item SKU |
| `quantity` | NUMERIC | Quantity on this pallet |
| `created_by` | UUID | Operator who assigned |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

**Unique Constraint:** (transfer_order_id, pallet_number, sku)

## Operator Workflow

### For TO RESERVE Items Only

**When operator scans item with "TO RESERVE" instruction:**

1. **Pallet Selection UI appears:**
   - Numbered squares: [1] [2] [3] [+]
   - Tap squares to select/deselect
   - Tap [+] to add new pallet
   - Can delete pallets (🗑️ icon) if no quantity assigned

2. **Quantity Assignment:**
   - Input field appears for each selected pallet
   - Enter specific quantity per pallet
   - Example: Pallet 1: 100, Pallet 2: 50

3. **Progress Tracking:**
   - Visual progress bar
   - Shows: allocated / expected
   - Colors:
     - 🟢 Green: Complete (100%)
     - 🟠 Orange: Under-allocated (< 100%)
     - 🔴 Red: Over-allocated (> 100%)

4. **Confirm:**
   - Saves assignments to database
   - Updates item status to "completed"
   - Proceeds to next item

### For TO PICK FACE Items

No pallet assignment needed - just tap "Proceed"

## Features

### Multi-Pallet Support

**Example: 200 units of SKU-81**

- Select Pallet 1, 2, 3
- Assign:
  - Pallet 1: 100 units
  - Pallet 2: 50 units
  - Pallet 3: 50 units
- Total: 200 units (100% allocated)

### Re-scan Support

**If operator scans same item again:**
- Loads existing assignments from database
- Pre-selects pallets with quantities
- Shows quantities in input fields
- Allows modifications
- Saves updated assignments

### Validation

✅ **Allow partial allocation** (e.g., 150/200)  
✅ **Allow over-allocation** (e.g., 220/200) - shows warning  
⚠️ **Warn under-allocation** - shows warning  
✅ **Ignore empty pallets** - only save pallets with quantity > 0  
✅ **Delete protection** - can't delete pallet with assigned quantity

## Print Labels Integration

### Auto-Count Labels

**OLD Behavior:**
- User manually enters number of labels (1-10)

**NEW Behavior:**
- System counts unique pallets with items
- Displays: "Based on X pallets used"
- Example: 3 pallets → "Print 3 Labels"

**Label Numbering:**
- 1 of 3
- 2 of 3
- 3 of 3

Each label corresponds to a physical pallet.

## Admin UI (Future Enhancement)

Will show pallet breakdown:
- Which items on which pallets
- Quantities per pallet
- Pallet-level details

## Database Queries

### Get Pallet Assignments for TO

```sql
SELECT 
  pallet_number,
  sku,
  quantity,
  sku_attributes.description
FROM pallet_assignments
JOIN sku_attributes ON pallet_assignments.sku = sku_attributes.sku
WHERE transfer_order_id = 'xxx'
ORDER BY pallet_number, sku;
```

### Get Pallet Count

```sql
SELECT COUNT(DISTINCT pallet_number)
FROM pallet_assignments
WHERE transfer_order_id = 'xxx';
```

## Testing

### Test Scenario 1: Single Pallet

1. Admin: Request SKU-81 in TO #T0501
2. Operator: Scan TO #T0501
3. Operator: Scan item 123456860
4. See: RED "TO RESERVE"
5. Pallet 1 auto-selected
6. Enter: 150 units
7. Progress: 150/150 (100%) - Green
8. Confirm → Saved!

### Test Scenario 2: Multiple Pallets

1. Scan item with 200 units
2. Tap [+] to add Pallet 2
3. Select both Pallet 1 and 2
4. Enter: Pallet 1: 120, Pallet 2: 80
5. Progress: 200/200 (100%) - Green
6. Confirm → Both pallets saved!

### Test Scenario 3: Over-Allocation

1. Total expected: 200
2. Assign: Pallet 1: 150, Pallet 2: 100
3. Progress: 250/200 (125%) - Red warning
4. Can still confirm (allowed)

### Test Scenario 4: Re-scan

1. Scan item that was already processed
2. See existing assignments pre-loaded
3. Modify quantities
4. Confirm → Updates saved

### Test Scenario 5: Delete Pallet

1. Add 3 pallets
2. Try to delete Pallet 2 (has 50 units) → Error
3. Clear Pallet 3 quantity → Can delete
4. Delete successful

## Migration

Run `supabase/migrations/011_pallet_assignments.sql` to:
- Create `pallet_assignments` table
- Add indexes
- Add RLS policies
- Add comments

---

**Pallet assignment feature is production-ready!** 🚀

