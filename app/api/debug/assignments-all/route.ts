import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('=== DEBUG: Getting ALL assignments from database ===');

    // Get all assignments without any filters
    const result: unknown[] = [];

    console.log('All assignments result:', result);

    // Mock results
    const countResult: unknown[] = [];
    const weekResult: unknown[] = [];

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
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace available"
    }, { status: 500 });
  }
}