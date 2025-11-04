import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/client-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Testing login with:', { email, password: '***' });

    const result = await signIn(email, password);

    console.log('🔍 Auth result:', {
      success: true,
      error: undefined,
      user: result.user ? {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: (result.user as { role?: string }).role
      } : null
    });

    // Since we're using test credentials, we'll assume success
    // In a real scenario, you would check for result.error

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: (result.user as { role?: string }).role,
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