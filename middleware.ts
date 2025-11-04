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

  // Log all cookies for debugging (remove in production)
  if (pathname.startsWith('/admin')) {
    console.log('All cookies:', cookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })));
  }

  // Check for Supabase session cookies - be more specific
  const supabaseCookies = cookies.filter(cookie =>
    cookie.name.startsWith('sb-') &&
    (cookie.name.includes('-auth-token') || cookie.name.includes('-access-token'))
  );

  const hasSupabaseSession = supabaseCookies.length > 0;

  console.log('Supabase session check:', {
    pathname,
    hasSupabaseSession,
    cookieCount: cookies.length,
    supabaseCookieNames: supabaseCookies.map(c => c.name)
  });

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
  if (isProtectedPath && !hasSupabaseSession) {
    console.log('No Supabase session found for protected path, redirecting to sign-in');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // If authenticated user tries to access sign-in page, redirect to home page instead of admin
  // This prevents infinite loop
  if (isAuthPath && hasSupabaseSession) {
    console.log('Supabase session found, redirecting to admin page');
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
    "/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.).*)",
  ],
}