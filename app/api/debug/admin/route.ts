import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';

// Import the user table from the schema
const { user } = require('@/db/schema/auth');
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking admin account...');

    // Check if admin user exists
    const adminUser = await db.select()
      .from(user)
      .where(eq(user.email, 'admin@ypssingkole.sch.id'))
      .limit(1);

    if (adminUser.length === 0) {
      console.log('❌ Admin user not found in database');
      return NextResponse.json({
        error: 'Admin user not found',
        suggestion: 'Run npm run create-admin first'
      }, { status: 404 });
    }

    const user = adminUser[0];
    console.log('✅ Found admin user:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });

    // Check if role is admin
    if (user.role !== 'admin') {
      console.log('⚠️ User role is not admin, updating...');
      await db.update(user)
        .set({ role: 'admin' })
        .where(eq(user.email, 'admin@ypssingkole.sch.id'));

      console.log('✅ Updated user role to admin');
    }

    // Try to authenticate with better-auth
    try {
      const authResult = await auth.api.signInEmail({
        body: {
          email: 'admin@ypssingkole.sch.id',
          password: 'admin123456',
        },
      });

      if (authResult.error) {
        console.log('❌ Authentication failed:', authResult.error);
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          authError: authResult.error.message,
          suggestion: 'Password might be incorrect. Try resetting or recreating account.'
        });
      }

      console.log('✅ Authentication successful');
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        authSuccess: true
      });

    } catch (authError) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        authError: authError instanceof Error ? authError.message : 'Unknown auth error',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      error: 'Failed to check admin account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}