import { supabase } from './supabase';
import type { TransferOrder, TransferOrderLine, SkuAttribute } from '@/types/database';

export interface TOWithItems extends TransferOrder {
  items: (TransferOrderLine & { sku_data: SkuAttribute })[];
}

// Get TO by transfer number
export async function getTransferOrderByNumber(
  transferNumber: string
): Promise<TOWithItems | null> {
  const { data: to, error } = await supabase
    .from('transfer_orders')
    .select('*')
    .eq('transfer_number', transferNumber)
    .single();

  if (error || !to) {
    return null;
  }

  // Get items with SKU data
  const { data: items } = await supabase
    .from('transfer_order_lines')
    .select(`
      *,
      sku_data:sku_attributes(*)
    `)
    .eq('transfer_order_id', to.id);

  return {
    ...to,
    items: items || [],
  };
}

// Get item by barcode for a specific TO
export async function getItemByBarcode(
  toId: string,
  barcode: string
): Promise<(TransferOrderLine & { sku_data: SkuAttribute }) | null> {
  // First find SKU by barcode
  const { data: sku } = await supabase
    .from('sku_attributes')
    .select('sku')
    .eq('barcode', barcode)
    .single();

  if (!sku) {
    return null;
  }

  // Then find the item in the TO
  const { data: item } = await supabase
    .from('transfer_order_lines')
    .select(`
      *,
      sku_data:sku_attributes(*)
    `)
    .eq('transfer_order_id', toId)
    .eq('sku', sku.sku)
    .single();

  return item || null;
}

// Complete preprocessing for an item
export async function completeItemPreprocessing(
  itemId: string,
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    console.error('Error completing preprocessing:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'complete_preprocessing',
      entity_type: 'transfer_order_lines',
      entity_id: itemId,
    });
  }
}

// Mark TO as in-progress (when operator starts working on it)
export async function markTOInProgress(
  toId: string,
  userId: string | null
): Promise<void> {
  // The trigger will auto-update TO status based on items
  // But we can manually set it if needed
  const { error } = await supabase
    .from('transfer_orders')
    .update({
      preprocessing_status: 'in-progress',
      updated_at: new Date().toISOString(),
    })
    .eq('id', toId);

  if (error) {
    console.error('Error marking TO in progress:', error);
    throw error;
  }

  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'start_preprocessing',
      entity_type: 'transfer_orders',
      entity_id: toId,
    });
  }
}

// Get count of items needing preprocessing in a TO
export function getPreprocessingCounts(items: TransferOrderLine[]) {
  const requested = items.filter(item => item.preprocessing_status === 'requested').length;
  const completed = items.filter(item => item.preprocessing_status === 'completed').length;
  const total = items.filter(
    item => item.preprocessing_status === 'requested' || item.preprocessing_status === 'completed'
  ).length;

  return { requested, completed, total };
}

// Check if TO preprocessing is complete
export function isTOPreprocessingComplete(items: TransferOrderLine[]): boolean {
  const { requested, total } = getPreprocessingCounts(items);
  return total > 0 && requested === 0; // All requested items are now completed
}

// Log pallet label print
export async function logPalletLabelPrint(
  toId: string,
  labelCount: number,
  userId: string | null
): Promise<void> {
  // Create pallet label records
  for (let i = 1; i <= labelCount; i++) {
    await supabase.from('pallet_labels').insert({
      transfer_order_id: toId,
      label_number: i,
      total_labels: labelCount,
      generated_by: userId || undefined,
    });
  }

  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'generate_label',
      entity_type: 'pallet_labels',
      details: { transfer_order_id: toId, count: labelCount },
    });
  }
}

