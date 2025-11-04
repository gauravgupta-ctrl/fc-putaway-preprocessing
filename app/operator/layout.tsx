'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/roles';
import { Loader2 } from 'lucide-react';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
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

    if (role !== 'operator' && role !== 'admin') {
      alert('Access denied. Operator access required.');
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
      {children}
    </div>
  );
}

