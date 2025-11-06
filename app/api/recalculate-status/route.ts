import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get current threshold
    const { data: thresholdData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'dos_threshold')
      .single();

    const threshold = parseFloat(thresholdData?.value || '30');

    // Get all eligible merchants
    const { data: eligibleMerchants } = await supabase
      .from('eligible_merchants')
      .select('merchant_name');

    const eligibleMerchantNames = eligibleMerchants?.map((m) => m.merchant_name) || [];

    // Get all transfer order lines with their TO and SKU data
    const { data: allLines } = await supabase
      .from('transfer_order_lines')
      .select(`
        id,
        sku,
        preprocessing_status,
        manually_cancelled,
        auto_requested,
        transfer_order_id,
        transfer_orders!inner(merchant),
        sku_attributes!inner(days_of_stock_pickface)
      `);

    if (!allLines) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    // Auto-request logic: Items above threshold are auto-requested
    // unless admin has manually cancelled them
    const updates = [];
    
    for (const line of allLines as any[]) {
      const merchant = line.transfer_orders.merchant;
      const dos = line.sku_attributes.days_of_stock_pickface;
      const currentStatus = line.preprocessing_status;
      const manuallyCancelled = line.manually_cancelled;
      const autoRequested = line.auto_requested;
      
      // Skip if already in-progress or completed
      if (['in-progress', 'completed'].includes(currentStatus)) {
        continue;
      }

      // Skip if admin manually cancelled (preserve their decision)
      if (manuallyCancelled) {
        continue;
      }

      // Skip if admin manually requested (preserve their decision)
      // Manual requests have status 'requested' but auto_requested = false
      if (currentStatus === 'requested' && !autoRequested) {
        continue;
      }

      // Check if merchant is eligible
      const isEligible = eligibleMerchantNames.includes(merchant);
      
      // Auto-request items above threshold
      if (isEligible && dos > threshold) {
        if (currentStatus !== 'requested') {
          updates.push(
            supabase
              .from('transfer_order_lines')
              .update({ 
                preprocessing_status: 'requested',
                auto_requested: true,
                requested_at: new Date().toISOString(),
              })
              .eq('id', line.id)
          );
        }
      } else {
        // Items below threshold or not eligible
        // Only change to 'not needed' if it was auto-requested
        if (currentStatus === 'requested' && autoRequested) {
          updates.push(
            supabase
              .from('transfer_order_lines')
              .update({ 
                preprocessing_status: 'not needed',
                auto_requested: false,
                requested_at: null,
                requested_by: null,
              })
              .eq('id', line.id)
          );
        } else if (currentStatus !== 'not needed' && currentStatus !== 'requested') {
          // For other statuses, set to 'not needed'
          updates.push(
            supabase
              .from('transfer_order_lines')
              .update({ 
                preprocessing_status: 'not needed',
                auto_requested: false,
                requested_at: null,
                requested_by: null,
              })
              .eq('id', line.id)
          );
        }
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return NextResponse.json({
      success: true,
      message: `Recalculated ${updates.length} item statuses`,
      threshold,
      updatedCount: updates.length,
    });
  } catch (error) {
    console.error('Recalculate error:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

