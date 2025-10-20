import { NextRequest, NextResponse } from 'next/server';
import { getTeacherStats, getUserById } from '@/lib/data-access';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user record to find teacherId
    const user = await getUserById(session.user.id);
    if (!user?.teacherId) {
      return NextResponse.json({
        stats: {
          totalAssignments: 0,
          publishedAssignments: 0,
          gradedAssignments: 0,
          pendingGrading: 0
        }
      }, { status: 200 });
    }

    const stats = await getTeacherStats(user.teacherId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}