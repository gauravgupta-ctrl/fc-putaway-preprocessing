import Link from 'next/link';
import { Settings, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Putaway Preprocess</h1>
              <p className="text-sm text-gray-600">Admin Portal</p>
            </div>
            <nav className="flex gap-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

