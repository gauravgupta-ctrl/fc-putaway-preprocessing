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
  onAssignmentsChange: (assignments: { palletNumber: number; quantity: number }[]) => void;
}

export function PalletSelector({
  totalExpected,
  initialAssignments = [],
  onAssignmentsChange,
}: PalletSelectorProps) {
  const [pallets, setPallets] = useState<PalletData[]>([{ number: 1, quantity: 0 }]);
  const [editingPallet, setEditingPallet] = useState<number | null>(1);
  const [tempQuantity, setTempQuantity] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
        });
      }

      setPallets(newPallets);
      setEditingPallet(null);
    }
  }, [initialAssignments]);

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

    if (pallet.quantity > 0) {
      // Deselect: remove quantity
      if (confirm('Remove quantity from this pallet?')) {
        setPallets(pallets.map((p) => (p.number === number ? { ...p, quantity: 0 } : p)));
      }
    } else {
      // Start editing
      setEditingPallet(number);
      setTempQuantity('');
    }
  }

  function saveQuantity() {
    if (editingPallet === null) return;
    
    const qty = parseFloat(tempQuantity) || 0;
    if (qty > 0) {
      setPallets(pallets.map((p) => (p.number === editingPallet ? { ...p, quantity: qty } : p)));
    }
    setEditingPallet(null);
    setTempQuantity('');
  }

  function cancelEdit() {
    setEditingPallet(null);
    setTempQuantity('');
  }

  function deletePallet(number: number) {
    const pallet = pallets.find((p) => p.number === number);
    if (pallet && pallet.quantity > 0) {
      alert('Cannot delete pallet with assigned quantity');
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
      {/* Pallet Squares with Inline Editing */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Assign to Pallets
        </label>
        <div className="flex flex-wrap gap-2">
          {pallets.map((pallet, index) => (
            <div key={pallet.number} className="relative">
              {editingPallet === pallet.number ? (
                /* Editing Mode - Input Field */
                <div className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 rounded-lg border-2 border-black bg-white flex flex-col items-center justify-center">
                    <Input
                      ref={inputRef}
                      type="number"
                      min="0"
                      value={tempQuantity}
                      onChange={(e) => setTempQuantity(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveQuantity();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      placeholder="0"
                      className="w-12 h-8 text-center text-sm font-bold border-0 p-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={saveQuantity}
                      className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode - Pallet Square */
                <button
                  type="button"
                  onClick={() => handlePalletClick(pallet.number)}
                  className={`w-14 h-14 rounded-lg font-bold transition-all ${
                    pallet.quantity > 0
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg">{pallet.number}</div>
                  {pallet.quantity > 0 && (
                    <div className="text-[10px] font-medium mt-0.5">{pallet.quantity}</div>
                  )}
                </button>
              )}
              {pallets.length > 1 && index === pallets.length - 1 && pallet.quantity === 0 && editingPallet !== pallet.number && (
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
          {editingPallet === null && (
            <button
              type="button"
              onClick={addPallet}
              className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Plus className="h-7 w-7" />
            </button>
          )}
        </div>
      </div>

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

