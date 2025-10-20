import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');

    // Get classes from database to ensure consistency
    const result = await db.execute(sql`
      SELECT id, grade, name, is_active as "isActive"
      FROM classes
      WHERE is_active = true
      ORDER BY grade, name
    `);

    let classes = result.rows || [];

    if (grade) {
      const gradeNum = parseInt(grade);
      classes = classes.filter(cls => cls.grade === gradeNum);
    }

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);

    // Get grade from search params for fallback
    const { searchParams } = new URL(request.url);
    const gradeParam = searchParams.get('grade');

    // Fallback to sample data if database fails
    const fallbackClasses = [
      // Grade 7
      { id: '7-DIS', grade: 7, name: 'DISCIPLINE', isActive: true },
      { id: '7-RES', grade: 7, name: 'RESPECT', isActive: true },
      { id: '7-CRE', grade: 7, name: 'CREATIVE', isActive: true },
      { id: '7-IND', grade: 7, name: 'INDEPENDENT', isActive: true },
      { id: '7-COL', grade: 7, name: 'COLLABORATIVE', isActive: true },
      { id: '7-RESI', grade: 7, name: 'RESILIENT', isActive: true },
      // Grade 8
      { id: '8-DIS', grade: 8, name: 'DISCIPLINE', isActive: true },
      { id: '8-RES', grade: 8, name: 'RESPECT', isActive: true },
      { id: '8-CRE', grade: 8, name: 'CREATIVE', isActive: true },
      { id: '8-IND', grade: 8, name: 'INDEPENDENT', isActive: true },
      { id: '8-COL', grade: 8, name: 'COLLABORATIVE', isActive: true },
      { id: '8-RESI', grade: 8, name: 'RESILIENT', isActive: true },
      // Grade 9
      { id: '9-DIS', grade: 9, name: 'DISCIPLINE', isActive: true },
      { id: '9-RES', grade: 9, name: 'RESPECT', isActive: true },
      { id: '9-CRE', grade: 9, name: 'CREATIVE', isActive: true },
      { id: '9-IND', grade: 9, name: 'INDEPENDENT', isActive: true },
      { id: '9-COL', grade: 9, name: 'COLLABORATIVE', isActive: true },
      { id: '9-RESI', grade: 9, name: 'RESILIENT', isActive: true },
    ];

    let classes = fallbackClasses;
    if (gradeParam) {
      const gradeNum = parseInt(gradeParam);
      classes = fallbackClasses.filter(cls => cls.grade === gradeNum);
    }

    return NextResponse.json({ classes });
  }
}