# Operator UI Setup Guide

## Overview

The Operator UI is now built! It's a mobile-optimized interface for warehouse operators to process pre-processing requests.

---

## Setup Steps

### 1. Run the Role Migration

In **Supabase Dashboard** → SQL Editor → New Query:

```sql
-- Add roles to users via metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@test.com';
```

This gives your test user admin access (which includes operator access).

---

### 2. (Optional) Create an Operator-Only User

If you want to test operator-only access:

1. **In Supabase Dashboard** → Authentication → Users → Add User:
   - Email: `operator@test.com`
   - Password: `test123456`
   - Auto Confirm: ✅

2. **Run this SQL:**
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "operator"}'::jsonb
WHERE email = 'operator@test.com';
```

---

## How to Use

### Access the Operator UI

**URL:** http://localhost:3000/operator

**Login:** Use `admin@test.com` (has both admin and operator access)

---

## Operator Workflow

### Page 1: Scan Transfer Order
- Large, mobile-optimized interface
- Scan TO barcode (e.g., "T0312" or "#T0312")
- External scanner auto-submits on Enter
- Camera mode available as fallback

**Validations:**
- ❌ TO not found → Error
- ❌ Status "not required" / "completed" / "in review" → Error  
- ✅ Status "requested" / "in-progress" → Proceed

---

### Page 2: Scan Items
- Shows TO number and progress
- Scan item barcode (from `sku_attributes.barcode`)
- Displays action in large colored box:
  - **"TO SHELF"** (RED) - Item needs shelf storage
  - **"TO PICK FACE"** (GREEN) - Item goes to ASRS
- Confirm button updates status to "completed"
- Print Labels button (if items completed)
- Abort button to exit

**Features:**
- Auto-tracks progress (X/Y items completed)
- Warns if item already processed
- Shows completion screen when all done

---

### Page 3: Print Labels
- Select number of labels (default 1)
- Shows label format preview
- "Print" logs labels to console
- Returns to scan new TO

**Label Format:**
```
PRE-PROCESSED
TO: #T0312
Date/Time
Label 1/3
```

---

## Testing the Operator UI

### Test Data Available:

**Transfer Orders to try:**
- `#T0312` - Has 1 item in "in review" status (SKU-25)
- `#T0311` - Has 2 items in "in review" status (SKU-31, SKU-35)

**Items to scan:**
- Barcode: `123456804` → SKU-25 (145 days stock → TO SHELF)
- Barcode: `123456810` → SKU-31 (82 days stock → TO SHELF)
- Barcode: `123456814` → SKU-35 (145 days stock → TO SHELF)

### Testing Steps:

1. **Request items in Admin UI first:**
   - Go to `/admin/dashboard`
   - Select TO #T0312
   - Click "Request" on SKU-25
   - This changes status from "in review" to "requested"

2. **Use Operator UI:**
   - Go to `/operator`
   - Scan TO: Type "T0312" and press Enter
   - Scan Item: Type "123456804" and press Enter
   - See "TO SHELF" in RED
   - Click "Confirm"
   - Item status → "completed"
   - Click "Print Labels"
   - Select number of labels
   - Click Print (check console)
   - Click "Scan New Transfer Order"

---

## Mobile Optimization

**Features:**
- Large touch targets (h-14, h-16)
- Minimal scrolling
- Clear visual hierarchy
- High contrast colors
- Simple, focused UI
- Auto-submit for scanners

**Works on:**
- Mobile phones
- Tablets
- Desktop (for testing)

---

## Role-Based Access

| Role | Admin Pages | Operator Pages |
|------|-------------|----------------|
| **admin** | ✅ Full access | ✅ Full access |
| **operator** | ❌ Denied | ✅ Full access |
| **none** | ❌ Redirect to login | ❌ Redirect to login |

**Routes:**
- `/admin/*` - Admin only
- `/operator/*` - Operator or Admin
- `/` - Public

---

## Status Flow

### TO Item Status:
```
in review → (admin requests) → requested → (operator confirms) → completed
```

### TO Status (Auto-calculated):
```
in review → requested → in-progress → completed
```

**Triggers:**
- Database trigger updates TO status when items change
- Real-time updates across pages

---

## Barcode Scanning

### External Scanner (Default):
- USB/Bluetooth barcode scanner
- Acts as keyboard input
- Auto-submits on Enter key
- Recommended for production

### Camera Mode:
- Fallback option
- Manual entry currently
- Future: Camera QR/barcode scanning

**How to test without scanner:**
- Use keyboard to type barcode
- Press Enter to submit
- Works same as scanner

---

## Label Printing

**Current Implementation:**
- Logs to browser console
- Creates database records
- Shows label format

**Production Implementation (Future):**
- Connect to label printer API
- Generate PDF labels
- Direct print via browser print dialog

**Check Console:**
Press F12 → Console tab to see label output

---

## Troubleshooting

### "Transfer Order not found"
- Check TO number format (#T0312)
- Verify TO exists in database
- Try with/without # prefix

### "Does not require pre-processing"
- TO status is "not required"
- No items in TO need pre-processing
- Request items in Admin UI first

### "Item not found in TO"
- Barcode doesn't match any item in TO
- Check barcode number
- Verify item exists in TO

### Access Denied
- User not logged in
- User doesn't have operator/admin role
- Run role migration SQL

---

## Next Steps

1. ✅ Run role migration SQL
2. ✅ Test with admin@test.com
3. ✅ Request items in Admin UI
4. ✅ Process items in Operator UI
5. ✅ Check console for label output

**The Operator UI is complete and ready to test!** 🎉

