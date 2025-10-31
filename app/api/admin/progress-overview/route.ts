import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { classes } from '@/db/schema/school';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!db) {
      // Return mock data if no database
      const mockProgress = {
        totalProgress: 65,
        weeklyProgress: [
          { week: 41, progress: 45 },
          { week: 42, progress: 55 },
          { week: 43, progress: 65 },
        ],
        subjectDistribution: [
          { subject: 'Matematika', count: 8 },
          { subject: 'Bahasa Indonesia', count: 6 },
          { subject: 'IPA', count: 5 },
          { subject: 'IPS', count: 4 },
        ],
        typeDistribution: {
          TUGAS: 18,
          UJIAN: 5,
        }
      };
      return NextResponse.json({ progress: mockProgress });
    }

    try {
      // Get current week info
      const getCurrentWeekInfo = () => {
        const now = new Date();
        const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return { weekNumber: weekNo, year: d.getUTCFullYear() };
      };

      const currentWeek = getCurrentWeekInfo();
      console.log('Fetching progress overview for week:', currentWeek);

      // Get all classes
      const classesResult = await db
        .select({
          id: classes.id,
          grade: classes.grade,
        })
        .from(classes)
        .where(eq(classes.isActive, true));

      // Get assignments for the last 4 weeks
      const weeksToShow = [currentWeek.weekNumber - 3, currentWeek.weekNumber - 2, currentWeek.weekNumber - 1, currentWeek.weekNumber];
      const assignmentsResult = await db.execute(sql`
        SELECT
          a.id,
          a.type,
          a.status,
          a.subject,
          a.week_number,
          a.year,
          ca.class_id
        FROM assignments a
        LEFT JOIN class_assignments ca ON a.id = ca.assignment_id
        WHERE a.week_number IN (${weeksToShow.join(', ')})
          AND a.year = ${currentWeek.year}
          AND a.status = 'published'
      `);

      // Calculate weekly progress
      const weeklyProgress = weeksToShow.map(week => {
        const weekAssignments = assignmentsResult.rows ? assignmentsResult.rows.filter(a => a.week_number === week) : [];
        const totalPossibleSlots = classesResult.length * 4; // 2 tasks + 2 exams per class
        const usedSlots = weekAssignments.length;
        const progress = Math.round((usedSlots / totalPossibleSlots) * 100);

        return {
          week,
          progress,
          assignments: weekAssignments.length
        };
      });

      // Calculate current total progress
      const currentWeekAssignments = assignmentsResult.rows ? assignmentsResult.rows.filter(a => a.week_number === currentWeek.weekNumber) : [];
      const totalPossibleSlots = classesResult.length * 4;
      const usedSlots = currentWeekAssignments.length;
      const totalProgress = Math.round((usedSlots / totalPossibleSlots) * 100);

      // Calculate subject distribution
      const subjectDistribution: Record<string, number> = {};
      const typeDistribution = { TUGAS: 0, UJIAN: 0 };

      currentWeekAssignments.forEach(assignment => {
        if (assignment.subject) {
          subjectDistribution[assignment.subject as string] = (subjectDistribution[assignment.subject as string] || 0) + 1;
        }
        if (assignment.type === 'TUGAS' || assignment.type === 'UJIAN') {
          typeDistribution[assignment.type] = (typeDistribution[assignment.type] || 0) + 1;
        }
      });

      // Convert to array format
      const subjectDistributionArray = Object.entries(subjectDistribution)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count);

      const progress = {
        totalProgress,
        weeklyProgress,
        subjectDistribution: subjectDistributionArray,
        typeDistribution,
        currentWeek: currentWeek.weekNumber,
        totalClasses: classesResult.length,
        totalPossibleSlots,
        usedSlots
      };

      console.log('Progress overview calculated:', progress);
      return NextResponse.json({ progress });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return mock data on database error
      const mockProgress = {
        totalProgress: 65,
        weeklyProgress: [
          { week: 40, progress: 45, assignments: 15 },
          { week: 41, progress: 55, assignments: 18 },
          { week: 42, progress: 60, assignments: 20 },
          { week: 43, progress: 65, assignments: 22 },
        ],
        subjectDistribution: [
          { subject: 'Matematika', count: 8 },
          { subject: 'Bahasa Indonesia', count: 6 },
          { subject: 'IPA', count: 5 },
          { subject: 'IPS', count: 4 },
        ],
        typeDistribution: {
          TUGAS: 18,
          UJIAN: 5,
        },
        currentWeek: 43,
        totalClasses: 18,
        totalPossibleSlots: 72,
        usedSlots: 23
      };
      return NextResponse.json({ progress: mockProgress });
    }
  } catch (error) {
    console.error('Error fetching progress overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress overview' },
      { status: 500 }
    );
  }
}