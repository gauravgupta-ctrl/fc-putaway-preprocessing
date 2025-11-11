'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Button } from '@/components/ui/button';
import {
  findItemByBarcode,
  getPreprocessingItems,
} from '@/lib/operator';
import { AlertCircle, PackageSearch, X, Package, CheckSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function ScanItemPage() {
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toNumber, setToNumber] = useState<string>('');
  const [completingTO, setCompletingTO] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toId = searchParams.get('to');

  function handleAbort() {
    if (confirm('Are you sure you want to abort this Transfer Order?')) {
      router.push('/operator');
    }
  }

  async function handleCompleteTO() {
    if (!toId) return;
    
    setCompletingTO(true);
    
    try {
      // Get all items for this TO that are not yet fully completed
      const { data: items, error: itemsError } = await supabase
        .from('transfer_order_lines')
        .select('id, sku, units_incoming, preprocessing_status')
        .eq('transfer_order_id', toId)
        .in('preprocessing_status', ['requested', 'partially completed']);

      if (itemsError) {
        console.error('Error fetching items:', itemsError);
        throw new Error(`Failed to fetch items: ${itemsError.message}`);
      }

      if (!items || items.length === 0) {
        // All items completed, proceed directly
        router.push(`/operator/print-labels?to=${toId}&completed=true`);
        return;
      }

      // Get assigned quantities for incomplete items
      const { data: assignments, error: assignmentsError } = await supabase
        .from('pallet_assignments')
        .select('sku, quantity')
        .eq('transfer_order_id', toId);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
      }

      const assignedQty = new Map<string, number>();
      if (assignments) {
        assignments.forEach(a => {
          assignedQty.set(a.sku, (assignedQty.get(a.sku) || 0) + a.quantity);
        });
      }

      // Build warning message
      const incompleteItems = items.map(item => {
        const assigned = assignedQty.get(item.sku) || 0;
        const expected = item.units_incoming || 0;
        const missing = expected - assigned;
        const status = assigned === 0 ? 'Not started' : 'Partially completed';
        return `${item.sku}: ${assigned}/${expected} units (${missing} missing) - ${status}`;
      });

      const proceed = confirm(
        `The following items are incomplete:\n\n${incompleteItems.join('\n')}\n\nDo you want to complete the Transfer Order anyway?`
      );

      if (!proceed) {
        setCompletingTO(false);
        return;
      }

      // Mark incomplete items as "not completed"
      const notCompletedIds = items
        .filter(item => (assignedQty.get(item.sku) || 0) === 0)
        .map(item => item.id);

      if (notCompletedIds.length > 0) {
        const { error: updateError } = await supabase
          .from('transfer_order_lines')
          .update({ preprocessing_status: 'not completed' })
          .in('id', notCompletedIds);

        if (updateError) {
          console.error('Error updating items:', updateError);
          throw new Error(`Failed to update items: ${updateError.message}`);
        }
      }

      // Navigate to print labels
      router.push(`/operator/print-labels?to=${toId}&completed=true`);
    } catch (error: any) {
      console.error('Error completing TO:', error);
      alert(`Failed to complete Transfer Order: ${error.message || 'Please try again.'}`);
      setCompletingTO(false);
    }
  }

  useEffect(() => {
    if (toId) {
      loadToInfo();
    }
  }, [toId]);

  async function loadToInfo() {
    const { data } = await supabase
      .from('transfer_orders')
      .select('transfer_number')
      .eq('id', toId)
      .single();

    if (data) {
      setToNumber(data.transfer_number);
    }
  }

  async function handleScan(barcode: string) {
    if (!toId) return;

    setError(null);
    setWarning(null);
    setLoading(true);

    try {
      const item = await findItemByBarcode(barcode, toId);

      if (!item) {
        setError('Item not found in this Transfer Order. Please scan again.');
        setLoading(false);
        return;
      }

      // Check item status and show warning if needed
      const status = item.preprocessing_status;
      
      if (status === 'in-progress') {
        setWarning('This item is currently being processed by another operator.');
      } else if (status === 'completed') {
        setWarning('This item has already been processed. You can reprocess it if needed.');
      } else if (status === 'not needed') {
        setWarning('This item is not requested for pre-processing. It will go to PICK FACE.');
      }

      // Always allow to proceed
      router.push(`/operator/add-carton?to=${toId}&item=${item.id}`);
    } catch (error) {
      console.error('Error scanning item:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* TO Info Bar with Abort Button */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-gray-600">Transfer Order</p>
            <p className="text-lg font-bold text-gray-900">{toNumber}</p>
          </div>
          <div className="flex-1 flex justify-end">
            <Button
              onClick={handleAbort}
              variant="ghost"
              size="sm"
              className="bg-transparent"
            >
              <X className="h-4 w-4 mr-1" />
              Abort
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Package className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Scan Carton
          </h1>
          <p className="text-gray-600">
            Scan the retail item barcode inside each full carton
          </p>
        </div>

        {/* Scanner */}
        <div className="max-w-md mx-auto w-full">
          <BarcodeScanner
            onScan={handleScan}
            placeholder="Enter item barcode"
          />
        </div>

        {/* Warning Message */}
        {warning && (
          <div className="mt-6 max-w-md mx-auto w-full">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">Warning</p>
                <p className="text-sm text-yellow-700 mt-1">{warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 max-w-md mx-auto w-full">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-gray-900"></div>
            <p className="text-sm text-gray-600 mt-2">Validating...</p>
          </div>
        )}
      </div>

      {/* Complete TO Button */}
      <div className="px-4 pb-6">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleCompleteTO}
            disabled={completingTO}
            variant="outline"
            size="lg"
            className="w-full h-14 text-base"
          >
            {completingTO ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent mr-2"></div>
                Completing...
              </>
            ) : (
              <>
                <CheckSquare className="h-5 w-5 mr-2" />
                Complete Transfer Order
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
