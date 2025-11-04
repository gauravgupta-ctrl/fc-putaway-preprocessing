import { supabase } from './supabase';
import type { TransferOrder, TransferOrderLine, SkuAttribute } from '@/types/database';

// =====================================================
// Operator Functions
// =====================================================

export async function findTransferOrderByNumber(
  transferNumber: string
): Promise<TransferOrder | null> {
  const { data, error } = await supabase
    .from('transfer_orders')
    .select('*')
    .eq('transfer_number', transferNumber)
    .single();

  if (error) {
    console.error('Error finding transfer order:', error);
    return null;
  }

  return data;
}

export async function findItemByBarcode(
  barcode: string,
  transferOrderId: string
): Promise<{ line: TransferOrderLine; sku: SkuAttribute } | null> {
  // First find the SKU by barcode
  const { data: skuData, error: skuError } = await supabase
    .from('sku_attributes')
    .select('*')
    .eq('barcode', barcode)
    .single();

  if (skuError || !skuData) {
    console.error('Error finding SKU:', skuError);
    return null;
  }

  // Then find the transfer order line
  const { data: lineData, error: lineError } = await supabase
    .from('transfer_order_lines')
    .select('*')
    .eq('transfer_order_id', transferOrderId)
    .eq('sku', skuData.sku)
    .single();

  if (lineError || !lineData) {
    console.error('Error finding transfer order line:', lineError);
    return null;
  }

  return { line: lineData, sku: skuData };
}

export async function completeItemProcessing(
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
    console.error('Error completing item:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'complete_preprocessing',
      entity_type: 'transfer_order_lines',
      entity_id: lineId,
    });
  }
}

export async function getTransferOrderItems(
  transferOrderId: string
): Promise<Array<TransferOrderLine & { sku_data: SkuAttribute }>> {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select(
      `
      *,
      sku_data:sku_attributes(*)
    `
    )
    .eq('transfer_order_id', transferOrderId);

  if (error) {
    console.error('Error getting TO items:', error);
    return [];
  }

  return data as Array<TransferOrderLine & { sku_data: SkuAttribute }>;
}

export async function getCompletedItemsCount(transferOrderId: string): Promise<number> {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select('id', { count: 'exact' })
    .eq('transfer_order_id', transferOrderId)
    .eq('preprocessing_status', 'completed');

  if (error) {
    console.error('Error getting completed count:', error);
    return 0;
  }

  return data?.length || 0;
}

export async function getRequestedItemsCount(transferOrderId: string): Promise<number> {
  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select('id', { count: 'exact' })
    .eq('transfer_order_id', transferOrderId)
    .eq('preprocessing_status', 'requested');

  if (error) {
    console.error('Error getting requested count:', error);
    return 0;
  }

  return data?.length || 0;
}

export async function createPalletLabel(
  transferOrderId: string,
  labelNumber: number,
  totalLabels: number,
  userId: string | null
): Promise<void> {
  if (!userId) {
    throw new Error('User ID required for label generation');
  }

  const { error } = await supabase.from('pallet_labels').insert({
    transfer_order_id: transferOrderId,
    label_number: labelNumber,
    total_labels: totalLabels,
    generated_by: userId,
  });

  if (error) {
    console.error('Error creating pallet label:', error);
    throw error;
  }

  // Log audit trail
  await supabase.from('audit_log').insert({
    user_id: userId,
    action: 'generate_label',
    entity_type: 'pallet_labels',
    details: { transfer_order_id: transferOrderId, label_number: labelNumber, total_labels: totalLabels },
  });
}

