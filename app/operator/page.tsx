'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getTransferOrderByNumber } from '@/lib/operator';
import { Loader2, AlertCircle } from 'lucide-react';

export default function OperatorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan(transferNumber: string) {
    setLoading(true);
    setError(null);

    try {
      // Ensure transfer number has # prefix
      const formattedNumber = transferNumber.startsWith('#') 
        ? transferNumber 
        : `#${transferNumber}`;

      const to = await getTransferOrderByNumber(formattedNumber);

      if (!to) {
        setError('Transfer Order not found. Please scan again.');
        setLoading(false);
        return;
      }

      // Check TO status
      const status = to.preprocessing_status;
      
      if (status === 'not required') {
        setError('This TO does not require pre-processing.');
        setLoading(false);
        return;
      }

      if (status === 'completed') {
        setError('Pre-processing for this TO is already completed.');
        setLoading(false);
        return;
      }

      if (status === 'in review') {
        setError('This TO has not been requested for pre-processing yet.');
        setLoading(false);
        return;
      }

      // Valid statuses: requested, in-progress
      router.push(`/operator/${encodeURIComponent(formattedNumber)}`);
    } catch (error) {
      console.error('Error fetching TO:', error);
      setError('Failed to fetch Transfer Order. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Scan Transfer Order</h2>
              <p className="text-gray-600">Scan the TO barcode to begin</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <BarcodeScanner
                onScan={handleScan}
                placeholder="Scan or enter TO number"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

