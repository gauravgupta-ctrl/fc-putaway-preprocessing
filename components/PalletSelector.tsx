'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Check } from 'lucide-react';

interface PalletData {
  number: number;
  quantity: number;
}

interface PalletSelectorProps {
  totalExpected: number;
  initialAssignments?: { palletNumber: number; quantity: number }[];
  allTOPallets?: { palletNumber: number; totalQuantity: number; items: { sku: string; quantity: number }[] }[];
  currentSku?: string;
  onAssignmentsChange: (assignments: { palletNumber: number; quantity: number }[]) => void;
}

export function PalletSelector({
  totalExpected,
  initialAssignments = [],
  allTOPallets = [],
  currentSku = '',
  onAssignmentsChange,
}: PalletSelectorProps) {
  const [pallets, setPallets] = useState<PalletData[]>([{ number: 1, quantity: 0 }]);
  const [editingPallet, setEditingPallet] = useState<number | null>(1);
  const [tempQuantity, setTempQuantity] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load pallets from TO (preserve across items)
  useEffect(() => {
    // Determine max pallet number from either all TO pallets or initial assignments
    const maxFromTO = allTOPallets.length > 0 
      ? Math.max(...allTOPallets.map((p) => p.palletNumber))
      : 0;
    const maxFromInitial = initialAssignments.length > 0
      ? Math.max(...initialAssignments.map((a) => a.palletNumber))
      : 0;
    const maxPallet = Math.max(maxFromTO, maxFromInitial, 1);

    const newPallets: PalletData[] = [];

    for (let i = 1; i <= maxPallet; i++) {
      // Get quantity for current item from initial assignments
      const assignment = initialAssignments.find((a) => a.palletNumber === i);
      newPallets.push({
        number: i,
        quantity: assignment?.quantity || 0,
      });
    }

    setPallets(newPallets);
    setEditingPallet(null);
  }, [initialAssignments, allTOPallets]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingPallet !== null) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [editingPallet]);

  // Notify parent of changes
  useEffect(() => {
    const assignments = pallets
      .filter((p) => p.quantity > 0)
      .map((p) => ({ palletNumber: p.number, quantity: p.quantity }));
    onAssignmentsChange(assignments);
  }, [pallets, onAssignmentsChange]);

  function addPallet() {
    const nextNumber = pallets.length + 1;
    setPallets([...pallets, { number: nextNumber, quantity: 0 }]);
    setEditingPallet(nextNumber);
    setTempQuantity('');
  }

  function handlePalletClick(number: number) {
    const pallet = pallets.find((p) => p.number === number);
    if (!pallet) return;

    // Select for editing (whether it has quantity or not)
    setEditingPallet(number);
    setTempQuantity(pallet.quantity > 0 ? String(pallet.quantity) : '');
  }

  function saveQuantity() {
    if (editingPallet === null) return;
    
    const qty = parseFloat(tempQuantity) || 0;
    // Update quantity (including 0, which deselects the pallet)
    setPallets(pallets.map((p) => (p.number === editingPallet ? { ...p, quantity: qty } : p)));
    setEditingPallet(null);
    setTempQuantity('');
  }

  function cancelEdit() {
    setEditingPallet(null);
    setTempQuantity('');
  }

  function deletePallet(number: number) {
    const pallet = pallets.find((p) => p.number === number);
    
    // Check if current item has quantity on this pallet
    if (pallet && pallet.quantity > 0) {
      alert('Cannot delete pallet with assigned quantity for this item');
      return;
    }

    // Check if any other item in the TO has quantity on this pallet
    const toPallet = allTOPallets.find((p) => p.palletNumber === number);
    if (toPallet && toPallet.totalQuantity > 0) {
      alert('Cannot delete pallet - it has items from other SKUs');
      return;
    }

    setPallets(pallets.filter((p) => p.number !== number));
    if (editingPallet === number) {
      setEditingPallet(null);
    }
  }

  const totalAssigned = pallets.reduce((sum, p) => sum + p.quantity, 0);
  const progress = (totalAssigned / totalExpected) * 100;
  const isOverAllocated = totalAssigned > totalExpected;
  const isUnderAllocated = totalAssigned < totalExpected;

  return (
    <div className="space-y-4">
      {/* Pallet Squares */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Assign to Pallets
        </label>
        <div className="flex flex-wrap gap-2" style={{ marginLeft: '2px', marginRight: '2px' }}>
          {pallets.map((pallet, index) => (
            <div key={pallet.number} className="relative">
              <button
                type="button"
                onClick={() => handlePalletClick(pallet.number)}
                className={`w-14 h-14 rounded-lg font-bold transition-all ${
                  pallet.quantity > 0
                    ? 'bg-gray-200 text-gray-800'
                    : editingPallet === pallet.number
                    ? 'bg-white text-gray-700 border border-gray-400'
                    : 'bg-white text-gray-700 hover:border hover:border-gray-300'
                }`}
              >
                <div className="text-lg">{pallet.number}</div>
                {pallet.quantity > 0 && (
                  <div className="text-[10px] font-medium mt-0.5">{pallet.quantity}</div>
                )}
              </button>
              {pallets.length > 1 && index === pallets.length - 1 && pallet.quantity === 0 && editingPallet !== pallet.number && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePallet(pallet.number);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center hover:bg-gray-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPallet}
            className="w-14 h-14 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>
      </div>

      {/* Quantity Input Bar (always visible, shows selected pallet) */}
      <div className="bg-gray-100 rounded-lg border border-gray-300 p-4">
        <p className="text-sm text-gray-600 mb-3">
          {editingPallet !== null 
            ? `Enter quantity for Pallet ${editingPallet}`
            : 'Select a pallet above to assign quantity'}
        </p>
        <div className="flex items-center gap-3">
          <Input
            ref={inputRef}
            type="number"
            min="0"
            value={tempQuantity}
            onChange={(e) => setTempQuantity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveQuantity();
            }}
            placeholder="0"
            disabled={editingPallet === null}
            className="text-lg h-12 text-center font-semibold flex-1 bg-white border-0 focus-visible:ring-0 focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={saveQuantity}
            disabled={editingPallet === null || !tempQuantity}
            className="w-12 h-12 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span
            className={`text-sm font-bold ${
              isOverAllocated
                ? 'text-blue-600'
                : isUnderAllocated
                ? 'text-orange-500'
                : 'text-green-600'
            }`}
          >
            {totalAssigned} / {totalExpected} ({Math.round(progress)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOverAllocated
                ? 'bg-blue-300'
                : isUnderAllocated
                ? 'bg-orange-300'
                : 'bg-green-300'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

