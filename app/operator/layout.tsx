import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Putaway Pre-processing</h1>
            <Link
              href="/"
              className="p-2 -mr-2 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile optimized, no extra padding */}
      <main className="pb-safe">{children}</main>
    </div>
  );
}

