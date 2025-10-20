import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  createAuditLog
} from "@/lib/data-access";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { handleApiError, DatabaseError, ValidationError, AuthenticationError, AuthorizationError } from "@/lib/error-handling";

// Validation schemas
const createTeacherSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
  learningGoals: z.array(z.string()).default([]),
});

const updateTeacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  subjects: z.array(z.string()).min(1, "At least one subject is required").optional(),
  learningGoals: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { session } = authResult;

    const teachers = await getAllTeachers();

    return NextResponse.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { session } = authResult;

    const body = await request.json();
    const validatedData = createTeacherSchema.parse(body);

    // Check if teacher with this email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create teacher
    const newTeacher = await createTeacher(validatedData);

    // Update user record to link with teacher
    await db.update(users)
      .set({ teacherId: newTeacher[0].id })
      .where(eq(users.id, validatedData.userId));

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: "CREATE_TEACHER",
      entityType: "teacher",
      entityId: newTeacher[0].id,
      newValues: validatedData,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      data: newTeacher[0],
      message: "Teacher created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating teacher:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    );
  }
}