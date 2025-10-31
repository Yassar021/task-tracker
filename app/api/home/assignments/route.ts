import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = parseInt(searchParams.get('week') || new Date().toISOString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const supabase = await createClient();

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
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

      return {
        weekNumber: weekNo,
        year: d.getUTCFullYear()
      };
    };

    const currentWeek = getCurrentWeekInfo();
    console.log(`Fetching assignments for week ${currentWeek.weekNumber}, year ${currentWeek.year}`);

    // Try to get real data from Supabase
    try {
      console.log('Fetching real assignments from Supabase...');

      // Query to get assignments for current week with class assignments
      const { data: assignmentClasses, error } = await supabase
        .from('class_assignments')
        .select(`
          class_id,
          assignments!inner(
            id,
            title,
            subject,
            type,
            week_number,
            year,
            status,
            created_at,
            learning_goal,
            description
          )
        `)
        .eq('assignments.week_number', currentWeek.weekNumber)
        .eq('assignments.year', currentWeek.year)
        .eq('assignments.status', 'published');

      if (error) {
        console.error('Error fetching assignments from Supabase:', error);
        throw error;
      }

      console.log('Raw Supabase result:', assignmentClasses);

      // Group by assignment
      const assignmentsMap = new Map();

      for (const row of assignmentClasses || []) {
        const assignment = row.assignments;
        // Handle case where assignments might be an array (Supabase relationship)
        const assignmentData = Array.isArray(assignment) ? assignment[0] : assignment;
        if (!assignmentData || !assignmentData.id) continue;

        if (!assignmentsMap.has(assignmentData.id)) {
          assignmentsMap.set(assignmentData.id, {
            id: assignmentData.id,
            title: assignmentData.title,
            subject: assignmentData.subject,
            type: assignmentData.type,
            weekNumber: assignmentData.week_number,
            year: assignmentData.year,
            status: assignmentData.status,
            createdAt: assignmentData.created_at,
            learningGoal: assignmentData.learning_goal,
            description: assignmentData.description,
            classAssignments: []
          });
        }

        assignmentsMap.get(assignmentData.id).classAssignments.push({
          classId: row.class_id
        });
      }

      const assignments = Array.from(assignmentsMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by created_at descending

      console.log(`Found ${assignments.length} real assignments for week ${currentWeek.weekNumber}, year ${currentWeek.year}`);

      return NextResponse.json({
        assignments,
        debug: {
          isSampleData: false,
          weekInfo: currentWeek,
          totalAssignments: assignments.length
        }
      });

    } catch (supabaseError) {
      console.error('Supabase query failed, returning empty array:', supabaseError);

      // Return empty array if Supabase query fails
      return NextResponse.json({
        assignments: [],
        debug: {
          isSampleData: false,
          weekInfo: currentWeek,
          error: 'Supabase query failed, returning empty',
          errorMessage: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
        }
      });
    }
  } catch (error) {
    console.error('=== HOME ASSIGNMENTS API ERROR ===');
    console.error('Full error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      {
        error: 'Failed to fetch assignments',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
}