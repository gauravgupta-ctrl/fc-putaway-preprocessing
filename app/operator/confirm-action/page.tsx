'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, AlertTriangle, Check } from 'lucide-react';
import { completeProcessingItem } from '@/lib/operator';
import { supabase } from '@/lib/supabase';

export default function ConfirmActionPage() {
  const searchParams = useSearchParams();
  const toId = searchParams.get('toId');
  const toNumber = searchParams.get('toNumber');
  const itemId = searchParams.get('itemId');
  const sku = searchParams.get('sku');
  const status = searchParams.get('status');
  const warning = searchParams.get('warning');
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!toId || !toNumber || !itemId || !sku) {
      router.push('/operator');
      return;
    }
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  }

  const shouldGoToShelf = status === 'requested';
  const actionText = shouldGoToShelf ? 'TO SHELF' : 'TO PICK FACE';
  const actionColor = shouldGoToShelf ? 'bg-red-500' : 'bg-green-500';

  async function handleConfirm() {
    if (!itemId) return;

    setLoading(true);
    try {
      await completeProcessingItem(itemId, userId);

      // Go back to scan item page
      router.push(`/operator/scan-item?toId=${toId}&toNumber=${toNumber}`);
    } catch (err) {
      console.error('Error completing item:', err);
      alert('Failed to complete item. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)]">
      {/* TO Info */}
      <div className="bg-gray-50 border-b px-6 py-4">
        <div>
          <p className="text-sm text-gray-600">Transfer Order</p>
          <p className="text-xl font-bold">{toNumber}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* SKU Info */}
          <Card className="p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Item SKU</p>
            <p className="text-2xl font-bold font-mono">{sku}</p>
          </Card>

          {/* Warning (if exists) */}
          {warning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-yellow-800 text-sm">{decodeURIComponent(warning)}</p>
            </div>
          )}

          {/* Action Display */}
          <div className="space-y-4">
            <p className="text-center text-lg font-medium text-gray-700">
              Place this item in:
            </p>

            <div
              className={`${actionColor} text-white rounded-2xl p-12 text-center shadow-lg`}
            >
              <p className="text-4xl font-bold">{actionText}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full h-16 text-xl bg-black hover:bg-gray-800"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-6 w-6" />
                  Confirm
                </>
              )}
            </Button>

            <Button
              onClick={handleCancel}
              disabled={loading}
              variant="outline"
              className="w-full h-14 text-lg"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

