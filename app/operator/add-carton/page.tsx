'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getAllTOPallets, addCartonToPallet, clearItemAssignments } from '@/lib/pallets';
import { supabase } from '@/lib/supabase';
import { X, Package, ArrowRight } from 'lucide-react';
import { PalletSelectorCarton } from '@/components/PalletSelectorCarton';
import type { TransferOrderLineWithSku } from '@/types/database';

export const dynamic = 'force-dynamic';

export default function AddCartonPage() {
  const [item, setItem] = useState<TransferOrderLineWithSku | null>(null);
  const [toNumber, setToNumber] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [allTOPallets, setAllTOPallets] = useState<any[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentItemQty, setCurrentItemQty] = useState(0);
  const [currentItemCartons, setCurrentItemCartons] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toId = searchParams.get('to');
  const itemId = searchParams.get('item');

  useEffect(() => {
    loadData();
    checkAuth();
  }, [toId, itemId]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
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
      
      // Load all pallets for this TO
      const toPallets = await getAllTOPallets(toId);
      setAllTOPallets(toPallets);

      // Calculate current item's total quantity and cartons
      const currentItem = toPallets
        .flatMap(p => p.items)
        .filter(i => i.sku === itemData.sku);
      
      const totalQty = currentItem.reduce((sum, i) => sum + i.quantity, 0);
      const totalCartons = currentItem.reduce((sum, i) => sum + i.cartonCount, 0);
      
      setCurrentItemQty(totalQty);
      setCurrentItemCartons(totalCartons);
    }
  }

  function handleAbort() {
    if (confirm('Are you sure you want to abort this Transfer Order?')) {
      router.push('/operator');
    }
  }

  async function handleCartonAdd(palletNumber: number, cartonQuantity: number) {
    if (!toId || !itemId || !item) return;

    await addCartonToPallet(toId, itemId, item.sku, palletNumber, cartonQuantity, userId);
    
    // Update item status based on quantity
    const newTotalQty = currentItemQty + cartonQuantity;
    const expected = item.units_incoming || 0;
    
    let newStatus: 'partially completed' | 'completed' = 'partially completed';
    if (newTotalQty >= expected) {
      newStatus = 'completed';
    }

    await supabase
      .from('transfer_order_lines')
      .update({ preprocessing_status: newStatus })
      .eq('id', itemId);

    // Navigate back to scan item page
    router.push(`/operator/scan-item?to=${toId}`);
  }

  async function handleClearItem() {
    if (!toId || !item) return;

    await clearItemAssignments(toId, item.sku, userId);
    
    // Reset status to requested
    await supabase
      .from('transfer_order_lines')
      .update({ preprocessing_status: 'requested' })
      .eq('id', itemId);

    // Reload data
    await loadData();
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-900"></div>
      </div>
    );
  }

  const toReserve = item.preprocessing_status === 'requested' || 
                     item.preprocessing_status === 'partially completed' || 
                     item.preprocessing_status === 'completed';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* TO Info Bar with Abort Button */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-gray-600">Transfer Order</p>
            <p className="text-lg font-bold text-gray-900">{toNumber}</p>
          </div>
          <div className="flex-1 flex justify-end">
            <Button
              onClick={handleAbort}
              variant="ghost"
              size="sm"
              className="bg-transparent"
            >
              <X className="h-4 w-4 mr-1" />
              Abort
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-6">
        {toReserve ? (
          <>
            {/* Item Info */}
            <div className="max-w-md mx-auto w-full mb-4">
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs text-gray-600 mb-1">Item</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-bold text-gray-900 font-mono">
                    {item.sku}
                  </p>
                  <p className="text-sm text-gray-600 truncate text-right">
                    {item.sku_data?.description || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Indicator */}
            <div className="max-w-md mx-auto w-full mb-4">
              <div className="bg-red-500 rounded-xl p-6 text-white text-center">
                <p className="text-2xl font-bold">TO RESERVE</p>
              </div>
            </div>

            {/* Pallet Assignment */}
            <div className="max-w-md mx-auto w-full mb-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <PalletSelectorCarton
                  totalExpected={item.units_incoming || 0}
                  currentItemQuantity={currentItemQty}
                  currentItemCartons={currentItemCartons}
                  allTOPallets={allTOPallets}
                  currentSku={item.sku}
                  onCartonAdd={handleCartonAdd}
                  onClearItem={handleClearItem}
                  onInputStateChange={setIsInputFocused}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* TO PICK FACE Flow */}
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

            <div className="max-w-md mx-auto w-full mb-8">
              <div className="bg-green-500 rounded-2xl p-8 text-white text-center shadow-lg">
                <p className="text-sm font-medium mb-2 opacity-90">
                  Place this item in:
                </p>
                <p className="text-4xl font-bold mb-2">
                  PICK FACE
                </p>
                <p className="text-sm opacity-90">
                  Send to ASRS pick face
                </p>
              </div>
            </div>
          </>
        )}

        {/* Action Button */}
        <div className="max-w-md mx-auto w-full mt-auto">
          <Button
            onClick={() => router.push(`/operator/scan-item?to=${toId}`)}
            size="lg"
            variant="ghost"
            className="w-full h-16 text-xl font-semibold bg-transparent"
          >
            <ArrowRight className="h-6 w-6 mr-3" />
            Continue Scanning
          </Button>
        </div>
      </div>
    </div>
  );
}

