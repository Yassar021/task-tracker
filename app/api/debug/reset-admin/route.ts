import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Resetting admin account...');

    if (!db) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 500 });
    }

    // Delete existing admin user
    await db.delete(users).where(eq(users.email, 'admin@ypssingkole.sch.id'));
    console.log('🗑️ Deleted existing admin user');

    // Create new admin user
    const newAdmin = await auth.api.signUpEmail({
      body: {
        email: 'admin@ypssingkole.sch.id',
        password: 'admin123456',
        name: 'Administrator YPS',
      },
    });

    if (!newAdmin.user) {
      throw new Error('Failed to create new admin user');
    }

    console.log('✅ Created new admin user:', newAdmin.user.id);

    // Update role to admin
    await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, newAdmin.user.id));

    console.log('✅ Set user role to admin');

    // Test authentication
    const testAuth = await auth.api.signInEmail({
      body: {
        email: 'admin@ypssingkole.sch.id',
        password: 'admin123456',
      },
    });

    // Check if authentication was successful
    if (!testAuth || !testAuth.user) {
      return NextResponse.json({
        error: 'Account created but authentication test failed',
        user: {
          id: newAdmin.user.id,
          email: newAdmin.user.email,
          name: newAdmin.user.name,
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account reset successfully',
      credentials: {
        email: 'admin@ypssingkole.sch.id',
        password: 'admin123456'
      },
      user: {
        id: newAdmin.user.id,
        email: newAdmin.user.email,
        name: newAdmin.user.name,
      },
      authTest: 'PASSED'
    });

  } catch (error) {
    console.error('❌ Reset error:', error);
    return NextResponse.json({
      error: 'Failed to reset admin account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}