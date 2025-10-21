import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function verifyAdmin(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user from Supabase session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log('❌ No session found:', error?.message);
      return {
        error: 'Unauthorized - No session found',
        status: 401
      };
    }

    // Check against known admin emails
    const knownAdminEmails = [
      'admin@ypssingkole.sch.id',
      'admin@yps.sch.id'
    ];

    const isAdmin = knownAdminEmails.includes(user.email || '');

    console.log('Admin auth check:', {
      userId: user.id,
      userEmail: user.email,
      knownAdminEmails,
      isAdmin
    });

    if (!isAdmin) {
      return {
        error: 'Unauthorized - Admin access required',
        status: 401
      };
    }

    return {
      session: {
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
          isAdmin
        }
      }
    };

  } catch (error) {
    console.error('Admin auth verification error:', error);
    return {
      error: 'Authentication error',
      status: 500
    };
  }
}