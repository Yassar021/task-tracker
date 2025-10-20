import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { classes } from '@/db/schema/school';

// Debug endpoint - no authentication required
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Class status API called');

    console.log('🔍 DEBUG: db status:', !!db);

    if (!db) {
      console.log('❌ DEBUG: Database is null');
      return NextResponse.json({
        error: 'Database not available',
        dbStatus: 'null',
        classStatus: []
      });
    }

    console.log('✅ DEBUG: Database is available, querying data...');

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
    console.log(`🔍 DEBUG: Current week: ${currentWeek.weekNumber}, year: ${currentWeek.year}`);

    // Get all classes
    const classesResult = await db
      .select({
        id: classes.id,
        grade: classes.grade,
        name: classes.name,
        isActive: classes.isActive,
      })
      .from(classes)
      .where(eq(classes.isActive, true));

    console.log(`🔍 DEBUG: Found ${classesResult.length} classes`);

    // Get assignments for current week
    const assignmentsResult = await db.execute(sql`
      SELECT
        a.id,
        a.type,
        a.status,
        ca.class_id
      FROM assignments a
      LEFT JOIN class_assignments ca ON a.id = ca.assignment_id
      WHERE a.week_number = ${currentWeek.weekNumber}
        AND a.year = ${currentWeek.year}
        AND a.status = 'published'
    `);

    console.log(`🔍 DEBUG: Found ${assignmentsResult.rows?.length || 0} assignment records`);

    // Calculate class status
    const classStatusMap = new Map();

    // Initialize class status
    classesResult.forEach(cls => {
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
    if (assignmentsResult.rows) {
      assignmentsResult.rows.forEach(assignment => {
        if (assignment.class_id && classStatusMap.has(assignment.class_id)) {
          const status = classStatusMap.get(assignment.class_id);
          if (assignment.type === 'TUGAS') {
            status.tasks += 1;
          } else if (assignment.type === 'UJIAN') {
            status.exams += 1;
          }
        }
      });
    }

    // Calculate load percentage and overload status
    const classStatuses = Array.from(classStatusMap.values()).map(status => {
      const totalSlots = status.maxTasks + status.maxExams;
      const usedSlots = status.tasks + status.exams;
      status.loadPercentage = Math.round((usedSlots / totalSlots) * 100);
      status.isOverloaded = status.loadPercentage >= 100;
      return status;
    });

    // Group by grade
    const gradeStatuses = [7, 8, 9].map(grade => {
      const gradeClasses = classStatuses.filter(cls => cls.grade === grade);
      const totalLoad = gradeClasses.reduce((sum, cls) => sum + cls.loadPercentage, 0);
      const avgLoad = gradeClasses.length > 0 ? Math.round(totalLoad / gradeClasses.length) : 0;
      const maxLoad = Math.max(...gradeClasses.map(cls => cls.loadPercentage), 0);
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

    console.log('✅ DEBUG: Class status calculated successfully');

    // Check specifically for 7-COL
    const grade7Data = gradeStatuses.find(g => g.grade === 7);
    if (grade7Data && grade7Data.classes) {
      const collabClass = grade7Data.classes.find(cls => cls.id === '7-COL');
      console.log('🎯 DEBUG: 7-COL found:', collabClass);
    }

    return NextResponse.json({
      success: true,
      dbStatus: 'connected',
      classStatus: gradeStatuses,
      debug: {
        totalClasses: classesResult.length,
        totalAssignments: assignmentsResult.rows?.length || 0,
        currentWeek: currentWeek.weekNumber,
        currentYear: currentWeek.year
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: Error in class status API:', error);
    return NextResponse.json({
      error: error.message,
      dbStatus: 'error',
      classStatus: []
    }, { status: 500 });
  }
}