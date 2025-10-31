import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('Check-admin API called with userId:', userId);

    // Temporary hardcoded admin check based on known admin user ID
    // This is a workaround while we fix database issues
    const knownAdminId = 'WfyvCKXv6EW3XHuJ50Ids2oWAsOVup3Z';
    const isAdmin = userId === knownAdminId;

    console.log('Check-admin result:', { userId, knownAdminId, isAdmin });

    return NextResponse.json({
      isAdmin,
      roles: {
        app: isAdmin ? 'admin' : null,
        auth: isAdmin ? 'admin' : null,
      },
      debug: {
        userId,
        knownAdminId,
        isMatch: userId === knownAdminId
      }
    });

  } catch (error) {
    console.error('Error in check-admin API:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : "Unknown error") : undefined
    }, { status: 500 });
  }
}