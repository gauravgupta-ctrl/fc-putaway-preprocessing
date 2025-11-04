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
    <div className="p-4 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Header with TO number */}
      <div className="mb-6">
        <Link href="/operator" className="inline-flex items-center text-blue-600 text-lg mb-4">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Scan TO
        </Link>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Transfer Order</p>
          <p className="text-2xl font-bold text-blue-900">{toNumber}</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <Scan className="h-16 w-16 mx-auto mb-3 text-blue-600" />
        <h2 className="text-2xl font-bold mb-2">Scan Item Barcode</h2>
        <p className="text-lg text-gray-600">Scan the item to pre-process</p>
      </div>

      {/* Scan Form */}
      <Card className="p-6 flex-1 flex flex-col justify-center">
        <form onSubmit={handleScan} className="space-y-6">
          {/* Input */}
          <div>
            <label htmlFor="barcode" className="block text-xl font-medium mb-3">
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
              className="text-2xl h-16 text-center font-mono"
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              <p className="text-xl text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !barcode.trim()}
            size="lg"
            className="w-full h-16 text-xl"
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
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={handlePrintLabel}
              variant="outline"
              size="lg"
              className="w-full h-16 text-xl border-2 border-green-500 text-green-700 hover:bg-green-50"
            >
              <Tag className="mr-3 h-6 w-6" />
              Print Label for Completed Items
            </Button>
          </div>
        )}

        {/* All Complete Message */}
        {allComplete && (
          <div className="mt-6 bg-green-50 border-2 border-green-500 rounded-lg p-4 text-center">
            <p className="text-xl text-green-800 font-bold mb-2">
              ✓ All items completed!
            </p>
            <p className="text-lg text-green-700">
              Click "Print Label" above or return to scan a new TO
            </p>
          </div>
        )}
      </Card>

      {/* Instructions */}
      <div className="mt-4 text-center text-gray-600">
        <p className="text-base">Scan the item barcode with your scanner</p>
      </div>
    </div>
  );
}

