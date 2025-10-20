import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!db) {
      // Return mock data if no database
      const mockAssignments = [
        {
          id: '1',
          title: 'Tugas Matematika Persamaan Linear',
          subject: 'Matematika',
          teacher: 'Budi Santoso',
          teacherId: 'teacher-1',
          teacherPhone: '08123456789',
          classes: ['7A', '7B'],
          type: 'TUGAS',
          createdAt: new Date('2024-01-15'),
          status: 'overdue',
          weekNumber: 3,
        },
        {
          id: '2',
          title: 'Ujian Sumatif IPA',
          subject: 'IPA',
          teacher: 'Siti Aminah',
          teacherId: 'teacher-2',
          teacherPhone: '08567890123',
          classes: ['8A', '8B', '8C'],
          type: 'UJIAN',
          createdAt: new Date('2024-01-18'),
          status: 'published',
          weekNumber: 3,
        },
        {
          id: '3',
          title: 'Tugas Bahasa Indonesia',
          subject: 'Bahasa Indonesia',
          teacher: 'Ahmad Fauzi',
          teacherId: 'teacher-3',
          teacherPhone: '08234567890',
          classes: ['9A'],
          type: 'TUGAS',
          createdAt: new Date('2024-01-12'),
          status: 'graded',
          weekNumber: 2,
        },
      ];
      return NextResponse.json({ assignments: mockAssignments });
    }

    try {
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
      console.log('Fetching admin assignments for week:', currentWeek);

      // Get assignments for current week with class assignments
      // Use SQL query similar to homepage for consistency
      const assignmentsResult = await db.execute(sql`
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
          a.teacher_id,
          ca.class_id
        FROM assignments a
        LEFT JOIN class_assignments ca ON a.id = ca.assignment_id
        WHERE a.week_number = ${currentWeek.weekNumber}
          AND a.year = ${currentWeek.year}
          AND a.status = 'published'
        ORDER BY a.created_at DESC
      `);

      // Get teacher info
      const teacherMap = new Map();
      if (assignmentsResult.rows && assignmentsResult.rows.length > 0) {
        const teacherIds = [...new Set(assignmentsResult.rows.map(a => a.teacher_id).filter(Boolean))];
        if (teacherIds.length > 0) {
          const teachersResult = await db
            .select({
              id: db.schema.teachers?.id,
              name: db.schema.teachers?.name,
              email: db.schema.teachers?.email,
              phone: db.schema.teachers?.phone,
            })
            .from(db.schema.teachers || {})
            .where((teachers, { inArray }) => inArray(teachers.id, teacherIds));

          teachersResult.rows.forEach(teacher => {
            teacherMap.set(teacher.id, teacher);
          });
        }
      }

      // Group assignments by assignment ID and attach teacher/class info
      // Use same logic as homepage for consistency
      const assignmentsMap = new Map();

      if (assignmentsResult.rows) {
        for (const row of assignmentsResult.rows) {
          if (!assignmentsMap.has(row.id)) {
            const teacher = teacherMap.get(row.teacher_id) || {
              name: 'Unknown Teacher',
              phone: '',
              email: ''
            };

            assignmentsMap.set(row.id, {
              id: row.id,
              title: row.title,
              subject: row.subject,
              type: row.type,
              status: row.status,
              createdAt: row.created_at,
              weekNumber: row.week_number,
              year: row.year,
              description: row.description,
              learningGoal: row.learning_goal,
              teacher: teacher.name,
              teacherId: row.teacher_id,
              teacherPhone: teacher.phone,
              classAssignments: []
            });
          }

          // Add class assignment if exists
          if (row.class_id) {
            assignmentsMap.get(row.id).classAssignments.push({
              classId: row.class_id
            });
          }
        }
      }

      const assignments = Array.from(assignmentsMap.values());
      console.log(`Found ${assignments.length} assignments for admin (using same logic as homepage)`);

      return NextResponse.json({ assignments });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return mock data on database error
      const mockAssignments = [
        {
          id: 'mock-1',
          title: 'Tugas Matematika',
          subject: 'Matematika',
          teacher: 'Unknown Teacher',
          teacherId: 'temp-teacher-id',
          teacherPhone: '08123456789',
          classes: ['7-DIS', '7-RES'],
          type: 'TUGAS',
          createdAt: new Date(),
          status: 'published',
          weekNumber: 43,
          year: 2025,
        },
      ];
      return NextResponse.json({ assignments: mockAssignments });
    }
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}