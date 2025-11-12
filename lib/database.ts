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

export async function getMerchantDestination(merchantName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('eligible_merchants')
    .select('reserve_destination')
    .eq('merchant_name', merchantName)
    .single();

  if (error || !data) {
    return null;
  }

  return data.reserve_destination;
}

export async function addEligibleMerchant(
  merchantName: string,
  reserveDestination: string | null,
  userId: string | null
): Promise<void> {
  const { error } = await supabase.from('eligible_merchants').insert({
    merchant_name: merchantName,
    reserve_destination: reserveDestination,
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
      details: { merchant_name: merchantName, reserve_destination: reserveDestination },
    });
  }
}

export async function updateMerchantDestination(
  merchantId: string,
  reserveDestination: string | null,
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('eligible_merchants')
    .update({ reserve_destination: reserveDestination })
    .eq('id', merchantId);

  if (error) {
    console.error('Error updating merchant destination:', error);
    throw error;
  }

  // Log audit trail
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'update_merchant_destination',
      entity_type: 'eligible_merchants',
      entity_id: merchantId,
      details: { reserve_destination: reserveDestination },
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
  // Get all transfer orders
  const { data: tos, error: toError } = await supabase
    .from('transfer_orders')
    .select('*')
    .order('estimated_arrival', { ascending: false });

  if (toError || !tos) {
    console.error('Error fetching transfer orders:', toError);
    return [];
  }

  const toIds = tos.map((to) => to.id);

  const requestedExpectedMap = new Map<string, number>();
  const requestedLineIds = new Set<string>();

  if (toIds.length > 0) {
    const { data: lines } = await supabase
      .from('transfer_order_lines')
      .select('id, transfer_order_id, units_incoming, preprocessing_status')
      .in('transfer_order_id', toIds);

    lines?.forEach((line) => {
      if (line.preprocessing_status && line.preprocessing_status !== 'not needed') {
        requestedLineIds.add(line.id);
        const incoming = line.units_incoming ?? 0;
        requestedExpectedMap.set(
          line.transfer_order_id,
          (requestedExpectedMap.get(line.transfer_order_id) ?? 0) + incoming
        );
      }
    });
  }

  const requestedProcessedMap = new Map<string, number>();

  if (requestedLineIds.size > 0) {
    const { data: assignments } = await supabase
      .from('pallet_assignments')
      .select('transfer_order_id, transfer_order_line_id, quantity')
      .in('transfer_order_id', toIds);

    assignments?.forEach((assignment) => {
      if (requestedLineIds.has(assignment.transfer_order_line_id)) {
        const qty = assignment.quantity ?? 0;
        requestedProcessedMap.set(
          assignment.transfer_order_id,
          (requestedProcessedMap.get(assignment.transfer_order_id) ?? 0) + qty
        );
      }
    });
  }

  // Get all eligible merchants with destinations
  const { data: merchants, error: merchantError } = await supabase
    .from('eligible_merchants')
    .select('merchant_name, reserve_destination');

  const merchantDestMap = new Map<string, string | null>();
  merchants?.forEach((m) => {
    merchantDestMap.set(m.merchant_name, m.reserve_destination);
  });

  // Add reserve_destination to each TO
  return tos.map((to) => ({
    ...to,
    reserve_destination: merchantDestMap.get(to.merchant) || null,
    requested_units_expected: requestedExpectedMap.get(to.id) ?? 0,
    requested_units_processed: requestedProcessedMap.get(to.id) ?? 0,
  }));
}

export async function getTransferOrderLines(transferOrderIds: string[]) {
  if (transferOrderIds.length === 0) return [];

  const { data: lines, error: linesError } = await supabase
    .from('transfer_order_lines')
    .select(
      `
      *,
      sku_data:sku_attributes(*),
      transfer_orders!inner(merchant)
    `
    )
    .in('transfer_order_id', transferOrderIds);

  if (linesError || !lines) {
    console.error('Error fetching transfer order lines:', linesError);
    return [];
  }

  const lineIds = lines.map((line: any) => line.id);
  const processedByLine = new Map<string, number>();

  if (lineIds.length > 0) {
    const { data: assignments } = await supabase
      .from('pallet_assignments')
      .select('transfer_order_line_id, quantity')
      .in('transfer_order_line_id', lineIds);

    assignments?.forEach((assignment) => {
      const current = processedByLine.get(assignment.transfer_order_line_id) ?? 0;
      processedByLine.set(
        assignment.transfer_order_line_id,
        current + (assignment.quantity ?? 0)
      );
    });
  }

  // Get all eligible merchants with destinations
  const { data: merchants } = await supabase
    .from('eligible_merchants')
    .select('merchant_name, reserve_destination');

  const merchantDestMap = new Map<string, string | null>();
  merchants?.forEach((m) => {
    merchantDestMap.set(m.merchant_name, m.reserve_destination);
  });

  // Add reserve_destination to each line
  return lines.map((line: any) => ({
    ...line,
    reserve_destination: merchantDestMap.get(line.transfer_orders.merchant) || null,
    processed_units: processedByLine.get(line.id) ?? 0,
  }));
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
      manually_cancelled: false,
      auto_requested: false,
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
      preprocessing_status: 'not needed',
      requested_at: null,
      requested_by: null,
      manually_cancelled: true,
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
      manually_cancelled: false,
      auto_requested: false,
    })
    .in('id', lineIds)
    .eq('preprocessing_status', 'not needed');

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
      preprocessing_status: 'not needed',
      requested_at: null,
      requested_by: null,
      manually_cancelled: true,
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

// =====================================================
// Admin Review Status
// =====================================================

export async function toggleAdminReviewed(
  transferOrderId: string,
  reviewed: boolean,
  userId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('transfer_orders')
    .update({
      admin_reviewed: reviewed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transferOrderId);

  if (error) {
    console.error('Error updating admin_reviewed:', error);
    throw error;
  }

  // Log audit trail (skip if no user)
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: reviewed ? 'mark_reviewed' : 'unmark_reviewed',
      entity_type: 'transfer_orders',
      entity_id: transferOrderId,
    });
  }
}

