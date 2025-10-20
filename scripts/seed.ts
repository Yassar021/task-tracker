import { db, users, teachers, classes, assignments, classAssignments } from '@/db';
import { eq } from 'drizzle-orm';

async function seedData() {
  try {
    console.log('Starting database seeding...');

    // Get the current user from auth table (if exists)
    const authUser = await db.query.user.findFirst({
      limit: 1
    });

    if (!authUser) {
      console.log('No auth user found. Please sign up first.');
      return;
    }

    console.log('Found auth user:', authUser.email);

    // Create user record in our users table
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, authUser.id)
    });

    let userRecord;
    if (!existingUser) {
      [userRecord] = await db.insert(users).values({
        id: authUser.id,
        email: authUser.email,
        role: 'teacher'
      }).returning();
      console.log('Created user record:', userRecord);
    } else {
      userRecord = existingUser;
      console.log('User record already exists:', userRecord);
    }

    // Create teacher record
    const existingTeacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, authUser.id)
    });

    let teacherRecord;
    if (!existingTeacher) {
      // Create a shorter teacher ID
      const teacherId = `T_${authUser.id.slice(0, 8)}`;
      [teacherRecord] = await db.insert(teachers).values({
        id: teacherId,
        userId: authUser.id,
        name: authUser.name || 'Guru Contoh',
        email: authUser.email,
        phone: '+6281234567890',
        subjects: ['Matematika', 'Fisika'],
        learningGoals: [
          'Memahami konsep dasar matematika',
          'Mampu menyelesaikan soal fisika dasar'
        ],
        isActive: true
      }).returning();
      console.log('Created teacher record:', teacherRecord);
    } else {
      // If teacher exists but has long ID, delete and recreate
      if (existingTeacher.id.length > 10) {
        await db.delete(teachers).where(eq(teachers.id, existingTeacher.id));
        const teacherId = `T_${authUser.id.slice(0, 8)}`;
        [teacherRecord] = await db.insert(teachers).values({
          id: teacherId,
          userId: authUser.id,
          name: authUser.name || 'Guru Contoh',
          email: authUser.email,
          phone: '+6281234567890',
          subjects: ['Matematika', 'Fisika'],
          learningGoals: [
            'Memahami konsep dasar matematika',
            'Mampu menyelesaikan soal fisika dasar'
          ],
          isActive: true
        }).returning();
        console.log('Recreated teacher record with shorter ID:', teacherRecord);
      } else {
        teacherRecord = existingTeacher;
        console.log('Teacher record already exists:', teacherRecord);
      }
    }

    // Update user record with teacherId
    await db.update(users)
      .set({ teacherId: teacherRecord.id })
      .where(eq(users.id, authUser.id));

    // Create sample classes
    const sampleClasses = [
      { id: '7-DISCI', grade: 7, name: 'DISCIPLINE' },
      { id: '7-EXCEL', grade: 7, name: 'EXCELLENCE' },
      { id: '8-WIS', grade: 8, name: 'WISDOM' },
      { id: '8-CREAT', grade: 8, name: 'CREATIVITY' },
    ];

    for (const classData of sampleClasses) {
      const existingClass = await db.query.classes.findFirst({
        where: eq(classes.id, classData.id)
      });

      if (!existingClass) {
        await db.insert(classes).values({
          ...classData,
          homeroomTeacherId: null
        });
        console.log('Created class:', classData.id);
      }
    }

    // Create sample assignments
    const sampleAssignments = [
      {
        id: 'assignment_1',
        title: 'Tugas Matematika Persamaan Linear',
        description: 'Selesaikan 10 soal persamaan linear dua variabel',
        subject: 'Matematika',
        learningGoal: 'Memahami konsep persamaan linear dua variabel',
        type: 'TUGAS' as const,
        weekNumber: 5,
        year: 2024,
        status: 'published' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        id: 'assignment_2',
        title: 'Ujian Fisika Gerak Lurus',
        description: 'Ujian tertulis tentang gerak lurus beraturan dan berubah beraturan',
        subject: 'Fisika',
        learningGoal: 'Menguasai konsep gerak lurus',
        type: 'UJIAN' as const,
        weekNumber: 4,
        year: 2024,
        status: 'graded' as const,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    for (const assignmentData of sampleAssignments) {
      const existingAssignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, assignmentData.id)
      });

      if (!existingAssignment) {
        const [assignment] = await db.insert(assignments).values({
          ...assignmentData,
          teacherId: teacherRecord.id
        }).returning();

        // Assign to classes
        await db.insert(classAssignments).values([
          {
            id: `${assignment.id}-7-DISCI`,
            assignmentId: assignment.id,
            classId: '7-DISCI',
            dueDate: assignment.dueDate
          },
          {
            id: `${assignment.id}-7-EXCEL`,
            assignmentId: assignment.id,
            classId: '7-EXCEL',
            dueDate: assignment.dueDate
          }
        ]);

        console.log('Created assignment:', assignment.title);
      }
    }

    console.log('Database seeding completed successfully!');
    console.log('Teacher ID:', teacherRecord.id);
    console.log('User ID:', userRecord.id);

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedData();