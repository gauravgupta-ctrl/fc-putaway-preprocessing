'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function EndFlowPage() {
  const searchParams = useSearchParams();
  const toNumber = searchParams.get('toNumber');
  const router = useRouter();

  function handleNewTO() {
    router.push('/operator');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Processing Complete!</h2>
          <p className="text-lg text-gray-600">
            Transfer Order <span className="font-mono font-semibold">{toNumber}</span> has been
            processed.
          </p>
        </div>

        {/* Action Button */}
        <Button onClick={handleNewTO} className="w-full h-16 text-xl" size="lg">
          Scan New Transfer Order
        </Button>
      </div>
    </div>
  );
}

