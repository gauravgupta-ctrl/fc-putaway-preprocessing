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
    <div className="p-4 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Title */}
      <div className="text-center mb-8 mt-8">
        <Scan className="h-20 w-20 mx-auto mb-4 text-blue-600" />
        <h2 className="text-3xl font-bold mb-2">Scan Transfer Order</h2>
        <p className="text-lg text-gray-600">Scan the TO barcode to begin</p>
      </div>

      {/* Scan Form */}
      <Card className="p-8 flex-1 flex flex-col justify-center">
        <form onSubmit={handleScan} className="space-y-6">
          {/* Input */}
          <div>
            <label htmlFor="to-number" className="block text-xl font-medium mb-3">
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

          {/* Warning Message */}
          {warning && (
            <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <p className="text-xl text-yellow-800 font-medium">{warning}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !toNumber.trim()}
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
                Scan Transfer Order
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Instructions */}
      <div className="mt-6 text-center text-gray-600">
        <p className="text-lg">Place cursor in the field above and scan the barcode</p>
      </div>
    </div>
  );
}

