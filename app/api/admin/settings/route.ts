import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Sample settings data
const sampleSettings = [
  {
    key: "max_weekly_assignments",
    value: "2",
    description: "Maximum number of assignments per class per week",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "max_weekly_exams",
    value: "2",
    description: "Maximum number of exams per class per week",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "school_year",
    value: "2024-2025",
    description: "Current academic year",
    updatedAt: new Date().toISOString(),
  },
  {
    key: "semester",
    value: "1",
    description: "Current semester",
    updatedAt: new Date().toISOString(),
  },
];

// Validation schema for settings
const updateSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      settings: sampleSettings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const validatedData = updateSettingSchema.parse(body);

    console.log("Setting updated:", validatedData);

    return NextResponse.json({
      success: true,
      message: "Setting updated successfully",
    });
  } catch (error) {
    console.error("Error updating setting:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}