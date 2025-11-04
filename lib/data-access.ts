/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-implicit-any */
import { db, users, teachers, classes, assignments, classAssignments, settings, auditLogs } from "@/db";
import { eq, and, count, desc } from "drizzle-orm";
import { safeDbOperation } from "@/lib/error-handling";
// Type imports temporarily removed for build

// User Management
export async function getUserByEmail(email: string) {
  return await safeDbOperation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (db as any).query.users.findFirst({
      where: eq(users.email, email),
      with: {
        teacher: true,
      },
    }),
    'Failed to fetch user by email'
  );
}

export async function getUserById(id: string) {
  return await (db as any).query.users.findFirst({
    where: eq(users.id, id),
    with: {
      teacher: true,
    },
  });
}

export async function createUserRole(data: any) {
  return await (db as any).insert(users).values(data).returning();
}

// Teacher Management
export async function getAllTeachers() {
  return await (db as any).query.teachers.findMany({
    with: {
      user: true,
      assignments: {
        orderBy: [desc(assignments.createdAt)],
      },
    },
    where: eq(teachers.isActive, true),
  });
}

export async function getTeacherById(id: string) {
  return await (db as any).query.teachers.findFirst({
    where: eq(teachers.id, id),
    with: {
      user: true,
      assignments: {
        with: {
          classAssignments: {
            with: {
              class: true,
            },
          },
        },
        orderBy: [desc(assignments.createdAt)],
      },
    },
  });
}

export async function createTeacher(data: any) {
  return await (db as any).insert(teachers).values(data).returning();
}

export async function updateTeacher(id: string, data: Partial<any>) {
  return await (db as any).update(teachers).set({ ...data, updatedAt: new Date() }).where(eq(teachers.id, id)).returning();
}

export async function deleteTeacher(id: string) {
  return await (db as any).update(teachers).set({ isActive: false, updatedAt: new Date() }).where(eq(teachers.id, id));
}

// Class Management
export async function getAllClasses() {
  return await (db as any).query.classes.findMany({
    with: {
      homeroomTeacher: true,
      classAssignments: {
        with: {
          assignment: true,
        },
      },
    },
    where: eq(classes.isActive, true),
    orderBy: [classes.grade, classes.name],
  });
}

export async function getClassesByGrade(grade: number) {
  return await (db as any).query.classes.findMany({
    where: and(eq(classes.grade, grade), eq(classes.isActive, true)),
    orderBy: [classes.name],
  });
}

export async function createClass(data: any) {
  return await (db as any).insert(classes).values(data).returning();
}

export async function updateClass(id: string, data: Partial<any>) {
  return await (db as any).update(classes).set({ ...data, updatedAt: new Date() }).where(eq(classes.id, id)).returning();
}

// Assignment Management
export async function getAssignmentsByTeacher(teacherId: string) {
  return await (db as any).query.assignments.findMany({
    where: eq(assignments.teacherId, teacherId),
    with: {
      teacher: true,
      classAssignments: {
        with: {
          class: true,
        },
      },
    },
    orderBy: [desc(assignments.createdAt)],
  });
}

export async function getAssignmentsByClass(classId: string, weekNumber?: number, year?: number) {
  const baseConditions = [eq(classAssignments.classId, classId)];

  const additionalConditions = weekNumber && year
    ? [and(
        eq(assignments.weekNumber, weekNumber),
        eq(assignments.year, year)
      )]
    : [];

  return await (db as any).query.classAssignments.findMany({
    where: and(...baseConditions, ...additionalConditions),
    with: {
      assignment: {
        with: {
          teacher: true,
        },
      },
      class: true,
    },
    orderBy: [desc(assignments.createdAt)],
  });
}

export async function createAssignment(data: any) {
  return await (db as any).insert(assignments).values(data).returning();
}

export async function assignToClasses(assignmentId: string, classIds: string[]) {
  const assignments = classIds.map((classId) => ({
    id: `${assignmentId}-${classId}-${Date.now()}`,
    assignmentId,
    classId,
    assignedDate: new Date(),
  }));

  return await (db as any).insert(classAssignments).values(assignments).returning();
}

export async function getWeeklyAssignmentCount(teacherId: string, weekNumber: number, year: number, classId: string) {
  const result = await (db as any)
    .select({ count: count() })
    .from(classAssignments)
    .innerJoin(assignments, eq(assignments.id, classAssignments.assignmentId))
    .where(
      and(
        eq(assignments.teacherId, teacherId),
        eq(assignments.weekNumber, weekNumber),
        eq(assignments.year, year),
        eq(classAssignments.classId, classId)
      )
    );

  return result[0]?.count || 0;
}

// Settings Management
export async function getSetting(key: string) {
  return await (db as any).query.settings.findFirst({
    where: eq(settings.key, key),
  });
}

export async function getAllSettings() {
  return await (db as any).query.settings.findMany();
}

export async function updateSetting(key: string, value: string, updatedBy: string) {
  return await (db as any)
    .update(settings)
    .set({ value, updatedBy, updatedAt: new Date() })
    .where(eq(settings.key, key))
    .returning();
}

export async function createSetting(data: any) {
  return await (db as any).insert(settings).values(data).returning();
}

// Audit Log
export async function createAuditLog(data: any) {
  return await (db as any).insert(auditLogs).values(data).returning();
}

export async function getAuditLogs(limit: number = 100) {
  return await (db as any).query.auditLogs.findMany({
    with: {
      user: {
        with: {
          teacher: true,
        },
      },
    },
    orderBy: [desc(auditLogs.createdAt)],
    limit,
  });
}

// Statistics and Reports
export async function getTeacherStats(teacherId: string) {
  const assignments = await getAssignmentsByTeacher(teacherId);
  const totalAssignments = assignments.length;
  const publishedAssignments = assignments.filter(a => a.status === 'published').length;
  const gradedAssignments = assignments.filter(a => a.status === 'graded').length;

  return {
    totalAssignments,
    publishedAssignments,
    gradedAssignments,
    pendingGrading: publishedAssignments - gradedAssignments,
  };
}

export async function getSchoolStats() {
  const [totalTeachers, totalClasses, totalAssignments] = await Promise.all([
    (db as any).select({ count: count() }).from(teachers).where(eq(teachers.isActive, true)),
    (db as any).select({ count: count() }).from(classes).where(eq(classes.isActive, true)),
    (db as any).select({ count: count() }).from(assignments),
  ]);

  return {
    totalTeachers: totalTeachers[0]?.count || 0,
    totalClasses: totalClasses[0]?.count || 0,
    totalAssignments: totalAssignments[0]?.count || 0,
  };
}

// Initialize default settings
export async function initializeDefaultSettings() {
  const defaultSettings = [
    {
      key: 'max_weekly_assignments',
      value: '2',
      description: 'Maximum number of assignments per class per week',
    },
    {
      key: 'school_year',
      value: new Date().getFullYear().toString(),
      description: 'Current school year',
    },
    {
      key: 'semester',
      value: '1',
      description: 'Current semester (1 or 2)',
    },
  ];

  for (const setting of defaultSettings) {
    const existing = await getSetting(setting.key);
    if (!existing) {
      await createSetting(setting as any);
    }
  }
}