import { db, users, teachers } from "@/db";
import { eq } from "drizzle-orm";

async function debugUserTeacher() {
  try {
    console.log('🔍 Debugging User-Teacher relationship...');

    // Check auth users
    const authUsers = await db.query.user.findMany({
      limit: 5
    });
    console.log('📝 Auth users found:', authUsers.length);
    authUsers.forEach(user => {
      console.log(`  - ${user.id}: ${user.email} (${user.name})`);
    });

    if (authUsers.length === 0) {
      console.log('❌ No auth users found');
      return;
    }

    const authUser = authUsers[0];
    console.log(`\n🎯 Checking user: ${authUser.id} (${authUser.email})`);

    // Check user record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, authUser.id),
      with: {
        teacher: true,
      },
    });

    if (!userRecord) {
      console.log('❌ No user record found for auth user');
      return;
    }

    console.log('✅ User record found:');
    console.log(`  - ID: ${userRecord.id}`);
    console.log(`  - Email: ${userRecord.email}`);
    console.log(`  - Role: ${userRecord.role}`);
    console.log(`  - Teacher ID: ${userRecord.teacherId}`);

    if (!userRecord.teacher) {
      console.log('❌ No teacher record linked to user');
      return;
    }

    console.log('✅ Teacher record found:');
    console.log(`  - ID: ${userRecord.teacher.id}`);
    console.log(`  - Name: ${userRecord.teacher.name}`);
    console.log(`  - Email: ${userRecord.teacher.email}`);
    console.log(`  - User ID: ${userRecord.teacher.userId}`);

    // Test getUserById function
    console.log('\n🧪 Testing getUserById function...');
    const { getUserById } = await import('@/lib/data-access');
    const testUser = await getUserById(authUser.id);

    if (testUser) {
      console.log('✅ getUserById success:');
      console.log(`  - User ID: ${testUser.id}`);
      console.log(`  - Teacher ID: ${testUser.teacherId}`);
      console.log(`  - Has teacher object: ${!!testUser.teacher}`);
      if (testUser.teacher) {
        console.log(`  - Teacher ID from object: ${testUser.teacher.id}`);
      }
    } else {
      console.log('❌ getUserById returned null');
    }

  } catch (error) {
    console.error('❌ Error debugging:', error);
  }
}

debugUserTeacher();