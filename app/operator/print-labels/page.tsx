'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logLabelPrint, getCompletedItems } from '@/lib/operator';
import { getPalletCount, cleanupAndResequencePallets } from '@/lib/pallets';
import { supabase } from '@/lib/supabase';
import { Printer, CheckCircle, Home, ChevronLeft, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PrintLabelsPage() {
  const [toNumber, setToNumber] = useState('');
  const [merchant, setMerchant] = useState('');
  const [reserveDestination, setReserveDestination] = useState<string | null>(null);
  const [labelCount, setLabelCount] = useState(1);
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<any[]>([]);
  const [isAllCompleted, setIsAllCompleted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toId = searchParams.get('to');
  const completed = searchParams.get('completed') === 'true';

  useEffect(() => {
    initialize();
  }, [toId, completed]);

  async function initialize() {
    setIsAllCompleted(completed);
    // Ensure userId is loaded before loadData
    await checkAuth();
    await loadData();
  }

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id || null;
    setUserId(currentUserId);
    return currentUserId;
  }

  async function loadData() {
    if (!toId) return;

    // Ensure userId is available
    const currentUserId = userId || await checkAuth();

    // Load TO info with merchant
    const { data: toData } = await supabase
      .from('transfer_orders')
      .select('transfer_number, merchant')
      .eq('id', toId)
      .single();

    if (toData) {
      setToNumber(toData.transfer_number);
      setMerchant(toData.merchant);

      // Get merchant's reserve destination
      const { data: merchantData } = await supabase
        .from('eligible_merchants')
        .select('reserve_destination')
        .eq('merchant_name', toData.merchant)
        .single();

      if (merchantData) {
        setReserveDestination(merchantData.reserve_destination);
      }
    }

    // Load completed items
    const items = await getCompletedItems(toId);
    setCompletedItems(items);

    // If all items are completed, cleanup and resequence pallets
    if (completed && currentUserId) {
      await cleanupAndResequencePallets(toId, currentUserId);
    }

    // Get pallet count from assignments (after cleanup)
    const palletCount = await getPalletCount(toId);
    setLabelCount(palletCount || 1); // Default to 1 if no pallets
  }

  async function handlePrint() {
    if (!toId) return;

    setPrinting(true);

    try {
      // Ensure userId is available before printing
      const currentUserId = userId || await checkAuth();
      
      if (!currentUserId) {
        throw new Error('User not authenticated. Please log in again.');
      }

      await logLabelPrint(toId, labelCount, currentUserId);

      // Log to console (replace with actual printer integration later)
      console.log('PRINTING PALLET LABELS:', {
        transferOrder: toNumber,
        labelCount,
        completedItems: completedItems.length,
        timestamp: new Date().toISOString(),
      });

      // Show success
      setPrinted(true);
      setPrinting(false);

      // Auto-redirect after 2 seconds if all completed
      if (isAllCompleted) {
        setTimeout(() => {
          router.push('/operator');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error logging label print:', error);
      alert(`Failed to log label print: ${error.message || 'Please try again.'}`);
      setPrinting(false);
    }
  }

  function handleContinue() {
    if (isAllCompleted) {
      router.push('/operator');
    } else {
      router.push(`/operator/scan-item?to=${toId}`);
    }
  }

  if (printed && isAllCompleted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            All Complete!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Pre-processing completed for {toNumber}
          </p>
          <p className="text-sm text-gray-500">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* TO Info Bar */}
      <div className="bg-white border-b px-4 py-3">
        <p className="text-sm text-gray-600">Transfer Order</p>
        <p className="text-lg font-bold text-gray-900">{toNumber}</p>
        {reserveDestination && (
          <p className="text-sm text-gray-600 mt-1">
            Zone: <span className="font-medium text-gray-900">{reserveDestination}</span>
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-8">
        {isAllCompleted && (
          <div className="max-w-md mx-auto w-full mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-900">
                All Items Completed
              </p>
              <p className="text-sm text-green-700 mt-1">
                Pre-processing complete for this Transfer Order
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Printer className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Print Pallet Labels
          </h1>
          <p className="text-gray-600">
            {completedItems.length} item(s) completed
          </p>
          {reserveDestination && (
            <p className="text-sm text-gray-600 mt-2">
              Send pallets to: <span className="font-semibold text-gray-900">{reserveDestination}</span>
            </p>
          )}
        </div>

        {/* Label Count Display */}
        <div className="max-w-md mx-auto w-full mb-8">
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <Label className="text-base mb-4 block">
              Labels to Print
            </Label>
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {labelCount}
            </div>
            <p className="text-sm text-gray-600">
              Based on {labelCount} pallet{labelCount !== 1 ? 's' : ''} used
            </p>
            {labelCount > 1 && (
              <p className="text-sm text-gray-500 mt-3">
                Labels will be numbered 1 of {labelCount}, 2 of {labelCount}, etc.
              </p>
            )}
          </div>
        </div>

        {/* Print Button */}
        <div className="max-w-md mx-auto w-full space-y-3">
          <Button
            onClick={handlePrint}
            disabled={printing || printed}
            size="lg"
            className="w-full h-16 text-xl font-semibold"
          >
            {printing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                Printing...
              </>
            ) : printed ? (
              <>
                <CheckCircle className="h-6 w-6 mr-3" />
                Printed {labelCount} Label(s)
              </>
            ) : (
              <>
                <Printer className="h-6 w-6 mr-3" />
                Print {labelCount} Label(s)
              </>
            )}
          </Button>

          {printed && !isAllCompleted && (
            <Button
              onClick={handleContinue}
              size="lg"
              variant="outline"
              className="w-full h-14 text-lg"
            >
              Continue Scanning Items
            </Button>
          )}

          {printed && isAllCompleted && (
            <Button
              onClick={() => router.push('/operator')}
              size="lg"
              variant="outline"
              className="w-full h-14 text-lg"
            >
              <Home className="h-5 w-5 mr-2" />
              Scan New Transfer Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

