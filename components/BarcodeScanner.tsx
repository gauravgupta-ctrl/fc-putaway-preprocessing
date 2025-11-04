'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
  label?: string;
}

export function BarcodeScanner({ onScan, placeholder, label }: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [scanMode, setScanMode] = useState<'auto' | 'manual'>('auto');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input for external scanner
  useEffect(() => {
    if (scanMode === 'auto' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  // Handle external scanner input (auto-submit on Enter)
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && manualInput.trim()) {
      e.preventDefault();
      onScan(manualInput.trim());
      setManualInput('');
    }
  }

  function handleManualSubmit() {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  }

  return (
    <div className="space-y-4">
      {label && <p className="text-lg font-medium text-center">{label}</p>}
      
      {/* Mode Toggle */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={scanMode === 'auto' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScanMode('auto')}
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Scanner
        </Button>
        <Button
          variant={scanMode === 'manual' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScanMode('manual')}
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
        </Button>
      </div>

      {scanMode === 'auto' ? (
        /* External Scanner Mode */
        <div className="space-y-2">
          <Input
            ref={inputRef}
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Scan barcode...'}
            className="text-xl h-16 text-center font-mono"
            autoFocus
          />
          <p className="text-sm text-gray-500 text-center">
            Use external scanner or type and press Enter
          </p>
        </div>
      ) : (
        /* Camera Scanner Mode */
        <div className="space-y-2">
          <Input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={placeholder || 'Enter barcode manually'}
            className="text-xl h-16 text-center font-mono"
          />
          <Button 
            onClick={handleManualSubmit} 
            className="w-full h-14 text-lg"
            disabled={!manualInput.trim()}
          >
            Submit
          </Button>
          <p className="text-sm text-gray-500 text-center">
            Camera scanning coming soon - use manual entry
          </p>
        </div>
      )}
    </div>
  );
}

