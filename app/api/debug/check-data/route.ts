import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    console.log('🔍 Checking existing data in Supabase...');

    // Check classes table
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .limit(10);

    console.log('Classes:', classes);
    console.log('Classes error:', classesError);

    // Check assignments table
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(10);

    console.log('Assignments:', assignments);
    console.log('Assignments error:', assignmentsError);

    // Check class_assignments table
    const { data: classAssignments, error: classAssignmentsError } = await supabase
      .from('class_assignments')
      .select('*')
      .limit(10);

    console.log('Class Assignments:', classAssignments);
    console.log('Class Assignments error:', classAssignmentsError);

    // Check tables structure
    const tablesInfo = {
      classes: {
        count: classes?.length || 0,
        sample: classes?.slice(0, 3) || [],
        error: classesError?.message
      },
      assignments: {
        count: assignments?.length || 0,
        sample: assignments?.slice(0, 3) || [],
        error: assignmentsError?.message
      },
      classAssignments: {
        count: classAssignments?.length || 0,
        sample: classAssignments?.slice(0, 3) || [],
        error: classAssignmentsError?.message
      }
    };

    return NextResponse.json({
      success: true,
      tables: tablesInfo,
      message: 'Data structure analysis complete'
    });

  } catch (error) {
    console.error('Error checking data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to check data structure'
      },
      { status: 500 }
    );
  }
}