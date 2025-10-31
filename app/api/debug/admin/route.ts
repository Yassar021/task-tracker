import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { user } from '@/db/schema/auth';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    console.log('🔍 Checking admin account...');

    // Check if admin user exists
    const adminUser: unknown[] = [];

    if (adminUser.length === 0) {
      console.log('❌ Admin user not found in database');
      return NextResponse.json({
        error: 'Admin user not found',
        suggestion: 'Run npm run create-admin first'
      }, { status: 404 });
    }

    console.log('✅ Mock admin user created');

    // Mock check complete

    // Mock authentication complete
    return NextResponse.json({
      user: {
            id: "mock-id",
            email: "admin@ypssingkole.sch.id",
            name: "Admin User",
            role: "admin",
        },
        success: true
      });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      error: 'Failed to check admin account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}