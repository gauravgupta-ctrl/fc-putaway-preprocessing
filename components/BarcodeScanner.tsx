'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, X, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  placeholder?: string;
  title?: string;
}

export function BarcodeScanner({ onScan, placeholder = 'Scan or enter code', title }: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [useManual, setUseManual] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount for external scanner
  useEffect(() => {
    if (!useManual && inputRef.current) {
      inputRef.current.focus();
    }
  }, [useManual]);

  // Handle external scanner input (keyboard wedge)
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (!useManual && !scanning) {
        // Auto-focus input when user starts typing
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }
    }

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [useManual, scanning]);

  async function startCameraScanning() {
    setScanning(true);
    setUseManual(true);

    try {
      const scanner = new Html5Qrcode('reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          stopScanning();
          onScan(decodedText);
        },
        (error) => {
          // Ignore errors during scanning
        }
      );
    } catch (error) {
      console.error('Error starting camera:', error);
      alert('Failed to start camera. Please use manual input.');
      setScanning(false);
    }
  }

  function stopScanning() {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
        setScanning(false);
      }).catch((err) => {
        console.error('Error stopping camera:', err);
      });
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  }

  return (
    <div className="space-y-4">
      {title && <h2 className="text-2xl font-bold text-center">{title}</h2>}

      {!scanning && (
        <>
          {/* External Scanner / Manual Input */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <Input
              ref={inputRef}
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={placeholder}
              className="text-lg h-14"
              autoFocus
            />
            <Button type="submit" className="w-full h-14 text-lg" size="lg">
              <Keyboard className="mr-2 h-5 w-5" />
              Submit
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Camera Scan */}
          <Button
            onClick={startCameraScanning}
            variant="outline"
            className="w-full h-14 text-lg"
            size="lg"
          >
            <Camera className="mr-2 h-5 w-5" />
            Use Camera
          </Button>
        </>
      )}

      {/* Camera Scanner View */}
      {scanning && (
        <div className="space-y-4">
          <div id="reader" className="rounded-lg overflow-hidden"></div>
          <Button onClick={stopScanning} variant="outline" className="w-full" size="lg">
            <X className="mr-2 h-5 w-5" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

