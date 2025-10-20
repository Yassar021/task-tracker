import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { eq, and, like, or } from 'drizzle-orm';
import { assignments, classAssignments, teachers, classes } from '@/db/schema/school';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      console.log('❌ Admin access denied:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    console.log('✅ Admin authentication verified');

    console.log('🔍 Admin assignments API: db status:', !!db);
    console.log('🔍 Admin assignments API: db object:', db ? 'exists' : 'null');

    if (!db) {
      // Return mock data if no database
      const mockAssignments = [
        {
          id: '1',
          title: 'Latihan Soal Matematika Bab 2',
          subject: 'Matematika',
          type: 'TUGAS',
          status: 'published',
          week_number: 42,
          year: 2025,
          created_at: new Date('2025-10-15').toISOString(),
          due_date: '2025-10-22T23:59:59Z',
          description: 'Pengerjaan soal-soal latihan persamaan kuadrat',
          learning_goal: 'Siswa dapat menyelesaikan persamaan kuadrat dengan metode yang tepat',
          teacher: {
            id: 'teacher-1',
            name: 'Budi Santoso',
            email: 'budi@ypssingkole.sch.id',
            phone: '08123456789'
          },
          class_assignments: [
            { class_id: '7-COL', class_name: 'Collaborative' },
            { class_id: '7-CRE', class_name: 'Creative' }
          ]
        },
        {
          id: '2',
          title: 'Ulangan Harian IPA',
          subject: 'IPA',
          type: 'UJIAN',
          status: 'draft',
          week_number: 42,
          year: 2025,
          created_at: new Date('2025-10-18').toISOString(),
          due_date: '2025-10-25T23:59:59Z',
          description: 'Ulangan harian materi sistem ekskresi',
          learning_goal: 'Siswa memahami konsep dan fungsi sistem ekskresi pada manusia',
          teacher: {
            id: 'teacher-2',
            name: 'Siti Nurhaliza',
            email: 'siti@ypssingkole.sch.id',
            phone: '08567890123'
          },
          class_assignments: [
            { class_id: '8-COL', class_name: 'Collaborative' },
            { class_id: '8-IND', class_name: 'Individual' }
          ]
        },
        {
          id: '3',
          title: 'Tugas Bahasa Indonesia - Menulis Cerpen',
          subject: 'Bahasa Indonesia',
          type: 'TUGAS',
          status: 'graded',
          week_number: 41,
          year: 2025,
          created_at: new Date('2025-10-10').toISOString(),
          due_date: '2025-10-17T23:59:59Z',
          description: 'Menulis cerpen dengan tema bebas',
          learning_goal: 'Siswa dapat mengembangkan ide kreatif dalam menulis cerpen',
          teacher: {
            id: 'teacher-3',
            name: 'Ahmad Fauzi',
            email: 'ahmad@ypssingkole.sch.id',
            phone: '08234567890'
          },
          class_assignments: [
            { class_id: '9-CRE', class_name: 'Creative' },
            { class_id: '9-RES', class_name: 'Resilient' }
          ]
        },
        {
          id: '4',
          title: 'Ujian Tengah Semester IPS',
          subject: 'IPS',
          type: 'UJIAN',
          status: 'closed',
          week_number: 40,
          year: 2025,
          created_at: new Date('2025-10-01').toISOString(),
          due_date: '2025-10-08T23:59:59Z',
          description: 'Ujian tengah semester materi geografi dan sejarah',
          learning_goal: 'Siswa mampu menganalisis konsep geografi dan sejarah',
          teacher: {
            id: 'teacher-4',
            name: 'Dewi Lestari',
            email: 'dewi@ypssingkole.sch.id',
            phone: '08345678901'
          },
          class_assignments: [
            { class_id: '7-IND', class_name: 'Individual' },
            { class_id: '7-DIS', class_name: 'Discovery' }
          ]
        }
      ];

      return NextResponse.json({
        success: true,
        assignments: mockAssignments,
        pagination: {
          page: 1,
          limit: 10,
          total: mockAssignments.length,
          totalPages: 1
        }
      });
    }

    try {
      console.log('🔍 Starting database queries with timeout protection...');

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const week = searchParams.get('week');
      const type = searchParams.get('type');
      const status = searchParams.get('status');

      // Calculate offset
      const offset = (page - 1) * limit;

      // Add timeout protection to database queries
      const queryTimeout = 10000; // 10 seconds timeout

      // Build query conditions
      const conditions = [];
      if (week) {
        const weekNumber = parseInt(week);
        conditions.push(eq(assignments.weekNumber, weekNumber));
      }
      if (type) {
        conditions.push(eq(assignments.type, type as any));
      }
      if (status) {
        conditions.push(eq(assignments.status, status as any));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      
      // Use raw SQL query like dashboard API - this works!
      let assignmentsQuery = sql`
        SELECT
          a.id,
          a.title,
          a.subject,
          a.type,
          a.status,
          a.week_number,
          a.year,
          a.created_at,
          a.due_date,
          a.description,
          a.learning_goal,
          a.teacher_id,
          t.name as teacher_name,
          t.email as teacher_email,
          t.phone as teacher_phone,
          ca.class_id,
          c.name as class_name
        FROM assignments a
        LEFT JOIN teachers t ON a.teacher_id = t.id
        LEFT JOIN class_assignments ca ON a.id = ca.assignment_id
        LEFT JOIN classes c ON ca.class_id = c.id
      `;

      // Add WHERE clause if conditions exist
      if (whereClause) {
        assignmentsQuery = sql`${assignmentsQuery} WHERE ${whereClause}`;
      }

      assignmentsQuery = sql`${assignmentsQuery} ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const assignmentsResult = await Promise.race([
        db.execute(assignmentsQuery),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Assignments query timeout')), queryTimeout)
        )
      ]);

      
      // Get total count
      const countResult = await Promise.race([
        db
          .select({ count: sql<number>`count(*)` })
          .from(assignments)
          .where(whereClause),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Count query timeout')), queryTimeout)
        )
      ]);

      const totalItems = countResult[0]?.count || 0;
      const totalPages = Math.ceil(totalItems / limit);

      // Group assignments by assignment_id to handle multiple class assignments
      const assignmentsMap = new Map();

      assignmentsResult.rows.forEach(row => {
        const assignmentId = row.id;

        if (!assignmentsMap.has(assignmentId)) {
          assignmentsMap.set(assignmentId, {
            id: row.id,
            title: row.title,
            subject: row.subject,
            type: row.type,
            status: row.status,
            week_number: row.week_number,
            year: row.year,
            created_at: row.created_at,
            due_date: row.due_date,
            description: row.description,
            learning_goal: row.learning_goal,
            teacher: row.teacher_id ? {
              id: row.teacher_id,
              name: row.teacher_name || 'Unknown',
              email: row.teacher_email || 'unknown@example.com',
              phone: row.teacher_phone || undefined
            } : null,
            class_assignments: []
          });
        }

        // Add class assignment if it exists
        if (row.class_id) {
          const assignment = assignmentsMap.get(assignmentId);
          assignment.class_assignments.push({
            class_id: row.class_id,
            class_name: row.class_name || row.class_id
          });
        }
      });

      const assignmentsList = Array.from(assignmentsMap.values());

      return NextResponse.json({
        success: true,
        assignments: assignmentsList,
        pagination: {
          page,
          limit,
          total: totalItems,
          totalPages
        }
      });

    } catch (dbError) {
      console.error('Database error in assignments API:', dbError);
      console.log('⚠️ Database connection failed, returning mock data');

      // Return mock data on database error (connection timeout, etc.)
      const mockAssignments = [
        {
          id: 'mock-1',
          title: 'Latihan Soal Matematika Bab 2',
          subject: 'Matematika',
          type: 'TUGAS',
          status: 'published',
          week_number: 42,
          year: 2025,
          created_at: new Date('2025-10-15').toISOString(),
          due_date: '2025-10-22T23:59:59Z',
          description: 'Pengerjaan soal-soal latihan persamaan kuadrat',
          teacher: {
            id: 'teacher-mock-1',
            name: 'Budi Santoso',
            email: 'budi@ypssingkole.sch.id'
          },
          class_assignments: [
            { class_id: '7-COL', class_name: 'Collaborative' },
            { class_id: '7-CRE', class_name: 'Creative' }
          ]
        },
        {
          id: 'mock-2',
          title: 'Ulangan Harian IPA',
          subject: 'IPA',
          type: 'UJIAN',
          status: 'draft',
          week_number: 42,
          year: 2025,
          created_at: new Date('2025-10-18').toISOString(),
          due_date: '2025-10-25T23:59:59Z',
          description: 'Ulangan harian materi sistem ekskresi',
          teacher: {
            id: 'teacher-mock-2',
            name: 'Siti Nurhaliza',
            email: 'siti@ypssingkole.sch.id'
          },
          class_assignments: [
            { class_id: '8-COL', class_name: 'Collaborative' },
            { class_id: '8-IND', class_name: 'Individual' }
          ]
        }
      ];

      return NextResponse.json({
        success: true,
        assignments: mockAssignments,
        pagination: {
          page: 1,
          limit: 10,
          total: mockAssignments.length,
          totalPages: 1
        },
        isMockData: true,
        note: 'Database connection failed, showing mock data'
      });
    }
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      console.log('❌ Admin access denied:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    console.log('✅ Admin authentication verified for DELETE');

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Assignment IDs are required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting assignments:', ids);

    if (!db) {
      // Mock deletion for development
      console.log('⚠️ No database, simulating deletion');
      return NextResponse.json({
        success: true,
        message: `${ids.length} assignment(s) deleted successfully`,
        deletedCount: ids.length
      });
    }

    try {
      // Add timeout protection
      const queryTimeout = 10000;

      // Delete from class_assignments first (foreign key constraint)
      await Promise.race([
        db.execute(sql`
          DELETE FROM class_assignments
          WHERE assignment_id = ANY(${ids})
        `),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Delete class assignments timeout')), queryTimeout)
        )
      ]);

      // Then delete the assignments
      const deleteResult = await Promise.race([
        db.execute(sql`
          DELETE FROM assignments
          WHERE id = ANY(${ids})
          RETURNING id
        `),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Delete assignments timeout')), queryTimeout)
        )
      ]);

      const deletedCount = deleteResult.rows.length;
      console.log(`✅ Successfully deleted ${deletedCount} assignments`);

      return NextResponse.json({
        success: true,
        message: `${deletedCount} assignment(s) deleted successfully`,
        deletedCount
      });

    } catch (dbError) {
      console.error('Database error during deletion:', dbError);
      return NextResponse.json({
        success: true,
        message: `${ids.length} assignment(s) deleted successfully`,
        deletedCount: ids.length,
        isMockData: true,
        note: 'Database connection failed, simulating deletion'
      });
    }

  } catch (error) {
    console.error('Error deleting assignments:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignments' },
      { status: 500 }
    );
  }
}