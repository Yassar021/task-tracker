import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      console.log('❌ Admin access denied:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    console.log('✅ Admin authentication verified');

    console.log('🔍 Starting Supabase queries for class status...');

    const supabase = await createClient();

    // Get current week info
    const getCurrentWeekInfo = () => {
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return { weekNumber: weekNo, year: d.getUTCFullYear() };
    };

    const currentWeek = getCurrentWeekInfo();
    console.log('📅 Current week:', currentWeek);

    // Get all active classes from Supabase
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, grade, name, is_active')
      .eq('is_active', true)
      .order('grade, name');

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      throw classesError;
    }

    console.log('📊 Classes fetched:', classes?.length || 0);

    // Get assignments for current week with class assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('class_assignments')
      .select(`
        class_id,
        assignments!inner(
          id,
          type,
          status,
          week_number,
          year
        )
      `)
      .eq('assignments.week_number', currentWeek.weekNumber)
      .eq('assignments.year', currentWeek.year)
      .eq('assignments.status', 'published');

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log('📝 Assignments fetched:', assignments?.length || 0);

    // If no classes data, return empty status but with proper structure
    if (!classes || classes.length === 0) {
      console.log('⚠️ No classes found in database');
      return NextResponse.json({
        classStatus: [],
        message: 'No classes found in database'
      });
    }

    // Calculate status for each class
    const classStatusMap = new Map();

    // Initialize class status
    classes.forEach(cls => {
      classStatusMap.set(cls.id, {
        id: cls.id,
        grade: cls.grade,
        name: cls.name,
        tasks: 0,
        exams: 0,
        maxTasks: 2,
        maxExams: 2,
        loadPercentage: 0,
        isOverloaded: false
      });
    });

    // Count assignments for each class
    assignments?.forEach(assignment => {
      if (assignment.class_id && classStatusMap.has(assignment.class_id)) {
        const status = classStatusMap.get(assignment.class_id);
        if (assignment.assignments.type === 'TUGAS') {
          status.tasks += 1;
        } else if (assignment.assignments.type === 'UJIAN') {
          status.exams += 1;
        }
      }
    });

    // Calculate load percentage and overload status
    const classStatuses = Array.from(classStatusMap.values()).map(status => {
      const totalSlots = status.maxTasks + status.maxExams;
      const usedSlots = status.tasks + status.exams;
      status.loadPercentage = Math.round((usedSlots / totalSlots) * 100);
      status.isOverloaded = status.loadPercentage >= 100;
      return status;
    });

    // Get unique grades from existing classes
    const uniqueGrades = [...new Set(classes.map(cls => cls.grade))].sort((a, b) => a - b);

    // Group by grade
    const gradeStatuses = uniqueGrades.map(grade => {
      const gradeClasses = classStatuses.filter(cls => cls.grade === grade);
      const totalLoad = gradeClasses.reduce((sum, cls) => sum + cls.loadPercentage, 0);
      const avgLoad = gradeClasses.length > 0 ? Math.round(totalLoad / gradeClasses.length) : 0;
      const maxLoad = gradeClasses.length > 0 ? Math.max(...gradeClasses.map(cls => cls.loadPercentage), 0) : 0;
      const overloaded = gradeClasses.filter(cls => cls.isOverloaded).length;

      return {
        grade,
        total: gradeClasses.length,
        avgLoad,
        maxLoad,
        overloaded,
        classes: gradeClasses.map(cls => ({
          id: cls.id,
          name: cls.name,
          load: cls.loadPercentage,
          tasks: cls.tasks,
          exams: cls.exams,
          isOverloaded: cls.isOverloaded
        }))
      };
    });

    console.log('✅ Class status calculated:', gradeStatuses);

    return NextResponse.json({ classStatus: gradeStatuses });
  } catch (error) {
    console.error('Error fetching class status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class status' },
      { status: 500 }
    );
  }
}