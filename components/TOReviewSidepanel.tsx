'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { TransferOrder } from '@/types/database';
import { format } from 'date-fns';

interface PalletAssignment {
  id: string;
  pallet_number: number;
  sku: string;
  quantity: number;
  sku_description?: string;
}

interface TOReviewSidepanelProps {
  transferOrder: TransferOrder;
  onClose: () => void;
}

export function TOReviewSidepanel({ transferOrder, onClose }: TOReviewSidepanelProps) {
  const [palletAssignments, setPalletAssignments] = useState<PalletAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPalletAssignments();
  }, [transferOrder.id]);

  async function loadPalletAssignments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pallet_assignments')
      .select(`
        id,
        pallet_number,
        sku,
        quantity,
        sku_data:sku_attributes(description)
      `)
      .eq('transfer_order_id', transferOrder.id)
      .order('pallet_number', { ascending: true })
      .order('sku', { ascending: true });

    if (data && !error) {
      const assignments = data.map((item: any) => ({
        id: item.id,
        pallet_number: item.pallet_number,
        sku: item.sku,
        quantity: item.quantity,
        sku_description: item.sku_data?.description || '',
      }));
      setPalletAssignments(assignments);
    }
    setLoading(false);
  }

  // Group by pallet number
  const palletGroups = palletAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.pallet_number]) {
      acc[assignment.pallet_number] = [];
    }
    acc[assignment.pallet_number].push(assignment);
    return acc;
  }, {} as Record<number, PalletAssignment[]>);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidepanel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transfer Order Details</h2>
            <p className="text-sm text-gray-600 mt-1">Pre-processing review</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TO Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Transfer Number</p>
                <p className="font-semibold text-gray-900">{transferOrder.transfer_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Merchant</p>
                <p className="font-semibold text-gray-900">{transferOrder.merchant}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Destination</p>
                <p className="font-semibold text-gray-900">{transferOrder.destination || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Est. Arrival</p>
                <p className="font-semibold text-gray-900">
                  {transferOrder.estimated_arrival
                    ? format(new Date(transferOrder.estimated_arrival), 'MMM dd, yyyy')
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Pallet Assignments */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pallet Assignments</h3>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-gray-900"></div>
              </div>
            ) : Object.keys(palletGroups).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No pallet assignments found
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(palletGroups)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([palletNumber, items]) => (
                    <div
                      key={palletNumber}
                      className="bg-white border rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-800">
                          {palletNumber}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Pallet {palletNumber}</p>
                          <p className="text-xs text-gray-600">
                            {items.length} item{items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Items in this pallet */}
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-gray-50 rounded p-3"
                          >
                            <div className="flex-1">
                              <p className="font-mono font-semibold text-sm text-gray-900">
                                {item.sku}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {item.sku_description || 'No description'}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs text-gray-600">Quantity</p>
                              <p className="font-bold text-lg text-gray-900">{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

