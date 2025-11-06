// Database types for Supabase tables

export type PreprocessingStatus =
  | 'not needed'
  | 'requested'
  | 'in-progress'
  | 'completed';

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

export interface EligibleMerchant {
  id: string;
  merchant_name: string;
  created_at: string;
  created_by: string | null;
}

export interface TransferOrder {
  id: string;
  transfer_number: string;
  merchant: string;
  transfer_status: string | null;
  estimated_arrival: string | null;
  receipt_time: string | null;
  destination: string | null;
  preprocessing_status: PreprocessingStatus;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface SkuAttribute {
  id: string;
  sku: string;
  description: string | null;
  barcode: string | null;
  daily_units_sold: number | null;
  units_pickface: number | null;
  units_reserve: number | null;
  days_of_stock_pickface: number | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface TransferOrderLine {
  id: string;
  transfer_order_id: string;
  transfer_number: string;
  sku: string;
  units_incoming: number | null;
  units_received: number | null;
  preprocessing_status: PreprocessingStatus;
  requested_at: string | null;
  requested_by: string | null;
  auto_requested: boolean;
  manually_cancelled: boolean;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface PalletLabel {
  id: string;
  transfer_order_id: string;
  label_number: number;
  total_labels: number;
  generated_at: string;
  generated_by: string;
  printed_at: string | null;
  has_items: boolean;
}

export interface PalletAssignment {
  id: string;
  transfer_order_id: string;
  transfer_order_line_id: string;
  pallet_number: number;
  sku: string;
  quantity: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

// Combined types for views
export interface TransferOrderWithItems extends TransferOrder {
  items: TransferOrderLineWithSku[];
}

export interface TransferOrderLineWithSku extends TransferOrderLine {
  sku_data: SkuAttribute;
}

// User roles
export type UserRole = 'admin' | 'operator';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

// Google Sheets data types
export interface GoogleSheetTransferOrder {
  Transfer: string;
  Merchant: string;
  Status: string;
  'Estimated Arrival': string;
  'Receipt Time': string;
  Destination: string;
}

export interface GoogleSheetTransferOrderLine {
  Transfer: string;
  SKU: string;
  'Units Incoming': number;
  'Units Received': number;
}

export interface GoogleSheetSkuAttribute {
  SKU: string;
  Description: string;
  Barcode: string;
  'Daily Units Sold': number;
  'Units on Hand - Pick Face': number;
  'Units on Hand - Reserve': number;
}

