import { NextRequest, NextResponse } from "next/server";

// Simple middleware that doesn't cause errors
export function middleware(request: NextRequest) {
  // Skip middleware for API routes and static assets
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // For now, let all requests pass through
  // Authentication will be handled at the page level
  return NextResponse.next();
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
};