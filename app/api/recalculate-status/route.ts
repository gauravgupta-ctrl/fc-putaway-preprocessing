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

    // Recalculate status for each line (but only if not already requested/in-progress/completed)
    const updates = [];
    
    for (const line of allLines as any[]) {
      const merchant = line.transfer_orders.merchant;
      const dos = line.sku_attributes.days_of_stock_pickface;
      const currentStatus = line.preprocessing_status;
      
      // Skip if already requested, in-progress, or completed
      if (['requested', 'in-progress', 'completed'].includes(currentStatus)) {
        continue;
      }

      // Calculate new status
      const isEligible = eligibleMerchantNames.includes(merchant);
      const newStatus = (isEligible && dos > threshold) ? 'in review' : 'not required';

      // Update if different
      if (newStatus !== currentStatus) {
        updates.push(
          supabase
            .from('transfer_order_lines')
            .update({ preprocessing_status: newStatus })
            .eq('id', line.id)
        );
      }
    }

    // Execute all updates
    await Promise.all(updates);

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

