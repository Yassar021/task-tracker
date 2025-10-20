import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { assignments, classAssignments, teachers } from '@/db/schema/school';
import { eq, and, gte, lte } from 'drizzle-orm';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Judul tugas wajib diisi'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Mata pelajaran wajib dipilih'),
  learningGoal: z.string().min(1, 'Tujuan pembelajaran wajib diisi'),
  type: z.enum(['TUGAS', 'UJIAN']),
  weekNumber: z.number().min(1).max(52),
  year: z.number(),
  dueDate: z.string().optional(),
  assignedClasses: z.array(z.string()).min(1, 'Pilih minimal satu kelas'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== ASSIGNMENT API START ===');

    // Check if offline mode is enabled
    if (process.env.OFFLINE_MODE === 'true' || !db) {
      console.log('🔌 Offline mode detected - creating mock assignment');

      const body = await request.json();
      const validatedData = assignmentSchema.parse(body);

      // Create a mock assignment response
      const mockAssignment = {
        id: `mock-${Date.now()}`,
        title: validatedData.title,
        description: validatedData.description || '',
        subject: validatedData.subject,
        learningGoal: validatedData.learningGoal,
        type: validatedData.type,
        weekNumber: validatedData.weekNumber,
        year: validatedData.year,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teacherId: 'mock-teacher',
        assignedClasses: validatedData.assignedClasses.map(classId => ({ classId })),
        dueDate: validatedData.dueDate || null,
        // Add assignedClasses array for easier frontend access
        classIds: validatedData.assignedClasses,
        isOfflineMode: true
      };

      return NextResponse.json({
        assignment: mockAssignment,
        message: 'Tugas/Ujian berhasil dibuat (mode offline)',
        isOfflineMode: true,
        debug: {
          mode: 'offline',
          timestamp: new Date().toISOString()
        }
      });
    }

    const body = await request.json();
    console.log('Request body:', body);

    const validatedData = assignmentSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Test database connection first with timeout
    try {
      const testResult = await Promise.race([
        db.select().from(teachers).limit(1),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database connection timeout')), 20000)
        )
      ]);
      console.log('Database connection OK, teachers count:', testResult.length);
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        {
          error: 'Database connection failed. Silakan coba lagi atau hubungi admin.',
          details: dbError.message,
          isDatabaseError: true
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Get or create demo teacher
    let demoTeacher = await db.query.teachers.findFirst({
      where: eq(teachers.id, 'DEMO_TEACHER')
    });

    if (!demoTeacher) {
      console.log('No demo teacher found, trying to use any existing teacher...');
      try {
        // Try to find any existing teacher
        const existingTeachers = await db.select().from(teachers).limit(1);
        if (existingTeachers.length > 0) {
          demoTeacher = existingTeachers[0];
          console.log('Using existing teacher:', demoTeacher);
        } else {
          // Return error since we can't create teacher without proper user table
          return NextResponse.json(
            { error: 'No teachers found in database. Please create teachers first through admin panel.' },
            { status: 500 }
          );
        }
      } catch (teacherError) {
        console.error('Failed to find teacher:', teacherError);
        return NextResponse.json(
          { error: 'Failed to find teacher', details: teacherError.message },
          { status: 500 }
        );
      }
    } else {
      console.log('Demo teacher found:', demoTeacher);
    }

    // Create assignment
    console.log('Creating assignment...');
    const now = new Date();
    const [assignment] = await db.insert(assignments).values({
      id: `ASSIGN_${Date.now()}`,
      teacherId: demoTeacher.id,
      title: validatedData.title,
      description: validatedData.description || null,
      subject: validatedData.subject,
      learningGoal: validatedData.learningGoal,
      type: validatedData.type,
      weekNumber: validatedData.weekNumber,
      year: validatedData.year,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    }).returning();

    console.log('Assignment created:', assignment);

    // Assign to classes
    if (validatedData.assignedClasses.length > 0) {
      console.log('Assigning to classes:', validatedData.assignedClasses);
      try {
        const classNow = new Date();
        const classAssignmentRecords = validatedData.assignedClasses.map(classId => ({
          id: `CLASS_ASSIGN_${Date.now()}_${classId}`,
          assignmentId: assignment.id,
          classId: classId,
          assignedDate: classNow,
          createdAt: classNow,
        }));

        await db.insert(classAssignments).values(classAssignmentRecords);
        console.log('Classes assigned successfully');
      } catch (classAssignError) {
        console.error('Failed to assign classes:', classAssignError);
        return NextResponse.json(
          { error: 'Failed to assign classes', details: classAssignError.message },
          { status: 500 }
        );
      }
    }

    console.log('=== ASSIGNMENT API SUCCESS ===');
    return NextResponse.json({
      success: true,
      assignment: {
        ...assignment,
        assignedClasses: validatedData.assignedClasses,
      },
      message: 'Tugas berhasil dibuat!'
    });
  } catch (error) {
    console.error('=== ASSIGNMENT API ERROR ===');
    console.error('Full error:', error);
    console.error('Error stack:', error.stack);

    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create assignment',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}