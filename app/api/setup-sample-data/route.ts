import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Sample classes data
    const sampleClasses = [
      { id: '7-DIS', grade: 7, name: 'DISCOVERY', is_active: true },
      { id: '7-RES', grade: 7, name: 'RESPECT', is_active: true },
      { id: '7-CRE', grade: 7, name: 'CREATIVE', is_active: true },
      { id: '7-IND', grade: 7, name: 'INDEPENDENT', is_active: true },
      { id: '7-COL', grade: 7, name: 'COLLABORATIVE', is_active: true },
      { id: '7-RESI', grade: 7, name: 'RESILIENT', is_active: true },
      { id: '8-DIS', grade: 8, name: 'DISCOVERY', is_active: true },
      { id: '8-RES', grade: 8, name: 'RESPECT', is_active: true },
      { id: '8-CRE', grade: 8, name: 'CREATIVE', is_active: true },
      { id: '8-IND', grade: 8, name: 'INDEPENDENT', is_active: true },
      { id: '8-COL', grade: 8, name: 'COLLABORATIVE', is_active: true },
      { id: '8-RESI', grade: 8, name: 'RESILIENT', is_active: true },
      { id: '9-DIS', grade: 9, name: 'DISCOVERY', is_active: true },
      { id: '9-RES', grade: 9, name: 'RESPECT', is_active: true },
      { id: '9-CRE', grade: 9, name: 'CREATIVE', is_active: true },
      { id: '9-IND', grade: 9, name: 'INDEPENDENT', is_active: true },
      { id: '9-COL', grade: 9, name: 'COLLABORATIVE', is_active: true },
      { id: '9-RESI', grade: 9, name: 'RESILIENT', is_active: true },
    ];

    console.log('🏫 Setting up sample classes...');
    let classesInserted = 0;
    for (const cls of sampleClasses) {
      const { error } = await supabase
        .from('classes')
        .upsert(cls, { onConflict: 'id' });

      if (!error) classesInserted++;
    }

    // Sample assignments data
    const getCurrentWeekInfo = () => {
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return { weekNumber: weekNo, year: d.getUTCFullYear() };
    };

    const currentWeek = getCurrentWeekInfo();
    console.log('📅 Current week:', currentWeek);

    const sampleAssignments = [
      {
        title: 'Latihan Soal Matematika Bab 2',
        subject: 'Matematika',
        type: 'TUGAS',
        status: 'published',
        week_number: currentWeek.weekNumber,
        year: currentWeek.year,
        description: 'Pengerjaan soal-soal latihan persamaan kuadrat',
        learning_goal: 'Siswa dapat menyelesaikan persamaan kuadrat dengan metode yang tepat'
      },
      {
        title: 'Tugas Bahasa Indonesia - Menulis Cerpen',
        subject: 'Bahasa Indonesia',
        type: 'TUGAS',
        status: 'published',
        week_number: currentWeek.weekNumber,
        year: currentWeek.year,
        description: 'Menulis cerpen dengan tema bebas',
        learning_goal: 'Siswa dapat mengembangkan ide kreatif dalam menulis cerpen'
      },
      {
        title: 'Ujian Tengah Semester IPS',
        subject: 'IPS',
        type: 'UJIAN',
        status: 'published',
        week_number: currentWeek.weekNumber - 1,
        year: currentWeek.year,
        description: 'Ujian tengah semester materi geografi dan sejarah',
        learning_goal: 'Siswa mampu menganalisis konsep geografi dan sejarah'
      }
    ];

    console.log('📝 Setting up sample assignments...');
    let assignmentsInserted = 0;
    const insertedAssignments = [];

    for (const assignment of sampleAssignments) {
      const { data, error } = await supabase
        .from('assignments')
        .upsert(assignment, { onConflict: 'id' })
        .select();

      if (!error && data && data.length > 0) {
        assignmentsInserted++;
        insertedAssignments.push(data[0]);
      }
    }

    // Create class assignments
    console.log('🔗 Setting up class assignments...');
    let classAssignmentsInserted = 0;

    for (const assignment of insertedAssignments) {
      // Assign to random classes
      const randomClasses = sampleClasses
        .filter(cls => cls.grade >= 7 && cls.grade <= 9)
        .slice(0, 3 + Math.floor(Math.random() * 3)); // 3-5 classes per assignment

      for (const cls of randomClasses) {
        const { error } = await supabase
          .from('class_assignments')
          .upsert({
            assignment_id: assignment.id,
            class_id: cls.id
          }, { onConflict: 'assignment_id,class_id' });

        if (!error) classAssignmentsInserted++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data setup completed',
      results: {
        classesInserted,
        assignmentsInserted,
        classAssignmentsInserted
      }
    });

  } catch (error) {
    console.error('Error setting up sample data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup sample data',
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}