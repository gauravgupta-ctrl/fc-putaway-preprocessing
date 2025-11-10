'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { findTransferOrderByNumber, logLabelPrint } from '@/lib/operator';
import { getPalletCount } from '@/lib/pallets';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Package, Printer } from 'lucide-react';
import type { TransferOrder } from '@/types/database';

export const dynamic = 'force-dynamic';

export default function OperatorHomePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedTO, setCompletedTO] = useState<TransferOrder | null>(null);
  const [palletCount, setPalletCount] = useState<number>(0);
  const [printing, setPrinting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  async function handleScan(code: string) {
    setError(null);
    setCompletedTO(null);
    setPalletCount(0);
    setLoading(true);

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);

    try {
      const transferOrder = await findTransferOrderByNumber(code);

      if (!transferOrder) {
        setError('Transfer Order not found. Please scan again.');
        setLoading(false);
        return;
      }

      // Check status
      const status = transferOrder.preprocessing_status;
      
      if (status === 'completed') {
        setError('Pre-processing for this Transfer Order is already completed.');
        setCompletedTO(transferOrder);
        
        // Get pallet count for the completed TO
        const count = await getPalletCount(transferOrder.id);
        setPalletCount(count || 0);
        
        setLoading(false);
        return;
      }

      if (status === 'not needed') {
        setError('This Transfer Order has not been requested for pre-processing yet.');
        setLoading(false);
        return;
      }

      // Status is "requested" or "in-progress" - proceed
      router.push(`/operator/scan-item?to=${transferOrder.id}`);
    } catch (error) {
      console.error('Error scanning TO:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  async function handlePrintLabels() {
    if (!completedTO) return;

    setPrinting(true);

    try {
      await logLabelPrint(completedTO.id, palletCount, userId);

      // Log to console (replace with actual printer integration later)
      console.log('PRINTING PALLET LABELS:', {
        transferOrder: completedTO.transfer_number,
        labelCount: palletCount,
        timestamp: new Date().toISOString(),
      });

      alert(`Successfully printed ${palletCount} pallet label(s) for ${completedTO.transfer_number}`);
      
      // Clear the state after successful print
      setCompletedTO(null);
      setPalletCount(0);
      setError(null);
      setPrinting(false);
    } catch (error) {
      console.error('Error logging label print:', error);
      alert('Failed to log label print. Please try again.');
      setPrinting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Content Container */}
      <div className="flex-1 flex flex-col px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Package className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Scan Transfer Order
          </h1>
          <p className="text-gray-600">
            Scan the TO barcode to begin pre-processing
          </p>
        </div>

        {/* Scanner */}
        <div className="max-w-md mx-auto w-full">
          <BarcodeScanner
            onScan={handleScan}
            placeholder="Enter TO number"
          />
        </div>

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
            
            {/* Print Labels Button for Completed TOs */}
            {completedTO && palletCount > 0 && (
              <div className="mt-4">
                <Button
                  onClick={handlePrintLabels}
                  disabled={printing}
                  size="lg"
                  variant="ghost"
                  className="w-full bg-transparent border-0 text-gray-700 hover:text-gray-900"
                >
                  {printing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent mr-2"></div>
                      Printing...
                    </>
                  ) : (
                    <>
                      <Printer className="h-5 w-5 mr-2" />
                      Print {palletCount} Label{palletCount !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-gray-900"></div>
            <p className="text-sm text-gray-600 mt-2">Validating...</p>
          </div>
        )}
      </div>
    </div>
  );
}

