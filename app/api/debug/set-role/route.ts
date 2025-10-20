import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting admin role via direct SQL...');

    // Import drizzle directly
    const { drizzle } = require('drizzle-orm/node-postgres');
    const { pgTable, text, timestamp, boolean } = require('drizzle-orm/pg-core');

    // Create connection
    const db = drizzle(process.env.DATABASE_URL);

    // Update user role directly via SQL
    const updateResult = await db.execute(`
      UPDATE "user"
      SET role = 'admin', updated_at = NOW()
      WHERE email = 'admin@ypssingkole.sch.id'
      RETURNING id, email, name, role, created_at, updated_at;
    `);

    console.log('✅ Update result:', updateResult);

    // Query to verify
    const verifyResult = await db.execute(`
      SELECT id, email, name, role, created_at, updated_at
      FROM "user"
      WHERE email = 'admin@ypssingkole.sch.id';
    `);

    console.log('🔍 Verify result:', verifyResult);

    return NextResponse.json({
      success: true,
      updated: updateResult,
      verified: verifyResult,
      message: 'Admin role set successfully'
    });

  } catch (error) {
    console.error('❌ Set role error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}