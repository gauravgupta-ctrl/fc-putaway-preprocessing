import { supabase } from './supabase';
import type { TransferOrder, TransferOrderLine } from '@/types/database';

// Find TO by barcode (supports both #T0303 and T0303 formats)
export async function findTransferOrderByBarcode(barcode: string): Promise<TransferOrder | null> {
  // Normalize barcode - try both with and without #
  const normalized = barcode.startsWith('#') ? barcode : `#${barcode}`;
  const withoutHash = barcode.replace('#', '');

  const { data, error } = await supabase
    .from('transfer_orders')
    .select('*')
    .or(`transfer_number.eq.${normalized},transfer_number.eq.${withoutHash}`)
    .single();

  if (error) {
    console.error('Error finding TO:', error);
    return null;
  }

  return data;
}

// Find item by barcode in a specific TO
export async function findItemByBarcode(
  transferOrderId: string,
  itemBarcode: string
): Promise<TransferOrderLine & { sku_data: any } | null> {
  // First, get the SKU from barcode
  const { data: skuData } = await supabase
    .from('sku_attributes')
    .select('sku')
    .eq('barcode', itemBarcode)
    .single();

  if (!skuData) return null;

  // Then find the item in the TO
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select('*, sku_data:sku_attributes(*)')
    .eq('transfer_order_id', transferOrderId)
    .eq('sku', skuData.sku)
    .single();

  if (error) {
    console.error('Error finding item:', error);
    return null;
  }

  return data as any;
}

// Get all items for a TO that need pre-processing
export async function getPreprocessingItems(transferOrderId: string) {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select('*, sku_data:sku_attributes(*)')
    .eq('transfer_order_id', transferOrderId)
    .in('preprocessing_status', ['requested', 'in-progress', 'completed']);

  if (error) {
    console.error('Error fetching preprocessing items:', error);
    return [];
  }

  return data || [];
}

// Mark item as in-progress
export async function startProcessingItem(itemId: string, userId: string | null) {
  const { error } = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'in-progress',
    })
    .eq('id', itemId);

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
      entity_id: itemId,
    });
  }
}

// Mark item as completed
export async function completeProcessingItem(itemId: string, userId: string | null) {
  const { error } = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'completed',
    })
    .eq('id', itemId);

  if (error) {
    console.error('Error completing item processing:', error);
    throw error;
  }

  // Log audit trail
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'complete_preprocessing',
      entity_type: 'transfer_order_lines',
      entity_id: itemId,
    });
  }
}

// Generate pallet labels
export async function generatePalletLabels(
  transferOrderId: string,
  quantity: number,
  userId: string
) {
  const labels = [];

  for (let i = 1; i <= quantity; i++) {
    labels.push({
      transfer_order_id: transferOrderId,
      label_number: i,
      total_labels: quantity,
      generated_by: userId,
    });
  }

  const { data, error } = await supabase.from('pallet_labels').insert(labels).select();

  if (error) {
    console.error('Error generating labels:', error);
    throw error;
  }

  // Log audit trail
  await supabase.from('audit_log').insert({
    user_id: userId,
    action: 'generate_label',
    entity_type: 'pallet_labels',
    details: { transfer_order_id: transferOrderId, quantity },
  });

  return data;
}

