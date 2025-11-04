import { supabase } from './supabase';
import type { TransferOrder, TransferOrderLine, PreprocessingStatus } from '@/types/database';

// =====================================================
// Operator Actions
// =====================================================

export interface ScanTOResult {
  success: boolean;
  error?: string;
  transferOrder?: TransferOrder;
  warning?: string;
}

export interface ScanItemResult {
  success: boolean;
  error?: string;
  item?: TransferOrderLine & { sku_data: any };
}

/**
 * Validate and retrieve Transfer Order by scanning barcode
 */
export async function scanTransferOrder(toNumber: string): Promise<ScanTOResult> {
  // Clean up the input (remove # if present)
  const cleanTO = toNumber.trim().toUpperCase();
  const searchTO = cleanTO.startsWith('#') ? cleanTO : `#${cleanTO}`;

  // Get the TO
  const { data: to, error } = await supabase
    .from('transfer_orders')
    .select('*')
    .eq('transfer_number', searchTO)
    .single();

  if (error || !to) {
    return {
      success: false,
      error: 'Transfer Order not found. Please scan again.',
    };
  }

  // Check if TO has any items in "requested" status
  const { data: requestedItems } = await supabase
    .from('transfer_order_lines')
    .select('id')
    .eq('transfer_order_id', to.id)
    .eq('preprocessing_status', 'requested');

  if (!requestedItems || requestedItems.length === 0) {
    return {
      success: false,
      error: 'No pre-processing requested for this TO. Please scan another TO.',
    };
  }

  // Check for warnings
  let warning: string | undefined;
  if (to.preprocessing_status === 'in-progress') {
    warning = 'Warning: This TO is currently being processed by another operator.';
  } else if (to.preprocessing_status === 'completed') {
    warning = 'Warning: This TO has already been completed.';
  }

  return {
    success: true,
    transferOrder: to,
    warning,
  };
}

/**
 * Validate and retrieve item by scanning barcode for a specific TO
 */
export async function scanItem(
  toId: string,
  barcode: string
): Promise<ScanItemResult> {
  const cleanBarcode = barcode.trim();

  // Find SKU by barcode
  const { data: sku } = await supabase
    .from('sku_attributes')
    .select('sku')
    .eq('barcode', cleanBarcode)
    .single();

  if (!sku) {
    return {
      success: false,
      error: 'Item barcode not recognized. Please scan again.',
    };
  }

  // Check if this SKU belongs to the TO
  const { data: item, error } = await supabase
    .from('transfer_order_lines')
    .select('*, sku_data:sku_attributes(*)')
    .eq('transfer_order_id', toId)
    .eq('sku', sku.sku)
    .single();

  if (error || !item) {
    return {
      success: false,
      error: 'This item is not part of the scanned Transfer Order.',
    };
  }

  return {
    success: true,
    item: item as any,
  };
}

/**
 * Complete preprocessing for an item
 */
export async function completeItemPreprocessing(
  itemId: string,
  userId: string | null
): Promise<void> {
  // Update item status to completed
  const { error } = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'completed',
      requested_at: new Date().toISOString(),
      requested_by: userId,
    })
    .eq('id', itemId);

  if (error) {
    console.error('Error completing item preprocessing:', error);
    throw error;
  }

  // Audit log
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'complete_preprocessing',
      entity_type: 'transfer_order_lines',
      entity_id: itemId,
    });
  }

  // Note: TO status will be updated automatically by the database trigger
}

/**
 * Get all items for a TO that need pre-processing
 */
export async function getPreprocessingItems(toId: string) {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select('*, sku_data:sku_attributes(*)')
    .eq('transfer_order_id', toId)
    .eq('preprocessing_status', 'requested');

  if (error) {
    console.error('Error fetching preprocessing items:', error);
    return [];
  }

  return data || [];
}

/**
 * Get completed preprocessing items for a TO
 */
export async function getCompletedItems(toId: string) {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select('*, sku_data:sku_attributes(*)')
    .eq('transfer_order_id', toId)
    .eq('preprocessing_status', 'completed');

  if (error) {
    console.error('Error fetching completed items:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if all requested items are completed
 */
export async function checkAllItemsCompleted(toId: string): Promise<boolean> {
  const { data: requestedItems } = await supabase
    .from('transfer_order_lines')
    .select('id')
    .eq('transfer_order_id', toId)
    .eq('preprocessing_status', 'requested');

  return !requestedItems || requestedItems.length === 0;
}

/**
 * Create pallet label records
 */
export async function createPalletLabels(
  toId: string,
  labelCount: number,
  userId: string | null
): Promise<void> {
  const labels = [];
  for (let i = 1; i <= labelCount; i++) {
    labels.push({
      transfer_order_id: toId,
      label_number: i,
      total_labels: labelCount,
      generated_by: userId || null,
      generated_at: new Date().toISOString(),
    });
  }

  const { error } = await supabase.from('pallet_labels').insert(labels);

  if (error) {
    console.error('Error creating pallet labels:', error);
    throw error;
  }

  // Audit log
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'generate_label',
      entity_type: 'pallet_labels',
      details: { transfer_order_id: toId, count: labelCount },
    });
  }
}

/**
 * Get pallet labels for a TO
 */
export async function getPalletLabels(toId: string) {
  const { data, error } = await supabase
    .from('pallet_labels')
    .select('*')
    .eq('transfer_order_id', toId)
    .order('label_number');

  if (error) {
    console.error('Error fetching pallet labels:', error);
    return [];
  }

  return data || [];
}

