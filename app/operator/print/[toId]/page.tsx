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
      <div className="p-6 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <Card className="p-12 text-center shadow-2xl border-0 bg-white/90 backdrop-blur max-w-lg">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
            <CheckCircle className="h-14 w-14 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Labels Created!
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            {labelCount} label{labelCount > 1 ? 's' : ''} ready for printing
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <p className="text-base text-blue-700 font-medium">Returning to scan TO...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/operator/scan-item/${params.toId}`}
          className="inline-flex items-center text-blue-600 text-lg mb-4 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Scan Item
        </Link>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 shadow-lg">
          <p className="text-sm text-blue-100 mb-1 font-medium">Transfer Order</p>
          <p className="text-3xl font-bold text-white">{toNumber}</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-3 shadow-lg">
          <Printer className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Print Pallet Labels</h2>
        <p className="text-lg text-gray-600">
          {completedItems.length} item{completedItems.length > 1 ? 's' : ''} completed
        </p>
      </div>

      {/* Label Info Card */}
      <Card className="p-6 mb-6 shadow-lg border-0 bg-white/90 backdrop-blur">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Label Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Transfer Order</span>
            <span className="font-mono font-bold text-gray-900 text-lg">{toNumber}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Date</span>
            <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Time</span>
            <span className="font-medium text-gray-900">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600 font-medium">Items</span>
            <span className="font-bold text-blue-600 text-lg">{completedItems.length}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3 font-semibold uppercase tracking-wide">Completed Items:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {completedItems.map((item, idx) => (
              <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                <p className="font-mono font-bold text-gray-900">{item.sku}</p>
                <p className="text-sm text-gray-600 mt-1">{item.sku_data?.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Label Count Input */}
      <Card className="p-6 mb-6 shadow-lg border-0 bg-white/90 backdrop-blur">
        <Label htmlFor="label-count" className="text-lg font-semibold mb-3 block text-gray-700">
          Number of Labels to Print
        </Label>
        <Input
          id="label-count"
          type="number"
          min="1"
          max="10"
          value={labelCount}
          onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
          className="text-3xl h-16 text-center font-bold border-2 focus:ring-4 focus:ring-green-100"
        />
        <p className="text-sm text-gray-500 mt-3 text-center">
          Labels will be numbered: <span className="font-semibold">1 of {labelCount}</span>, <span className="font-semibold">2 of {labelCount}</span>, etc.
        </p>
      </Card>

      {/* Print Button */}
      <Button
        onClick={handlePrint}
        disabled={printing}
        size="lg"
        className="w-full h-20 text-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all mb-4"
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
          className="w-full h-16 text-xl border-2 hover:bg-gray-50 shadow-md transition-all"
          disabled={printing}
        >
          End Transfer Order
        </Button>
      </Link>
    </div>
  );
}

