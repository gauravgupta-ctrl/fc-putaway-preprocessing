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
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Select Pallet(s)
        </label>
        <div className="flex flex-wrap gap-2 items-start">
          {pallets.map((pallet, index) => (
            <div key={pallet.number} className="relative">
              <button
                type="button"
                onClick={() => togglePallet(pallet.number)}
                className={`w-14 h-14 rounded-lg font-bold text-lg transition-all ${
                  pallet.selected
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                {pallet.number}
              </button>
              {pallets.length > 1 && index === pallets.length - 1 && pallet.quantity === 0 && (
                <button
                  type="button"
                  onClick={() => deletePallet(pallet.number)}
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
            className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>
      </div>

      {/* Quantity Inputs for Selected Pallets */}
      {pallets.some((p) => p.selected) && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Assign Quantities
          </label>
          {pallets
            .filter((p) => p.selected)
            .map((pallet) => (
              <div key={pallet.number} className="bg-white rounded-lg border px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-20">
                    Pallet {pallet.number}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={pallet.quantity || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateQuantity(pallet.number, val === '' ? 0 : parseFloat(val));
                    }}
                    placeholder="0"
                    className="text-lg h-11 text-center font-semibold flex-1 border-gray-300"
                  />
                  <span className="text-sm text-gray-600">units</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span
            className={`text-sm font-bold ${
              isOverAllocated
                ? 'text-red-500'
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
                ? 'bg-red-300'
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

