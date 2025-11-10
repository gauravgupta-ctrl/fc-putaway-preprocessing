'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, RotateCcw } from 'lucide-react';

interface PalletData {
  number: number;
  quantity: number;
  cartonCount: number;
}

interface PalletSelectorCartonProps {
  totalExpected: number;
  currentItemQuantity: number;
  currentItemCartons: number;
  allTOPallets: { palletNumber: number; totalQuantity: number; totalCartons: number; items: { sku: string; quantity: number; cartonCount: number }[] }[];
  currentSku: string;
  onCartonAdd: (palletNumber: number, cartonQuantity: number) => Promise<void>;
  onClearItem: () => Promise<void>;
  onInputStateChange?: (isInputFocused: boolean) => void;
  onSelectionChange?: (palletNumber: number, cartonQuantity: number) => void;
}

export function PalletSelectorCarton({
  totalExpected,
  currentItemQuantity,
  currentItemCartons,
  allTOPallets = [],
  currentSku = '',
  onCartonAdd,
  onClearItem,
  onInputStateChange,
  onSelectionChange,
}: PalletSelectorCartonProps) {
  const [pallets, setPallets] = useState<PalletData[]>([{ number: 1, quantity: 0, cartonCount: 0 }]);
  const [selectedPallet, setSelectedPallet] = useState<number>(1);
  const [cartonQuantity, setCartonQuantity] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load pallets from TO
  useEffect(() => {
    const maxPallet = allTOPallets.length > 0 
      ? Math.max(...allTOPallets.map((p) => p.palletNumber))
      : 1;

    const newPallets: PalletData[] = [];

    for (let i = 1; i <= maxPallet; i++) {
      const toPallet = allTOPallets.find((p) => p.palletNumber === i);
      const currentItem = toPallet?.items.find((item) => item.sku === currentSku);
      
      newPallets.push({
        number: i,
        quantity: currentItem?.quantity || 0,
        cartonCount: currentItem?.cartonCount || 0,
      });
    }

    setPallets(newPallets);
    
    // Auto-select pallet: if 1 pallet select it, if multiple select last
    const palletToSelect = newPallets.length === 1 ? 1 : newPallets.length;
    setSelectedPallet(palletToSelect);
  }, [allTOPallets, currentSku]);

  // Notify parent about input focus state
  useEffect(() => {
    if (onInputStateChange) {
      onInputStateChange(isInputFocused);
    }
  }, [isInputFocused, onInputStateChange]);

  // Notify parent about selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const qty = parseFloat(cartonQuantity) || 0;
      onSelectionChange(selectedPallet, qty);
    }
  }, [selectedPallet, cartonQuantity, onSelectionChange]);

  function handleInputFocus() {
    setIsInputFocused(true);
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300);
  }

  function handleInputBlur() {
    setIsInputFocused(false);
  }

  function addPallet() {
    const nextNumber = pallets.length + 1;
    setPallets([...pallets, { number: nextNumber, quantity: 0, cartonCount: 0 }]);
    setSelectedPallet(nextNumber);
  }

  function handlePalletClick(number: number) {
    setSelectedPallet(number);
  }

  async function handleAddCarton() {
    if (!cartonQuantity || isAdding) return;
    
    const qty = parseFloat(cartonQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid carton quantity');
      return;
    }

    setIsAdding(true);
    
    try {
      await onCartonAdd(selectedPallet, qty);
      setCartonQuantity('');
    } catch (error) {
      console.error('Error adding carton:', error);
      alert('Failed to add carton. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }


  async function handleClearItem() {
    if (isClearing) return;

    if (!confirm(`Clear all assignments for ${currentSku}?\n\nThis will remove all quantities and cartons from all pallets for this item.`)) {
      return;
    }

    setIsClearing(true);
    
    try {
      await onClearItem();
      setCartonQuantity('');
    } catch (error) {
      console.error('Error clearing item:', error);
      alert('Failed to clear item. Please try again.');
    } finally {
      setIsClearing(false);
    }
  }

  function canDeletePallet(number: number): boolean {
    const toPallet = allTOPallets.find((p) => p.palletNumber === number);
    if (!toPallet || toPallet.totalQuantity === 0) {
      return true; // Can delete if empty
    }
    return false;
  }

  function deletePallet(number: number) {
    if (!canDeletePallet(number)) {
      alert('Cannot delete pallet - it has assigned quantities');
      return;
    }

    const filteredPallets = pallets.filter((p) => p.number !== number);
    const renumberedPallets = filteredPallets.map((p, index) => ({
      ...p,
      number: index + 1,
    }));

    setPallets(renumberedPallets);
    if (selectedPallet === number) {
      setSelectedPallet(renumberedPallets.length > 0 ? renumberedPallets[renumberedPallets.length - 1].number : 1);
    }
  }

  const totalAssigned = currentItemQuantity;
  const progress = (totalAssigned / totalExpected) * 100;
  const isOverAllocated = totalAssigned > totalExpected;
  const isUnderAllocated = totalAssigned < totalExpected;

  return (
    <div className="space-y-4">
      {/* Carton Quantity Input - MOVED TO TOP */}
      <div className="bg-gray-100 rounded-lg border border-gray-300 p-4">
        <p className="text-sm text-gray-600 mb-3">
          Enter retail unit quantity in current carton
        </p>
        <div className="flex items-center gap-3">
          <Input
            ref={inputRef}
            type="number"
            min="1"
            step="1"
            value={cartonQuantity}
            onChange={(e) => setCartonQuantity(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCarton();
            }}
            placeholder="Enter quantity"
            className="text-lg h-12 text-center font-semibold flex-1 bg-white border-0 focus-visible:ring-0 focus-visible:outline-none"
          />
        </div>
      </div>

      {/* Pallet Squares */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Select Pallet
        </label>
        <div className="flex flex-wrap gap-2" style={{ marginLeft: '2px', marginRight: '2px' }}>
          {pallets.map((pallet) => (
            <div key={pallet.number} className="relative">
              <button
                type="button"
                onClick={() => handlePalletClick(pallet.number)}
                className={`w-16 h-16 rounded-lg font-bold transition-all ${
                  selectedPallet === pallet.number
                    ? 'bg-gray-200 text-gray-800 border-2 border-gray-600'
                    : pallet.quantity > 0
                    ? 'bg-gray-200 text-gray-800 border border-gray-200'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-lg">{pallet.number}</div>
                {pallet.quantity > 0 && (
                  <>
                    <div className="text-[11px] font-medium">{pallet.quantity}</div>
                    <div className="text-[9px] text-gray-600">{pallet.cartonCount} ctns</div>
                  </>
                )}
              </button>
              {pallets.length > 1 && canDeletePallet(pallet.number) && (
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

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span
            className={`text-sm font-bold ${
              isOverAllocated
                ? 'text-blue-600'
                : isUnderAllocated
                ? 'text-orange-600'
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
                ? 'bg-blue-600'
                : isUnderAllocated
                ? 'bg-orange-600'
                : 'bg-green-600'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Clear Item Button */}
      <div className="bg-white rounded-lg p-3">
        <Button
          onClick={handleClearItem}
          disabled={isClearing || currentItemQuantity === 0}
          variant="ghost"
          size="sm"
          className="w-full text-gray-600 hover:text-red-600"
        >
          {isClearing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-900 border-t-transparent mr-1"></div>
              Clearing...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear Current Item
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

