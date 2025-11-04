'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, LayoutDashboard, Package, Loader2 } from 'lucide-react';
import { getCurrentUserRole } from '@/lib/roles';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const role = await getCurrentUserRole();
    
    if (!role) {
      router.push('/login');
      return;
    }

    if (role !== 'admin') {
      alert('Access denied. Admin access required.');
      router.push('/');
      return;
    }

    setAuthorized(true);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

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
              <Link
                href="/operator"
                className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Package className="h-4 w-4" />
                Operator
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

