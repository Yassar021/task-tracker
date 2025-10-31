import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('=== DEBUG: Getting table schemas ===');

    if (!db) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 500 });
    }

    // Get class_assignments table structure
    const classAssignmentsSchema = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'class_assignments'
      ORDER BY ordinal_position
    `);

    // Get assignments table structure
    const assignmentsSchema = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'assignments'
      ORDER BY ordinal_position
    `);

    // Get classes table structure
    const classesSchema = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'classes'
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      class_assignments: classAssignmentsSchema,
      assignments: assignmentsSchema,
      classes: classesSchema,
      debug: {
        message: 'Table schemas from database'
      }
    });

  } catch (error) {
    console.error('DEBUG SCHEMA ERROR:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace available"
    }, { status: 500 });
  }
}