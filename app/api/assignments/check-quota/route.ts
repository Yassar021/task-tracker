import { NextRequest, NextResponse } from 'next/server';
import { db, assignments, classAssignments } from '@/db';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classIds, weekNumber, year, assignmentType } = body;

    if (!classIds || !Array.isArray(classIds) || !weekNumber || !year || !assignmentType) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    console.log('Checking quota:', { classIds, weekNumber, year, assignmentType });

    // Check if offline mode is enabled
    if (process.env.OFFLINE_MODE === 'true' || !db) {
      console.log('🔌 Offline mode - returning default quotas');

      const maxLimit = 2;
      const quotas: Record<string, { used: number; max: number }> = {};

      // Return default quotas (0 used, max 2) for all classes
      for (const classId of classIds) {
        quotas[classId] = {
          used: 0,
          max: maxLimit
        };
      }

      console.log('Final quotas (offline mode):', quotas);
      return NextResponse.json({
        quotas,
        isOfflineMode: true,
        message: 'Quota check successful (offline mode)'
      });
    }

    const maxLimit = 2;
    const quotas: Record<string, { used: number; max: number }> = {};

    for (const classId of classIds) {
      try {
        // Count assignments for this class, week, year, and type with timeout
        const assignmentCount = await Promise.race([
          db
            .select({ count: assignments.id })
            .from(assignments)
            .innerJoin(classAssignments, eq(assignments.id, classAssignments.assignmentId))
            .where(
              and(
                eq(classAssignments.classId, classId),
                eq(assignments.weekNumber, weekNumber),
                eq(assignments.year, year),
                eq(assignments.type, assignmentType),
                eq(assignments.status, 'published')
              )
            ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database query timeout')), 15000)
          )
        ]);

        const used = assignmentCount.length;
        quotas[classId] = {
          used,
          max: maxLimit
        };
        console.log(`Class ${classId}: ${used}/${maxLimit} ${assignmentType.toLowerCase()}`);
      } catch (error) {
        console.error(`Error checking quota for class ${classId}:`, error);
        // If database fails, assume 0 usage so user can still proceed
        quotas[classId] = {
          used: 0,
          max: maxLimit
        };
      }
    }

    console.log('Final quotas:', quotas);
    return NextResponse.json({ quotas });
  } catch (error) {
    console.error('Error checking quota:', error);
    return NextResponse.json(
      { error: 'Failed to check quota' },
      { status: 500 }
    );
  }
}