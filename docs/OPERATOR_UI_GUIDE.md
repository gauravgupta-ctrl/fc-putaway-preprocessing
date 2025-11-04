# Operator UI Guide

## Overview

The Operator UI is a mobile-optimized interface designed for warehouse operators to execute pre-processing workflows using barcode scanners.

---

## Access

**URL:** http://localhost:3000/operator

**Device:** Mobile devices/tablets with external barcode scanner

---

## Workflow

### 1. Scan Transfer Order
**Page:** `/operator`

- Large input field auto-focused for scanner
- Scanner types TO number and submits
- Validates:
  - TO exists in database
  - TO has items in "requested" status
- Shows warnings if TO is "in-progress" or "completed" (but allows override)
- Proceeds to Scan Item page

### 2. Scan Item Barcode
**Page:** `/operator/scan-item/[toId]`

- Shows current TO number at top
- Large input field for item barcode
- Scanner types barcode and submits
- Validates:
  - Barcode matches SKU in system
  - Item belongs to scanned TO
- **Print Label Button** appears if any items already completed
- **All Complete Message** shows when all requested items done
- Proceeds to Confirm Action page

### 3. Confirm Action
**Page:** `/operator/confirm/[toId]/[itemId]`

- Shows TO number and item details (SKU, description, quantity)
- **Large colored display:**
  - **"TO SHELVES"** (RED) - if item status is "requested"
  - **"TO PICK FACE"** (GREEN) - if item status is anything else
- Big "Confirm" button
- Updates item status to "completed"
- Returns to Scan Item page

### 4. Print Labels
**Page:** `/operator/print/[toId]`

- Shows label information (TO number, date, time, items)
- Lists all completed items
- Select number of labels (default: 1)
- Labels numbered: "1 of X", "2 of X", etc.
- Creates pallet label records in database
- Shows success message
- Returns to Scan TO page

---

## Features

### Mobile Optimization
- ✅ Large touch targets (buttons 64-80px high)
- ✅ Big fonts (text-xl to text-5xl)
- ✅ Auto-focus inputs for scanner
- ✅ Single-screen views (no scrolling needed)
- ✅ Full-width buttons
- ✅ Clear visual hierarchy

### Barcode Scanning
- ✅ External scanner device (types into input)
- ✅ Auto-submit on Enter key
- ✅ Maintains focus for continuous scanning
- ✅ Clear error messages

### Validation
- ✅ TO must exist and have requested items
- ✅ Warnings for in-progress/completed TOs
- ✅ Item must belong to scanned TO
- ✅ Barcode must match SKU

### Status Updates
- ✅ Item: requested → completed (on confirm)
- ✅ TO: Auto-updates via database trigger
- ✅ Audit logging for all actions

---

## Navigation Flow

```
/operator (Scan TO)
    ↓
/operator/scan-item/[toId] (Scan Item)
    ↓
/operator/confirm/[toId]/[itemId] (Confirm Action)
    ↓ (returns to)
/operator/scan-item/[toId] (Scan next item or print)
    ↓
/operator/print/[toId] (Print Labels)
    ↓
/operator (Start new TO)
```

### Abort/Cancel Options
- **Scan TO page:** Back button returns to home
- **Scan Item page:** "Back to Scan TO" button
- **Confirm page:** "Cancel" button returns to Scan Item
- **Print page:** "End Transfer Order" returns to Scan TO

---

## Color Coding

| Element | Color | Meaning |
|---------|-------|---------|
| **TO SHELVES** | Red (bg-red-500) | Redirect to shelf storage |
| **TO PICK FACE** | Green (bg-green-500) | Send to ASRS |
| **Print Label** | Green border | Completed items action |
| **Primary Actions** | Blue (bg-blue-600) | Main workflow buttons |
| **Warnings** | Yellow (bg-yellow-50) | Override warnings |
| **Errors** | Red (bg-red-50) | Validation errors |

---

## Database Tables Used

### Read
- `transfer_orders` - TO details and status
- `transfer_order_lines` - Item details and status
- `sku_attributes` - SKU lookup by barcode

### Write
- `transfer_order_lines` - Update status to "completed"
- `pallet_labels` - Create label records
- `audit_log` - Track operator actions

---

## Testing Workflow

### Setup Test Data

You already have sample data loaded. To test:

1. **Set an item to "requested" status:**
   ```sql
   -- In Supabase SQL Editor
   UPDATE transfer_order_lines
   SET preprocessing_status = 'requested'
   WHERE sku = 'SKU-25' AND transfer_number = '#T0312';
   ```

2. **Test the flow:**
   - Open http://localhost:3000/operator on mobile/tablet
   - Scan (or type) TO: `T0312` or `#T0312`
   - Scan (or type) barcode: `123456804` (SKU-25's barcode)
   - Confirm action → should show "TO SHELVES" in RED
   - Click Confirm
   - Back to scan item → try printing labels

---

## Future Enhancements

### Role-Based Access (TODO)
- Add `role` column to users table
- Middleware to restrict operator access to `/operator` only
- Admin can access all pages

### Actual Printing
- Browser print dialog integration
- PDF generation for labels
- Print server integration

### Offline Support
- Service worker for offline operation
- Sync when back online

### Enhanced Scanning
- Multiple items in quick succession
- Batch confirmation

---

## Mobile Device Requirements

**Supported:**
- iOS devices (iPhone, iPad) with Bluetooth scanner
- Android tablets with Bluetooth scanner
- Ruggedized warehouse devices

**Scanner Types:**
- Bluetooth barcode scanners (keyboard emulation mode)
- USB-connected scanners (keyboard wedge mode)

**Browser:**
- Chrome, Safari, Edge (latest versions)
- JavaScript enabled

---

## Troubleshooting

### Scanner Not Working
1. Check scanner is in keyboard emulation mode
2. Verify cursor is in input field
3. Test by typing barcode manually

### Item Not Found
1. Verify barcode matches SKU in `sku_attributes` table
2. Check item belongs to scanned TO
3. Ensure TO has been scanned first

### Can't Print Labels
1. Verify items are marked "completed"
2. Check `pallet_labels` table for created records
3. Browser popup blockers may prevent print dialog

---

## Summary

The Operator UI provides a streamlined, mobile-optimized workflow for warehouse operators to:
1. Scan Transfer Orders
2. Scan Items
3. See clear visual instructions (TO SHELVES or TO PICK FACE)
4. Confirm actions
5. Print pallet labels

All with large touch targets, minimal text, and scanner-friendly inputs.

