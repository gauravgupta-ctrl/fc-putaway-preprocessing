import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 bg-white border-b shadow-sm z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/operator" className="flex items-center gap-2 text-gray-600">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-semibold">Pre-Processing</h1>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content - Full screen mobile optimized */}
      <main className="pb-safe">{children}</main>
    </div>
  );
}

