import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Try to create user with regular signup (this will work if email/password signup is enabled)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin',
          name: email.split('@')[0]
        }
      }
    });

    if (error) {
      // If user already exists, that's okay
      if (error.message.includes('already registered')) {
        return NextResponse.json({
          success: true,
          message: 'Admin user already exists',
          email,
          action: 'Try logging in'
        });
      }
      throw error;
    }

    // If signup successful but email confirmation is needed, we'll confirm it manually
    if (data.user && !data.session) {
      return NextResponse.json({
        success: true,
        message: 'Admin user created but needs confirmation',
        email,
        action: 'Check Supabase Dashboard to confirm email'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      email,
      userId: data.user?.id
    });

  } catch (error) {
    console.error('Ensure admin error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to ensure admin user' },
      { status: 500 }
    );
  }
}