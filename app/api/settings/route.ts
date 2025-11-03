import { NextRequest, NextResponse } from 'next/server';
import { getSetting, updateSetting } from '@/lib/data-access';
import { auth } from '@/lib/auth';

interface SystemSettings {
  maxWeeklyTasks: number;
  maxWeeklyExams: number;
  complianceRate?: number;
}

export async function GET(request: NextRequest) {
  try {
    const [maxTasksSetting, maxExamsSetting] = await Promise.all([
      getSetting('max_weekly_assignments'),
      getSetting('max_weekly_exams'),
    ]);

    const settings: SystemSettings = {
      maxWeeklyTasks: parseInt(maxTasksSetting?.value || '2'),
      maxWeeklyExams: parseInt(maxExamsSetting?.value || '2'),
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id || (session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { maxWeeklyTasks, maxWeeklyExams } = body;

    if (typeof maxWeeklyTasks !== 'number' || typeof maxWeeklyExams !== 'number') {
      return NextResponse.json(
        { error: 'Invalid settings values' },
        { status: 400 }
      );
    }

    if (maxWeeklyTasks < 0 || maxWeeklyExams < 0) {
      return NextResponse.json(
        { error: 'Values must be positive' },
        { status: 400 }
      );
    }

    await Promise.all([
      updateSetting('max_weekly_assignments', maxWeeklyTasks.toString(), session.user.id),
      updateSetting('max_weekly_exams', maxWeeklyExams.toString(), session.user.id),
    ]);

    const settings: SystemSettings = {
      maxWeeklyTasks,
      maxWeeklyExams,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}