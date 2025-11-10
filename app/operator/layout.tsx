'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Putaway Pre-processing</h1>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-lg flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile optimized, no extra padding */}
      <main className="pb-safe">{children}</main>
    </div>
  );
}

