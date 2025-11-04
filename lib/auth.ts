import { supabase } from './supabase';

export type UserRole = 'admin' | 'operator';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
}

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  return {
    id: session.user.id,
    email: session.user.email || '',
    role: (roleData?.role as UserRole) || 'operator', // Default to operator
  };
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return (data?.role as UserRole) || 'operator';
}

export function hasAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === 'admin') return true; // Admin has access to everything
  return userRole === requiredRole;
}

