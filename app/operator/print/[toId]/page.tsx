'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPalletLabels, getCompletedItems } from '@/lib/operator';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Printer, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function OperatorPrintPage({ params }: { params: { toId: string } }) {
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [labelCount, setLabelCount] = useState(1);
  const [toNumber, setToNumber] = useState('');
  const [completedItems, setCompletedItems] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
    checkAuth();
  }, [params.toId]);

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

    // Get completed items
    const items = await getCompletedItems(params.toId);
    setCompletedItems(items);

    setLoading(false);
  }

  async function handlePrint() {
    setPrinting(true);

    try {
      await createPalletLabels(params.toId, labelCount, userId);
      setPrintSuccess(true);

      // Show success message briefly, then navigate
      setTimeout(() => {
        router.push('/operator');
      }, 2000);
    } catch (error) {
      console.error('Error creating labels:', error);
      alert('Failed to print labels. Please try again.');
      setPrinting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (printSuccess) {
    return (
      <div className="p-4 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-green-700 mb-4">
            Labels Created Successfully!
          </h2>
          <p className="text-xl text-gray-600">
            {labelCount} label{labelCount > 1 ? 's' : ''} ready for printing
          </p>
          <p className="text-lg text-gray-500 mt-4">Returning to scan TO...</p>
        </div>
      </div>
    );
  }

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

      {/* Title */}
      <div className="text-center mb-6">
        <Printer className="h-16 w-16 mx-auto mb-3 text-blue-600" />
        <h2 className="text-2xl font-bold mb-2">Print Pallet Labels</h2>
        <p className="text-lg text-gray-600">
          {completedItems.length} item{completedItems.length > 1 ? 's' : ''} completed
        </p>
      </div>

      {/* Label Info Card */}
      <Card className="p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Label Information</h3>
        <div className="space-y-3 text-lg">
          <div className="flex justify-between">
            <span className="text-gray-600">Transfer Order:</span>
            <span className="font-mono font-bold">{toNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Items:</span>
            <span className="font-medium">{completedItems.length}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Completed Items:</p>
          <div className="space-y-2">
            {completedItems.map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded">
                <p className="font-mono font-medium">{item.sku}</p>
                <p className="text-sm text-gray-600">{item.sku_data?.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Label Count Input */}
      <Card className="p-6 mb-6">
        <Label htmlFor="label-count" className="text-xl font-medium mb-3 block">
          Number of Labels
        </Label>
        <Input
          id="label-count"
          type="number"
          min="1"
          max="10"
          value={labelCount}
          onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
          className="text-2xl h-16 text-center"
        />
        <p className="text-sm text-gray-600 mt-2 text-center">
          Labels will be numbered 1 of {labelCount}, 2 of {labelCount}, etc.
        </p>
      </Card>

      {/* Print Button */}
      <Button
        onClick={handlePrint}
        disabled={printing}
        size="lg"
        className="w-full h-20 text-2xl bg-green-600 hover:bg-green-700 mb-4"
      >
        {printing ? (
          <>
            <Loader2 className="mr-3 h-8 w-8 animate-spin" />
            Creating Labels...
          </>
        ) : (
          <>
            <Printer className="mr-3 h-8 w-8" />
            Print {labelCount} Label{labelCount > 1 ? 's' : ''}
          </>
        )}
      </Button>

      {/* End TO Button */}
      <Link href="/operator">
        <Button
          variant="outline"
          size="lg"
          className="w-full h-16 text-xl border-2"
          disabled={printing}
        >
          End Transfer Order
        </Button>
      </Link>
    </div>
  );
}

