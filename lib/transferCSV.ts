import { supabase } from './supabase';

interface PalletAssignment {
  barcode: string;
  quantity: number;
  pallet_number: number;
}

export async function generateTransferCSVs(
  transferOrderId: string,
  transferNumber: string,
  merchant: string,
  storageZone: string
): Promise<void> {
  try {
    // Fetch pallet assignments with SKU barcodes
    const { data: assignments, error } = await supabase
      .from('pallet_assignments')
      .select(`
        pallet_number,
        quantity,
        sku,
        sku_data:sku_attributes(barcode)
      `)
      .eq('transfer_order_id', transferOrderId)
      .order('pallet_number', { ascending: true })
      .order('sku', { ascending: true });

    if (error || !assignments) {
      throw new Error('Failed to fetch pallet assignments');
    }

    // Transform data for CSV 1 (with pallet numbers)
    const csv1Data: PalletAssignment[] = assignments.map((a: any) => ({
      barcode: a.sku_data?.barcode || '',
      quantity: a.quantity,
      pallet_number: a.pallet_number,
    }));

    // Transform data for CSV 2 (aggregated, no pallet numbers)
    const aggregatedMap = new Map<string, number>();
    assignments.forEach((a: any) => {
      const barcode = a.sku_data?.barcode || '';
      if (barcode) {
        const currentQty = aggregatedMap.get(barcode) || 0;
        aggregatedMap.set(barcode, currentQty + a.quantity);
      }
    });

    const csv2Data = Array.from(aggregatedMap.entries()).map(([barcode, quantity]) => ({
      barcode,
      quantity,
    }));

    // Generate CSV 1
    const csv1Content = [
      'barcode,quantity,pallet',
      ...csv1Data.map((row) => `${row.barcode},${row.quantity},${row.pallet_number}`),
    ].join('\n');

    // Generate CSV 2
    const csv2Content = [
      'barcode,quantity',
      ...csv2Data.map((row) => `${row.barcode},${row.quantity}`),
    ].join('\n');

    // Download CSV 1
    const csv1FileName = `wmslite_transfer_${transferNumber}_${merchant}_to_${storageZone}.csv`;
    downloadCSV(csv1Content, csv1FileName);

    // Download CSV 2
    const csv2FileName = `vb_putaway_${transferNumber}_${merchant}.csv`;
    downloadCSV(csv2Content, csv2FileName);
  } catch (error) {
    console.error('Error generating transfer CSVs:', error);
    throw error;
  }
}

function downloadCSV(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

