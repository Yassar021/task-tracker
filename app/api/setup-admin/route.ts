import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // For now, just return that admin setup should be done manually in Supabase
    return NextResponse.json({
      success: false,
      message: 'Please create admin user manually in Supabase Dashboard',
      instructions: [
        '1. Go to your Supabase Dashboard',
        '2. Navigate to Authentication > Users',
        '3. Click "Add user"',
        `4. Email: ${email}`,
        '5. Set a password',
        '6. Check "Auto confirm user"',
        '7. Click "Save"',
        '8. Then try logging in with the new credentials'
      ]
    });

  } catch (error) {
    console.error('Setup admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}