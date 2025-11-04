import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Putaway Preprocess</h1>
        <p className="text-lg text-gray-600 mb-8">
          Manage pre-processing workflows for warehouse operations
        </p>
        <div className="flex gap-4 justify-center mb-8">
          <Link href="/login">
            <Button size="lg">Login to Get Started</Button>
          </Link>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/admin/dashboard">
            <Button size="lg" variant="outline">Admin Dashboard</Button>
          </Link>
          <Link href="/operator">
            <Button size="lg" variant="outline">Operator Portal</Button>
          </Link>
          <Link href="/admin/settings">
            <Button size="lg" variant="outline">
              Settings
            </Button>
          </Link>
        </div>
        <div className="mt-12 p-6 bg-gray-50 rounded-lg text-left">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <a href="/login" className="text-blue-600 hover:underline">
                Login
              </a>{' '}
              - Login as test user first
            </li>
            <li>
              <a href="/admin/dashboard" className="text-blue-600 hover:underline">
                Admin Dashboard
              </a>{' '}
              - View and manage transfer orders
            </li>
            <li>
              <a href="/operator" className="text-blue-600 hover:underline">
                Operator Portal
              </a>{' '}
              - Mobile-optimized interface for warehouse staff
            </li>
            <li>
              <a href="/admin/settings" className="text-blue-600 hover:underline">
                Settings
              </a>{' '}
              - Configure threshold and eligible merchants
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

