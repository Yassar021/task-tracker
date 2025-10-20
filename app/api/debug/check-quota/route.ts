import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('DEBUG check-quota request:', body);

    // Mock response for testing
    const { classIds } = body;
    const quotas = {};

    // Since we know 7-DIS has 2 tasks (from debug data), let's mock that
    classIds.forEach(classId => {
      if (classId === '7-DIS') {
        quotas[classId] = {
          used: 2,
          max: 2
        };
      } else {
        quotas[classId] = {
          used: 0,
          max: 2
        };
      }
    });

    console.log('DEBUG check-quota response:', { quotas });

    return NextResponse.json({ quotas });

  } catch (error) {
    console.error('DEBUG check-quota error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}