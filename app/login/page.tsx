'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, User, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'operator';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(`Login failed: ${error.message}`);
        return;
      }

      if (data.session) {
        // Route based on selected role
        if (selectedRole === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/operator');
        }
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to login');
    } finally {
      setLoading(false);
    }
  }

  function handleRoleSelect(role: UserRole) {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
  }

  function handleBack() {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">Putaway Preprocess</CardTitle>
          <CardDescription className="text-base">
            {selectedRole ? `Login as ${selectedRole === 'admin' ? 'Admin' : 'Operator'}` : 'Select your role to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedRole ? (
            // Role Selection
            <div className="space-y-3">
              {/* Admin Login */}
              <Button
                onClick={() => handleRoleSelect('admin')}
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                size="lg"
              >
                <Shield className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold text-base">Admin</div>
                  <div className="text-xs text-gray-500">Dashboard & Settings</div>
                </div>
              </Button>

              {/* Operator Login */}
              <Button
                onClick={() => handleRoleSelect('operator')}
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300 transition-colors"
                size="lg"
              >
                <User className="h-6 w-6 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold text-base">Operator</div>
                  <div className="text-xs text-gray-500">Warehouse Operations</div>
                </div>
              </Button>
            </div>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                {selectedRole === 'admin' ? (
                  <Shield className="h-10 w-10 text-blue-600" />
                ) : (
                  <User className="h-10 w-10 text-green-600" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

