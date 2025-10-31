import { db, assignments } from '../db';
import { eq } from 'drizzle-orm';

// List mapel baru dari list-mapel.md
const NEW_SUBJECTS = [
  "AGAMA ISLAM",
  "AGAMA KRISTEN",
  "AGAMA KATOLIK",
  "AGAMA HINDU",
  "PENDIDIKAN AGAMA",
  "PANCASILA",
  "BAHASA INDONESIA",
  "MATEMATIKA",
  "IPA",
  "IPS",
  "BAHASA INGGRIS",
  "PJOK",
  "INFORMATIKA",
  "SENI, BUDAYA DAN PRAKARYA",
  "MANDARIN"
];

async function updateSubjects() {
  try {
    console.log('🔍 Mencari semua assignments...');

    // Ambil semua assignments
    const allAssignments = await db.select().from(assignments);
    console.log(`📊 Ditemukan ${allAssignments.length} assignments`);

    if (allAssignments.length === 0) {
      console.log('✅ Tidak ada assignments yang perlu diupdate');
      return;
    }

    // Tampilkan assignments yang ada
    console.log('\n📋 Daftar assignments saat ini:');
    allAssignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.subject} - ${assignment.title}`);
    });

    // Update assignments dengan nama mata pelajaran baru
    console.log('\n🔄 Mengupdate assignments...');

    for (const assignment of allAssignments) {
      // Cari mata pelajaran yang cocok atau pilih yang paling mirip
      let newSubject = assignment.subject;

      // Check if subject needs updating
      if (!NEW_SUBJECTS.includes(assignment.subject)) {
        // Try to find a match
        const oldSubjectLower = assignment.subject.toLowerCase();

        if (oldSubjectLower.includes('agama')) {
          if (oldSubjectLower.includes('islam')) newSubject = "AGAMA ISLAM";
          else if (oldSubjectLower.includes('kristen')) newSubject = "AGAMA KRISTEN";
          else if (oldSubjectLower.includes('katolik')) newSubject = "AGAMA KATOLIK";
          else if (oldSubjectLower.includes('hindu')) newSubject = "AGAMA HINDU";
          else newSubject = "PENDIDIKAN AGAMA";
        } else if (oldSubjectLower.includes('bahasa indonesia')) {
          newSubject = "BAHASA INDONESIA";
        } else if (oldSubjectLower.includes('bahasa inggris')) {
          newSubject = "BAHASA INGGRIS";
        } else if (oldSubjectLower.includes('matematika')) {
          newSubject = "MATEMATIKA";
        } else if (oldSubjectLower.includes('ipa')) {
          newSubject = "IPA";
        } else if (oldSubjectLower.includes('ips')) {
          newSubject = "IPS";
        } else if (oldSubjectLower.includes('pjok') || oldSubjectLower.includes('penjaskes')) {
          newSubject = "PJOK";
        } else if (oldSubjectLower.includes('informatika') || oldSubjectLower.includes('tik')) {
          newSubject = "INFORMATIKA";
        } else if (oldSubjectLower.includes('seni') || oldSubjectLower.includes('prakarya')) {
          newSubject = "SENI, BUDAYA DAN PRAKARYA";
        } else if (oldSubjectLower.includes('mandarin')) {
          newSubject = "MANDARIN";
        } else if (oldSubjectLower.includes('pancasila') || oldSubjectLower.includes('pkn')) {
          newSubject = "PANCASILA";
        }
      }

      // Update jika subject berubah
      if (newSubject !== assignment.subject) {
        await db
          .update(assignments)
          .set({ subject: newSubject })
          .where(eq(assignments.id, assignment.id));

        console.log(`✅ Update: "${assignment.subject}" → "${newSubject}" (${assignment.title})`);
      }
    }

    console.log('\n🎉 Selesai mengupdate assignments!');

    // Tampilkan hasil akhir
    const updatedAssignments = await db.select().from(assignments);
    console.log('\n📋 Daftar assignments setelah update:');
    updatedAssignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.subject} - ${assignment.title}`);
    });

  } catch (error) {
    console.error('❌ Error updating subjects:', error);
    process.exit(1);
  }
}

// Run the update
updateSubjects().then(() => {
  console.log('✅ Script completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});