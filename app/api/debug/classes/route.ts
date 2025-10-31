import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('=== DEBUG: Getting all classes ===');

    if (!db) {
      return NextResponse.json({
        error: 'Database not available',
        debugInfo: { db: null }
      }, { status: 500 });
    }

    // Get all classes
    const allClasses = await db.execute(sql`
      SELECT id, grade, name, is_active
      FROM classes
      ORDER BY grade, name
    `);

    // Check if 9-COU exists
    const specificClass = await db.execute(sql`
      SELECT id, grade, name, is_active
      FROM classes
      WHERE id = '9-COU'
    `);

    return NextResponse.json({
      allClasses: allClasses,
      specificClass: specificClass,
      debug: {
        totalClasses: allClasses.rows?.length || 0,
        nineCouExists: (specificClass.rows?.length || 0) > 0
      }
    });

  } catch (error) {
    console.error('DEBUG CLASSES ERROR:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace available"
    }, { status: 500 });
  }
}