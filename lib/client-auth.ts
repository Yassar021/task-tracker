// Client-side auth functions for Supabase
import { createClient } from '@/utils/supabase/client';

export async function signIn(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

export async function signOut() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Logout failed');
  }

  return response.json();
}

export async function getCurrentUser() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    return null;
  }
}

export async function isAdmin() {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const knownAdminEmails = [
      'admin@ypssingkole.sch.id',
      'admin@yps.sch.id'
    ];

    const isAdminUser = knownAdminEmails.includes(user.email || '');
    console.log('Admin check:', { userEmail: user.email, isAdminUser });

    return isAdminUser;
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}