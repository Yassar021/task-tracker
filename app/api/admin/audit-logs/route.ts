import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // TODO: Implement actual audit logs from database
    const auditLogs = [
      {
        id: '1',
        action: 'CREATE_TEACHER',
        entityType: 'TEACHER',
        createdAt: new Date().toISOString(),
        user: {
          teacher: {
            name: 'Admin User'
          }
        }
      },
      {
        id: '2',
        action: 'UPDATE_TEACHER',
        entityType: 'TEACHER',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        user: {
          teacher: {
            name: 'Admin User'
          }
        }
      }
    ];

    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}