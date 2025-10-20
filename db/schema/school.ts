import { pgTable, text, integer, boolean, timestamp, jsonb, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

// Enums for role and assignment types
export const userRoleEnum = pgEnum("user_role", ["teacher", "admin"]);
export const assignmentTypeEnum = pgEnum("assignment_type", ["TUGAS", "UJIAN"]);
export const assignmentStatusEnum = pgEnum("assignment_status", ["draft", "published", "graded", "closed"]);

// Teachers table - extended user information for teachers
export const teachers = pgTable("teachers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  subjects: jsonb("subjects").notNull().$type<string[]>(),
  learningGoals: jsonb("learning_goals").notNull().$type<string[]>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table with role - extend existing auth user
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Classes table - 18 classes with character names
export const classes = pgTable("classes", {
  id: varchar("id", { length: 10 }).primaryKey(), // e.g., "7-DISCIPLINE"
  grade: integer("grade").notNull(), // 7, 8, or 9
  name: varchar("name", { length: 20 }).notNull(), // e.g., "DISCIPLINE"
  homeroomTeacherId: text("homeroom_teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: text("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  subject: varchar("subject", { length: 100 }).notNull(),
  learningGoal: text("learning_goal").notNull(),
  type: assignmentTypeEnum("type").notNull(),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  teacherId: text("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  status: assignmentStatusEnum("status").default("draft").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Class assignments junction table - which classes get which assignments
export const classAssignments = pgTable("class_assignments", {
  id: text("id").primaryKey(),
  classId: varchar("class_id", { length: 10 }).notNull().references(() => classes.id, { onDelete: "cascade" }),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  assignedDate: timestamp("assigned_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings table for system configuration
export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit trail for important changes
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: text("entity_id").notNull(),
  oldValues: jsonb("old_values").$type<Record<string, any>>(),
  newValues: jsonb("new_values").$type<Record<string, any>>(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const teachersRelations = relations(teachers, ({ many, one }) => ({
  user: one(user, {
    fields: [teachers.userId],
    references: [user.id],
  }),
  assignments: many(assignments),
  homeroomClasses: many(classes),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  teacher: one(teachers, {
    fields: [users.teacherId],
    references: [teachers.id],
  }),
  settings: many(settings),
  auditLogs: many(auditLogs),
}));

export const classesRelations = relations(classes, ({ many, one }) => ({
  homeroomTeacher: one(teachers, {
    fields: [classes.homeroomTeacherId],
    references: [teachers.id],
  }),
  classAssignments: many(classAssignments),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  teacher: one(teachers, {
    fields: [assignments.teacherId],
    references: [teachers.id],
  }),
  classAssignments: many(classAssignments),
}));

export const classAssignmentsRelations = relations(classAssignments, ({ one }) => ({
  class: one(classes, {
    fields: [classAssignments.classId],
    references: [classes.id],
  }),
  assignment: one(assignments, {
    fields: [classAssignments.assignmentId],
    references: [assignments.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [settings.updatedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Types for TypeScript
export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type ClassAssignment = typeof classAssignments.$inferSelect;
export type NewClassAssignment = typeof classAssignments.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;