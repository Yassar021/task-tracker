import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function verifyAdmin(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id || session.user.role !== 'admin') {
    return {
      error: 'Unauthorized - Admin access required',
      status: 401
    };
  }

  return { session };
}