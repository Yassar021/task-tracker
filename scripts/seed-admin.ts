import { db, users, teachers } from '@/db';
import { eq } from 'drizzle-orm';

async function seedAdmin() {
  try {
    console.log('🔧 Creating admin user...');

    // Create admin user in auth system
    const adminEmail = 'admin@yps.singkole';
    const adminName = 'Admin YPS Singkole';

    // Check if admin already exists in auth
    const existingAuthAdmin = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.email, adminEmail)
    });

    if (!existingAuthAdmin) {
      console.log('❌ Admin user not found in auth system.');
      console.log('📝 Please sign up with this email first:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Name: ${adminName}`);
      console.log(`   Then run this script again.`);
      return;
    }

    console.log('✅ Found admin auth user:', existingAuthAdmin.email);

    // Create user record
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, existingAuthAdmin.id)
    });

    let userRecord;
    if (!existingUser) {
      [userRecord] = await db.insert(users).values({
        id: existingAuthAdmin.id,
        email: existingAuthAdmin.email,
        role: 'admin'
      }).returning();
      console.log('✅ Created admin user record:', userRecord);
    } else {
      // Update to admin role if not already
      if (existingUser.role !== 'admin') {
        [userRecord] = await db.update(users)
          .set({ role: 'admin' })
          .where(eq(users.id, existingAuthAdmin.id))
          .returning();
        console.log('✅ Updated user role to admin:', userRecord);
      } else {
        userRecord = existingUser;
        console.log('✅ Admin user record already exists:', userRecord);
      }
    }

    // Create teacher record for admin (optional, for assignment form)
    const existingTeacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, existingAuthAdmin.id)
    });

    if (!existingTeacher) {
      const teacherId = `ADMIN_${existingAuthAdmin.id.slice(0, 6)}`;
      await db.insert(teachers).values({
        id: teacherId,
        userId: existingAuthAdmin.id,
        name: existingAuthAdmin.name || adminName,
        email: existingAuthAdmin.email,
        phone: '000000000000',
        nip: 'ADMIN001',
        subjects: ['Administration'],
        isHomeroom: false,
        isActive: true,
      });
      console.log('✅ Created admin teacher record');
    }

    console.log('🎉 Admin setup complete!');
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: (what you set during signup)`);
    console.log('📋 Admin can now access /admin dashboard');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();