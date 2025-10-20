import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('=== DEBUG: Getting ALL assignments from database ===');

    // Get all assignments without any filters
    const result = await db.execute(sql`
      SELECT
        a.id,
        a.title,
        a.subject,
        a.type,
        a.week_number,
        a.year,
        a.status,
        a.created_at,
        a.learning_goal,
        a.description,
        ca.class_id
      FROM assignments a
      INNER JOIN class_assignments ca ON a.id = ca.assignment_id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    console.log('All assignments result:', result);

    // Also get total count
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM assignments
    `);

    console.log('Total assignments count:', countResult);

    // Also get assignments for current week specifically
    const weekResult = await db.execute(sql`
      SELECT
        a.id,
        a.title,
        a.subject,
        a.type,
        a.week_number,
        a.year,
        a.status,
        a.created_at,
        ca.class_id
      FROM assignments a
      INNER JOIN class_assignments ca ON a.id = ca.assignment_id
      WHERE a.week_number = 42 AND a.year = 2025 AND a.status = 'published'
      ORDER BY a.created_at DESC
    `);

    console.log('Week 42 assignments result:', weekResult);

    return NextResponse.json({
      allAssignments: result,
      totalAssignments: countResult,
      weekAssignments: weekResult,
      debug: {
        message: 'Debug data for assignments'
      }
    });

  } catch (error) {
    console.error('DEBUG ERROR:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}