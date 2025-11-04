import { NextResponse } from "next/server";

// Better Auth routes are disabled - using Supabase auth instead
export async function GET() {
  return NextResponse.json({ message: "Auth endpoints migrated to Supabase" }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ message: "Auth endpoints migrated to Supabase" }, { status: 410 });
}