'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { completeItemPreprocessing } from '@/lib/operator';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import Link from 'next/link';
import type { TransferOrderLine } from '@/types/database';

export default function OperatorConfirmPage({
  params,
}: {
  params: { toId: string; itemId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [toNumber, setToNumber] = useState('');
  const [item, setItem] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
    checkAuth();
  }, [params.toId, params.itemId]);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  }

  async function loadData() {
    setLoading(true);

    // Get TO details
    const { data: to } = await supabase
      .from('transfer_orders')
      .select('transfer_number')
      .eq('id', params.toId)
      .single();

    if (to) {
      setToNumber(to.transfer_number);
    }

    // Get item details
    const { data: itemData } = await supabase
      .from('transfer_order_lines')
      .select('*, sku_data:sku_attributes(*)')
      .eq('id', params.itemId)
      .single();

    if (itemData) {
      setItem(itemData);
    }

    setLoading(false);
  }

  async function handleConfirm() {
    setConfirming(true);

    try {
      await completeItemPreprocessing(params.itemId, userId);

      // Navigate back to scan item page
      router.push(`/operator/scan-item/${params.toId}`);
    } catch (error) {
      console.error('Error confirming preprocessing:', error);
      alert('Failed to confirm. Please try again.');
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const isRequested = item?.preprocessing_status === 'requested';
  const actionText = isRequested ? 'TO SHELVES' : 'TO PICK FACE';
  const actionColor = isRequested
    ? 'bg-red-500 text-white border-red-600'
    : 'bg-green-500 text-white border-green-600';

  return (
    <div className="p-4 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/operator/scan-item/${params.toId}`}
          className="inline-flex items-center text-blue-600 text-lg mb-4"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Scan Item
        </Link>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Transfer Order</p>
          <p className="text-2xl font-bold text-blue-900">{toNumber}</p>
        </div>
      </div>

      {/* Item Info */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <Package className="h-12 w-12 text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">SKU</p>
            <p className="text-2xl font-bold font-mono mb-3">{item?.sku}</p>
            <p className="text-lg text-gray-700">{item?.sku_data?.description}</p>
            <p className="text-base text-gray-500 mt-2">
              Quantity: {item?.units_incoming?.toLocaleString()} units
            </p>
          </div>
        </div>
      </Card>

      {/* Action Card */}
      <Card className="p-8 flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Send this item to:</h2>
          
          {/* Large Action Display */}
          <div
            className={`${actionColor} rounded-2xl p-12 mb-8 border-4 shadow-xl`}
          >
            <p className="text-5xl font-black tracking-wide">{actionText}</p>
          </div>

          <p className="text-lg text-gray-600 mb-2">
            {isRequested
              ? 'This item requires shelf storage'
              : 'This item goes to ASRS pick face'}
          </p>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={confirming}
          size="lg"
          className="w-full h-20 text-2xl bg-blue-600 hover:bg-blue-700"
        >
          {confirming ? (
            <>
              <Loader2 className="mr-3 h-8 w-8 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle className="mr-3 h-8 w-8" />
              Confirm
            </>
          )}
        </Button>

        {/* Cancel Button */}
        <Link href={`/operator/scan-item/${params.toId}`} className="mt-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-16 text-xl border-2"
            disabled={confirming}
          >
            Cancel
          </Button>
        </Link>
      </Card>
    </div>
  );
}

