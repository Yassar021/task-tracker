import { NextRequest, NextResponse } from 'next/server';
import { getAssignmentsByTeacher, getUserById } from '@/lib/data-access';
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
      return NextResponse.json({ assignments: [] }, { status: 200 });
    }

    const assignments = await getAssignmentsByTeacher(user.teacherId);

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}