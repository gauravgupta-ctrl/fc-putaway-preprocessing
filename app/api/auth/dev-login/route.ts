import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Development-only: Create a test user session
export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Sign up a test user (will fail if already exists, which is fine)
    await supabase.auth.signUp({
      email: 'admin@test.com',
      password: 'test123456',
    });

    // Sign in with test credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'test123456',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      session: data.session,
      message: 'Logged in as test user'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to login',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

