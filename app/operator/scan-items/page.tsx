'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Package, AlertCircle, CheckCircle, ArrowLeft, Printer } from 'lucide-react';
import {
  findItemByBarcode,
  completeItemProcessing,
  getTransferOrderItems,
  getCompletedItemsCount,
  getRequestedItemsCount,
  findTransferOrderByNumber,
} from '@/lib/operator';
import { supabase } from '@/lib/supabase';
import type { TransferOrderLine, SkuAttribute } from '@/types/database';

export default function ScanItemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transferOrderId = searchParams.get('to');
  const transferNumber = searchParams.get('num');

  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [scannedItem, setScannedItem] = useState<{
    line: TransferOrderLine;
    sku: SkuAttribute;
  } | null>(null);

  const [completedCount, setCompletedCount] = useState(0);
  const [requestedCount, setRequestedCount] = useState(0);
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    if (!transferOrderId || !transferNumber) {
      router.push('/operator');
      return;
    }
    
    checkAuth();
    loadCounts();
  }, [transferOrderId, transferNumber]);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  }

  async function loadCounts() {
    if (!transferOrderId) return;

    const [completed, requested] = await Promise.all([
      getCompletedItemsCount(transferOrderId),
      getRequestedItemsCount(transferOrderId),
    ]);

    setCompletedCount(completed);
    setRequestedCount(requested);

    // Check if all requested items are completed
    if (requested > 0 && completed >= requested) {
      setAllComplete(true);
    }
  }

  async function handleScan(barcode: string) {
    if (!transferOrderId) return;

    setError('');
    setWarning('');
    setLoading(true);
    setScannedItem(null);

    try {
      const result = await findItemByBarcode(barcode, transferOrderId);

      if (!result) {
        setError('Item not found in this Transfer Order. Please scan again.');
        setLoading(false);
        return;
      }

      // Check if already completed
      if (result.line.preprocessing_status === 'completed') {
        setWarning('This item has already been processed. Processing again...');
      } else if (result.line.preprocessing_status === 'in-progress') {
        setWarning('This item is being processed by another operator. Processing anyway...');
      }

      setScannedItem(result);
      setLoading(false);
    } catch (error) {
      console.error('Error scanning item:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!scannedItem || !transferOrderId) return;

    setLoading(true);

    try {
      await completeItemProcessing(scannedItem.line.id, userId);
      
      // Reload counts
      await loadCounts();
      
      // Clear scanned item
      setScannedItem(null);
      setWarning('');
      setError('');
      
      // Show success briefly
      setWarning('Item completed successfully!');
      setTimeout(() => setWarning(''), 2000);
      
      setLoading(false);
    } catch (error) {
      console.error('Error confirming item:', error);
      setError('Failed to complete item. Please try again.');
      setLoading(false);
    }
  }

  function handleAbort() {
    if (confirm('Are you sure you want to abort this Transfer Order?')) {
      router.push('/operator');
    }
  }

  function handlePrintLabels() {
    router.push(`/operator/print-labels?to=${transferOrderId}&num=${transferNumber}`);
  }

  if (!transferOrderId || !transferNumber) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleAbort}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Abort
          </Button>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {transferNumber}
          </Badge>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Progress</p>
              <p className="text-3xl font-bold">
                {completedCount} / {requestedCount}
              </p>
              <p className="text-sm text-gray-600 mt-1">items completed</p>
            </div>
          </CardContent>
        </Card>

        {/* All Complete Message */}
        {allComplete ? (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                <div>
                  <p className="text-xl font-semibold text-green-900">All Items Complete!</p>
                  <p className="text-green-700">Ready to print pallet labels</p>
                </div>
                <Button
                  onClick={handlePrintLabels}
                  className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Labels
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Scanner Card */
          <>
            {!scannedItem && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Scan Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarcodeScanner
                    onScan={handleScan}
                    placeholder="Scan item barcode..."
                    label="Scan next item"
                  />
                </CardContent>
              </Card>
            )}

            {/* Scanned Item Action */}
            {scannedItem && (
              <Card className="border-2">
                <CardContent className="pt-6 space-y-4">
                  {/* Item Info */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">SKU</p>
                    <p className="text-2xl font-mono font-bold">{scannedItem.sku.sku}</p>
                    <p className="text-gray-700 mt-1">{scannedItem.sku.description}</p>
                  </div>

                  {/* Action */}
                  <div className={`p-8 rounded-lg ${
                    scannedItem.line.preprocessing_status === 'requested'
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  }`}>
                    <p className="text-4xl font-bold text-white text-center">
                      {scannedItem.line.preprocessing_status === 'requested'
                        ? 'TO SHELF'
                        : 'TO PICK FACE'}
                    </p>
                  </div>

                  {/* Confirm Button */}
                  <Button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="w-full h-16 text-xl"
                  >
                    {loading ? 'Processing...' : 'Confirm'}
                  </Button>

                  {/* Cancel */}
                  <Button
                    onClick={() => setScannedItem(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Print Button (if any completed) */}
        {completedCount > 0 && !allComplete && (
          <Button
            onClick={handlePrintLabels}
            variant="outline"
            className="w-full h-12"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Labels ({completedCount} items)
          </Button>
        )}

        {/* Warning Message */}
        {warning && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-900">{warning}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-900">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && !scannedItem && (
          <div className="text-center text-gray-600">
            <p>Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
}

