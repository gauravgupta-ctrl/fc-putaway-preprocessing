'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface PalletData {
  number: number;
  quantity: number;
  selected: boolean;
}

interface PalletSelectorProps {
  totalExpected: number;
  initialAssignments?: { palletNumber: number; quantity: number }[];
  onAssignmentsChange: (assignments: { palletNumber: number; quantity: number }[]) => void;
}

export function PalletSelector({
  totalExpected,
  initialAssignments = [],
  onAssignmentsChange,
}: PalletSelectorProps) {
  const [pallets, setPallets] = useState<PalletData[]>([
    { number: 1, quantity: 0, selected: true },
  ]);

  // Load initial assignments
  useEffect(() => {
    if (initialAssignments.length > 0) {
      const maxPallet = Math.max(...initialAssignments.map((a) => a.palletNumber));
      const newPallets: PalletData[] = [];

      for (let i = 1; i <= maxPallet; i++) {
        const assignment = initialAssignments.find((a) => a.palletNumber === i);
        newPallets.push({
          number: i,
          quantity: assignment?.quantity || 0,
          selected: !!assignment,
        });
      }

      setPallets(newPallets);
    }
  }, [initialAssignments]);

  // Notify parent of changes
  useEffect(() => {
    const assignments = pallets
      .filter((p) => p.selected && p.quantity > 0)
      .map((p) => ({ palletNumber: p.number, quantity: p.quantity }));
    onAssignmentsChange(assignments);
  }, [pallets, onAssignmentsChange]);

  function addPallet() {
    const nextNumber = pallets.length + 1;
    setPallets([...pallets, { number: nextNumber, quantity: 0, selected: false }]);
  }

  function togglePallet(number: number) {
    setPallets(
      pallets.map((p) =>
        p.number === number
          ? { ...p, selected: !p.selected, quantity: p.selected ? 0 : p.quantity }
          : p
      )
    );
  }

  function updateQuantity(number: number, quantity: number) {
    setPallets(pallets.map((p) => (p.number === number ? { ...p, quantity } : p)));
  }

  function deletePallet(number: number) {
    const pallet = pallets.find((p) => p.number === number);
    if (pallet && pallet.quantity > 0) {
      alert('Cannot delete pallet with assigned quantity');
      return;
    }
    setPallets(pallets.filter((p) => p.number !== number));
  }

  const totalAssigned = pallets
    .filter((p) => p.selected)
    .reduce((sum, p) => sum + p.quantity, 0);
  const progress = (totalAssigned / totalExpected) * 100;
  const isOverAllocated = totalAssigned > totalExpected;
  const isUnderAllocated = totalAssigned < totalExpected;

  return (
    <div className="space-y-6">
      {/* Pallet Squares */}
      <div>
        <label className="block text-base font-medium text-gray-900 mb-3">
          Select Pallet(s)
        </label>
        <div className="flex flex-wrap gap-3 items-start">
          {pallets.map((pallet) => (
            <div key={pallet.number} className="relative">
              <button
                type="button"
                onClick={() => togglePallet(pallet.number)}
                className={`w-16 h-16 rounded-lg border-2 font-bold text-xl transition-all ${
                  pallet.selected
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {pallet.number}
              </button>
              {pallets.length > 1 && pallet.quantity === 0 && (
                <button
                  type="button"
                  onClick={() => deletePallet(pallet.number)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPallet}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>
      </div>

      {/* Quantity Inputs for Selected Pallets */}
      {pallets.some((p) => p.selected) && (
        <div className="space-y-3">
          <label className="block text-base font-medium text-gray-900">
            Assign Quantities
          </label>
          {pallets
            .filter((p) => p.selected)
            .map((pallet) => (
              <div key={pallet.number} className="flex items-center gap-3">
                <div className="w-20 text-right">
                  <span className="text-sm font-medium text-gray-700">
                    Pallet {pallet.number}:
                  </span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={pallet.quantity || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateQuantity(pallet.number, val === '' ? 0 : parseFloat(val));
                  }}
                  placeholder="0"
                  className="text-lg h-12 text-center font-semibold flex-1"
                />
                <span className="text-sm text-gray-600 w-16">units</span>
              </div>
            ))}
        </div>
      )}

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span
            className={`text-sm font-bold ${
              isOverAllocated
                ? 'text-red-600'
                : isUnderAllocated
                ? 'text-orange-600'
                : 'text-green-600'
            }`}
          >
            {totalAssigned} / {totalExpected} ({Math.round(progress)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isOverAllocated
                ? 'bg-red-500'
                : isUnderAllocated
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        {isOverAllocated && (
          <p className="text-sm text-red-600 mt-2">
            ⚠️ Over-allocated by {totalAssigned - totalExpected} units
          </p>
        )}
        {isUnderAllocated && totalAssigned > 0 && (
          <p className="text-sm text-orange-600 mt-2">
            ⚠️ Under-allocated by {totalExpected - totalAssigned} units
          </p>
        )}
      </div>
    </div>
  );
}

