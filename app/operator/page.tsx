'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Scan } from 'lucide-react';
import { findTransferOrderByBarcode } from '@/lib/operator';

export default function OperatorHomePage() {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Auto-focus input for barcode scanner
    inputRef.current?.focus();
  }, []);

  async function handleScan() {
    if (!barcode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const to = await findTransferOrderByBarcode(barcode.trim());

      if (!to) {
        setError('Transfer Order not found. Please scan again.');
        setBarcode('');
        inputRef.current?.focus();
        return;
      }

      // Check status
      if (to.preprocessing_status === 'not required') {
        setError('This Transfer Order does not require pre-processing.');
        setBarcode('');
        inputRef.current?.focus();
        return;
      }

      if (to.preprocessing_status === 'completed') {
        setError('This Transfer Order has already been completed.');
        setBarcode('');
        inputRef.current?.focus();
        return;
      }

      // Valid TO - proceed to item scanning
      router.push(`/operator/scan-item?toId=${to.id}&toNumber=${to.transfer_number}`);
    } catch (err) {
      console.error('Error scanning TO:', err);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
            <Scan className="w-12 h-12 text-gray-600" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Scan Transfer Order</h2>
          <p className="text-gray-600">Scan the TO barcode to begin</p>
        </div>

        {/* Input */}
        <Card className="p-6">
          <div className="space-y-4">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Scan or enter TO number..."
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

        {/* Help text */}
        <p className="text-sm text-gray-500 text-center">
          Supported formats: #T0303 or T0303
        </p>
      </div>
    </div>
  );
}

