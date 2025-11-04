import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Mobile-optimized header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Operator Portal</h1>
              <p className="text-sm text-gray-500">Pre-processing Workflow</p>
            </div>
          </div>
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
        </div>
      </header>

      {/* Main content - mobile optimized */}
      <main className="max-w-2xl mx-auto">
        {children}
      </main>
    </div>
  );
}

