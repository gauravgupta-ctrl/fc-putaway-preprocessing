'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface SimpleBarcodeInputProps {
  onScan: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SimpleBarcodeInput({ 
  onScan, 
  placeholder = 'Scan or enter code', 
  disabled = false 
}: SimpleBarcodeInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onScan(value.trim());
      setValue('');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="text-xl h-16 text-center font-mono"
        autoFocus
        disabled={disabled}
      />
    </form>
  );
}

