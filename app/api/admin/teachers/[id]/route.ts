import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  createAuditLog,
  getUserById
} from "@/lib/data-access";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";

// Validation schema
const updateTeacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  subjects: z.array(z.string()).min(1, "At least one subject is required").optional(),
  learningGoals: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const teacher = await getTeacherById(id);

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateTeacherSchema.parse(body);

    const { id } = await params;
    // Get current teacher for audit log
    const currentTeacher = await getTeacherById(id);
    if (!currentTeacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== currentTeacher.email) {
      const existingUser = null;

      if (existingUser) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 400 }
        );
      }

      // Update user email as well
      if (db) {
        await db.update(users)
          .set({ email: validatedData.email })
          .where(eq(users.teacherId, id));
      }
    }

    // Update teacher
    const updatedTeacher = await updateTeacher(id, validatedData);

    // Create audit log
    await createAuditLog({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "UPDATE_TEACHER",
      entityType: "teacher",
      entityId: id,
      oldValues: {
        name: currentTeacher.name,
        email: currentTeacher.email,
        phone: currentTeacher.phone,
        subjects: currentTeacher.subjects,
        learningGoals: currentTeacher.learningGoals,
      },
      newValues: validatedData,
      ipAddress: "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      data: updatedTeacher[0],
      message: "Teacher updated successfully",
    });
  } catch (error) {
    console.error("Error updating teacher:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get current teacher for audit log
    const currentTeacher = await getTeacherById(id);
    if (!currentTeacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Soft delete teacher
    await deleteTeacher(id);

    // Create audit log
    await createAuditLog({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "DELETE_TEACHER",
      entityType: "teacher",
      entityId: id,
      oldValues: {
        name: currentTeacher.name,
        email: currentTeacher.email,
        isActive: currentTeacher.isActive,
      },
      newValues: { isActive: false },
      ipAddress: "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Teacher deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    );
  }
}