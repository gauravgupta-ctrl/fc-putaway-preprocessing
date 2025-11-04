import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile-optimized header */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Operator</h1>
          <Link
            href="/"
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
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

