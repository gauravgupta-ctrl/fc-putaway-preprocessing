'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { scanItem, getCompletedItems, checkAllItemsCompleted } from '@/lib/operator';
import { supabase } from '@/lib/supabase';
import { Loader2, Scan, AlertCircle, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';

export default function OperatorScanItemPage({ params }: { params: { toId: string } }) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toNumber, setToNumber] = useState('');
  const [hasCompletedItems, setHasCompletedItems] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadTOInfo();
    inputRef.current?.focus();
  }, [params.toId]);

  async function loadTOInfo() {
    // Get TO details
    const { data: to } = await supabase
      .from('transfer_orders')
      .select('transfer_number')
      .eq('id', params.toId)
      .single();

    if (to) {
      setToNumber(to.transfer_number);
    }

    // Check if there are completed items
    const completedItems = await getCompletedItems(params.toId);
    setHasCompletedItems(completedItems.length > 0);

    // Check if all items are complete
    const isAllComplete = await checkAllItemsCompleted(params.toId);
    setAllComplete(isAllComplete);
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await scanItem(params.toId, barcode);

      if (!result.success) {
        setError(result.error || 'Failed to scan item');
        setBarcode('');
        inputRef.current?.focus();
        setLoading(false);
        return;
      }

      // Navigate to confirm page
      if (result.item) {
        router.push(`/operator/confirm/${params.toId}/${result.item.id}`);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to scan item');
      setBarcode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handlePrintLabel() {
    router.push(`/operator/print/${params.toId}`);
  }

  return (
    <div className="p-6 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Header with TO number */}
      <div className="mb-6">
        <Link href="/operator" className="inline-flex items-center text-blue-600 text-lg mb-4 hover:text-blue-700 transition-colors">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Scan TO
        </Link>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 shadow-lg">
          <p className="text-sm text-blue-100 mb-1 font-medium">Transfer Order</p>
          <p className="text-3xl font-bold text-white">{toNumber}</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-3 shadow-lg">
          <Scan className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Scan Item Barcode</h2>
        <p className="text-lg text-gray-600">Scan the item to pre-process</p>
      </div>

      {/* Scan Form */}
      <Card className="p-8 flex-1 flex flex-col justify-center shadow-xl border-0 bg-white/80 backdrop-blur">
        <form onSubmit={handleScan} className="space-y-6">
          {/* Input */}
          <div>
            <label htmlFor="barcode" className="block text-lg font-semibold mb-3 text-gray-700">
              Item Barcode
            </label>
            <Input
              ref={inputRef}
              id="barcode"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan item barcode"
              disabled={loading}
              className="text-2xl h-16 text-center font-mono border-2 focus:ring-4 focus:ring-blue-100 transition-all"
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5 flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">Error</p>
                <p className="text-lg text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !barcode.trim()}
            size="lg"
            className="w-full h-16 text-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="mr-3 h-6 w-6" />
                Scan Item
              </>
            )}
          </Button>
        </form>

        {/* Print Label Button (if completed items exist) */}
        {hasCompletedItems && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              onClick={handlePrintLabel}
              variant="outline"
              size="lg"
              className="w-full h-16 text-xl border-2 border-green-500 text-green-700 hover:bg-green-50 shadow-md hover:shadow-lg transition-all"
            >
              <Tag className="mr-3 h-6 w-6" />
              Print Label for Completed Items
            </Button>
          </div>
        )}

        {/* All Complete Message */}
        {allComplete && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xl text-green-900 font-bold mb-1">All items completed!</p>
                <p className="text-base text-green-700">
                  Click "Print Label" above or return to scan a new TO
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Instructions */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <p className="text-base text-gray-700 font-medium">Ready to scan item</p>
        </div>
      </div>
    </div>
  );
}

