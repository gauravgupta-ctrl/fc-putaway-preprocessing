'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Printer, Check } from 'lucide-react';
import { generatePalletLabels, getPreprocessingItems } from '@/lib/operator';
import { supabase } from '@/lib/supabase';

export default function PrintLabelsPage() {
  const searchParams = useSearchParams();
  const toId = searchParams.get('toId');
  const toNumber = searchParams.get('toNumber');
  const fromScan = searchParams.get('fromScan') === 'true';
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [allComplete, setAllComplete] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!toId || !toNumber) {
      router.push('/operator');
      return;
    }
    checkAuth();
    checkCompletion();
  }, [toId]);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  }

  async function checkCompletion() {
    if (!toId) return;
    try {
      const items = await getPreprocessingItems(toId);
      const completed = items.filter((item) => item.preprocessing_status === 'completed');
      const requested = items.filter((item) => item.preprocessing_status === 'requested');

      setCompletedCount(completed.length);
      setAllComplete(requested.length === 0 && completed.length > 0);
    } catch (err) {
      console.error('Error checking completion:', err);
    }
  }

  async function handlePrint() {
    if (!toId || !userId || quantity < 1) return;

    setLoading(true);
    try {
      await generatePalletLabels(toId, quantity, userId);

      // Show success message
      alert(`Print request sent for ${quantity} label(s)!`);

      // If came from scan page, go back
      // If all items complete, go to end flow
      if (fromScan) {
        router.push(`/operator/scan-item?toId=${toId}&toNumber=${toNumber}`);
      } else {
        router.push(`/operator/end-flow?toId=${toId}&toNumber=${toNumber}`);
      }
    } catch (err) {
      console.error('Error printing labels:', err);
      alert('Failed to request print. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    if (fromScan) {
      router.push(`/operator/scan-item?toId=${toId}&toNumber=${toNumber}`);
    } else {
      router.push(`/operator/end-flow?toId=${toId}&toNumber=${toNumber}`);
    }
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
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Printer className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Print Pallet Labels</h2>
            {allComplete ? (
              <p className="text-green-600 font-medium">
                ✓ All items processed ({completedCount} items)
              </p>
            ) : (
              <p className="text-gray-600">{completedCount} item(s) completed</p>
            )}
          </div>

          {/* Quantity Input */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity" className="text-base">
                  Number of labels
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-2xl h-16 text-center font-bold mt-2"
                />
              </div>

              <p className="text-sm text-gray-500 text-center">
                Each label will include: TO #{toNumber}, date/time, "PRE-PROCESSED"
              </p>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handlePrint}
              disabled={loading || !userId || quantity < 1}
              className="w-full h-16 text-xl"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-6 w-6" />
                  Print {quantity} Label{quantity > 1 ? 's' : ''}
                </>
              )}
            </Button>

            <Button
              onClick={handleSkip}
              disabled={loading}
              variant="outline"
              className="w-full h-14 text-lg"
              size="lg"
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

