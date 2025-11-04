import { NextRequest, NextResponse } from 'next/server'

// Simple middleware with redirect logic
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define protected paths
  const protectedPaths = ['/admin', '/dashboard']
  const authPaths = ['/sign-in']

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  // Get all cookies to check for session
  const cookies = request.cookies.getAll();

  // Check for various possible session cookie names
  const sessionCookie = cookies.find(cookie =>
    cookie.name.startsWith('better-auth') ||
    cookie.name === 'session' ||
    cookie.name.includes('auth')
  );

  const sessionToken = sessionCookie?.value;

  // If trying to access protected routes without session, redirect to sign-in
  if (isProtectedPath && !sessionToken) {
    console.log('No session found, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // If authenticated user tries to access sign-in page, redirect to admin
  if (isAuthPath && sessionToken) {
    console.log('Session found, redirecting to admin');
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}