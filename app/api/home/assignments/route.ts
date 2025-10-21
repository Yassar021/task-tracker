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
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

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
        if (!assignmentsMap.has(assignment.id)) {
          assignmentsMap.set(assignment.id, {
            id: assignment.id,
            title: assignment.title,
            subject: assignment.subject,
            type: assignment.type,
            weekNumber: assignment.week_number,
            year: assignment.year,
            status: assignment.status,
            createdAt: assignment.created_at,
            learningGoal: assignment.learning_goal,
            description: assignment.description,
            classAssignments: []
          });
        }

        assignmentsMap.get(assignment.id).classAssignments.push({
          classId: row.class_id
        });
      }

      const assignments = Array.from(assignmentsMap.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by created_at descending

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
          errorMessage: supabaseError.message
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