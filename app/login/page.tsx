'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDevLogin() {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Logged in successfully!');
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        alert(`Login failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Development Login</CardTitle>
          <CardDescription>
            Click below to login as a test user and access the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleDevLogin} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login as Test User'
            )}
          </Button>
          <p className="mt-4 text-sm text-gray-600 text-center">
            This creates and logs in with:<br />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">admin@test.com</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

