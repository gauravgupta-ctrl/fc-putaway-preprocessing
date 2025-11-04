import { supabase } from './supabase';
import type { UserRole, UserProfile } from '@/types/database';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const profile = await getUserProfile(userId);
  return profile?.role || null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function isOperator(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'operator';
}

