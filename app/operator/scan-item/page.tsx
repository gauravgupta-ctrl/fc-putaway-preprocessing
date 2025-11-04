'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, X, Printer } from 'lucide-react';
import { findItemByBarcode, getPreprocessingItems } from '@/lib/operator';
import type { TransferOrderLineWithSku } from '@/types/database';

export default function ScanItemPage() {
  const searchParams = useSearchParams();
  const toId = searchParams.get('toId');
  const toNumber = searchParams.get('toNumber');
  const router = useRouter();

  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState('');
  const [completedItems, setCompletedItems] = useState<TransferOrderLineWithSku[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toId || !toNumber) {
      router.push('/operator');
      return;
    }
    loadCompletedItems();
    inputRef.current?.focus();
  }, [toId]);

  async function loadCompletedItems() {
    if (!toId) return;
    setLoadingItems(true);
    try {
      const items = await getPreprocessingItems(toId);
      const completed = items.filter((item) => item.preprocessing_status === 'completed');
      setCompletedItems(completed as any);
    } catch (err) {
      console.error('Error loading items:', err);
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleScan() {
    if (!barcode.trim() || !toId) return;

    setLoading(true);
    setError('');

    try {
      const item = await findItemByBarcode(toId, barcode.trim());

      if (!item) {
        setError('Item not found in this Transfer Order. Please scan again.');
        setBarcode('');
        inputRef.current?.focus();
        return;
      }

      // Show warning if item is already in-progress or completed
      let warning = '';
      if (item.preprocessing_status === 'in-progress') {
        warning = 'Item is currently being processed by another user.';
      } else if (item.preprocessing_status === 'completed') {
        warning = 'Item has already been processed.';
      }

      // Proceed to confirm action page
      router.push(
        `/operator/confirm-action?toId=${toId}&toNumber=${toNumber}&itemId=${item.id}&sku=${item.sku}&status=${item.preprocessing_status}&warning=${encodeURIComponent(warning)}`
      );
    } catch (err) {
      console.error('Error scanning item:', err);
      setError('An error occurred. Please try again.');
      setBarcode('');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleScan();
    }
  }

  function handleAbort() {
    if (confirm('Abort current Transfer Order and return to start?')) {
      router.push('/operator');
    }
  }

  function handlePrintLabels() {
    router.push(`/operator/print-labels?toId=${toId}&toNumber=${toNumber}&fromScan=true`);
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)]">
      {/* TO Info */}
      <div className="bg-gray-50 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Transfer Order</p>
            <p className="text-xl font-bold">{toNumber}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAbort}>
            <X className="h-4 w-4 mr-1" />
            Abort
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-600" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Scan Item Barcode</h2>
            <p className="text-gray-600">Scan the item to process</p>
          </div>

          {/* Input */}
          <Card className="p-6">
            <div className="space-y-4">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Scan item barcode..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg h-14 text-center font-mono"
                disabled={loading}
                autoFocus
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              <Button
                onClick={handleScan}
                disabled={!barcode.trim() || loading}
                className="w-full h-14 text-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </Card>

          {/* Print Labels Button (if completed items exist) */}
          {completedItems.length > 0 && !loadingItems && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">
                    {completedItems.length} item(s) completed
                  </p>
                  <p className="text-sm text-blue-700">Ready to print labels</p>
                </div>
                <Button onClick={handlePrintLabels} variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

