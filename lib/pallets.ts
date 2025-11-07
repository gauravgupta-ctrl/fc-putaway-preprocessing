import { supabase } from './supabase';
import type { PalletAssignment } from '@/types/database';

// Get all pallet assignments for a TO
export async function getPalletAssignments(transferOrderId: string): Promise<PalletAssignment[]> {
  const { data, error } = await supabase
    .from('pallet_assignments')
    .select('*')
    .eq('transfer_order_id', transferOrderId)
    .order('pallet_number', { ascending: true });

  if (error) {
    console.error('Error fetching pallet assignments:', error);
    return [];
  }

  return data || [];
}

// Get pallet assignments for a specific item
export async function getItemPalletAssignments(
  transferOrderId: string,
  sku: string
): Promise<PalletAssignment[]> {
  const { data, error } = await supabase
    .from('pallet_assignments')
    .select('*')
    .eq('transfer_order_id', transferOrderId)
    .eq('sku', sku)
    .order('pallet_number', { ascending: true });

  if (error) {
    console.error('Error fetching item pallet assignments:', error);
    return [];
  }

  return data || [];
}

// Save pallet assignments for an item (upsert)
export async function savePalletAssignments(
  transferOrderId: string,
  transferOrderLineId: string,
  sku: string,
  assignments: { palletNumber: number; quantity: number }[],
  userId: string | null
): Promise<void> {
  // First, delete existing assignments for this item
  await supabase
    .from('pallet_assignments')
    .delete()
    .eq('transfer_order_id', transferOrderId)
    .eq('sku', sku);

  // Insert new assignments (only non-zero quantities)
  const validAssignments = assignments.filter((a) => a.quantity > 0);

  if (validAssignments.length === 0) {
    return; // No assignments to save
  }

  const records = validAssignments.map((a) => ({
    transfer_order_id: transferOrderId,
    transfer_order_line_id: transferOrderLineId,
    pallet_number: a.palletNumber,
    sku,
    quantity: a.quantity,
    created_by: userId,
  }));

  const { error } = await supabase.from('pallet_assignments').insert(records);

  if (error) {
    console.error('Error saving pallet assignments:', error);
    throw error;
  }

  // Log audit trail
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'assign_pallets',
      entity_type: 'pallet_assignments',
      details: {
        transfer_order_id: transferOrderId,
        sku,
        pallet_count: validAssignments.length,
        total_quantity: validAssignments.reduce((sum, a) => sum + a.quantity, 0),
      },
    });
  }
}

// Get total number of pallets used in a TO
export async function getPalletCount(transferOrderId: string): Promise<number> {
  const { data, error } = await supabase
    .from('pallet_assignments')
    .select('pallet_number')
    .eq('transfer_order_id', transferOrderId);

  if (error || !data) {
    return 0;
  }

  // Get unique pallet numbers
  const uniquePallets = new Set(data.map((a) => a.pallet_number));
  return uniquePallets.size;
}

// Get the highest pallet number used in a TO
export async function getMaxPalletNumber(transferOrderId: string): Promise<number> {
  const { data, error } = await supabase
    .from('pallet_assignments')
    .select('pallet_number')
    .eq('transfer_order_id', transferOrderId)
    .order('pallet_number', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return 0;
  }

  return data[0].pallet_number;
}

// Get all pallets with their quantities for a TO (grouped by pallet number)
export async function getAllTOPallets(transferOrderId: string): Promise<
  { palletNumber: number; totalQuantity: number; items: { sku: string; quantity: number }[] }[]
> {
  const { data, error } = await supabase
    .from('pallet_assignments')
    .select('pallet_number, sku, quantity')
    .eq('transfer_order_id', transferOrderId)
    .order('pallet_number', { ascending: true });

  if (error || !data) {
    return [];
  }

  // Group by pallet number
  const palletMap = new Map<number, { sku: string; quantity: number }[]>();
  
  data.forEach((assignment) => {
    if (!palletMap.has(assignment.pallet_number)) {
      palletMap.set(assignment.pallet_number, []);
    }
    palletMap.get(assignment.pallet_number)!.push({
      sku: assignment.sku,
      quantity: assignment.quantity,
    });
  });

  return Array.from(palletMap.entries()).map(([palletNumber, items]) => ({
    palletNumber,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
  }));
}

// Get pallet summary (which items on which pallets)
export async function getPalletSummary(transferOrderId: string) {
  const { data, error } = await supabase
    .from('pallet_assignments')
    .select(`
      pallet_number,
      sku,
      quantity,
      sku_attributes!inner(description, barcode)
    `)
    .eq('transfer_order_id', transferOrderId)
    .order('pallet_number', { ascending: true })
    .order('sku', { ascending: true });

  if (error) {
    console.error('Error fetching pallet summary:', error);
    return [];
  }

  return data || [];
}

// Cleanup and resequence pallets for a TO (remove empty pallets, renumber sequentially)
export async function cleanupAndResequencePallets(
  transferOrderId: string,
  userId: string | null
): Promise<void> {
  // Get all pallet assignments for this TO
  const { data: assignments, error: fetchError } = await supabase
    .from('pallet_assignments')
    .select('*')
    .eq('transfer_order_id', transferOrderId)
    .order('pallet_number', { ascending: true });

  if (fetchError || !assignments) {
    console.error('Error fetching pallet assignments:', fetchError);
    return;
  }

  // Group by pallet number and calculate total quantity per pallet
  const palletMap = new Map<number, typeof assignments>();
  assignments.forEach((assignment) => {
    if (!palletMap.has(assignment.pallet_number)) {
      palletMap.set(assignment.pallet_number, []);
    }
    palletMap.get(assignment.pallet_number)!.push(assignment);
  });

  // Filter out empty pallets and get non-empty pallets sorted by number
  const nonEmptyPallets = Array.from(palletMap.entries())
    .filter(([_, items]) => items.reduce((sum, item) => sum + item.quantity, 0) > 0)
    .sort(([a], [b]) => a - b);

  if (nonEmptyPallets.length === 0) {
    return; // No pallets to resequence
  }

  // Create mapping from old pallet numbers to new sequential numbers
  const palletNumberMap = new Map<number, number>();
  nonEmptyPallets.forEach(([oldNumber], index) => {
    palletNumberMap.set(oldNumber, index + 1);
  });

  // Update all assignments with new pallet numbers
  const updates = assignments
    .filter((a) => palletNumberMap.has(a.pallet_number))
    .map((assignment) => {
      const newPalletNumber = palletNumberMap.get(assignment.pallet_number)!;
      return supabase
        .from('pallet_assignments')
        .update({ pallet_number: newPalletNumber })
        .eq('id', assignment.id);
    });

  // Delete assignments for empty pallets
  const emptyPalletNumbers = Array.from(palletMap.keys()).filter(
    (num) => !palletNumberMap.has(num)
  );

  if (emptyPalletNumbers.length > 0) {
    updates.push(
      supabase
        .from('pallet_assignments')
        .delete()
        .eq('transfer_order_id', transferOrderId)
        .in('pallet_number', emptyPalletNumbers)
    );
  }

  // Execute all updates
  if (updates.length > 0) {
    await Promise.all(updates);
  }

  // Log audit trail
  if (userId) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action: 'cleanup_pallets',
      entity_type: 'pallet_assignments',
      details: {
        transfer_order_id: transferOrderId,
        removed_empty_pallets: emptyPalletNumbers.length,
        final_pallet_count: nonEmptyPallets.length,
      },
    });
  }
}

