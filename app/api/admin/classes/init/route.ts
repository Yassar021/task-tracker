import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClass, getAllClasses } from "@/lib/data-access";
import { generateAllClasses } from "@/lib/school-utils";
import { createAuditLog } from "@/lib/data-access";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if classes already exist
    const existingClasses = await getAllClasses();
    if (existingClasses.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Classes already exist",
        existingCount: existingClasses.length,
      });
    }

    // Generate all 18 classes
    const classesToCreate = generateAllClasses();
    const createdClasses = [];

    for (const classData of classesToCreate) {
      const createdClass = await createClass(classData);
      createdClasses.push(createdClass[0]);
    }

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: "INITIALIZE_CLASSES",
      entityType: "class",
      entityId: "system",
      newValues: { classesCreated: createdClasses.length },
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdClasses.length} classes`,
      data: createdClasses,
    });
  } catch (error) {
    console.error("Error initializing classes:", error);
    return NextResponse.json(
      { error: "Failed to initialize classes" },
      { status: 500 }
    );
  }
}