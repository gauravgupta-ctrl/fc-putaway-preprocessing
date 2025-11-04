import { supabase } from './supabase';

export type UserRole = 'admin' | 'operator';

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const role = session.user.user_metadata?.role as UserRole;
  return role || null;
}

export async function checkAccess(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  
  if (!userRole) return false;
  
  // Admin has access to everything
  if (userRole === 'admin') return true;
  
  // Operator only has access to operator pages
  if (requiredRole === 'operator' && userRole === 'operator') return true;
  
  return false;
}

