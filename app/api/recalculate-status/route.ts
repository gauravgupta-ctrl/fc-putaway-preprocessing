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
        transfer_order_id,
        transfer_orders!inner(merchant),
        sku_attributes!inner(days_of_stock_pickface)
      `);

    if (!allLines) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    // All items start as "no instruction" regardless of DOS or merchant
    // This API doesn't need to recalculate anything anymore
    // Statuses are only changed by admin (request/cancel) and operator (complete)
    
    // For now, we can use this to reset any orphaned statuses if needed
    const updates = [];
    
    for (const line of allLines as any[]) {
      const currentStatus = line.preprocessing_status;
      
      // Skip if already requested, in-progress, or completed
      if (['requested', 'in-progress', 'completed'].includes(currentStatus)) {
        continue;
      }

      // Ensure all others are "no instruction"
      if (currentStatus !== 'no instruction') {
        updates.push(
          supabase
            .from('transfer_order_lines')
            .update({ preprocessing_status: 'no instruction' })
            .eq('id', line.id)
        );
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

