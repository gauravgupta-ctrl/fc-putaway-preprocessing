import { supabase } from './supabase';

export interface CSVRow {
  transfer_number: string;
  merchant: string;
  estimated_arrival: string;
  receipt_time: string;
  destination: string;
  transfer_status: string;
  sku: string;
  units_incoming: string;
  sku_description: string;
  barcode: string;
  units_on_hand_pickface: string;
  average_daily_sales: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParsedData {
  transferOrders: Map<string, any>;
  transferOrderLines: any[];
  skuAttributes: Map<string, any>;
}

export function parseCSV(csvText: string): CSVRow[] {
  // Handle different line endings (Windows, Unix, Mac)
  const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.trim().split('\n').filter(line => line.trim() !== '');
  
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row as CSVRow);
  }

  return rows;
}

export function validateCSV(rows: CSVRow[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const requiredFields = [
    'transfer_number',
    'merchant',
    'estimated_arrival',
    'destination',
    'transfer_status',
    'sku',
    'units_incoming',
    'sku_description',
    'barcode',
    'units_on_hand_pickface',
    'average_daily_sales',
  ];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because index 0 is row 2 (after header)

    // Check required fields
    requiredFields.forEach((field) => {
      if (!row[field as keyof CSVRow] || row[field as keyof CSVRow].trim() === '') {
        errors.push({
          row: rowNum,
          field,
          message: `Required field "${field}" is missing or empty`,
        });
      }
    });

    // Validate date format for estimated_arrival
    if (row.estimated_arrival) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.estimated_arrival)) {
        errors.push({
          row: rowNum,
          field: 'estimated_arrival',
          message: 'Invalid date format. Expected YYYY-MM-DD',
        });
      }
    }

    // Validate receipt_time format if provided
    if (row.receipt_time && row.receipt_time.trim() !== '') {
      const datetimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
      if (!datetimeRegex.test(row.receipt_time)) {
        errors.push({
          row: rowNum,
          field: 'receipt_time',
          message: 'Invalid datetime format. Expected YYYY-MM-DD HH:MM:SS',
        });
      }
    }

    // Validate numeric fields
    const unitsIncoming = parseFloat(row.units_incoming);
    if (isNaN(unitsIncoming) || unitsIncoming < 0) {
      errors.push({
        row: rowNum,
        field: 'units_incoming',
        message: 'Must be a positive number',
      });
    }

    const unitsOnHand = parseFloat(row.units_on_hand_pickface);
    if (isNaN(unitsOnHand) || unitsOnHand < 0) {
      errors.push({
        row: rowNum,
        field: 'units_on_hand_pickface',
        message: 'Must be a positive number',
      });
    }

    const avgDailySales = parseFloat(row.average_daily_sales);
    if (isNaN(avgDailySales) || avgDailySales <= 0) {
      errors.push({
        row: rowNum,
        field: 'average_daily_sales',
        message: 'Must be a positive number greater than 0',
      });
    }
  });

  return errors;
}

export function transformCSVData(rows: CSVRow[]): ParsedData {
  const transferOrders = new Map<string, any>();
  const transferOrderLines: any[] = [];
  const skuAttributes = new Map<string, any>();

  rows.forEach((row) => {
    // Process Transfer Order (use first occurrence)
    if (!transferOrders.has(row.transfer_number)) {
      transferOrders.set(row.transfer_number, {
        transfer_number: row.transfer_number,
        merchant: row.merchant,
        estimated_arrival: row.estimated_arrival,
        receipt_time: row.receipt_time || null,
        destination: row.destination,
        transfer_status: row.transfer_status,
      });
    }

    // Process SKU Attributes (use first occurrence)
    if (!skuAttributes.has(row.sku)) {
      const unitsOnHand = parseFloat(row.units_on_hand_pickface);
      const avgDailySales = parseFloat(row.average_daily_sales);
      // Note: days_of_stock_pickface is a generated column, don't include it in insert

      skuAttributes.set(row.sku, {
        sku: row.sku,
        description: row.sku_description,
        barcode: row.barcode,
        units_on_hand_pickface: unitsOnHand,
        average_daily_sales: avgDailySales,
        // days_of_stock_pickface is calculated by the database
      });
    }

    // Process Transfer Order Line (use first occurrence of TO + SKU combo)
    const lineKey = `${row.transfer_number}-${row.sku}`;
    const existingLine = transferOrderLines.find(
      (line) => `${line.transfer_number}-${line.sku}` === lineKey
    );

    if (!existingLine) {
      transferOrderLines.push({
        transfer_number: row.transfer_number,
        sku: row.sku,
        units_incoming: parseFloat(row.units_incoming),
      });
    }
  });

  return {
    transferOrders,
    transferOrderLines,
    skuAttributes,
  };
}

export async function uploadCSVData(
  data: ParsedData,
  userId: string | null
): Promise<{ success: boolean; message: string; stats: any }> {
  try {
    // Get existing data to preserve manual choices
    const { data: existingLines } = await supabase
      .from('transfer_order_lines')
      .select('transfer_order_id, sku, manually_cancelled, auto_requested');

    const manualChoicesMap = new Map<string, { manually_cancelled: boolean; auto_requested: boolean }>();
    if (existingLines) {
      existingLines.forEach((line) => {
        manualChoicesMap.set(`${line.transfer_order_id}-${line.sku}`, {
          manually_cancelled: line.manually_cancelled,
          auto_requested: line.auto_requested,
        });
      });
    }

    // 1. Upsert SKU Attributes
    const skuAttributesArray = Array.from(data.skuAttributes.values());
    if (skuAttributesArray.length > 0) {
      const { error: skuError } = await supabase
        .from('sku_attributes')
        .upsert(skuAttributesArray, { onConflict: 'sku' });

      if (skuError) throw skuError;
    }

    // 2. Upsert Transfer Orders
    const transferOrdersArray = Array.from(data.transferOrders.values());
    if (transferOrdersArray.length > 0) {
      const { error: toError } = await supabase
        .from('transfer_orders')
        .upsert(transferOrdersArray, { onConflict: 'transfer_number' });

      if (toError) throw toError;
    }

    // 3. Get TO IDs for the lines
    const toNumbers = Array.from(data.transferOrders.keys());
    const { data: toData } = await supabase
      .from('transfer_orders')
      .select('id, transfer_number')
      .in('transfer_number', toNumbers);

    const toIdMap = new Map<string, string>();
    toData?.forEach((to) => {
      toIdMap.set(to.transfer_number, to.id);
    });

    // 4. Prepare Transfer Order Lines with preserved manual choices
    const linesWithIds = data.transferOrderLines.map((line) => {
      const toId = toIdMap.get(line.transfer_number);
      const manualChoice = manualChoicesMap.get(`${toId}-${line.sku}`);

      return {
        transfer_order_id: toId,
        sku: line.sku,
        units_incoming: line.units_incoming,
        // Preserve manual choices if they exist
        manually_cancelled: manualChoice?.manually_cancelled || false,
        auto_requested: manualChoice?.auto_requested || false,
      };
    });

    // 5. Upsert Transfer Order Lines
    if (linesWithIds.length > 0) {
      const { error: linesError } = await supabase
        .from('transfer_order_lines')
        .upsert(linesWithIds, { onConflict: 'transfer_order_id,sku' });

      if (linesError) throw linesError;
    }

    // 6. Trigger recalculation of preprocessing status
    await fetch('/api/recalculate-status', { method: 'POST' });

    // Log audit trail
    if (userId) {
      await supabase.from('audit_log').insert({
        user_id: userId,
        action: 'csv_upload',
        entity_type: 'bulk_import',
        details: {
          transfer_orders: transferOrdersArray.length,
          transfer_order_lines: linesWithIds.length,
          sku_attributes: skuAttributesArray.length,
        },
      });
    }

    return {
      success: true,
      message: 'CSV data uploaded successfully',
      stats: {
        transferOrders: transferOrdersArray.length,
        transferOrderLines: linesWithIds.length,
        skuAttributes: skuAttributesArray.length,
      },
    };
  } catch (error) {
    console.error('Error uploading CSV data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stats: null,
    };
  }
}

