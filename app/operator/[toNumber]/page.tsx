'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  getTransferOrderByNumber,
  getItemByBarcode,
  completeItemPreprocessing,
  markTOInProgress,
  getPreprocessingCounts,
  isTOPreprocessingComplete,
  logPalletLabelPrint,
  type TOWithItems,
} from '@/lib/operator';
import { supabase } from '@/lib/supabase';
import type { TransferOrderLine, SkuAttribute } from '@/types/database';
import { Loader2, AlertCircle, CheckCircle, XCircle, Printer, Home } from 'lucide-react';

type ScanState = 'scanning' | 'confirming' | 'completed';

export default function TOItemsPage() {
  const router = useRouter();
  const params = useParams();
  const toNumber = decodeURIComponent(params.toNumber as string);

  const [to, setTO] = useState<TOWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ScanState>('scanning');
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Current scanned item
  const [currentItem, setCurrentItem] = useState<(TransferOrderLine & { sku_data: SkuAttribute }) | null>(null);
  
  // Label printing
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [labelCount, setLabelCount] = useState(1);

  useEffect(() => {
    loadData();
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  }

  async function loadData() {
    setLoading(true);
    try {
      const toData = await getTransferOrderByNumber(toNumber);
      if (!toData) {
        setError('Transfer Order not found');
        setLoading(false);
        return;
      }

      setTO(toData);

      // Mark as in-progress if status is 'requested'
      if (toData.preprocessing_status === 'requested') {
        await markTOInProgress(toData.id, userId);
        toData.preprocessing_status = 'in-progress';
      }

      // Check if already completed
      if (isTOPreprocessingComplete(toData.items)) {
        setState('completed');
      }
    } catch (error) {
      console.error('Error loading TO:', error);
      setError('Failed to load Transfer Order');
    } finally {
      setLoading(false);
    }
  }

  async function handleItemScan(barcode: string) {
    if (!to) return;

    setLoading(true);
    setError(null);

    try {
      const item = await getItemByBarcode(to.id, barcode);

      if (!item) {
        setError('Item not found in this Transfer Order');
        setLoading(false);
        return;
      }

      // Show warning if already completed
      if (item.preprocessing_status === 'completed') {
        setError(`Warning: This item was already processed. Proceeding anyway.`);
      }

      setCurrentItem(item);
      setState('confirming');
    } catch (error) {
      console.error('Error scanning item:', error);
      setError('Failed to scan item');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!currentItem || !to) return;

    setLoading(true);
    try {
      await completeItemPreprocessing(currentItem.id, userId);

      // Reload TO data
      await loadData();

      // Check if all items are done
      const updatedTO = await getTransferOrderByNumber(toNumber);
      if (updatedTO && isTOPreprocessingComplete(updatedTO.items)) {
        setState('completed');
      } else {
        // Reset to scanning
        setState('scanning');
        setCurrentItem(null);
      }
    } catch (error) {
      console.error('Error confirming item:', error);
      setError('Failed to confirm item');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setState('scanning');
    setCurrentItem(null);
    setError(null);
  }

  async function handlePrintLabels() {
    if (!to) return;

    try {
      await logPalletLabelPrint(to.id, labelCount, userId);
      alert(`Printing ${labelCount} label(s) for ${toNumber}`);
      setShowPrintDialog(false);
      setLabelCount(1);
    } catch (error) {
      console.error('Error printing labels:', error);
      alert('Failed to log label print');
    }
  }

  function handleAbort() {
    router.push('/operator');
  }

  if (loading && !to) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && !to) {
    return (
      <div className="max-w-md mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleAbort} className="w-full mt-4" size="lg">
          <Home className="mr-2 h-5 w-5" />
          Back to Start
        </Button>
      </div>
    );
  }

  if (!to) return null;

  const counts = getPreprocessingCounts(to.items);

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* TO Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transfer Order</p>
              <p className="text-2xl font-bold">{toNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-xl font-semibold">
                {counts.completed} / {counts.total}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* State: Scanning */}
      {state === 'scanning' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Scan Item</h2>
                <p className="text-gray-600">Scan the item barcode</p>
              </div>

              {error && (
                <Alert variant={error.includes('Warning') ? 'default' : 'destructive'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {counts.completed > 0 && (
                <Button
                  onClick={() => setShowPrintDialog(true)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Printer className="mr-2 h-5 w-5" />
                  Print Labels ({counts.completed} items processed)
                </Button>
              )}

              <BarcodeScanner
                onScan={handleItemScan}
                placeholder="Scan or enter item barcode"
              />

              <Button onClick={handleAbort} variant="outline" className="w-full" size="lg">
                <Home className="mr-2 h-5 w-5" />
                Abort & Return
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* State: Confirming */}
      {state === 'confirming' && currentItem && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Item Info */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Item</p>
                <p className="text-xl font-bold">{currentItem.sku}</p>
                <p className="text-gray-600">{currentItem.sku_data?.description}</p>
              </div>

              {/* Action Display */}
              <div className="py-12">
                {currentItem.preprocessing_status === 'requested' ? (
                  <div className="bg-red-500 text-white rounded-lg p-8 text-center">
                    <div className="text-6xl font-bold mb-2">TO SHELF</div>
                    <p className="text-xl">Pre-process this item</p>
                  </div>
                ) : (
                  <div className="bg-green-500 text-white rounded-lg p-8 text-center">
                    <div className="text-6xl font-bold mb-2">TO PICK FACE</div>
                    <p className="text-xl">Standard processing</p>
                  </div>
                )}
              </div>

              {/* Confirm Button */}
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full h-16 text-xl"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-6 w-6" />
                )}
                Confirm
              </Button>

              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                <XCircle className="mr-2 h-5 w-5" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* State: Completed */}
      {state === 'completed' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Pre-processing Complete!</h2>
                <p className="text-gray-600">
                  All items for {toNumber} have been processed
                </p>
              </div>

              <Button
                onClick={() => setShowPrintDialog(true)}
                className="w-full h-14"
                size="lg"
              >
                <Printer className="mr-2 h-5 w-5" />
                Print Pallet Labels
              </Button>

              <Button
                onClick={handleAbort}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Home className="mr-2 h-5 w-5" />
                Scan New TO
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Dialog */}
      {showPrintDialog && (
        <Card className="border-2 border-blue-500">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center">Print Labels</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of labels
                </label>
                <Input
                  type="number"
                  min={1}
                  value={labelCount}
                  onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
                  className="text-lg h-12"
                />
              </div>

              <Button onClick={handlePrintLabels} className="w-full" size="lg">
                <Printer className="mr-2 h-5 w-5" />
                Print {labelCount} Label{labelCount > 1 ? 's' : ''}
              </Button>

              <Button
                onClick={() => setShowPrintDialog(false)}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

