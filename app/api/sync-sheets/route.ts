import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchGoogleSheetsData } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get access token from request body
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      );
    }

    // Fetch data from Google Sheets
    const sheetsData = await fetchGoogleSheetsData(accessToken);

    // Sync SKU attributes first (referenced by transfer order lines)
    for (const skuData of sheetsData.skuAttributes) {
      await supabase.from('sku_attributes').upsert(
        {
          sku: skuData.SKU,
          description: skuData.Description,
          barcode: skuData.Barcode,
          daily_units_sold: skuData['Daily Units Sold'],
          units_pickface: skuData['Units on Hand - Pick Face'],
          units_reserve: skuData['Units on Hand - Reserve'],
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'sku' }
      );
    }

    // Sync transfer orders
    for (const toData of sheetsData.transferOrders) {
      await supabase.from('transfer_orders').upsert(
        {
          transfer_number: toData.Transfer,
          merchant: toData.Merchant,
          transfer_status: toData.Status,
          estimated_arrival: toData['Estimated Arrival'] || null,
          receipt_time: toData['Receipt Time'] || null,
          destination: toData.Destination,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'transfer_number' }
      );
    }

    // Get threshold for status calculation
    const { data: thresholdSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'dos_threshold')
      .single();

    const threshold = parseFloat(thresholdSetting?.value || '30');

    // Sync transfer order lines with status calculation
    for (const lineData of sheetsData.transferOrderLines) {
      // Get transfer order ID
      const { data: transferOrder } = await supabase
        .from('transfer_orders')
        .select('id, merchant')
        .eq('transfer_number', lineData.Transfer)
        .single();

      if (!transferOrder) continue;

      // Get SKU data for days of stock calculation
      const { data: skuData } = await supabase
        .from('sku_attributes')
        .select('days_of_stock_pickface')
        .eq('sku', lineData.SKU)
        .single();

      // Check if merchant is eligible
      const { data: eligibleMerchant } = await supabase
        .from('eligible_merchants')
        .select('id')
        .eq('merchant_name', transferOrder.merchant)
        .single();

      // Calculate preprocessing status (only if not already requested/in-progress/completed)
      const { data: existingLine } = await supabase
        .from('transfer_order_lines')
        .select('preprocessing_status')
        .eq('transfer_order_id', transferOrder.id)
        .eq('sku', lineData.SKU)
        .single();

      let preprocessingStatus = 'not required';

      // Only recalculate if status is 'not required' or 'in review'
      if (
        !existingLine ||
        existingLine.preprocessing_status === 'not required' ||
        existingLine.preprocessing_status === 'in review'
      ) {
        const daysOfStock = skuData?.days_of_stock_pickface || 0;
        const isEligible = !!eligibleMerchant;

        if (isEligible && daysOfStock > threshold) {
          preprocessingStatus = 'in review';
        }
      } else {
        // Preserve existing status
        preprocessingStatus = existingLine.preprocessing_status;
      }

      await supabase.from('transfer_order_lines').upsert(
        {
          transfer_order_id: transferOrder.id,
          transfer_number: lineData.Transfer,
          sku: lineData.SKU,
          units_incoming: lineData['Units Incoming'],
          units_received: lineData['Units Received'],
          preprocessing_status: preprocessingStatus,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'transfer_order_id,sku' }
      );
    }

    // Log audit trail
    await supabase.from('audit_log').insert({
      user_id: session.user.id,
      action: 'sync_data',
      entity_type: 'google_sheets',
      details: {
        transfer_orders_count: sheetsData.transferOrders.length,
        transfer_order_lines_count: sheetsData.transferOrderLines.length,
        sku_attributes_count: sheetsData.skuAttributes.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data synced successfully',
      counts: {
        transferOrders: sheetsData.transferOrders.length,
        transferOrderLines: sheetsData.transferOrderLines.length,
        skuAttributes: sheetsData.skuAttributes.length,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

