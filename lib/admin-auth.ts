import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function verifyAdmin(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized - No session found',
      status: 401
    };
  }

  // Since session.role might be undefined, check against known admin IDs
  // This is a temporary solution similar to the check-admin API
  const knownAdminIds = [
    'WfyvCKXv6EW3XHuJ50Ids2oWAsOVup3Z', // admin@ypssingkole.sch.id
  ];

  const isAdmin = knownAdminIds.includes(session.user.id);

  console.log('Admin auth check:', {
    userId: session.user.id,
    userEmail: session.user.email,
    knownAdminIds,
    isAdmin
  });

  if (!isAdmin) {
    return {
      error: 'Unauthorized - Admin access required',
      status: 401
    };
  }

  return { session };
}