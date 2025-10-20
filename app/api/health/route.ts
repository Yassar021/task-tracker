import { NextResponse } from "next/server";

export async function GET() {
  try {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      database: "disconnected" // We'll skip DB check for now
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}