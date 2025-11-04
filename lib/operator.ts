import { supabase } from './supabase';
import type { TransferOrder, TransferOrderLine, SkuAttribute, PreprocessingStatus } from '@/types/database';

// Find TO by transfer number (supports both "#T0303" and "T0303")
export async function findTransferOrderByNumber(transferNumber: string) {
  // Normalize: ensure it has # prefix
  const normalized = transferNumber.startsWith('#') ? transferNumber : `#${transferNumber}`;
  
  const { data, error } = await supabase
    .from('transfer_orders')
    .select('*')
    .eq('transfer_number', normalized)
    .single();

  if (error) {
    console.error('Error finding TO:', error);
    return null;
  }

  return data as TransferOrder;
}

// Find item by barcode
export async function findItemByBarcode(barcode: string, transferOrderId: string) {
  // First, find SKU by barcode
  const { data: skuData, error: skuError } = await supabase
    .from('sku_attributes')
    .select('sku')
    .eq('barcode', barcode)
    .single();

  if (skuError || !skuData) {
    console.error('SKU not found for barcode:', barcode);
    return null;
  }

  // Then find the transfer order line
  const { data: lineData, error: lineError } = await supabase
    .from('transfer_order_lines')
    .select(`
      *,
      sku_data:sku_attributes(*)
    `)
    .eq('transfer_order_id', transferOrderId)
    .eq('sku', skuData.sku)
    .single();

  if (lineError || !lineData) {
    console.error('Item not found in TO:', lineError);
    return null;
  }

  return lineData;
}

// Update item status after operator confirms action
export async function confirmItemAction(
  lineId: string,
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', lineId);

  if (error) {
    console.error('Error updating item status:', error);
    throw error;
  }

  // Log audit trail
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'complete_preprocessing',
      entity_type: 'transfer_order_lines',
      entity_id: lineId,
    });
  }
}

// Start processing an item (set to in-progress)
export async function startItemProcessing(
  lineId: string,
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'in-progress',
      updated_at: new Date().toISOString(),
    })
    .eq('id', lineId);

  if (error) {
    console.error('Error starting item processing:', error);
    throw error;
  }

  // Log audit trail
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'start_preprocessing',
      entity_type: 'transfer_order_lines',
      entity_id: lineId,
    });
  }
}

// Get all items for a TO that need pre-processing
export async function getPreprocessingItems(transferOrderId: string) {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select(`
      *,
      sku_data:sku_attributes(*)
    `)
    .eq('transfer_order_id', transferOrderId)
    .in('preprocessing_status', ['requested', 'in-progress', 'completed']);

  if (error) {
    console.error('Error fetching preprocessing items:', error);
    return [];
  }

  return data;
}

// Check if all requested items are completed
export async function areAllItemsCompleted(transferOrderId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select('preprocessing_status')
    .eq('transfer_order_id', transferOrderId)
    .eq('preprocessing_status', 'requested');

  if (error) {
    console.error('Error checking completion:', error);
    return false;
  }

  // If no items are still in "requested" status, all are done
  return !data || data.length === 0;
}

// Get completed items for a TO (for label printing)
export async function getCompletedItems(transferOrderId: string) {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select(`
      *,
      sku_data:sku_attributes(*)
    `)
    .eq('transfer_order_id', transferOrderId)
    .eq('preprocessing_status', 'completed');

  if (error) {
    console.error('Error fetching completed items:', error);
    return [];
  }

  return data;
}

// Log label print action
export async function logLabelPrint(
  transferOrderId: string,
  labelCount: number,
  userId: string | null
): Promise<void> {
  // Insert pallet labels
  const labels = Array.from({ length: labelCount }, (_, i) => ({
    transfer_order_id: transferOrderId,
    label_number: i + 1,
    total_labels: labelCount,
    generated_by: userId,
  }));

  const { error } = await supabase.from('pallet_labels').insert(labels);

  if (error) {
    console.error('Error logging labels:', error);
    throw error;
  }

  // Log audit trail
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'generate_label',
      entity_type: 'transfer_orders',
      entity_id: transferOrderId,
      details: { label_count: labelCount },
    });
  }
}

