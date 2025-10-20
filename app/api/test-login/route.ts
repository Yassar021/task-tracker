import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Testing login with:', { email, password: '***' });

    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    console.log('🔍 Auth result:', {
      success: !result.error,
      error: result.error?.message,
      user: result.user ? {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: (result.user as any).role
      } : null
    });

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error.message,
        code: result.error.code,
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: (result.user as any).role,
      }
    });

  } catch (error) {
    console.error('❌ Login test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}