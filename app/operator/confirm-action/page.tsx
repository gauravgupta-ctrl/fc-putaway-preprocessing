'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { confirmItemAction, areAllItemsCompleted } from '@/lib/operator';
import { supabase } from '@/lib/supabase';
import { ArrowRight, CheckCircle } from 'lucide-react';
import type { TransferOrderLineWithSku } from '@/types/database';

export default function ConfirmActionPage() {
  const [item, setItem] = useState<TransferOrderLineWithSku | null>(null);
  const [toNumber, setToNumber] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toId = searchParams.get('to');
  const itemId = searchParams.get('item');

  useEffect(() => {
    loadData();
    checkAuth();
  }, [toId, itemId]);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  }

  async function loadData() {
    if (!toId || !itemId) return;

    // Load TO info
    const { data: toData } = await supabase
      .from('transfer_orders')
      .select('transfer_number')
      .eq('id', toId)
      .single();

    if (toData) {
      setToNumber(toData.transfer_number);
    }

    // Load item info
    const { data: itemData } = await supabase
      .from('transfer_order_lines')
      .select(`
        *,
        sku_data:sku_attributes(*)
      `)
      .eq('id', itemId)
      .single();

    if (itemData) {
      setItem(itemData as TransferOrderLineWithSku);
    }
  }

  async function handleConfirm() {
    if (!itemId || !toId) return;

    setConfirming(true);

    try {
      await confirmItemAction(itemId, userId);

      // Check if all items are completed
      const allCompleted = await areAllItemsCompleted(toId);

      if (allCompleted) {
        // Go to print labels page
        router.push(`/operator/print-labels?to=${toId}&completed=true`);
      } else {
        // Go back to scan item
        router.push(`/operator/scan-item?to=${toId}`);
      }
    } catch (error) {
      console.error('Error confirming action:', error);
      alert('Failed to confirm action. Please try again.');
      setConfirming(false);
    }
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-900"></div>
      </div>
    );
  }

  const action = item.preprocessing_status === 'requested' ? 'shelf' : 'pickface';
  const actionColor = action === 'shelf' ? 'red' : 'green';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* TO Info Bar */}
      <div className="bg-white border-b px-4 py-3">
        <p className="text-sm text-gray-600">Transfer Order</p>
        <p className="text-lg font-bold text-gray-900">{toNumber}</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-8">
        {/* Item Info */}
        <div className="max-w-md mx-auto w-full mb-8">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600 mb-1">Item</p>
            <p className="text-xl font-bold text-gray-900 mb-4 font-mono">
              {item.sku}
            </p>
            <p className="text-gray-700">
              {item.sku_data?.description || 'No description'}
            </p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-semibold">{item.units_incoming}</span>
            </div>
          </div>
        </div>

        {/* Action Indicator */}
        <div className="max-w-md mx-auto w-full mb-8">
          <div
            className={`${
              actionColor === 'red'
                ? 'bg-red-500'
                : 'bg-green-500'
            } rounded-2xl p-8 text-white text-center shadow-lg`}
          >
            <p className="text-sm font-medium mb-2 opacity-90">
              Place this item in:
            </p>
            <p className="text-4xl font-bold mb-2">
              {action === 'shelf' ? 'SHELF' : 'RESERVE'}
            </p>
            <p className="text-sm opacity-90">
              {action === 'shelf' ? 'Store on shelves' : 'Send to reserve storage'}
            </p>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="max-w-md mx-auto w-full">
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            size="lg"
            className="w-full h-16 text-xl font-semibold"
          >
            {confirming ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-6 w-6 mr-3" />
                Confirm Action
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

