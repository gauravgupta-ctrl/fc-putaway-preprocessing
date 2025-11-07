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
  // Filter only non-zero quantities
  const validAssignments = assignments.filter((a) => a.quantity > 0);

  if (validAssignments.length === 0) {
    return; // No assignments to save
  }

  // Upsert each assignment (update if exists, insert if not)
  const upsertPromises = validAssignments.map((a) => {
    return supabase
      .from('pallet_assignments')
      .upsert(
        {
          transfer_order_id: transferOrderId,
          transfer_order_line_id: transferOrderLineId,
          pallet_number: a.palletNumber,
          sku,
          quantity: a.quantity,
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'transfer_order_id,pallet_number,sku',
        }
      );
  });

  const results = await Promise.all(upsertPromises);
  
  // Check for errors
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    console.error('Error saving pallet assignments:', errors);
    throw new Error('Failed to save pallet assignments');
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

