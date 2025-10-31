import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    console.log('=== DEBUG: Syncing all 18 classes ===');

    // Define all 18 classes that should exist
    const expectedClasses = [
      // Grade 7
      { id: '7-DIS', grade: 7, name: 'DISCIPLINE' },
      { id: '7-RES', grade: 7, name: 'RESPECT' },
      { id: '7-RESI', grade: 7, name: 'RESILIENT' },
      { id: '7-COL', grade: 7, name: 'COLLABORATIVE' },
      { id: '7-CRE', grade: 7, name: 'CREATIVE' },
      { id: '7-IND', grade: 7, name: 'INDEPENDENT' },

      // Grade 8
      { id: '8-DIS', grade: 8, name: 'DISCIPLINE' },
      { id: '8-RES', grade: 8, name: 'RESPECT' },
      { id: '8-RESI', grade: 8, name: 'RESILIENT' },
      { id: '8-COL', grade: 8, name: 'COLLABORATIVE' },
      { id: '8-CRE', grade: 8, name: 'CREATIVE' },
      { id: '8-IND', grade: 8, name: 'INDEPENDENT' },

      // Grade 9
      { id: '9-DIS', grade: 9, name: 'DISCIPLINE' },
      { id: '9-RES', grade: 9, name: 'RESPECT' },
      { id: '9-RESI', grade: 9, name: 'RESILIENT' },
      { id: '9-COL', grade: 9, name: 'COLLABORATIVE' },
      { id: '9-CRE', grade: 9, name: 'CREATIVE' },
      { id: '9-IND', grade: 9, name: 'INDEPENDENT' },
    ];

    if (!db) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 500 });
    }

    // Get existing classes
    const existingClassesResult = await db.execute(sql`
      SELECT id FROM classes
    `);
    const existingClassIds = existingClassesResult.rows?.map(row => row.id) || [];

    console.log('Existing classes:', existingClassIds);

    // Insert missing classes
    const insertedClasses = [];
    for (const classData of expectedClasses) {
      if (!existingClassIds.includes(classData.id)) {
        console.log('Inserting missing class:', classData.id);
        await db.execute(sql`
          INSERT INTO classes (id, grade, name, is_active, created_at, updated_at)
          VALUES (${classData.id}, ${classData.grade}, ${classData.name}, true, NOW(), NOW())
        `);
        insertedClasses.push(classData.id);
      }
    }

    return NextResponse.json({
      message: 'Classes synced successfully',
      expectedClasses: expectedClasses.length,
      existingClasses: existingClassIds.length,
      insertedClasses: insertedClasses,
      debug: {
        totalExpected: expectedClasses.length,
        totalExisting: existingClassIds.length,
        totalInserted: insertedClasses.length
      }
    });

  } catch (error) {
    console.error('SYNC CLASSES ERROR:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace available"
    }, { status: 500 });
  }
}