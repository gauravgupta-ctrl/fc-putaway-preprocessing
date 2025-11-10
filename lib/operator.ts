import { supabase } from './supabase';
import type { TransferOrder, TransferOrderLine, SkuAttribute, PreprocessingStatus } from '@/types/database';

// Find TO by transfer number (supports both "#T0303" and "T0303")
export async function findTransferOrderByNumber(transferNumber: string) {
  // Remove # prefix if present for consistent lookup
  const normalized = transferNumber.startsWith('#') ? transferNumber.substring(1) : transferNumber;
  
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
  console.log('Looking up barcode:', barcode, 'for TO:', transferOrderId);
  
  // First, find SKU by barcode
  const { data: skuData, error: skuError } = await supabase
    .from('sku_attributes')
    .select('sku')
    .eq('barcode', barcode);

  console.log('SKU lookup result:', skuData, 'error:', skuError);

  if (skuError || !skuData || (Array.isArray(skuData) && skuData.length === 0)) {
    console.error('SKU not found for barcode:', barcode, 'error:', skuError);
    return null;
  }

  // If multiple SKUs have the same barcode, use the first one
  const sku = Array.isArray(skuData) ? skuData[0]?.sku : (skuData as any).sku;
  console.log('Using SKU:', sku);

  // Then find the transfer order line
  const { data: lineData, error: lineError } = await supabase
    .from('transfer_order_lines')
    .select(`
      *,
      sku_data:sku_attributes(*)
    `)
    .eq('transfer_order_id', transferOrderId)
    .eq('sku', sku);

  console.log('Line lookup result:', lineData, 'error:', lineError);

  if (lineError || !lineData || (Array.isArray(lineData) && lineData.length === 0)) {
    console.error('Item not found in TO:', lineError);
    return null;
  }

  // Return the first match if multiple lines exist
  return Array.isArray(lineData) ? lineData[0] : lineData;
}

// These functions are no longer used with the carton-by-carton flow
// Status is now updated in real-time based on quantity additions

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

// Function removed - no longer needed with carton-by-carton flow
// Completion is now determined by the Complete TO button

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

