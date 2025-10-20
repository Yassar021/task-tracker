import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { classes } from '@/db/schema/school';

// Debug endpoint that uses the EXACT same logic as the fixed admin API
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Testing fixed admin API logic');

    if (!db) {
      console.log('❌ DEBUG: Database is null');
      return NextResponse.json({ error: 'Database not available' });
    }

    console.log('✅ DEBUG: Database available, using fixed admin API logic...');

    // Use the EXACT same logic as the fixed admin API
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

    // Get all classes (using FIXED schema approach)
    const classesResult = await db
      .select({
        id: classes.id,
        grade: classes.grade,
        name: classes.name,
        isActive: classes.isActive,
      })
      .from(classes)
      .where(eq(classes.isActive, true));

    console.log(`🔍 DEBUG: Found ${classesResult.length} classes using fixed schema`);

    // Get assignments for current week with class assignments (same SQL as admin API)
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

    // Calculate status for each class (exact same logic as admin API)
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
      console.log(`🔍 DEBUG: Initialized class ${cls.id} (${cls.name})`);
    });

    // Count assignments for each class (exact same logic as admin API)
    if (assignmentsResult.rows) {
      assignmentsResult.rows.forEach(assignment => {
        if (assignment.class_id && classStatusMap.has(assignment.class_id)) {
          const status = classStatusMap.get(assignment.class_id);
          if (assignment.type === 'TUGAS') {
            status.tasks += 1;
            console.log(`🔍 DEBUG: Added TUGAS to ${assignment.class_id}, total tasks: ${status.tasks}`);
          } else if (assignment.type === 'UJIAN') {
            status.exams += 1;
            console.log(`🔍 DEBUG: Added UJIAN to ${assignment.class_id}, total exams: ${status.exams}`);
          }
        } else {
          console.log(`🔍 DEBUG: Skipping assignment ${assignment.id} - class_id: ${assignment.class_id}`);
        }
      });
    }

    // Calculate load percentage and overload status (exact same logic as admin API)
    const classStatuses = Array.from(classStatusMap.values()).map(status => {
      const totalSlots = status.maxTasks + status.maxExams;
      const usedSlots = status.tasks + status.exams;
      status.loadPercentage = Math.round((usedSlots / totalSlots) * 100);
      status.isOverloaded = status.loadPercentage >= 100;
      return status;
    });

    // Group by grade (exact same logic as admin API)
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

    console.log('✅ DEBUG: Fixed admin API logic calculated successfully');

    // Debug: Check specifically for 7-COL
    const grade7Data = gradeStatuses.find(g => g.grade === 7);
    if (grade7Data && grade7Data.classes) {
      const collabClass = grade7Data.classes.find(cls => cls.id === '7-COL');
      console.log('🎯 DEBUG: 7-COL result from fixed admin API logic:', collabClass);
    } else {
      console.log('❌ DEBUG: 7-COL not found in fixed admin API logic');
    }

    // Log all grade 7 classes for debugging
    if (grade7Data) {
      console.log('🔍 DEBUG: All Grade 7 classes from fixed admin API:');
      grade7Data.classes.forEach(cls => {
        console.log(`  - ${cls.id}: ${cls.tasks}T/${cls.exams}U = ${cls.load}% (${cls.isOverloaded ? 'OVERLOADED' : 'OK'})`);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Fixed admin API logic test',
      classStatus: gradeStatuses,
      debug: {
        totalClasses: classesResult.length,
        totalAssignments: assignmentsResult.rows?.length || 0,
        currentWeek: currentWeek.weekNumber,
        currentYear: currentWeek.year,
        note: 'This uses the exact same logic as the fixed admin API'
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: Error in fixed admin API logic test:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}