import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

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
  teacherId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== ASSIGNMENT API START ===');

    const body = await request.json();
    console.log('Request body:', body);

    const validatedData = assignmentSchema.parse(body);
    console.log('Validated data:', validatedData);

    const supabase = await createClient();

    // Get or use the provided teacher ID, or find a default teacher
    let teacherId = validatedData.teacherId;
    if (!teacherId) {
      console.log('No teacher ID provided, finding a default teacher...');
      const { data: teachers, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .limit(1);

      if (teacherError || !teachers || teachers.length === 0) {
        console.log('No teachers found, using default teacher ID');
        teacherId = 'T_BrdZG4ZO'; // Use the teacher ID from existing data
      } else {
        teacherId = teachers[0].id;
      }
    }

    console.log('Using teacher ID:', teacherId);

    // Create assignment
    console.log('Creating assignment...');
    const now = new Date().toISOString();

    const assignmentData = {
      id: `ASSIGN_${Date.now()}`,
      teacher_id: teacherId,
      title: validatedData.title,
      description: validatedData.description || null,
      subject: validatedData.subject,
      learning_goal: validatedData.learningGoal,
      type: validatedData.type,
      week_number: validatedData.weekNumber,
      year: validatedData.year,
      due_date: validatedData.dueDate ? new Date(validatedData.dueDate).toISOString() : null,
      status: 'published',
      created_at: now,
      updated_at: now,
    };

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single();

    if (assignmentError) {
      console.error('Failed to create assignment:', assignmentError);
      throw assignmentError;
    }

    console.log('Assignment created:', assignment);

    // Assign to classes
    if (validatedData.assignedClasses.length > 0) {
      console.log('Assigning to classes:', validatedData.assignedClasses);
      try {
        const classAssignmentsData = validatedData.assignedClasses.map(classId => ({
          id: `CA_${Date.now()}_${assignment.id}_${classId}`,
          assignment_id: assignment.id,
          class_id: classId,
        }));

        const { error: classAssignmentError } = await supabase
          .from('class_assignments')
          .insert(classAssignmentsData);

        if (classAssignmentError) {
          console.error('Failed to assign classes:', classAssignmentError);
          throw classAssignmentError;
        }

        console.log('Classes assigned successfully');
      } catch (classAssignError) {
        console.error('Failed to assign classes:', classAssignError);
        // Don't fail the whole operation if class assignment fails
        console.log('Assignment created but class assignments failed');
      }
    }

    console.log('=== ASSIGNMENT API SUCCESS ===');

    // Format response for frontend compatibility
    const responseAssignment = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject,
      learningGoal: assignment.learning_goal,
      type: assignment.type,
      weekNumber: assignment.week_number,
      year: assignment.year,
      status: assignment.status,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      teacherId: assignment.teacher_id,
      dueDate: assignment.due_date,
      assignedClasses: validatedData.assignedClasses,
      classIds: validatedData.assignedClasses,
    };

    return NextResponse.json({
      success: true,
      assignment: responseAssignment,
      message: 'Tugas berhasil dibuat!'
    });

  } catch (error) {
    console.error('=== ASSIGNMENT API ERROR ===');
    console.error('Full error:', error);

    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create assignment',
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}