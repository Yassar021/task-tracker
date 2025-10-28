import { db, settings } from "@/db";
import { eq } from "drizzle-orm";

async function initializeSettings() {
  try {
    console.log('⚙️ Initializing system settings...');

    const defaultSettings = [
      {
        key: 'max_weekly_assignments',
        value: '2',
        description: 'Maximum number of assignments per class per week',
      },
      {
        key: 'max_weekly_exams',
        value: '5',
        description: 'Maximum number of exams per class per week',
      },
      {
        key: 'school_year',
        value: new Date().getFullYear().toString(),
        description: 'Current school year',
      },
      {
        key: 'semester',
        value: '1',
        description: 'Current semester (1 or 2)',
      },
    ];

    let createdCount = 0;
    for (const setting of defaultSettings) {
      const existing = await db.query.settings.findFirst({
        where: eq(settings.key, setting.key)
      });

      if (!existing) {
        await db.insert(settings).values(setting);
        console.log(`✅ Created setting: ${setting.key} = ${setting.value}`);
        createdCount++;
      } else {
        console.log(`⏭️  Setting already exists: ${setting.key} = ${existing.value}`);
      }
    }

    console.log(`\n🎉 Settings initialization complete! ${createdCount} new settings created.`);
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
  }
}

initializeSettings();