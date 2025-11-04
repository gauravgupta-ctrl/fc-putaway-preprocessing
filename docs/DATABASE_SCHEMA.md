# Database Schema

This document outlines the Supabase database schema for the Putaway Preprocess application.

## Tables

### 1. `settings`
Global application settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `key` | text | UNIQUE, NOT NULL | Setting key (e.g., 'dos_threshold') |
| `value` | text | NOT NULL | Setting value |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |
| `updated_by` | uuid | FOREIGN KEY → auth.users | User who updated |

**Indexes:**
- `settings_key_idx` ON `key`

---

### 2. `eligible_merchants`
Merchants that can be subject to pre-processing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `merchant_name` | text | UNIQUE, NOT NULL | Merchant name (exact match with Google Sheets) |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `created_by` | uuid | FOREIGN KEY → auth.users | User who added |

**Indexes:**
- `eligible_merchants_name_idx` ON `merchant_name`

---

### 3. `transfer_orders`
Transfer order header data (synced from Google Sheets).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `transfer_number` | text | UNIQUE, NOT NULL | TO number (e.g., #T0303) |
| `merchant` | text | NOT NULL | Merchant name |
| `transfer_status` | text | | Transfer status from Google Sheets |
| `estimated_arrival` | date | | Estimated arrival date |
| `receipt_time` | timestamptz | | Actual receipt timestamp |
| `destination` | text | | Destination location |
| `preprocessing_status` | text | NOT NULL, DEFAULT 'not required' | Calculated pre-processing status |
| `synced_at` | timestamptz | DEFAULT now() | Last sync from Google Sheets |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Enums for `preprocessing_status`:**
- `not required`
- `in review`
- `requested`
- `in-progress`
- `completed`

**Indexes:**
- `transfer_orders_number_idx` ON `transfer_number`
- `transfer_orders_merchant_idx` ON `merchant`
- `transfer_orders_preprocessing_status_idx` ON `preprocessing_status`

---

### 4. `sku_attributes`
SKU master data (synced from Google Sheets).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `sku` | text | UNIQUE, NOT NULL | SKU code |
| `description` | text | | SKU description |
| `barcode` | text | | Barcode |
| `daily_units_sold` | numeric | | Average daily sales |
| `units_pickface` | numeric | | Units in pick face (ASRS) |
| `units_reserve` | numeric | | Units in reserve |
| `days_of_stock_pickface` | numeric | GENERATED | Calculated: units_pickface / daily_units_sold |
| `synced_at` | timestamptz | DEFAULT now() | Last sync timestamp |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `sku_attributes_sku_idx` ON `sku`
- `sku_attributes_barcode_idx` ON `barcode`

---

### 5. `transfer_order_lines`
Transfer order line items (synced from Google Sheets).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `transfer_order_id` | uuid | NOT NULL, FOREIGN KEY → transfer_orders | TO reference |
| `transfer_number` | text | NOT NULL | TO number (for sync) |
| `sku` | text | NOT NULL, FOREIGN KEY → sku_attributes | SKU code |
| `units_incoming` | numeric | | Expected quantity |
| `units_received` | numeric | | Received quantity |
| `preprocessing_status` | text | NOT NULL, DEFAULT 'not required' | Item pre-processing status |
| `requested_at` | timestamptz | | When admin requested pre-processing |
| `requested_by` | uuid | FOREIGN KEY → auth.users | Admin who requested |
| `synced_at` | timestamptz | DEFAULT now() | Last sync timestamp |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Enums for `preprocessing_status`:**
- `not required`
- `in review`
- `requested`
- `in-progress`
- `completed`

**Indexes:**
- `transfer_order_lines_to_idx` ON `transfer_order_id`
- `transfer_order_lines_sku_idx` ON `sku`
- `transfer_order_lines_status_idx` ON `preprocessing_status`

**Unique constraint:**
- `transfer_order_lines_to_sku_unique` ON (`transfer_order_id`, `sku`)

---

### 6. `pallet_labels`
Generated pallet labels for pre-processed items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `transfer_order_id` | uuid | NOT NULL, FOREIGN KEY → transfer_orders | TO reference |
| `label_number` | integer | NOT NULL | Label number (1, 2, 3...) |
| `total_labels` | integer | NOT NULL | Total labels for this TO |
| `generated_at` | timestamptz | DEFAULT now() | Generation timestamp |
| `generated_by` | uuid | NOT NULL, FOREIGN KEY → auth.users | Operator who generated |
| `printed_at` | timestamptz | | Print timestamp |

**Indexes:**
- `pallet_labels_to_idx` ON `transfer_order_id`

**Unique constraint:**
- `pallet_labels_to_number_unique` ON (`transfer_order_id`, `label_number`)

---

### 7. `audit_log`
Audit trail of all user actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | uuid | NOT NULL, FOREIGN KEY → auth.users | User who performed action |
| `action` | text | NOT NULL | Action type |
| `entity_type` | text | NOT NULL | Entity affected (TO, item, setting) |
| `entity_id` | uuid | | Entity ID |
| `details` | jsonb | | Additional details |
| `created_at` | timestamptz | DEFAULT now() | Action timestamp |

**Indexes:**
- `audit_log_user_idx` ON `user_id`
- `audit_log_entity_idx` ON (`entity_type`, `entity_id`)
- `audit_log_created_idx` ON `created_at`

**Action types:**
- `sync_data`
- `update_threshold`
- `add_merchant`
- `remove_merchant`
- `request_preprocessing`
- `cancel_preprocessing`
- `start_preprocessing`
- `complete_preprocessing`
- `generate_label`

---

## Relationships

```
transfer_orders (1) ──< (N) transfer_order_lines
sku_attributes (1) ──< (N) transfer_order_lines
transfer_orders (1) ──< (N) pallet_labels
auth.users (1) ──< (N) audit_log
auth.users (1) ──< (N) eligible_merchants
auth.users (1) ──< (N) settings
```

---

## Row Level Security (RLS)

All tables will have RLS enabled with policies based on user roles:
- **Admin**: Full access
- **Operator**: Read-only on TOs/items, write on pallet labels
- **Public**: No access

---

## Triggers

### 1. `update_updated_at`
Auto-update `updated_at` timestamp on row modification.

Applied to:
- `settings`
- `transfer_orders`
- `sku_attributes`
- `transfer_order_lines`

### 2. `calculate_to_preprocessing_status`
Auto-calculate TO-level preprocessing status based on item statuses.

Trigger on `transfer_order_lines` after INSERT/UPDATE.

### 3. `log_audit_trail`
Auto-log changes to audit_log.

Applied to sensitive operations.

---

## Functions

### 1. `calculate_days_of_stock(sku_code text) → numeric`
Calculate days of stock for a SKU.

### 2. `sync_from_google_sheets()`
Sync data from Google Sheets (called via API).

### 3. `get_eligible_items_for_preprocessing(threshold numeric)`
Get items that meet pre-processing criteria.

### 4. `update_to_status(transfer_order_id uuid)`
Update TO status based on item statuses.

---

## Notes

- All timestamps use `timestamptz` (timezone-aware)
- All foreign keys use `uuid` references
- Soft deletes not implemented (hard delete only)
- Google Sheets sync is one-way (read-only)

