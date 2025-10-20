import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

export async function middleware(request: NextRequest) {
  
  let session = null;
  try {
    // Try multiple methods to get session
    const result = await auth.api.getSession({
      headers: request.headers,
    });
    session = result?.data;
  } catch (error) {
    session = null;
  }

  // All admin routes require authentication (admin-only system)
  const protectedPaths = ["/admin"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If trying to access protected routes without valid session, redirect to sign in
  if (isProtectedPath) {
    if (!session || !session.user) {
      const response = NextResponse.redirect(new URL("/sign-in", request.url));
      // Clear any stale cookies
      response.headers.set('x-clear-auth', 'true');
      return response;
    }
  }

  // If authenticated user tries to access sign-in page, redirect to admin
  if (request.nextUrl.pathname.startsWith("/sign-in") && session?.user) {
    const response = NextResponse.redirect(new URL("/admin", request.url));
    return response;
  }

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