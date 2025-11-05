import { supabase } from './supabase';
import type { EligibleMerchant, Setting } from '@/types/database';

// =====================================================
// Settings
// =====================================================

export async function getThreshold(): Promise<number> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'dos_threshold')
    .single();

  if (error) {
    console.error('Error fetching threshold:', error);
    return 30; // Default
  }

  return parseFloat(data.value);
}

export async function updateThreshold(
  value: number,
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({
      value: value.toString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('key', 'dos_threshold');

  if (error) {
    console.error('Error updating threshold:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'update_threshold',
      entity_type: 'settings',
      details: { old_value: null, new_value: value },
    });
  }
}

// =====================================================
// Eligible Merchants
// =====================================================

export async function getEligibleMerchants(): Promise<EligibleMerchant[]> {
  const { data, error } = await supabase
    .from('eligible_merchants')
    .select('*')
    .order('merchant_name');

  if (error) {
    console.error('Error fetching eligible merchants:', error);
    return [];
  }

  return data || [];
}

export async function addEligibleMerchant(
  merchantName: string,
  userId: string | null
): Promise<void> {
  const { error } = await supabase.from('eligible_merchants').insert({
    merchant_name: merchantName,
    created_by: userId,
  });

  if (error) {
    console.error('Error adding eligible merchant:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'add_merchant',
      entity_type: 'eligible_merchants',
      details: { merchant_name: merchantName },
    });
  }
}

export async function removeEligibleMerchant(
  merchantId: string,
  merchantName: string,
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('eligible_merchants')
    .delete()
    .eq('id', merchantId);

  if (error) {
    console.error('Error removing eligible merchant:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'remove_merchant',
      entity_type: 'eligible_merchants',
      entity_id: merchantId,
      details: { merchant_name: merchantName },
    });
  }
}

// =====================================================
// Transfer Orders
// =====================================================

export async function getTransferOrders() {
  const { data, error } = await supabase
    .from('transfer_orders')
    .select('*')
    .order('estimated_arrival', { ascending: false });

  if (error) {
    console.error('Error fetching transfer orders:', error);
    return [];
  }

  return data || [];
}

export async function getTransferOrderLines(transferOrderIds: string[]) {
  if (transferOrderIds.length === 0) return [];

  const { data, error } = await supabase
    .from('transfer_order_lines')
    .select(
      `
      *,
      sku_data:sku_attributes(*)
    `
    )
    .in('transfer_order_id', transferOrderIds);

  if (error) {
    console.error('Error fetching transfer order lines:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// Preprocessing Actions
// =====================================================

export async function requestPreprocessing(
  lineId: string,
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'requested',
      requested_at: new Date().toISOString(),
      requested_by: userId,
    })
    .eq('id', lineId);

  if (error) {
    console.error('Error requesting preprocessing:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'request_preprocessing',
      entity_type: 'transfer_order_lines',
      entity_id: lineId,
    });
  }
}

export async function cancelPreprocessing(
  lineId: string,
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'no instruction',
      requested_at: null,
      requested_by: null,
    })
    .eq('id', lineId);

  if (error) {
    console.error('Error canceling preprocessing:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'cancel_preprocessing',
      entity_type: 'transfer_order_lines',
      entity_id: lineId,
    });
  }
}

export async function requestAllPreprocessing(
  lineIds: string[],
  userId: string | null
): Promise<void> {
  const { error} = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'requested',
      requested_at: new Date().toISOString(),
      requested_by: userId,
    })
    .in('id', lineIds)
    .eq('preprocessing_status', 'in review');

  if (error) {
    console.error('Error requesting all preprocessing:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'request_preprocessing',
      entity_type: 'transfer_order_lines',
      details: { count: lineIds.length },
    });
  }
}

export async function cancelAllPreprocessing(
  lineIds: string[],
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('transfer_order_lines')
    .update({
      preprocessing_status: 'no instruction',
      requested_at: null,
      requested_by: null,
    })
    .in('id', lineIds)
    .eq('preprocessing_status', 'requested');

  if (error) {
    console.error('Error canceling all preprocessing:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'cancel_preprocessing',
      entity_type: 'transfer_order_lines',
      details: { count: lineIds.length },
    });
  }
}

