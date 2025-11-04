'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Package, AlertCircle } from 'lucide-react';
import { findTransferOrderByNumber } from '@/lib/operator';
import type { TransferOrder } from '@/types/database';

export default function OperatorPage() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleScan(transferNumber: string) {
    setError('');
    setLoading(true);

    try {
      // Add # if not present
      const formattedNumber = transferNumber.startsWith('#') 
        ? transferNumber 
        : `#${transferNumber}`;

      const transferOrder = await findTransferOrderByNumber(formattedNumber);

      if (!transferOrder) {
        setError('Transfer Order not found. Please scan again.');
        setLoading(false);
        return;
      }

      // Check status
      if (transferOrder.preprocessing_status === 'not required') {
        setError('This Transfer Order does not require pre-processing.');
        setLoading(false);
        return;
      }

      if (transferOrder.preprocessing_status === 'completed') {
        setError('This Transfer Order has already been completed.');
        setLoading(false);
        return;
      }

      if (transferOrder.preprocessing_status === 'in review') {
        setError('This Transfer Order has not been requested for pre-processing yet.');
        setLoading(false);
        return;
      }

      // Valid statuses: "requested" or "in-progress"
      if (transferOrder.preprocessing_status === 'requested' || 
          transferOrder.preprocessing_status === 'in-progress') {
        // Navigate to scan items page
        router.push(`/operator/scan-items?to=${transferOrder.id}&num=${formattedNumber}`);
      } else {
        setError('Invalid Transfer Order status.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error scanning TO:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Package className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pre-Processing</h1>
          <p className="text-gray-600">Scan Transfer Order to begin</p>
        </div>

        {/* Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Scan Transfer Order</CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeScanner
              onScan={handleScan}
              placeholder="Scan TO barcode..."
              label="Position barcode in scanner"
            />
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center text-gray-600">
            <p>Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
}

