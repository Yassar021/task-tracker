import { createClient } from './server';

// Helper function untuk query assignments dengan classes
export async function getAssignmentsWithClasses(filters?: {
  week?: number;
  year?: number;
  status?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('assignments')
    .select(`
      *,
      class_assignments(
        class_id,
        classes(
          id,
          grade,
          name
        )
      )
    `);

  // Apply filters
  if (filters?.week) {
    query = query.eq('week_number', filters.week);
  }
  if (filters?.year) {
    query = query.eq('year', filters.year);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error in getAssignmentsWithClasses:', error);
    throw error;
  }

  // Format the data to ensure consistent structure
  const formattedData = data?.map(assignment => ({
    ...assignment,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    class_assignments: assignment.class_assignments?.map((ca: any) => ({
      class_id: ca.class_id,
      classes: ca.classes || null
    })) || []
  }));

  return formattedData;
}

// Helper function untuk create assignment dengan classes
export async function createAssignmentWithClasses(
  assignmentData: any,
  classIds: string[]
) {
  const supabase = await createClient();

  try {
    // Create assignment first
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single();

    if (assignmentError) {
      throw assignmentError;
    }

    // Then create class assignments
    if (classIds && classIds.length > 0) {
      const classAssignmentsData = classIds.map(classId => ({
        assignment_id: assignment.id,
        class_id: classId
      }));

      const { error: classAssignmentError } = await supabase
        .from('class_assignments')
        .insert(classAssignmentsData);

      if (classAssignmentError) {
        throw classAssignmentError;
      }
    }

    return assignment;
  } catch (error) {
    console.error('Error in createAssignmentWithClasses:', error);
    throw error;
  }
}

// Helper function untuk get active classes
export async function getActiveClasses() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('is_active', true)
    .order('grade')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error in getActiveClasses:', error);
    throw error;
  }

  return data;
}