'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Printer, CheckCircle, Package, Loader2 } from 'lucide-react';
import { createPalletLabel, getCompletedItemsCount } from '@/lib/operator';
import { supabase } from '@/lib/supabase';

function PrintLabelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transferOrderId = searchParams.get('to');
  const transferNumber = searchParams.get('num');

  const [labelCount, setLabelCount] = useState(1);
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!transferOrderId || !transferNumber) {
      router.push('/operator');
      return;
    }

    checkAuth();
    loadCompletedCount();
  }, [transferOrderId, transferNumber]);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  }

  async function loadCompletedCount() {
    if (!transferOrderId) return;
    const count = await getCompletedItemsCount(transferOrderId);
    setCompletedCount(count);
  }

  async function handlePrint() {
    if (!transferOrderId || !userId) return;

    setPrinting(true);

    try {
      // Create pallet label records
      for (let i = 1; i <= labelCount; i++) {
        await createPalletLabel(transferOrderId, i, labelCount, userId);
      }

      // Log the print request (in production, this would trigger actual printing)
      console.log('='.repeat(50));
      console.log('PALLET LABEL PRINT REQUEST');
      console.log('='.repeat(50));
      console.log(`Transfer Order: ${transferNumber}`);
      console.log(`Date/Time: ${new Date().toLocaleString()}`);
      console.log(`Total Labels: ${labelCount}`);
      console.log(`Completed Items: ${completedCount}`);
      console.log('='.repeat(50));
      
      for (let i = 1; i <= labelCount; i++) {
        console.log(`\nLabel ${i} of ${labelCount}:`);
        console.log('-----------------------------------');
        console.log(`PRE-PROCESSED`);
        console.log(`TO: ${transferNumber}`);
        console.log(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
        console.log(`Label ${i}/${labelCount}`);
        console.log('-----------------------------------');
      }

      console.log('\n' + '='.repeat(50));
      console.log('END PRINT REQUEST');
      console.log('='.repeat(50));

      setPrinted(true);
      setPrinting(false);

      // Show success message
      alert(`${labelCount} label(s) sent to printer!\n\nCheck console for label details.`);
    } catch (error) {
      console.error('Error printing labels:', error);
      alert('Failed to print labels. Please try again.');
      setPrinting(false);
    }
  }

  function handleDone() {
    router.push('/operator');
  }

  if (!transferOrderId || !transferNumber) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {!printed ? (
          <>
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Printer className="h-16 w-16 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Print Labels</h1>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {transferNumber}
              </Badge>
              <p className="text-gray-600 mt-4">{completedCount} items completed</p>
            </div>

            {/* Label Count Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Number of Labels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="labelCount">How many pallet labels?</Label>
                  <Input
                    id="labelCount"
                    type="number"
                    min={1}
                    max={10}
                    value={labelCount}
                    onChange={(e) => setLabelCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-2xl h-16 text-center"
                  />
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
                  <p className="font-semibold mb-2">Label Details:</p>
                  <p>• TO: {transferNumber}</p>
                  <p>• Date/Time: {new Date().toLocaleString()}</p>
                  <p>• Label format: "1 of {labelCount}", "2 of {labelCount}", etc.</p>
                </div>

                <Button
                  onClick={handlePrint}
                  disabled={printing || labelCount < 1}
                  className="w-full h-16 text-xl"
                >
                  {printing ? 'Printing...' : `Print ${labelCount} Label(s)`}
                </Button>

                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="w-full"
                >
                  Back
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Success Screen */
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <CheckCircle className="h-24 w-24 text-green-600 mx-auto" />
                <div>
                  <p className="text-2xl font-bold text-green-900 mb-2">
                    Labels Printed!
                  </p>
                  <p className="text-green-700">
                    {labelCount} label(s) sent to printer
                  </p>
                  <Badge variant="outline" className="text-lg px-4 py-2 mt-4">
                    {transferNumber}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleDone}
                    className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    Scan New Transfer Order
                  </Button>
                  <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Items
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PrintLabelsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PrintLabelsContent />
    </Suspense>
  );
}

