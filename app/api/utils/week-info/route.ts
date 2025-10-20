import { NextResponse } from 'next/server';
import { getCurrentWeekInfo } from '@/lib/school-utils';

export async function GET() {
  try {
    const weekInfo = getCurrentWeekInfo();

    return NextResponse.json({ weekInfo });
  } catch (error) {
    console.error('Error fetching week info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch week info' },
      { status: 500 }
    );
  }
}