'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Button } from '@/components/ui/button';
import {
  findItemByBarcode,
  getPreprocessingItems,
  getCompletedItems,
} from '@/lib/operator';
import { AlertCircle, PackageSearch, X, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ScanItemPage() {
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toNumber, setToNumber] = useState<string>('');
  const [completedCount, setCompletedCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toId = searchParams.get('to');

  function handleAbort() {
    if (confirm('Are you sure you want to abort this Transfer Order?')) {
      router.push('/operator');
    }
  }

  function handlePrintLabel() {
    router.push(`/operator/print-labels?to=${toId}`);
  }

  useEffect(() => {
    if (toId) {
      loadToInfo();
      loadCompletedCount();
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

  async function loadCompletedCount() {
    if (!toId) return;
    const completed = await getCompletedItems(toId);
    setCompletedCount(completed.length);
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
        setWarning('This item has already been processed.');
      }

      // Always allow to proceed
      router.push(`/operator/confirm-action?to=${toId}&item=${item.id}`);
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
          {completedCount > 0 && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-lg font-bold text-green-600">{completedCount}</p>
            </div>
          )}
          <div className={`flex-1 flex ${completedCount === 0 ? 'justify-end' : 'justify-end'}`}>
            <Button
              onClick={handleAbort}
              variant="outline"
              size="sm"
              className="bg-transparent border-gray-300"
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
            <PackageSearch className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Scan Item
          </h1>
          <p className="text-gray-600">
            Scan the item barcode
          </p>
        </div>

        {/* Scanner */}
        <div className="max-w-md mx-auto w-full">
          <BarcodeScanner
            onScan={handleScan}
            placeholder="Enter item barcode"
            autoFocus
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

      {/* Bottom Actions - Print Label Only */}
      {completedCount > 0 && (
        <div className="px-4 py-6 flex justify-center">
          <Button
            onClick={handlePrintLabel}
            size="lg"
            variant="ghost"
            className="bg-transparent border-0 h-12 text-base text-gray-700 hover:text-gray-900"
          >
            <Printer className="h-5 w-5 mr-2" />
            Print Label
          </Button>
        </div>
      )}
    </div>
  );
}

