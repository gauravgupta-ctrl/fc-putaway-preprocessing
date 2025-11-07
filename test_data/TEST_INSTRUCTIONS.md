# CSV Upload Test Sequence

## Prerequisites
1. Set threshold to **30 days** in Settings
2. Add **Merchant A** and **Merchant B** to eligible merchants
3. Clean up existing data (optional)

## Test File 1: `csv_test_1_initial.csv`
**Purpose:** Initial data load

**Expected Results:**
- 3 Transfer Orders created: T0201, T0202, T0203
- 5 Items total
- **Auto-requested items** (DOS > 30 days):
  - SKU-101: 800/20 = **40 days** ✅ Requested
  - SKU-103: 1200/30 = **40 days** ✅ Requested
  - SKU-105: 600/15 = **40 days** ✅ Requested
- **Not needed** (DOS ≤ 30 days):
  - SKU-102: 400/25 = **16 days** ❌ Not needed
  - SKU-104: 300/50 = **6 days** ❌ Not needed

**What to verify:**
- Dashboard shows 3 TOs
- 3 items with "requested" status
- 2 items with "not needed" status

---

## Test File 2: `csv_test_2_update_quantities.csv`
**Purpose:** Update inventory levels (changes DOS calculations)

**Changes:**
- SKU-101: 800 → **1500** units (40 → **75 days**) - Still requested
- SKU-102: 400 → **200** units (16 → **8 days**) - Still not needed
- SKU-103: 1200 → **600** units (40 → **20 days**) - Should change to not needed!
- SKU-104: 300 → **150** units (6 → **3 days**) - Still not needed
- SKU-105: 600 → **1000** units (40 → **66 days**) - Still requested

**Expected Results:**
- SKU-103 changes from "requested" to "not needed" (dropped below threshold)
- SKU-101 and SKU-105 remain "requested"
- SKU-102 and SKU-104 remain "not needed"

**What to verify:**
- Only 2 items now have "requested" status (SKU-101, SKU-105)
- 3 items have "not needed" status

---

## Test File 3: `csv_test_3_add_new_to.csv`
**Purpose:** Add new Transfer Order with new items

**Changes:**
- Added T0204 with 2 new items:
  - SKU-106: 2000/40 = **50 days** ✅ Should be requested
  - SKU-107: 100/10 = **10 days** ❌ Not needed

**Expected Results:**
- 4 Transfer Orders total
- 7 Items total
- 3 items with "requested" status (SKU-101, SKU-105, SKU-106)
- 4 items with "not needed" status

**What to verify:**
- T0204 appears in dashboard
- SKU-106 is auto-requested
- SKU-107 is not needed

---

## Test File 4: `csv_test_4_mark_received.csv`
**Purpose:** Update TO status to received

**Changes:**
- T0201 status: "In Transit" → "Received"
- Added receipt_time for T0201

**Expected Results:**
- T0201 shows as "Received" with receipt timestamp
- All preprocessing statuses remain unchanged
- No change to item statuses

**What to verify:**
- T0201 shows receipt_time in dashboard
- Transfer status updated to "Received"
- Item statuses unchanged

---

## Manual Testing Scenarios

### Test 5: Manual Request (Below Threshold)
1. In dashboard, find SKU-102 (8 days, not needed)
2. Click "Request" button
3. Upload `csv_test_2_update_quantities.csv` again
4. **Verify:** SKU-102 remains "requested" (manual choice preserved)

### Test 6: Manual Cancel (Above Threshold)
1. In dashboard, find SKU-101 (75 days, requested)
2. Click "Cancel" button
3. Upload `csv_test_2_update_quantities.csv` again
4. **Verify:** SKU-101 remains "not needed" (manual cancellation preserved)

---

## Summary of Expected Final State (After Test 4)

**Transfer Orders:** 4
- T0201: Received
- T0202: Scheduled
- T0203: Scheduled
- T0204: Scheduled

**Items with "requested" status:** 3
- SKU-101 (75 days)
- SKU-105 (66 days)
- SKU-106 (50 days)

**Items with "not needed" status:** 4
- SKU-102 (8 days)
- SKU-103 (20 days)
- SKU-104 (3 days)
- SKU-107 (10 days)

