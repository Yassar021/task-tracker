import { NextRequest, NextResponse } from 'next/server'

// Simple middleware with redirect logic
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define protected paths
  const protectedPaths = ['/admin', '/dashboard']
  const authPaths = ['/sign-in']

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  // Get session token from cookies
  const sessionToken = request.cookies.get('better-auth.session_token')?.value

  // If trying to access protected routes without session, redirect to sign-in
  if (isProtectedPath && !sessionToken) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // If authenticated user tries to access sign-in page, redirect to admin
  if (isAuthPath && sessionToken) {
    return NextResponse.redirect(new URL('/admin', request.url))
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