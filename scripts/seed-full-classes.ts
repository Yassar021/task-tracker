import { db, users, teachers, classes } from "@/db";
import { eq } from "drizzle-orm";

async function seedFullClasses() {
  try {
    console.log('🏫 Seeding 18 kelas untuk SMP YPS SINGKOLE...');

    // Get current teacher/user
    const authUser = await db.query.user.findFirst({
      limit: 1
    });

    if (!authUser) {
      console.log('❌ Tidak ada user yang login. Silakan signup terlebih dahulu.');
      return;
    }

    const teacherRecord = await db.query.teachers.findFirst({
      where: eq(teachers.userId, authUser.id)
    });

    if (!teacherRecord) {
      console.log('❌ Tidak ada teacher record. Silakan run seed.ts terlebih dahulu.');
      return;
    }

    // Define all 18 classes (3 grades × 6 characters) - Format ID: 7-XXX
    const allClasses = [
      // Kelas 7
      { id: '7-DIS', grade: 7, name: 'DISCIPLINE' },
      { id: '7-RES', grade: 7, name: 'RESPECT' },
      { id: '7-RESI', grade: 7, name: 'RESILIENT' },
      { id: '7-COL', grade: 7, name: 'COLLABORATIVE' },
      { id: '7-CRE', grade: 7, name: 'CREATIVE' },
      { id: '7-IND', grade: 7, name: 'INDEPENDENT' },

      // Kelas 8
      { id: '8-DIS', grade: 8, name: 'DISCIPLINE' },
      { id: '8-RES', grade: 8, name: 'RESPECT' },
      { id: '8-RESI', grade: 8, name: 'RESILIENT' },
      { id: '8-COL', grade: 8, name: 'COLLABORATIVE' },
      { id: '8-CRE', grade: 8, name: 'CREATIVE' },
      { id: '8-IND', grade: 8, name: 'INDEPENDENT' },

      // Kelas 9
      { id: '9-DIS', grade: 9, name: 'DISCIPLINE' },
      { id: '9-RES', grade: 9, name: 'RESPECT' },
      { id: '9-RESI', grade: 9, name: 'RESILIENT' },
      { id: '9-COL', grade: 9, name: 'COLLABORATIVE' },
      { id: '9-CRE', grade: 9, name: 'CREATIVE' },
      { id: '9-IND', grade: 9, name: 'INDEPENDENT' },
    ];

    console.log(`📝 Menambahkan ${allClasses.length} kelas...`);

    let createdCount = 0;
    for (const classData of allClasses) {
      const existingClass = await db.query.classes.findFirst({
        where: eq(classes.id, classData.id)
      });

      if (!existingClass) {
        await db.insert(classes).values({
          ...classData,
          homeroomTeacherId: null // Will be assigned later
        });
        console.log(`✅ Created class: ${classData.id}`);
        createdCount++;
      } else {
        console.log(`⏭️  Class already exists: ${classData.id}`);
      }
    }

    console.log(`\n🎉 Selesai! ${createdCount} kelas baru ditambahkan.`);
    console.log(`📊 Total kelas di database: ${allClasses.length}`);

  } catch (error) {
    console.error('❌ Error seeding classes:', error);
  }
}

seedFullClasses();