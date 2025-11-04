import { supabase } from './supabase';

export type UserRole = 'admin' | 'operator';

export async function getUserRole(): Promise<UserRole | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  // Get role from user metadata
  const role = session.user.user_metadata?.role as UserRole;
  return role || null;
}

export async function checkRole(allowedRoles: UserRole[]): Promise<boolean> {
  const role = await getUserRole();
  if (!role) return false;
  return allowedRoles.includes(role);
}

export async function requireRole(allowedRoles: UserRole[]): Promise<void> {
  const hasAccess = await checkRole(allowedRoles);
  if (!hasAccess) {
    throw new Error('Access denied');
  }
}

