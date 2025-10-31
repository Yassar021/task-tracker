import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assignments, classAssignments } from '@/db/schema/school';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Starting simple assignments API ===');

    if (!db) {
      return NextResponse.json({
        error: 'Database not available',
        debug: { db: null }
      }, { status: 500 });
    }

    // Test database connection
    console.log('Testing database connection...');
    const testResult = await db.select().from(assignments).limit(1);
    console.log('Database connection OK, found assignments:', testResult.length);

    // Get all assignments without any conditions first
    console.log('Getting all assignments...');
    const allAssignments = await db.select().from(assignments);
    console.log(`Found ${allAssignments.length} total assignments`);

    // Return simple response
    return NextResponse.json({
      assignments: allAssignments,
      debug: {
        totalAssignments: allAssignments.length,
        hasData: allAssignments.length > 0
      }
    });

  } catch (error) {
    console.error('=== DEBUG: Simple assignments API ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');

    return NextResponse.json(
      {
        error: 'Failed to fetch assignments',
        debug: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorType: typeof error,
          hasDb: !!db,
          hasAssignmentsTable: !!assignments
        }
      },
      { status: 500 }
    );
  }
}