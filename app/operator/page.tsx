'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { scanTransferOrder } from '@/lib/operator';
import { Loader2, Scan, AlertCircle } from 'lucide-react';

export default function OperatorScanTOPage() {
  const [toNumber, setToNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus();
  }, []);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!toNumber.trim()) return;

    setLoading(true);
    setError('');
    setWarning('');

    try {
      const result = await scanTransferOrder(toNumber);

      if (!result.success) {
        setError(result.error || 'Failed to scan TO');
        setToNumber('');
        inputRef.current?.focus();
        setLoading(false);
        return;
      }

      if (result.warning) {
        setWarning(result.warning);
      }

      // Navigate to scan item page
      if (result.transferOrder) {
        router.push(`/operator/scan-item/${result.transferOrder.id}`);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to scan Transfer Order');
      setToNumber('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Title */}
      <div className="text-center mb-8 mt-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
          <Scan className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Scan Transfer Order
        </h2>
        <p className="text-lg text-gray-600">Scan the TO barcode to begin pre-processing</p>
      </div>

      {/* Scan Form */}
      <Card className="p-8 flex-1 flex flex-col justify-center shadow-xl border-0 bg-white/80 backdrop-blur">
        <form onSubmit={handleScan} className="space-y-6">
          {/* Input */}
          <div>
            <label htmlFor="to-number" className="block text-lg font-semibold mb-3 text-gray-700">
              Transfer Order Number
            </label>
            <Input
              ref={inputRef}
              id="to-number"
              type="text"
              value={toNumber}
              onChange={(e) => setToNumber(e.target.value)}
              placeholder="Scan or enter TO number"
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

          {/* Warning Message */}
          {warning && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-5 flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">Warning</p>
                <p className="text-lg text-amber-800">{warning}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !toNumber.trim()}
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
                Scan Transfer Order
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Instructions */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <p className="text-base text-gray-700 font-medium">Ready to scan</p>
        </div>
      </div>
    </div>
  );
}

