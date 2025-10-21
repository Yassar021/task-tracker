import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classIds, weekNumber, year, assignmentType } = body;

    if (!classIds || !Array.isArray(classIds) || !weekNumber || !year || !assignmentType) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    console.log('Checking quota:', { classIds, weekNumber, year, assignmentType });

    const supabase = await createClient();
    const maxLimit = 2;
    const quotas: Record<string, { used: number; max: number }> = {};

    for (const classId of classIds) {
      try {
        // Count assignments for this class, week, year, and type using Supabase
        const { data: assignmentClasses, error } = await supabase
          .from('class_assignments')
          .select(`
            assignments!inner(
              id,
              type,
              status,
              week_number,
              year
            )
          `)
          .eq('class_id', classId)
          .eq('assignments.week_number', weekNumber)
          .eq('assignments.year', year)
          .eq('assignments.type', assignmentType)
          .eq('assignments.status', 'published');

        if (error) {
          console.error(`Error checking quota for class ${classId}:`, error);
          // If database fails, assume 0 usage so user can still proceed
          quotas[classId] = {
            used: 0,
            max: maxLimit
          };
        } else {
          const used = assignmentClasses?.length || 0;
          quotas[classId] = {
            used,
            max: maxLimit
          };
          console.log(`Class ${classId}: ${used}/${maxLimit} ${assignmentType.toLowerCase()}`);
        }
      } catch (error) {
        console.error(`Error checking quota for class ${classId}:`, error);
        // If database fails, assume 0 usage so user can still proceed
        quotas[classId] = {
          used: 0,
          max: maxLimit
        };
      }
    }

    console.log('Final quotas:', quotas);
    return NextResponse.json({ quotas });
  } catch (error) {
    console.error('Error checking quota:', error);
    return NextResponse.json(
      { error: 'Failed to check quota' },
      { status: 500 }
    );
  }
}