import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== SIMPLE: Starting assignments API ===');

    // Return sample data for now to test if the route works
    const sampleAssignments = [
      {
        id: 'SAMPLE_1',
        title: 'Sample Assignment',
        subject: 'Matematika',
        type: 'TUGAS',
        weekNumber: 42,
        year: 2025,
        status: 'published',
        createdAt: new Date().toISOString(),
        classAssignments: [
          { classId: '7-DIS' },
          { classId: '7-RES' }
        ]
      }
    ];

    return NextResponse.json({
      assignments: sampleAssignments,
      debug: {
        totalAssignments: sampleAssignments.length,
        isSampleData: true,
        message: 'Using sample data - database connection not working yet'
      }
    });

  } catch (error) {
    console.error('=== SIMPLE: Assignments API ERROR ===');
    console.error('Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}