import { NextRequest, NextResponse } from 'next/server'

// Simple middleware with redirect logic
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define protected paths
  const protectedPaths = ['/admin', '/dashboard']
  const authPaths = ['/sign-in']
  const publicPaths = ['/']  // Home page is public

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname === '/')

  // Get all cookies to check for session
  const cookies = request.cookies.getAll();

  // Check for Supabase session cookies
  const sessionCookie = cookies.find(cookie =>
    cookie.name.startsWith('sb-') || // Supabase session
    cookie.name.includes('auth-token') || // Custom auth token
    cookie.name === 'session' ||
    cookie.name.includes('supabase')
  );

  const sessionToken = sessionCookie?.value;

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // If trying to access protected routes without session, redirect to sign-in
  if (isProtectedPath && !sessionToken) {
    console.log('No session found for protected path, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // If authenticated user tries to access sign-in page, redirect to home page instead of admin
  // This prevents infinite loop
  if (isAuthPath && sessionToken) {
    console.log('Session found, redirecting to home page');
    return NextResponse.redirect(new URL('/', request.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.).*)",
  ],
}