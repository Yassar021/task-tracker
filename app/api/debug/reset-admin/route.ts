import { NextRequest, NextResponse } from 'next/server';

// Debug route disabled - using Supabase auth now
export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Debug route disabled. Admin account should be created directly in Supabase dashboard.',
    instructions: {
      email: 'admin@ypssingkole.sch.id',
      password: 'Create in Supabase Auth',
      role: 'admin'
    }
  }, { status: 410 });
}