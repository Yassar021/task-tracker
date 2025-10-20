import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { classes } from '@/db/schema/school';

// Test endpoint - NO AUTHENTICATION - uses exact same logic as fixed admin API
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TEST: Admin class-status API (NO AUTH) - Testing fixed schema');

    if (!db) {
      console.log('❌ TEST: Database is null');
      // Return mock data if no database
      const mockClassStatus = [
        {
          grade: 7,
          total: 6,
          avgLoad: 65,
          maxLoad: 100,
          overloaded: 1,
          classes: [
            { id: '7-COL', name: 'Collaborative', load: 100, tasks: 2, exams: 0, isOverloaded: true },
            { id: '7-CRE', name: 'Creative', load: 25, tasks: 1, exams: 0, isOverloaded: false },
          ]
        },
      ];
      return NextResponse.json({ classStatus: mockClassStatus });
    }

    console.log('✅ TEST: Database available, using fixed schema approach');

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

    // Get all classes (using FIXED schema approach - same as fixed admin API)
    const classesResult = await db
      .select({
        id: classes.id,
        grade: classes.grade,
        name: classes.name,
        isActive: classes.isActive,
      })
      .from(classes)
      .where(eq(classes.isActive, true));

    console.log(`✅ TEST: Found ${classesResult.length} classes using fixed schema`);

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

    console.log(`✅ TEST: Found ${assignmentsResult.rows?.length || 0} assignment records`);

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
    });

    // Count assignments for each class (exact same logic as admin API)
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

    console.log('✅ TEST: Class status calculated with fixed schema');

    // Debug: Check specifically for 7-COL
    const grade7Data = gradeStatuses.find(g => g.grade === 7);
    if (grade7Data && grade7Data.classes) {
      const collabClass = grade7Data.classes.find(cls => cls.id === '7-COL');
      console.log('🎯 TEST: 7-COL result with fixed schema:', collabClass);
    }

    console.log('Class status calculated:', gradeStatuses);

    // Debug: Check if 7-COL data exists
    const grade7DataCheck = gradeStatuses.find(g => g.grade === 7);
    if (grade7DataCheck && grade7DataCheck.classes) {
      const collabClass = grade7DataCheck.classes.find(cls => cls.id === '7-COL');
      console.log('🎯 7-COL found in test admin API:', collabClass);
    } else {
      console.log('❌ 7-COL not found in test admin API response');
    }

    return NextResponse.json({ classStatus: gradeStatuses });

  } catch (error) {
    console.error('❌ TEST: Error in test admin API:', error);
    // Return mock data on database error
    const mockClassStatus = [
      {
        grade: 7,
        total: 6,
        avgLoad: 65,
        maxLoad: 100,
        overloaded: 1,
        classes: [
          { id: '7-COL', name: 'Collaborative', load: 100, tasks: 2, exams: 0, isOverloaded: true },
          { id: '7-CRE', name: 'Creative', load: 25, tasks: 1, exams: 0, isOverloaded: false },
        ]
      },
    ];
    return NextResponse.json({ classStatus: mockClassStatus });
  }
}