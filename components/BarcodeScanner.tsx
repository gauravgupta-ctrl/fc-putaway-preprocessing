'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
}

export function BarcodeScanner({
  onScan,
  placeholder = 'Scan or enter code',
  label,
  autoFocus = true,
}: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [scanMode, setScanMode] = useState<'bluetooth' | 'manual'>('bluetooth');
  const inputRef = useRef<HTMLInputElement>(null);
  const bluetoothBufferRef = useRef('');
  const bluetoothTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle bluetooth scanner input (types like keyboard)
  useEffect(() => {
    if (scanMode !== 'bluetooth') return;

    function handleKeyPress(e: KeyboardEvent) {
      // Ignore if user is typing in an input field
      if (document.activeElement?.tagName === 'INPUT' && document.activeElement !== inputRef.current) {
        return;
      }

      // Enter key = end of scan
      if (e.key === 'Enter' && bluetoothBufferRef.current) {
        e.preventDefault();
        const scannedCode = bluetoothBufferRef.current.trim();
        bluetoothBufferRef.current = '';
        
        if (scannedCode) {
          onScan(scannedCode);
        }
        return;
      }

      // Ignore special keys
      if (e.key.length > 1 && e.key !== 'Enter') return;

      // Add character to buffer
      bluetoothBufferRef.current += e.key;

      // Clear buffer after 100ms of no input (scanner types fast)
      clearTimeout(bluetoothTimeoutRef.current);
      bluetoothTimeoutRef.current = setTimeout(() => {
        bluetoothBufferRef.current = '';
      }, 100);
    }

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(bluetoothTimeoutRef.current);
    };
  }, [scanMode, onScan]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  }

  function handleInputFocus() {
    // Scroll the input into view when keyboard appears on mobile
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300); // Delay to allow keyboard to appear first
  }

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-lg font-medium text-gray-900">
          {label}
        </label>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setScanMode('bluetooth')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-colors ${
            scanMode === 'bluetooth'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Camera className="h-5 w-5" />
          Scanner
        </button>
        <button
          type="button"
          onClick={() => setScanMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-colors ${
            scanMode === 'manual'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Keyboard className="h-5 w-5" />
          Manual
        </button>
      </div>

      {/* Scanner Ready Indicator */}
      {scanMode === 'bluetooth' && (
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <Camera className="h-12 w-12 mx-auto mb-3 text-gray-600" />
          <p className="text-lg font-medium text-gray-900 mb-1">
            Scanner Ready
          </p>
          <p className="text-sm text-gray-600">
            Scan barcode with your bluetooth scanner
          </p>
        </div>
      )}

      {/* Manual Input */}
      {scanMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <Input
            ref={inputRef}
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="text-lg h-14 text-center font-mono"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg"
            disabled={!manualInput.trim()}
          >
            Submit
          </Button>
        </form>
      )}
    </div>
  );
}

