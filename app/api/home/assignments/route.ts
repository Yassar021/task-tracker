import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = parseInt(searchParams.get('week') || new Date().toISOString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get current week info dynamically (using ISO week standard)
    const getCurrentWeekInfo = () => {
      const now = new Date();

      // Copy date so don't modify original
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

      // Set to nearest Thursday: current date + 4 - current day number
      // Make Sunday's day number 7
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

      // Get first day of year
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

      // Calculate full weeks to nearest Thursday
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

      return {
        weekNumber: weekNo,
        year: d.getUTCFullYear()
      };
    };

    const currentWeek = getCurrentWeekInfo();
    console.log(`Fetching assignments for week ${currentWeek.weekNumber}, year ${currentWeek.year}`);

    // Try to get real data from database
    try {
      console.log('Fetching real assignments from database...');

      // Simple query to get assignments for current week
      const result = await db.execute(sql`
        SELECT
          a.id,
          a.title,
          a.subject,
          a.type,
          a.week_number,
          a.year,
          a.status,
          a.created_at,
          a.learning_goal,
          a.description,
          ca.class_id
        FROM assignments a
        INNER JOIN class_assignments ca ON a.id = ca.assignment_id
        WHERE a.week_number = ${currentWeek.weekNumber}
          AND a.year = ${currentWeek.year}
          AND a.status = 'published'
        ORDER BY a.created_at DESC
      `);

      console.log('Raw database result:', result);

      // Check if result has rows property (different Drizzle versions)
      const rows = result.rows || result;
      if (!Array.isArray(rows)) {
        throw new Error('Database query did not return an array');
      }

      // Group by assignment
      const assignmentsMap = new Map();

      for (const row of rows) {
        if (!assignmentsMap.has(row.id)) {
          assignmentsMap.set(row.id, {
            id: row.id,
            title: row.title,
            subject: row.subject,
            type: row.type,
            weekNumber: row.week_number,
            year: row.year,
            status: row.status,
            createdAt: row.created_at,
            learningGoal: row.learning_goal,
            description: row.description,
            classAssignments: []
          });
        }

        assignmentsMap.get(row.id).classAssignments.push({
          classId: row.class_id
        });
      }

      const assignments = Array.from(assignmentsMap.values());
      console.log(`Found ${assignments.length} real assignments for week ${currentWeek.weekNumber}, year ${currentWeek.year}`);

      return NextResponse.json({
        assignments,
        debug: {
          isSampleData: false,
          weekInfo: currentWeek,
          totalAssignments: assignments.length
        }
      });

    } catch (dbError) {
      console.error('Database query failed, returning empty array:', dbError);

      // Return empty array if database query fails
      return NextResponse.json({
        assignments: [],
        debug: {
          isSampleData: false,
          weekInfo: currentWeek,
          error: 'Database query failed, returning empty',
          errorMessage: dbError.message
        }
      });
    }
  } catch (error) {
    console.error('=== HOME ASSIGNMENTS API ERROR ===');
    console.error('Full error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        error: 'Failed to fetch assignments',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}